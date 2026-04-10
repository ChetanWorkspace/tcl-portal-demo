import { Star } from 'lucide-react';
import type { ProductRow } from '@/types/customer';
import { cn } from '@/lib/cn';

type Props = {
  product: ProductRow;
  selected: boolean;
  onToggle: () => void;
};

export function ProductCard({ product, selected, onToggle }: Props) {
  const price =
    product.starting_price != null
      ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
          product.starting_price,
        )
      : '—';

  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        'group relative flex w-full flex-col overflow-hidden rounded-xl border bg-white text-left shadow-sm transition-all',
        selected
          ? 'border-teal-400 ring-2 ring-teal-200 shadow-md'
          : 'border-gray-200 hover:border-gray-300 hover:shadow-md active:scale-[0.99]',
      )}
    >
      {product.featured ? (
        <span className="absolute left-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-900 ring-1 ring-amber-200">
          <Star className="size-3 fill-amber-500 text-amber-600" strokeWidth={1.5} />
          Featured
        </span>
      ) : null}

      <div className="relative aspect-[4/3] w-full bg-gradient-to-br from-gray-100 to-gray-50">
        {product.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element -- remote Supabase URLs
          <img
            src={product.image_url}
            alt=""
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">
            No image
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-4">
        <p className="line-clamp-2 font-semibold text-gray-900">{product?.name}</p>
        <p className="text-xs text-gray-500">{product?.category ?? 'Uncategorized'}</p>
        {product?.turnaround_days && (
          <p className="text-xs text-gray-500">Turnaround: {product.turnaround_days} days</p>
        )}
        <p className="mt-auto pt-2 text-sm font-medium text-teal-700">From {price}</p>
      </div>
    </button>
  );
}
