'use client';

import { useEffect, useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/Card';

type Props = {
  /**
   * When set, always loads tips for this order (e.g. order detail page).
   * Does not use or clear sessionStorage.
   */
  orderId?: string;
  /**
   * Dashboard: after placing an order, `tcl_last_order_id` is set and this panel reads it once.
   */
  fromSessionStorage?: boolean;
  /** Required for sessionStorage flow: only fetch when user just landed from new order */
  active?: boolean;
};

export function NextBestActionPanel({
  orderId,
  fromSessionStorage = false,
  active = false,
}: Props) {
  const [text, setText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const explicitOrder = Boolean(orderId);
  const sessionFlow = fromSessionStorage && active && !explicitOrder;

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!explicitOrder && !sessionFlow) {
      setText(null);
      setLoading(false);
      return;
    }

    let targetId: string | null = null;
    if (orderId) {
      targetId = orderId;
    } else if (sessionFlow) {
      targetId = sessionStorage.getItem('tcl_last_order_id');
    }

    if (!targetId) {
      setText(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/orders/${targetId}/next-best-action`)
      .then(async (res) => {
        const data = (await res.json()) as {
          suggestion?: string | null;
          fallback?: string | null;
          error?: string;
        };
        if (cancelled) return;
        if (data.suggestion) {
          setText(data.suggestion);
        } else if (data.fallback) {
          setText(data.fallback);
        } else {
          setError(data.error ?? 'Could not load suggestion.');
        }
      })
      .catch(() => {
        if (!cancelled) setError('Network error loading suggestion.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
        if (sessionFlow) {
          try {
            sessionStorage.removeItem('tcl_last_order_id');
          } catch {
            /* ignore */
          }
        }
      });

    return () => {
      cancelled = true;
    };
  }, [orderId, explicitOrder, sessionFlow]);

  if (!explicitOrder && !sessionFlow) return null;

  const subtitle = explicitOrder
    ? 'Updates when you return — based on order status and proofs (Google Gemini).'
    : 'Personalized tip for your new order (Google Gemini).';

  return (
    <Card className="mb-6 border-violet-200/80 bg-gradient-to-br from-violet-50/90 via-white to-teal-50/40 p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
          <Sparkles className="size-5" strokeWidth={1.5} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-gray-900">What happens next</h2>
          <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>
          {loading ? (
            <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
              <Loader2 className="size-4 animate-spin text-violet-600" />
              Preparing your summary…
            </div>
          ) : error ? (
            <p className="mt-3 text-sm text-red-700">{error}</p>
          ) : text ? (
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-gray-800">{text}</p>
          ) : (
            <p className="mt-3 text-sm text-gray-600">
              {sessionFlow
                ? 'Submit an order to see a tailored next-steps message here.'
                : 'No suggestion available yet.'}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
