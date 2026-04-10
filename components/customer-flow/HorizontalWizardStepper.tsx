'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/cn';

const STEPS = [
  { key: 1, label: 'Product selection' },
  { key: 2, label: 'Design details' },
  { key: 3, label: 'Print type' },
] as const;

type Props = {
  current: 1 | 2 | 3;
};

export function HorizontalWizardStepper({ current }: Props) {
  return (
    <div className="w-full">
      <div className="lg:hidden">
        <div className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 pt-1 [scrollbar-width:thin]">
          {STEPS.map((step) => {
            const state =
              current > step.key ? 'done' : current === step.key ? 'current' : 'upcoming';
            return (
              <div
                key={step.key}
                className="flex min-w-[85%] shrink-0 snap-center flex-col gap-3 rounded-xl border border-gray-200 bg-gray-50/80 p-4 sm:min-w-[240px]"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      'flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors',
                      state === 'done' && 'bg-emerald-100 text-emerald-800 ring-2 ring-emerald-200',
                      state === 'current' &&
                        'bg-teal-600 text-white shadow-md ring-2 ring-teal-300/60',
                      state === 'upcoming' && 'bg-gray-100 text-gray-400 ring-2 ring-gray-200',
                    )}
                  >
                    {state === 'done' ? <Check className="size-4" strokeWidth={2.5} /> : step.key}
                  </span>
                  <div className="min-w-0">
                    <p
                      className={cn(
                        'text-sm font-semibold',
                        state === 'current' && 'text-gray-900',
                        state === 'upcoming' && 'text-gray-400',
                        state === 'done' && 'text-gray-700',
                      )}
                    >
                      {step.label}
                    </p>
                    <p className="text-xs text-gray-500">
                      {state === 'current'
                        ? 'In progress'
                        : state === 'done'
                          ? 'Completed'
                          : 'Up next'}
                    </p>
                  </div>
                </div>
                {step.key < STEPS.length ? (
                  <div
                    className={cn(
                      'h-0.5 w-full rounded-full',
                      current > step.key ? 'bg-emerald-200' : 'bg-gray-200',
                    )}
                    aria-hidden
                  />
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      {/* Desktop: single row + connectors */}
      <ol className="hidden w-full items-center gap-0 lg:flex">
        {STEPS.map((step, index) => {
          const state = current > step.key ? 'done' : current === step.key ? 'current' : 'upcoming';
          const isLast = index === STEPS.length - 1;

          return (
            <li key={step.key} className="flex min-w-0 flex-1 items-center">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <span
                  className={cn(
                    'flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors',
                    state === 'done' && 'bg-emerald-100 text-emerald-800 ring-2 ring-emerald-200',
                    state === 'current' &&
                      'bg-teal-600 text-white shadow-md ring-2 ring-teal-300/60',
                    state === 'upcoming' && 'bg-gray-100 text-gray-400 ring-2 ring-gray-200',
                  )}
                >
                  {state === 'done' ? <Check className="size-4" strokeWidth={2.5} /> : step.key}
                </span>
                <div className="min-w-0 py-1">
                  <p
                    className={cn(
                      'truncate text-sm font-semibold',
                      state === 'current' && 'text-gray-900',
                      state === 'upcoming' && 'text-gray-400',
                      state === 'done' && 'text-gray-700',
                    )}
                  >
                    {step.label}
                  </p>
                  <p className="text-xs text-gray-500">
                    {state === 'current'
                      ? 'In progress'
                      : state === 'done'
                        ? 'Completed'
                        : 'Up next'}
                  </p>
                </div>
              </div>
              {!isLast ? (
                <div
                  className={cn(
                    'mx-3 h-0.5 min-w-[1.5rem] flex-1 rounded-full',
                    current > step.key ? 'bg-emerald-200' : 'bg-gray-200',
                  )}
                  aria-hidden
                />
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
