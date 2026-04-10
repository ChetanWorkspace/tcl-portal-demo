/**
 * Demo seed data used fictional https://cdn.tcl.io/mockups/* URLs that are not real files.
 * Rewrite those (and empty URLs) so the UI always has a loadable placeholder.
 */
export function resolveProofMockupUrl(
  url: string | null | undefined,
  proofNumber: number | null | undefined,
): string | null {
  const raw = url?.trim() ?? '';
  if (!raw) return null;
  if (raw.includes('cdn.tcl.io/mockups/')) {
    return placeholderProofImage(proofNumber);
  }
  return raw;
}

/** Reliable placeholder (placehold.co); works without Supabase Storage. */
export function placeholderProofImage(proofNumber: number | null | undefined): string {
  const n = proofNumber ?? 1;
  const label = encodeURIComponent(`Proof ${n}`);
  return `https://placehold.co/800x600/0d9488/ffffff/png?text=${label}`;
}

export function brokenImageFallbackUrl(): string {
  return 'https://placehold.co/800x600/e7e5e4/57534e/png?text=Image+unavailable';
}
