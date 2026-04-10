'use client';

import { Menu, LogOut } from 'lucide-react';
import type { UserProfile } from '@/types/customer';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';

type Props = {
  profile: UserProfile | null;
  onMenuOpen: () => void;
  onSignOut: () => void;
};

export function AppHeader({ profile, onMenuOpen, onSignOut }: Props) {
  return (
    <header
      className={cn(
        'sticky top-0 z-20 border-b border-gray-200 bg-white/95 px-4 py-3 backdrop-blur-md supports-[backdrop-filter]:bg-white/80',
        'lg:px-8',
      )}
    >
      <div className="mx-auto flex max-w-6xl items-center gap-3 lg:gap-6">
        <button
          type="button"
          onClick={onMenuOpen}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 shadow-sm transition hover:bg-gray-50 active:bg-gray-100 lg:hidden"
          aria-label="Open navigation"
        >
          <Menu className="size-5" strokeWidth={1.5} />
        </button>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-gray-900">
            {profile?.name ?? 'Customer'}
          </p>
          <p className="truncate text-xs text-gray-500">
            {profile?.organization ?? 'Organization'}
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-stretch gap-2 sm:flex-row sm:items-center">
          <Button
            type="button"
            variant="secondary"
            onClick={() => void onSignOut()}
            className="w-full sm:w-auto"
          >
            <LogOut className="size-3.5" strokeWidth={1.5} />
            Sign out
          </Button>
        </div>
      </div>
    </header>
  );
}
