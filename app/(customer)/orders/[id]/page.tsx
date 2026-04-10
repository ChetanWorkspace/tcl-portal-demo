import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { format } from 'date-fns';
import { ArrowLeft, CalendarDays, Hash, Layers, Images } from 'lucide-react';
import type { OrderRow } from '@/types/customer';
import { StatusBadge } from '@/components/orders/StatusBadge';
import { ProofMockupImage } from '@/components/orders/ProofMockupImage';
import { NextBestActionPanel } from '@/components/dashboard/NextBestActionPanel';
import { serverApiFetch } from '@/lib/server-api-fetch';

type PageProps = { params: Promise<{ id: string }> };

export default async function OrderDetailPage({ params }: PageProps) {
  const { id } = await params;

  const res = await serverApiFetch(`/api/orders/${id}`);
  if (res.status === 401) redirect('/login');
  if (res.status === 404) notFound();
  if (!res.ok) notFound();

  const { order, proofCount, proofs } = (await res.json()) as {
    order: OrderRow;
    proofCount: number;
    proofs: {
      id: string;
      proof_number: number | null;
      mockup_image_url: string | null;
      status: string;
    }[];
  };

  const o = order;
  const due = o.due_date
    ? (() => {
        try {
          return format(new Date(o.due_date), 'MMM d, yyyy');
        } catch {
          return o.due_date;
        }
      })()
    : '—';

  let productsSummary: { productId?: string; name?: string; color?: string }[] = [];
  try {
    if (o.products_selected && typeof o.products_selected === 'string') {
      productsSummary = JSON.parse(o.products_selected) as typeof productsSummary;
    }
  } catch {
    productsSummary = [];
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-sm font-medium text-stone-600 transition hover:text-teal-700"
      >
        <ArrowLeft className="size-4" strokeWidth={1.5} />
        Back to dashboard
      </Link>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-teal-700/90">Order</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl">
            {o.event_name}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-stone-500">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="size-4 text-stone-400" strokeWidth={1.5} />
              Due {due}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Hash className="size-4 text-stone-400" strokeWidth={1.5} />
              {o.id.slice(0, 8)}…
            </span>
          </div>
        </div>
        <StatusBadge status={o.status} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3 lg:items-start">
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-2xl border border-stone-200/80 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-stone-900">Order details</h2>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-stone-400">
                  Order type
                </dt>
                <dd className="mt-1 text-stone-800 capitalize">
                  {o.order_type?.replace('_', ' ') ?? '—'}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-stone-400">
                  Print type
                </dt>
                <dd className="mt-1 text-stone-800 capitalize">
                  {o.print_type?.replace(/_/g, ' ') ?? '—'}
                </dd>
              </div>
            </dl>
          </section>

          {productsSummary.length > 0 ? (
            <section className="rounded-2xl border border-stone-200/80 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2">
                <Layers className="size-4 text-teal-600" strokeWidth={1.5} />
                <h2 className="text-sm font-semibold text-stone-900">Products</h2>
              </div>
              <ul className="mt-4 divide-y divide-stone-100">
                {productsSummary.map((p, i) => (
                  <li
                    key={`${p.productId ?? i}`}
                    className="flex justify-between gap-4 py-3 text-sm"
                  >
                    <span className="font-medium text-stone-800">{p.name ?? 'Item'}</span>
                    <span className="text-stone-500">{p.color ?? '—'}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="rounded-2xl border border-stone-200/80 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-sm font-semibold text-stone-900">Proofs</h2>
                <p className="mt-1 text-xs text-stone-500">
                  {proofCount ?? 0} proof{proofCount === 1 ? '' : 's'} on this order.
                </p>
              </div>
              <Link
                href={`/orders/${id}/proofs`}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 active:bg-teal-800"
              >
                <Images className="size-4" strokeWidth={1.5} />
                Review proofs
              </Link>
            </div>
            {(proofs?.length ?? 0) > 0 ? (
              <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {(proofs ?? []).map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/orders/${id}/proofs`}
                      className="group block overflow-hidden rounded-xl border border-stone-200 bg-stone-50 shadow-sm ring-stone-900/5 transition hover:border-teal-300 hover:ring-2 hover:ring-teal-200/60"
                    >
                      <div className="relative aspect-4/3 bg-stone-100">
                        <ProofMockupImage
                          url={p.mockup_image_url}
                          proofNumber={p.proof_number}
                          alt={p.proof_number != null ? `Proof ${p.proof_number}` : 'Proof mockup'}
                          className="size-full object-cover transition group-hover:opacity-95"
                          emptyClassName="min-h-[8rem] text-xs"
                        />
                      </div>
                      <p className="truncate px-2 py-2 text-center text-xs font-medium capitalize text-stone-600">
                        {p.status.replace(/_/g, ' ')}
                        {p.proof_number != null ? ` · #${p.proof_number}` : ''}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-stone-500">
                No proofs yet. You&apos;ll be notified when mockups are ready.
              </p>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          <NextBestActionPanel orderId={id} />

          <section className="rounded-2xl border border-stone-200/80 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-stone-900">Design notes</h2>
            <div className="mt-4 space-y-4 text-sm text-stone-600">
              <div>
                <p className="text-xs font-medium text-stone-400">Front</p>
                <p className="mt-1 whitespace-pre-wrap">{o.front_design_description ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-stone-400">Back</p>
                <p className="mt-1 whitespace-pre-wrap">{o.back_design_description ?? '—'}</p>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
