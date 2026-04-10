import type { OrderStatus } from '@/types/customer';
import { cn } from '@/lib/cn';

/** Stronger contrast per `order_status_enum` for dashboard & order headers. */
const styles: Record<string, string> = {
  new: 'bg-gray-100 text-gray-700 ring-gray-200',
  proof_pending: 'bg-yellow-100 text-yellow-700 ring-yellow-200',
  proof_ready: 'bg-sky-100 text-sky-700 ring-sky-200',
  approved: 'bg-green-100 text-green-700 ring-green-200',
  revision_requested: 'bg-yellow-100 text-yellow-700 ring-yellow-200',
  in_production: 'bg-violet-200/90 text-violet-950 ring-violet-400/50',
  shipped: 'bg-indigo-200/90 text-indigo-950 ring-indigo-400/50',
  complete: 'bg-teal-900 text-teal-50 ring-teal-700',
};

function labelize(status: string) {
  return status.replace(/_/g, ' ');
}

type Props = {
  status: OrderStatus;
  className?: string;
};

export function StatusBadge({ status, className }: Props) {
  const key = String(status);
  const palette = styles[key] ?? 'bg-gray-100 text-gray-700 ring-gray-200';

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold capitalize ring-1 ring-inset shadow-sm',
        palette,
        className,
      )}
    >
      {labelize(key)}
    </span>
  );
}
