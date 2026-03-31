import { TrendingUp, TrendingDown } from 'lucide-react';
import type { KpiItem, KpiRecord } from '../../types';

interface KpiCardProps {
  item: KpiItem;
  records: KpiRecord[];
  onClick?: () => void;
}

export default function KpiCard({ item, records, onClick }: KpiCardProps) {
  // 최신 월 기록
  const sorted = [...records].sort((a, b) => b.month.localeCompare(a.month));
  const latest = sorted[0];
  const previous = sorted[1];

  const currentScore = latest?.score ?? 0;
  const maxScore = item.max_score || 3;
  const percentage = Math.round((currentScore / maxScore) * 100);

  // 전월 대비 변화
  const prevScore = previous?.score ?? null;
  const change = prevScore !== null ? currentScore - prevScore : null;

  // 색상 결정
  const getColor = (pct: number) => {
    if (pct >= 90) return { bar: '#22c55e', text: 'text-success' };
    if (pct >= 70) return { bar: '#f59e0b', text: 'text-warning' };
    return { bar: '#ef4444', text: 'text-danger' };
  };

  const color = getColor(percentage);

  return (
    <button
      onClick={onClick}
      className="flex flex-col gap-2.5 rounded-xl border border-white/[.06] bg-white/[.03] p-3 text-left transition-colors duration-200 hover:bg-white/[.06]"
    >
      {/* 제목 + 변화량 */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary line-clamp-1 tracking-wide">{item.title}</h3>
        {change !== null && (
          <span className={`flex items-center gap-0.5 text-[11px] font-mono font-medium ${
            change >= 0 ? 'text-success' : 'text-danger'
          }`}>
            {change >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {change >= 0 ? '+' : ''}{change.toFixed(1)}
          </span>
        )}
      </div>

      {/* 설명 */}
      {item.description && (
        <p className="text-xs text-text-muted line-clamp-1">{item.description}</p>
      )}

      {/* 프로그레스 바 */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-text-muted">
            {latest?.month ?? '-'}
          </span>
          <span className={`font-mono font-semibold ${color.text}`}>
            {currentScore.toFixed(1)} / {maxScore}
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-white/[.08]">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(percentage, 100)}%`,
              backgroundColor: color.bar,
            }}
          />
        </div>
        <div className="text-right">
          <span className={`text-[10px] font-mono font-medium ${color.text}`}>
            {percentage}%
          </span>
        </div>
      </div>
    </button>
  );
}
