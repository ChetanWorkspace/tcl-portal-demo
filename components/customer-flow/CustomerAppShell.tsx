'use client';

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { FlowSidebar } from './FlowSidebar';
import { AppHeader } from './AppHeader';
import type { UserProfile } from '@/types/customer';
import { createClient } from '@/utils/supabase/client';
import { OrderWizardProvider } from './OrderWizardContext';
import { cn } from '@/lib/cn';

type Props = {
  profile: UserProfile | null;
  children: ReactNode;
};

export function CustomerAppShell({ profile, children }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMobileNavOpen(false));
    return () => cancelAnimationFrame(id);
  }, [pathname]);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <OrderWizardProvider>
      <div className="min-h-dvh bg-gray-50 text-gray-900">
        {mobileNavOpen ? (
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[1px] lg:hidden"
            aria-label="Close menu"
            onClick={() => setMobileNavOpen(false)}
          />
        ) : null}

        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-50 flex w-72 max-w-[min(100vw-2rem,18rem)] flex-col border-r border-slate-800/80 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 shadow-xl transition-transform duration-300 ease-out lg:translate-x-0',
            mobileNavOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          )}
          aria-hidden={false}
        >
          <FlowSidebar
            onNavigate={() => setMobileNavOpen(false)}
            onClose={() => setMobileNavOpen(false)}
          />
        </aside>

        <div className="flex min-h-dvh min-w-0 flex-col lg:pl-72">
          <AppHeader
            profile={profile}
            onMenuOpen={() => setMobileNavOpen(true)}
            onSignOut={signOut}
          />
          <main className="flex-1 overflow-x-hidden overflow-y-auto">{children}</main>
        </div>
      </div>
    </OrderWizardProvider>
  );
}
