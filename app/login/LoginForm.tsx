'use client';

import { useActionState, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Loader2, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { authenticate } from './actions';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';

export default function LoginForm() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [state, formAction, isPending] = useActionState(authenticate, null);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const isSignIn = mode === 'signin';

  useEffect(() => {
    if (
      state?.success === 'Login successful' ||
      state?.success === 'Account created successfully'
    ) {
      setTimeout(() => {
        router.push('/dashboard');
      }, 1000);
    }
  }, [state, router]);

  return (
    <Card className="p-8 shadow-xl border-slate-200">
      {/* Mode Toggle Swiper */}
      <div className="mb-8 p-1 bg-slate-100 rounded-xl flex relative">
        <div 
          className={cn(
            "absolute inset-y-1 w-1/2 bg-white rounded-lg shadow-sm transition-all duration-300 ease-out",
            isSignIn ? "left-1" : "left-[calc(50%)]"
          )}
        />
        <button
          type="button"
          onClick={() => setMode('signin')}
          className={cn(
            "relative z-10 flex-1 py-2 text-[11px] font-black uppercase tracking-widest transition-colors duration-200 text-center",
            isSignIn ? "text-teal-600" : "text-slate-400"
          )}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => setMode('signup')}
          className={cn(
            "relative z-10 flex-1 py-2 text-[11px] font-black uppercase tracking-widest transition-colors duration-200 text-center",
            isSignIn ? "text-slate-400" : "text-teal-600"
          )}
        >
          Create Account
        </button>
      </div>

      <form action={formAction} className="space-y-6">
        {/* Hidden intent input for server action */}
        <input type="hidden" name="intent" value={mode} />

        {state?.error && (
          <div className="flex items-center gap-3 px-4 py-3 text-sm text-red-800 bg-red-50 border border-red-100 rounded-xl animate-in fade-in slide-in-from-top-1">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <p className="font-medium">{state.error}</p>
          </div>
        )}

        {state?.success && (
          <div className="flex items-center gap-3 px-4 py-3 text-sm text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-xl animate-in fade-in slide-in-from-top-1">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <p className="font-medium">{state.success}</p>
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">
              Email Address
            </label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 transition-colors group-focus-within:text-teal-600" />
              <input
                name="email"
                type="email"
                required
                className="w-full h-11 pl-11 pr-4 rounded-xl border border-slate-200 bg-slate-50/30 text-sm outline-none transition-all focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 placeholder:text-slate-400 group-hover:border-slate-300"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between ml-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                Password
              </label>
            </div>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 transition-colors group-focus-within:text-teal-600" />
              <input
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                className="w-full h-11 pl-11 pr-12 rounded-xl border border-slate-200 bg-slate-50/30 text-sm outline-none transition-all focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 placeholder:text-slate-400 group-hover:border-slate-300"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-2">
          <Button
            type="submit"
            variant="primary"
            disabled={isPending}
            className="w-full h-11 uppercase font-black tracking-widest shadow-lg shadow-teal-600/20"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isSignIn ? (
              'Sign In'
            ) : (
              'Create Account'
            )}
          </Button>
        </div>
      </form>
    </Card>
  );
}
