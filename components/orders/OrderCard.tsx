import Link from 'next/link';
import { format } from 'date-fns';
import { ArrowRight, CalendarDays } from 'lucide-react';
import type { OrderRow } from '@/types/customer';
import { StatusBadge } from './StatusBadge';
import { Card } from '@/components/ui/Card';

type Props = {
  order: OrderRow;
};

export function OrderCard({ order }: Props) {
  const due = order.due_date
    ? (() => {
        try {
          return format(new Date(order.due_date), 'MMM d, yyyy');
        } catch {
          return order.due_date;
        }
      })()
    : '—';

  return (
    <Card className="flex flex-col gap-6 transition-shadow hover:shadow-md sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 space-y-2">
        <h3 className="truncate text-lg font-semibold text-gray-900">{order.event_name}</h3>
        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="size-4 text-gray-400" strokeWidth={1.5} />
            Due {due}
          </span>
          <StatusBadge status={order.status} />
        </div>
      </div>
      <Link
        href={`/orders/${order.id}`}
        className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-800 shadow-sm transition hover:border-teal-300 hover:bg-teal-50 hover:text-teal-900 active:bg-teal-100 sm:w-auto"
      >
        View details
        <ArrowRight className="size-4" strokeWidth={1.5} />
      </Link>
    </Card>
  );
}
