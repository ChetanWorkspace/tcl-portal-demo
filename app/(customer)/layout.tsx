import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { CustomerAppShell } from '@/components/customer-flow/CustomerAppShell';

export default async function CustomerLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('users')
    .select('name, organization')
    .eq('id', user.id)
    .single();

  return (
    <CustomerAppShell
      profile={{
        name: profile?.name ?? null,
        organization: profile?.organization ?? null,
      }}
    >
      {children}
    </CustomerAppShell>
  );
}
