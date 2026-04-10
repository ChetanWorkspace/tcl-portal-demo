'use client';

import { useMemo, useState } from 'react';
import { ImageOff } from 'lucide-react';
import {
  brokenImageFallbackUrl,
  resolveProofMockupUrl,
} from '@/lib/proof-mockup-url';
import { cn } from '@/lib/cn';

type Props = {
  url: string | null | undefined;
  proofNumber?: number | null;
  alt: string;
  className?: string;
  emptyClassName?: string;
};

export function ProofMockupImage({
  url,
  proofNumber,
  alt,
  className,
  emptyClassName,
}: Props) {
  const [loadFailed, setLoadFailed] = useState(false);
  const resolved = useMemo(
    () => resolveProofMockupUrl(url, proofNumber),
    [url, proofNumber],
  );

  const src = loadFailed ? brokenImageFallbackUrl() : resolved;

  if (!resolved) {
    return (
      <div
        className={cn(
          'flex size-full flex-col items-center justify-center gap-2 p-6 text-center text-sm text-stone-400',
          emptyClassName,
        )}
      >
        <ImageOff className="size-10 stroke-1 opacity-60" />
        <span>Mockup not available yet</span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src ?? brokenImageFallbackUrl()}
      alt={alt}
      className={className}
      onError={() => setLoadFailed(true)}
    />
  );
}
