#!/usr/bin/env node
/**
 * Bonus 3 — Bubble-style JSON → Supabase public schema.
 *
 * Usage (from repo root):
 *   node scripts/migrate-bubble-sample.mjs
 *
 * Requires in .env.local (or env):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Behavior:
 * - User rows: skipped unless a public.users row with matching email exists (FK to auth.users).
 * - Product rows: upsert by sku (service role bypasses RLS).
 * - Order rows: insert only when customer_id resolves by email; null / empty fields handled.
 * - Option sets: normalized to lowercase + underscores for enums / text.
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '.env.local') });
dotenv.config({ path: join(__dirname, '..', '.env') });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

function normalizeOption(value) {
  if (value == null || String(value).trim() === '') return null;
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/-+/g, '_');
}

function nullIfEmpty(v) {
  if (v == null) return null;
  if (typeof v === 'string' && v.trim() === '') return null;
  return v;
}

async function resolveCustomerIdByEmail(email) {
  const e = nullIfEmpty(email);
  if (!e) return null;
  const { data, error } = await supabase.from('users').select('id').eq('email', e).maybeSingle();
  if (error) {
    console.warn(`Lookup error for ${e}:`, error.message);
    return null;
  }
  return data?.id ?? null;
}

async function migrateUser(row) {
  const email = nullIfEmpty(row.email_text);
  if (!email) {
    console.log(`[User ${row.bubble_unique_id}] skip: no email`);
    return;
  }
  const { data: existing } = await supabase.from('users').select('id').eq('email', email).maybeSingle();
  if (!existing) {
    console.log(
      `[User ${row.bubble_unique_id}] skip: no public.users row for "${email}" (create Auth user + trigger first)`,
    );
    return;
  }
  const ut = normalizeOption(row.user_type_option_set) || 'customer';
  const allowed = ['customer', 'campus_rep', 'account_manager'];
  const userType = allowed.includes(ut) ? ut : 'customer';

  const { error } = await supabase
    .from('users')
    .update({
      name: nullIfEmpty(row.name_text),
      organization: nullIfEmpty(row.organization_text),
      school: nullIfEmpty(row.school_text),
      loyalty_points: row.loyalty_points_number ?? 0,
      user_type: userType,
    })
    .eq('id', existing.id);

  if (error) console.error(`[User ${row.bubble_unique_id}] update failed:`, error.message);
  else console.log(`[User ${row.bubble_unique_id}] updated profile for ${email}`);
}

async function migrateProduct(row) {
  const sku = nullIfEmpty(row.sku_text);
  if (!sku) {
    console.log(`[Product ${row.bubble_unique_id}] skip: no sku`);
    return;
  }
  const printTypes = nullIfEmpty(row.print_types_option_set_csv) ?? 'screen_print';
  const rowData = {
    sku,
    name: nullIfEmpty(row.name_text) ?? 'Imported product',
    category: nullIfEmpty(row.category_text),
    turnaround_days: row.turnaround_days_number ?? 10,
    starting_price: row.starting_price_number ?? 0,
    is_featured: Boolean(row.is_featured_boolean),
    print_types_available: printTypes,
  };

  const { error } = await supabase.from('products').upsert(rowData, { onConflict: 'sku' });
  if (error) console.error(`[Product ${row.bubble_unique_id}]`, error.message);
  else console.log(`[Product ${row.bubble_unique_id}] upserted ${sku}`);
}

const ORDER_STATUSES = new Set([
  'new',
  'proof_pending',
  'proof_ready',
  'approved',
  'in_production',
  'shipped',
  'complete',
]);
const PRINT_TYPES = new Set([
  'screen_print',
  'embroidery',
  'puff_print',
  'foil',
  'dye_sublimation',
]);

async function migrateOrder(row) {
  const customerId = await resolveCustomerIdByEmail(row.customer_email_lookup);
  if (!customerId) {
    console.log(`[Order ${row.bubble_unique_id}] skip: unknown customer email`);
    return;
  }

  const rawStatus = normalizeOption(row.status_option_set) || 'new';
  const status = ORDER_STATUSES.has(rawStatus) ? rawStatus : 'new';
  const rawPrint = normalizeOption(row.print_type_option_set) || 'screen_print';
  const printType = PRINT_TYPES.has(rawPrint) ? rawPrint : 'screen_print';
  const orderType = nullIfEmpty(row.order_type_text) === 'link' ? 'link' : 'group';
  const productsJson =
    nullIfEmpty(row.products_selected_text) ?? '[]';

  const { error } = await supabase.from('orders').insert({
    customer_id: customerId,
    event_name: nullIfEmpty(row.event_name_text) ?? 'Imported order',
    due_date: nullIfEmpty(row.due_date_date),
    status,
    order_type: orderType,
    products_selected: productsJson,
    print_type: printType,
    front_design_description: nullIfEmpty(row.front_design_description_text) ?? '—',
    back_design_description: nullIfEmpty(row.back_design_description_text) ?? '—',
  });

  if (error) console.error(`[Order ${row.bubble_unique_id}]`, error.message);
  else console.log(`[Order ${row.bubble_unique_id}] inserted for customer`);
}

const raw = readFileSync(join(__dirname, 'bubble-sample-export.json'), 'utf8');
const rows = JSON.parse(raw);

console.log(`Loaded ${rows.length} Bubble-style rows\n`);

for (const row of rows) {
  const t = row._bubble_type;
  if (t === 'User') await migrateUser(row);
  else if (t === 'Product') await migrateProduct(row);
  else if (t === 'Order') await migrateOrder(row);
  else console.warn('Unknown _bubble_type:', t);
}

console.log('\nDone.');
