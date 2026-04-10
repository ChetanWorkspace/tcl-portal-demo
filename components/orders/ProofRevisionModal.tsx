'use client';

import { useEffect, useRef, useState, useTransition, type FormEvent } from 'react';
import { X, Loader2 } from 'lucide-react';
import { requestProofRevision } from '@/app/(customer)/orders/[id]/proofs/actions';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';

const NOTES_MIN = 3;
const NOTES_MAX = 4000;

type Props = {
  open: boolean;
  onClose: () => void;
  proofId: string;
  orderId: string;
  /** e.g. Proof #123 - Bella+Canvas Unisex Tee */
  proofSubtitle: string;
  onSuccess: () => void;
};

export function ProofRevisionModal({
  open,
  onClose,
  proofId,
  orderId,
  proofSubtitle,
  onSuccess,
}: Props) {
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const trimmed = notes.trim();
  const canSubmit = trimmed.length >= NOTES_MIN && trimmed.length <= NOTES_MAX;

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
      if (e.key === 'Escape' && !isPending) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, isPending, onClose]);

  useEffect(() => {
    if (!open) {
      setNotes('');
      setError(null);
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      const id = requestAnimationFrame(() => textareaRef.current?.focus());
      return () => cancelAnimationFrame(id);
    }
  }, [open]);

  if (!open) return null;

  function handleBackdropClick() {
    if (!isPending) onClose();
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit || isPending) return;

    const fd = new FormData();
    fd.set('proofId', proofId);
    fd.set('orderId', orderId);
    fd.set('notes', trimmed);

    startTransition(async () => {
      setError(null);
      const result = await requestProofRevision(null, fd);
      if (result?.error) {
        setError(result.error);
        return;
      }
      onSuccess();
      onClose();
    });
  }

  return (
    <div
      className="fixed inset-0 z-60 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="proof-revision-title"
      aria-describedby="proof-revision-subtitle"
      onClick={handleBackdropClick}
    >
      <div
        className={cn(
          'flex max-h-dvh w-full max-w-lg flex-col overflow-hidden bg-white shadow-2xl',
          'sm:max-h-[90vh] sm:rounded-2xl',
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-stone-200 px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <h2 id="proof-revision-title" className="text-lg font-semibold text-stone-900">
              Request Revision
            </h2>
            <p id="proof-revision-subtitle" className="mt-1 text-sm text-stone-500">
              {proofSubtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={() => !isPending && onClose()}
            disabled={isPending}
            className="shrink-0 rounded-lg p-2 text-stone-500 transition hover:bg-stone-100 hover:text-stone-900 disabled:opacity-50"
            aria-label="Close"
          >
            <X className="size-5" strokeWidth={1.5} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
            {error ? (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                {error}
              </div>
            ) : null}

            <label htmlFor={`proof-revision-notes-${proofId}`} className="sr-only">
              Revision notes
            </label>
            <textarea
              ref={textareaRef}
              id={`proof-revision-notes-${proofId}`}
              name="notes"
              rows={5}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={NOTES_MAX}
              placeholder="Describe the changes you need (placement, colors, sizing, copy, etc.)"
              className="w-full resize-y rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-900 shadow-sm placeholder:text-stone-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              disabled={isPending}
              aria-invalid={trimmed.length > 0 && trimmed.length < NOTES_MIN}
              aria-describedby={`proof-revision-hint-${proofId}`}
            />
            <p id={`proof-revision-hint-${proofId}`} className="mt-2 text-xs text-stone-500">
              {trimmed.length > 0 && trimmed.length < NOTES_MIN
                ? `Add at least ${NOTES_MIN} characters.`
                : `${trimmed.length} / ${NOTES_MAX} characters`}
            </p>
          </div>

          <div className="shrink-0 border-t border-stone-200 bg-white px-5 py-4 sm:px-6">
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
              <Button
                type="button"
                variant="secondary"
                disabled={isPending}
                onClick={() => !isPending && onClose()}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={!canSubmit || isPending}
                className="w-full sm:w-auto"
              >
                {isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    Submitting…
                  </>
                ) : (
                  'Submit revision request'
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
