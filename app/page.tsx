import { redirect } from 'next/navigation';

/** `/` is handled by middleware (→ `/login` or `/dashboard`); this is a fallback if middleware is skipped. */
export default function Home() {
  redirect('/login');
}
