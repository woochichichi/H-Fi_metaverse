import type { UrgencyLevel } from '../../lib/constants';

const URGENCY_CONFIG: Record<UrgencyLevel, { label: string; color: string; bg: string }> = {
  '긴급': { label: '🔴 긴급', color: '#ef4444', bg: 'rgba(239,68,68,.15)' },
  '할일': { label: '🟡 할일', color: '#f59e0b', bg: 'rgba(245,158,11,.15)' },
  '참고': { label: '🔵 참고', color: '#3b82f6', bg: 'rgba(59,130,246,.15)' },
};

interface UrgencyBadgeProps {
  urgency: UrgencyLevel;
  size?: 'sm' | 'md';
}

export default function UrgencyBadge({ urgency, size = 'sm' }: UrgencyBadgeProps) {
  const config = URGENCY_CONFIG[urgency];
  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
      }`}
      style={{ color: config.color, backgroundColor: config.bg }}
    >
      {config.label}
    </span>
  );
}
