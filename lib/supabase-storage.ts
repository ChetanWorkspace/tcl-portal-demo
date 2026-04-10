import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Bucket for customer design uploads (Step 2).
 * Create this bucket in Supabase → Storage, or set NEXT_PUBLIC_SUPABASE_DESIGNS_BUCKET
 * to an existing bucket (e.g. "product_image").
 */
export const SUPABASE_DESIGNS_BUCKET =
  typeof process !== 'undefined' && process.env.NEXT_PUBLIC_SUPABASE_DESIGNS_BUCKET?.trim()
    ? process.env.NEXT_PUBLIC_SUPABASE_DESIGNS_BUCKET.trim()
    : 'designs';

type StorageLikeError = {
  message?: string;
  status?: string | number;
  error?: string;
};

export function formatStorageError(err: unknown, bucket: string): string {
  if (err && typeof err === 'object') {
    const o = err as StorageLikeError;
    const msg = (o.message ?? o.error ?? '').toString();
    const status = String(o.status ?? '');

    if (
      /bucket not found/i.test(msg) ||
      /not found/i.test(msg) ||
      status === '404' ||
      msg.includes('Bucket')
    ) {
      return `Storage bucket "${bucket}" was not found. In Supabase → Storage, create a bucket named "${bucket}" or set NEXT_PUBLIC_SUPABASE_DESIGNS_BUCKET in .env.local to your existing bucket name (for example: product_image).`;
    }

    if (msg) return msg;
  }
  if (err instanceof Error && err.message) return err.message;
  return 'File upload failed. Please try again.';
}

export function designObjectPath(userId: string, file: File): string {
  const ext = file.name.split('.').pop() ?? 'bin';
  return `${userId}/${crypto.randomUUID()}.${ext}`;
}

/** Upload front/back design files; empty strings if no file. Throws on failure. */
export async function uploadDesignAssets(
  supabase: SupabaseClient,
  userId: string,
  bucket: string,
  frontFile: File | null,
  backFile: File | null,
): Promise<{ frontUrl: string; backUrl: string }> {
  let frontUrl = '';
  let backUrl = '';

  if (frontFile) {
    const path = designObjectPath(userId, frontFile);
    const { error } = await supabase.storage.from(bucket).upload(path, frontFile, {
      cacheControl: '3600',
      upsert: false,
    });
    if (error) {
      throw new Error(formatStorageError(error, bucket));
    }
    frontUrl = supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  }

  if (backFile) {
    const path = designObjectPath(userId, backFile);
    const { error } = await supabase.storage.from(bucket).upload(path, backFile, {
      cacheControl: '3600',
      upsert: false,
    });
    if (error) {
      throw new Error(formatStorageError(error, bucket));
    }
    backUrl = supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  }

  return { frontUrl, backUrl };
}
