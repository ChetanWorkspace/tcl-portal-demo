'use client';

import { useActionState, useEffect, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import { approveProof, type ProofReviewState } from '@/app/(customer)/orders/[id]/proofs/actions';
import { ProofRevisionModal } from '@/components/orders/ProofRevisionModal';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';

const REVISION_TOAST_MESSAGE = 'Revision request submitted';

type Props = {
  proofId: string;
  orderId: string;
  status: string;
  /** Shown in the revision modal subtitle, e.g. Proof #123 - Product name */
  proofSubtitle: string;
};

function canRespond(status: string) {
  return status === 'pending' || status === 'revision_requested';
}

function SubmitButton({
  label,
  pendingLabel,
  className,
}: {
  label: string;
  pendingLabel: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" disabled={pending} className={cn(className)}>
      {pending ? pendingLabel : label}
    </Button>
  );
}

export function ProofReviewActions({ proofId, orderId, status, proofSubtitle }: Props) {
  const router = useRouter();
  const [approveState, approveAction] = useActionState(approveProof, null as ProofReviewState);
  const [revisionModalOpen, setRevisionModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (approveState?.success) {
      router.refresh();
    }
  }, [approveState?.success, router]);

  useEffect(() => {
    if (!toastMessage) return;
    const t = window.setTimeout(() => setToastMessage(null), 4000);
    return () => window.clearTimeout(t);
  }, [toastMessage]);

  if (!canRespond(status)) {
    return null;
  }

  const approveError = approveState?.error;
  const approveSuccess = approveState?.success;

  return (
    <>
      <div className="mt-auto space-y-4 border-t border-stone-100 pt-4">
        {approveError && (
          <p
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
            role="alert"
          >
            {approveError}
          </p>
        )}
        {approveSuccess && (
          <p className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
            {approveSuccess}
          </p>
        )}

        <div className="flex flex-wrap gap-3">
          <form action={approveAction} className="inline">
            <input type="hidden" name="proofId" value={proofId} />
            <input type="hidden" name="orderId" value={orderId} />
            <SubmitButton label="Approve proof" pendingLabel="Approving…" />
          </form>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setRevisionModalOpen(true)}
            className="w-full sm:w-auto"
          >
            Request revision
          </Button>
        </div>
      </div>

      <ProofRevisionModal
        open={revisionModalOpen}
        onClose={() => setRevisionModalOpen(false)}
        proofId={proofId}
        orderId={orderId}
        proofSubtitle={proofSubtitle}
        onSuccess={() => {
          setToastMessage(REVISION_TOAST_MESSAGE);
          router.refresh();
        }}
      />

      {toastMessage ? (
        <div
          className="fixed bottom-4 right-4 z-70 max-w-sm rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-900 shadow-lg ring-1 ring-green-900/5"
          role="status"
          aria-live="polite"
        >
          {toastMessage}
        </div>
      ) : null}
    </>
  );
}
