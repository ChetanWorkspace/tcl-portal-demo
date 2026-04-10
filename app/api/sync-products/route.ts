import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { MOCK_SHOPIFY_PRODUCTS } from '@/lib/shopify-mock-products';

type UpsertRow = {
  sku: string;
  name: string;
  category: string;
  turnaround_days: number;
  starting_price: number;
  is_featured: boolean;
  print_types_available: string;
};

/**
 * Shopify-style sync (mock fixture): upserts rows into public.products by SKU.
 * Requires SUPABASE_SERVICE_ROLE_KEY so inserts bypass RLS (products are read-only for customers).
 */
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    return NextResponse.json(
      {
        success: false,
        error:
          'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY (service role is required to upsert products).',
      },
      { status: 503 },
    );
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const rows: UpsertRow[] = MOCK_SHOPIFY_PRODUCTS.map((p) => ({
    sku: p.sku,
    name: p.title,
    category: p.productType,
    turnaround_days: p.turnaroundDays,
    starting_price: p.price,
    is_featured: p.featured,
    print_types_available: p.printTypes,
  }));

  const { data, error } = await supabase.from('products').upsert(rows, { onConflict: 'sku' }).select('id, sku, name');

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    source: 'mock_shopify_fixture',
    upserted: data?.length ?? 0,
    products: data ?? [],
  });
}
