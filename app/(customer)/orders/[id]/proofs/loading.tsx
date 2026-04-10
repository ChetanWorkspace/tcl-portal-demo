import { Loader2 } from 'lucide-react';

export default function LoadingProofsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8">
      <div className="rounded-2xl border border-stone-200 bg-white p-12 text-center shadow-sm">
        <div className="inline-flex items-center gap-3 text-stone-600">
          <Loader2 className="size-5 animate-spin text-teal-600" />
          <span className="text-sm font-medium">Loading proofs...</span>
        </div>
      </div>
    </div>
  );
}
