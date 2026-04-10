import { format, parseISO, isValid } from 'date-fns';
import { parsePriceTiers, PriceTiersDisplay } from '@/lib/proof-price-tiers';
import { printTypeLabel } from '@/lib/print-types';
import { ProofStatusBadge } from '@/components/orders/ProofStatusBadge';
import { ProofReviewActions } from '@/components/orders/ProofReviewActions';
import { ProofMockupImage } from '@/components/orders/ProofMockupImage';
import { cn } from '@/lib/cn';

export type ProofWithProduct = {
  id: string;
  order_id: string;
  proof_number: number | null;
  color: string | null;
  print_type: string | null;
  est_ship_date: string | null;
  price_tiers: string | null;
  mockup_image_url: string | null;
  status: string;
  product: { name: string | null } | { name: string | null }[] | null;
};

function formatShip(d: string | null) {
  if (!d) return '—';
  try {
    const dt = d.includes('T') ? parseISO(d) : parseISO(`${d}T12:00:00`);
    return isValid(dt) ? format(dt, 'MMM d, yyyy') : d;
  } catch {
    return d;
  }
}

type Props = {
  proof: ProofWithProduct;
};

export function ProofReviewProofCard({ proof }: Props) {
  const productName =
    (Array.isArray(proof.product) ? proof.product[0]?.name : proof.product?.name) ?? 'Product';
  const proofLabel = proof.proof_number != null ? `Proof #${proof.proof_number}` : 'Proof';
  const tiersContent = parsePriceTiers(proof.price_tiers);

  return (
    <article
      className={cn(
        'flex h-full flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm ring-1 ring-stone-900/5 transition-shadow hover:shadow-md',
      )}
    >
      <div className="relative aspect-4/3 w-full bg-linear-to-b from-stone-100 to-stone-50">
        <ProofMockupImage
          url={proof.mockup_image_url}
          proofNumber={proof.proof_number}
          alt={`${proofLabel} mockup for ${productName}`}
          className="size-full object-contain p-2"
          emptyClassName="bg-linear-to-b from-stone-100 to-stone-50"
        />

        <div className="absolute left-3 top-3 flex flex-wrap items-center gap-2">
          <span className="rounded-lg bg-white/95 px-2.5 py-1 text-xs font-bold text-stone-900 shadow-sm ring-1 ring-stone-200/80 backdrop-blur-sm">
            {proofLabel}
          </span>
        </div>
        <div className="absolute right-3 top-3">
          <ProofStatusBadge status={proof.status} />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-5 sm:p-6">
        <div>
          <h3 className="text-lg font-semibold leading-snug text-stone-900">{productName}</h3>
        </div>

        <dl className="grid gap-3 text-sm">
          <div className="flex items-baseline justify-between gap-4 border-b border-stone-100 pb-3">
            <dt className="shrink-0 text-stone-500">Color</dt>
            <dd className="text-right font-medium text-stone-900">{proof.color ?? '—'}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-4 border-b border-stone-100 pb-3">
            <dt className="shrink-0 text-stone-500">Print type</dt>
            <dd className="text-right font-medium text-stone-900">
              {printTypeLabel(proof.print_type)}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-4">
            <dt className="shrink-0 text-stone-500">Est. ship date</dt>
            <dd className="text-right font-medium text-stone-900">
              {formatShip(proof.est_ship_date)}
            </dd>
          </div>
        </dl>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
            Price per piece (tiers)
          </p>
          <div className="mt-2">
            <PriceTiersDisplay content={tiersContent} />
          </div>
        </div>

        <ProofReviewActions
          proofId={proof.id}
          orderId={proof.order_id}
          status={proof.status}
          proofSubtitle={`${proofLabel} - ${productName}`}
        />
      </div>
    </article>
  );
}
