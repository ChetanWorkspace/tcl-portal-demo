'use client';

import { useEffect } from 'react';
import { format, parseISO, isValid } from 'date-fns';
import type { LucideIcon } from 'lucide-react';
import { X, User, ShoppingBag, Palette, Droplets, CheckCircle2, Loader2 } from 'lucide-react';
import type { DesignDirection, SelectedProductLine } from '@/types/customer';
import type { PrintTypeOption } from '@/lib/print-types';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';

function directionLabel(d: DesignDirection) {
  const labels: Record<DesignDirection, string> = {
    exact: 'Copy design exactly as provided',
    inspiration: 'Use as inspiration — make it your own',
    designer_choice: 'No preference — designer’s choice',
  };
  return labels[d];
}

function formatDue(due: string) {
  if (!due) return '—';
  try {
    const dt = due.includes('T') ? parseISO(due) : parseISO(`${due}T12:00:00`);
    return isValid(dt) ? format(dt, 'MMMM d, yyyy') : due;
  } catch {
    return due;
  }
}

type Props = {
  open: boolean;
  onClose: () => void;
  customerName: string | null;
  eventName: string;
  dueDate: string;
  lines: SelectedProductLine[];
  frontText: string;
  backText: string;
  frontDir: DesignDirection;
  backDir: DesignDirection;
  frontFileName: string | null;
  backFileName: string | null;
  orderType: 'group' | 'link';
  printType: PrintTypeOption | null;
  onConfirm: () => void;
  confirming: boolean;
  error: string | null;
};

function SectionHeader({ icon: Icon, title }: { icon: LucideIcon; title: string }) {
  return (
    <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
      <span className="flex size-9 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
        <Icon className="size-4" strokeWidth={1.5} />
      </span>
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-0.5 sm:grid-cols-[minmax(0,11rem)_1fr] sm:gap-4">
      <dt className="text-xs font-medium text-gray-500">{label}</dt>
      <dd className="text-sm text-gray-900">{value || '—'}</dd>
    </div>
  );
}

export function OrderReviewModal({
  open,
  onClose,
  customerName,
  eventName,
  dueDate,
  lines,
  frontText,
  backText,
  frontDir,
  backDir,
  frontFileName,
  backFileName,
  orderType,
  printType,
  onConfirm,
  confirming,
  error,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const orderTypeLabel = orderType === 'group' ? 'Group order' : 'Shareable link (Get a link)';
  const Icon = printType?.icon ?? Droplets;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="order-review-title"
      onClick={onClose}
    >
      <div
        className={cn(
          'flex max-h-[100dvh] w-full max-w-2xl flex-col overflow-hidden bg-white shadow-2xl',
          'sm:max-h-[90vh] sm:rounded-2xl',
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-gray-200 px-5 py-4 sm:px-6">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex size-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="size-5" strokeWidth={1.5} />
            </span>
            <div>
              <h2 id="order-review-title" className="text-lg font-semibold text-gray-900">
                Order summary — review before submission
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Confirm details below, then submit your order.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
            aria-label="Close"
          >
            <X className="size-5" strokeWidth={1.5} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          {error ? (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </div>
          ) : null}

          <div className="flex flex-col gap-8">
            <section className="space-y-4">
              <SectionHeader icon={User} title="Customer & event" />
              <dl className="space-y-3">
                <Row label="Customer name" value={customerName?.trim() || 'Not specified'} />
                <Row label="Event name" value={eventName.trim()} />
                <Row label="Due date" value={formatDue(dueDate)} />
              </dl>
            </section>

            <section className="space-y-4">
              <SectionHeader icon={ShoppingBag} title={`Selected products (${lines.length})`} />
              <ul className="space-y-3">
                {lines.map((line) => (
                  <li
                    key={line.productId}
                    className="flex gap-3 rounded-xl border border-gray-100 bg-gray-50/80 p-3"
                  >
                    <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-gray-200">
                      {line.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={line.imageUrl} alt="" className="size-full object-cover" />
                      ) : (
                        <div className="flex size-full items-center justify-center text-[10px] text-gray-400">
                          No img
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900">{line.name}</p>
                      <p className="text-xs text-gray-500">ID: {line.productId.slice(0, 8)}…</p>
                      <span className="mt-1 inline-block rounded-md bg-white px-2 py-0.5 text-xs font-medium text-gray-700 ring-1 ring-gray-200">
                        {line.color}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            <section className="space-y-4">
              <SectionHeader icon={Palette} title="Design information" />
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-gray-100 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Front design
                  </p>
                  <p className="mt-2 text-sm text-gray-800">{frontText.trim() || '—'}</p>
                  <p className="mt-3 text-xs text-gray-500">Design direction</p>
                  <p className="text-sm text-gray-800">{directionLabel(frontDir)}</p>
                  {frontFileName ? (
                    <p className="mt-2 text-xs text-teal-700">File: {frontFileName}</p>
                  ) : null}
                </div>
                <div className="rounded-xl border border-gray-100 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Back design
                  </p>
                  <p className="mt-2 text-sm text-gray-800">{backText.trim() || '—'}</p>
                  <p className="mt-3 text-xs text-gray-500">Design direction</p>
                  <p className="text-sm text-gray-800">{directionLabel(backDir)}</p>
                  {backFileName ? (
                    <p className="mt-2 text-xs text-teal-700">File: {backFileName}</p>
                  ) : null}
                </div>
              </div>
            </section>

            {printType ? (
              <section className="space-y-4">
                <SectionHeader icon={Droplets} title="Print method" />
                <div className="rounded-xl border border-gray-200 p-4">
                  <div className="flex gap-3">
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-700">
                      <Icon className="size-6" strokeWidth={1.5} />
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900">{printType.name}</p>
                      <p className="mt-1 text-sm text-gray-600">{printType.description}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="rounded-lg bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                          Min: {printType.minQuantity} pcs
                        </span>
                        <span className="rounded-lg bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                          {printType.turnaroundDays}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            ) : null}

            <section className="space-y-4">
              <SectionHeader icon={CheckCircle2} title="Submission summary" />
              <div className="grid gap-3 rounded-xl border border-gray-100 bg-gray-50/50 p-4 sm:grid-cols-3">
                <div>
                  <p className="text-xs text-gray-500">Products</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">
                    {lines.length} item{lines.length === 1 ? '' : 's'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Print method</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">
                    {printType?.name ?? '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Order type</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">{orderTypeLabel}</p>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                After you submit, your order appears on the dashboard with status <strong>new</strong>.
                You&apos;ll see proofs here when they are ready.
              </p>
            </section>
          </div>
        </div>

        <div className="shrink-0 border-t border-gray-200 bg-white px-5 py-4 sm:px-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Button type="button" variant="ghost" onClick={onClose} className="w-full sm:w-auto">
              Back to edit
            </Button>
            <Button
              type="button"
              disabled={confirming}
              onClick={() => void onConfirm()}
              className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 sm:w-auto"
            >
              {confirming ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Submitting…
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-4" strokeWidth={1.5} />
                  Confirm & submit order
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
