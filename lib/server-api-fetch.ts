import { headers } from 'next/headers';

/** Fetch this app's Route Handlers from a Server Component / server action, forwarding cookies. */
export async function serverApiFetch(path: string, init?: RequestInit): Promise<Response> {
  const h = await headers();
  const cookie = h.get('cookie');
  const host = h.get('x-forwarded-host') ?? h.get('host');
  if (!host) {
    throw new Error('serverApiFetch: missing Host header');
  }
  const proto = h.get('x-forwarded-proto') ?? (process.env.VERCEL ? 'https' : 'http');
  const pathname = path.startsWith('/') ? path : `/${path}`;
  const url = `${proto}://${host}${pathname}`;

  const merged = new Headers(init?.headers);
  if (cookie) merged.set('cookie', cookie);

  return fetch(url, {
    ...init,
    headers: merged,
    cache: 'no-store',
  });
}
