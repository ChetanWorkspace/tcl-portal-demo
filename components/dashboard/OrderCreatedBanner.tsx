'use client';

import { useState } from 'react';
import { CheckCircle2, X } from 'lucide-react';

export function OrderCreatedBanner({ show }: { show: boolean }) {
  const [dismissed, setDismissed] = useState(false);

  if (!show || dismissed) return null;

  return (
    <div className="mb-6 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/90 px-4 py-3 text-emerald-950 shadow-sm">
      <CheckCircle2 className="size-5 shrink-0 text-emerald-600" strokeWidth={1.5} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">Order created successfully</p>
        <p className="mt-0.5 text-xs text-emerald-900/80">
          You&apos;ll see it in your list below. Our team will follow up as proofs are ready.
        </p>
      </div>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="rounded-lg p-1 text-emerald-800/70 transition hover:bg-emerald-100/80"
        aria-label="Dismiss"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
