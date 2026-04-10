import type { ProductRow } from '@/types/customer';

/** Normalize Supabase row (supports `image` or `image_url`; `is_featured` or `featured`). */
export function mapProductRow(r: Record<string, unknown>): ProductRow {
  const img = r.image_url ?? r.image ?? null;
  const featured = r.is_featured ?? r.featured;
  return {
    id: String(r.id),
    name: String(r.name ?? 'Product'),
    category: r.category != null ? String(r.category) : null,
    image_url: img != null ? String(img) : null,
    starting_price: typeof r.starting_price === 'number' ? r.starting_price : null,
    turnaround_days: typeof r.turnaround_days === 'number' ? r.turnaround_days : null,
    featured: Boolean(featured),
  };
}
