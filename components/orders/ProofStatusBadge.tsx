import { cn } from '@/lib/cn';

const proofStatusStyles: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-700 ring-gray-200',
  new: 'bg-gray-100 text-gray-700 ring-gray-200',
  approved: 'bg-green-100 text-green-700 ring-green-200',
  revision_requested: 'bg-yellow-100 text-yellow-700 ring-yellow-200',
};

function labelize(status: string) {
  if (status === 'pending') return 'new';
  return status.replace(/_/g, ' ');
}

type Props = {
  status: string;
  className?: string;
};

export function ProofStatusBadge({ status, className }: Props) {
  const raw = String(status);
  const key = raw === 'pending' ? 'new' : raw;
  const styles = proofStatusStyles[key] ?? 'bg-stone-100 text-stone-800 ring-stone-300/80';

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ring-inset',
        styles,
        className,
      )}
    >
      {labelize(key)}
    </span>
  );
}
