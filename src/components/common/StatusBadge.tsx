import type { VocStatus } from '../../lib/constants';

const STATUS_CONFIG: Record<VocStatus, { color: string; bg: string }> = {
  '접수': { color: '#94a3b8', bg: 'rgba(148,163,184,.15)' },
  '검토중': { color: '#3b82f6', bg: 'rgba(59,130,246,.15)' },
  '처리중': { color: '#f59e0b', bg: 'rgba(245,158,11,.15)' },
  '완료': { color: '#22c55e', bg: 'rgba(34,197,94,.15)' },
  '보류': { color: '#ef4444', bg: 'rgba(239,68,68,.15)' },
};

interface StatusBadgeProps {
  status: VocStatus;
  size?: 'sm' | 'md';
}

export default function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
      }`}
      style={{ color: config.color, backgroundColor: config.bg }}
    >
      {status}
    </span>
  );
}
