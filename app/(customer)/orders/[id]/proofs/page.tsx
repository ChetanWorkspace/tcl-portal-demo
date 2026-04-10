import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { ProofReviewProofCard, type ProofWithProduct } from '@/components/orders/ProofReviewProofCard';
import type { OrderRow } from '@/types/customer';
import { StatusBadge } from '@/components/orders/StatusBadge';
import { serverApiFetch } from '@/lib/server-api-fetch';

type PageProps = { params: Promise<{ id: string }> };

export default async function OrderProofsPage({ params }: PageProps) {
  const { id } = await params;

  const res = await serverApiFetch(`/api/orders/${id}/proofs`);
  if (res.status === 401) redirect('/login');
  if (res.status === 404) notFound();
  if (!res.ok) notFound();

  const { order, proofs } = (await res.json()) as {
    order: OrderRow;
    proofs: ProofWithProduct[];
  };

  const o = order;
  const list = proofs ?? [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8">
      <Link
        href={`/orders/${id}`}
        className="inline-flex items-center gap-2 text-sm font-medium text-stone-600 transition hover:text-teal-700"
      >
        <ArrowLeft className="size-4" strokeWidth={1.5} />
        Back to order
      </Link>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-widest text-teal-700/90">Proofs</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl">
            {o.event_name}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-stone-600">
            Mockups and pricing for this order. Contact your account manager if you need changes.
          </p>
        </div>
        <StatusBadge status={o.status} className="shrink-0" />
      </div>

      {list.length === 0 ? (
        <div className="mt-12 rounded-2xl border border-dashed border-stone-200 bg-linear-to-b from-stone-50 to-white p-12 text-center">
          <p className="text-sm font-medium text-stone-700">No proofs yet</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-stone-500">
            Proofs will appear here once your design team uploads mockups for this order.
          </p>
        </div>
      ) : (
        <ul className="mt-10 grid gap-8 lg:grid-cols-2">
          {list.map((proof) => (
            <li key={proof.id}>
              <ProofReviewProofCard proof={proof} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
