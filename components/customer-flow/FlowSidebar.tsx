'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Check, LayoutDashboard, PlusCircle, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useOrderWizardStep } from './OrderWizardContext';

const WIZARD_STEPS = [
  { step: 1, title: 'Product selection', subtitle: 'Choose items & event details' },
  { step: 2, title: 'Design details', subtitle: 'Artwork & direction' },
  { step: 3, title: 'Print type', subtitle: 'Method & turnaround' },
] as const;

type Props = {
  onNavigate?: () => void;
  onClose?: () => void;
};

export function FlowSidebar({ onNavigate, onClose }: Props) {
  const pathname = usePathname();
  const { wizardStep: ctxStep } = useOrderWizardStep();
  const onDashboard = pathname === '/dashboard';
  const onNewOrder = pathname.startsWith('/orders/new');
  const wizardStep = onNewOrder ? ctxStep : null;

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <div className="flex items-start justify-between gap-2 border-b border-white/10 px-5 py-6">
        <Link
          href="/dashboard"
          onClick={() => onNavigate?.()}
          className="min-w-0 font-semibold tracking-tight text-white"
        >
          <span className="text-lg">TCL Portal</span>
          <span className="mt-1 block text-xs font-normal text-slate-400">Customer portal</span>
        </Link>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-300 transition hover:bg-white/10 hover:text-white lg:hidden"
            aria-label="Close menu"
          >
            <X className="size-5" strokeWidth={1.5} />
          </button>
        ) : null}
      </div>

      <nav className="flex flex-col gap-1 px-3 py-4">
        <Link
          href="/dashboard"
          onClick={() => onNavigate?.()}
          className={cn(
            'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
            onDashboard
              ? 'bg-white/10 text-white'
              : 'text-slate-300 hover:bg-white/5 hover:text-white',
          )}
        >
          <LayoutDashboard className="size-4 opacity-80" strokeWidth={1.5} />
          Dashboard
        </Link>
        <Link
          href="/orders/new"
          onClick={() => onNavigate?.()}
          className={cn(
            'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
            onNewOrder
              ? 'bg-teal-500/20 text-teal-100 ring-1 ring-teal-400/30'
              : 'text-slate-300 hover:bg-white/5 hover:text-white',
          )}
        >
          <PlusCircle className="size-4 opacity-80" strokeWidth={1.5} />
          New order
        </Link>
      </nav>

      {onNewOrder ? (
        <div className="mx-3 min-h-0 flex-1 overflow-y-auto border-t border-white/10 pt-4">
          <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            New order steps
          </p>
          <ul className="flex flex-col gap-0.5 px-1 pb-6">
            {WIZARD_STEPS.map((s) => {
              const isWizardActive = wizardStep != null && s.step === wizardStep;
              const doneOnWizard = wizardStep != null && s.step < wizardStep;

              return (
                <li key={s.step}>
                  <div
                    className={cn(
                      'flex gap-3 rounded-xl px-3 py-2.5 transition-colors',
                      isWizardActive && 'bg-teal-500/15 ring-1 ring-teal-400/25',
                      !isWizardActive && !doneOnWizard && 'opacity-80',
                    )}
                  >
                    <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center">
                      {doneOnWizard ? (
                        <span className="flex size-7 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/30">
                          <Check className="size-3.5" strokeWidth={2.5} />
                        </span>
                      ) : isWizardActive ? (
                        <span className="flex size-7 items-center justify-center rounded-full bg-teal-400 text-xs font-bold text-slate-950 shadow-sm shadow-teal-500/40">
                          {s.step}
                        </span>
                      ) : (
                        <span className="flex size-7 items-center justify-center rounded-full bg-slate-800 text-xs font-semibold text-slate-400 ring-1 ring-slate-700">
                          {s.step}
                        </span>
                      )}
                    </span>
                    <div className="min-w-0">
                      <p
                        className={cn(
                          'text-sm font-medium leading-tight',
                          isWizardActive ? 'text-white' : 'text-slate-200',
                        )}
                      >
                        {s.title}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">{s.subtitle}</p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
        <div className="mx-3 flex-1 border-t border-white/10 pt-4" />
      )}
    </div>
  );
}
