import { Paperclip, User, EyeOff, EyeOff as Hidden, CheckCircle } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';
import { formatRelativeTime } from '../../lib/utils';
import type { Voc } from '../../types';
import type { VocCategory } from '../../lib/constants';

const CATEGORY_CONFIG: Record<VocCategory, { color: string; bg: string }> = {
  '불편': { color: '#ef4444', bg: 'rgba(239,68,68,.15)' },
  '요청': { color: '#3b82f6', bg: 'rgba(59,130,246,.15)' },
  '칭찬': { color: '#22c55e', bg: 'rgba(34,197,94,.15)' },
  '개선': { color: '#f59e0b', bg: 'rgba(245,158,11,.15)' },
  '기타': { color: '#94a3b8', bg: 'rgba(148,163,184,.15)' },
};

const SEVERITY_COLORS: Record<number, string> = {
  1: '#22c55e', 2: '#86efac', 3: '#f59e0b', 4: '#f97316', 5: '#ef4444',
};

interface VocCardProps {
  voc: Voc;
  onClick: () => void;
  assigneeName?: string | null;
}

export default function VocCard({ voc, onClick, assigneeName }: VocCardProps) {
  const catConfig = CATEGORY_CONFIG[voc.category];

  return (
    <button
      onClick={onClick}
      className={`flex w-full flex-col gap-2 rounded-xl border p-3 text-left transition-colors duration-200 ${
        voc.is_hidden
          ? 'border-danger/20 bg-danger/[.04] hover:bg-danger/[.08]'
          : 'border-white/[.06] bg-white/[.03] hover:bg-white/[.06]'
      }`}
    >
      {/* 상단: 카테고리 + 심각도 + 상태 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span
            className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium"
            style={{ color: catConfig.color, backgroundColor: catConfig.bg }}
          >
            {voc.category}
          </span>
          {voc.sub_category && (
            <span className="rounded-full bg-white/[.06] px-2 py-0.5 text-[10px] text-text-muted">
              {voc.sub_category}
            </span>
          )}
          {voc.severity && (
            <span
              className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-bold"
              style={{
                color: SEVERITY_COLORS[voc.severity],
                backgroundColor: `${SEVERITY_COLORS[voc.severity]}20`,
              }}
            >
              Lv.{voc.severity}
            </span>
          )}
          {voc.is_hidden && (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-danger/15 px-1.5 py-0.5 text-[9px] font-medium text-danger">
              <Hidden size={9} /> 비공개
            </span>
          )}
        </div>
        <StatusBadge status={voc.status} />
      </div>

      {/* 제목 */}
      <h3 className="text-sm font-semibold text-text-primary line-clamp-1 tracking-wide">{voc.title}</h3>

      {/* ⑤ 피드백 루프: 완료 + resolution 있으면 미리보기 */}
      {voc.status === '완료' && voc.resolution && (
        <div className="flex items-start gap-1.5 rounded-lg bg-success/10 px-2.5 py-1.5">
          <CheckCircle size={12} className="text-success mt-0.5 shrink-0" />
          <p className="text-[11px] text-success/80 line-clamp-2">{voc.resolution}</p>
        </div>
      )}

      {/* 하단: 메타 정보 */}
      <div className="flex items-center gap-2 text-[11px] text-text-muted">
        {voc.anonymous ? (
          <span className="flex items-center gap-1">
            <EyeOff size={11} /> 익명
          </span>
        ) : (
          <span className="flex items-center gap-1">
            <User size={11} /> 실명
          </span>
        )}
        <span>·</span>
        <span>{voc.team}</span>
        <span>·</span>
        <span>{formatRelativeTime(voc.created_at)}</span>
        {assigneeName && (
          <>
            <span>·</span>
            <span className="text-accent">{assigneeName}</span>
          </>
        )}
        {voc.attachment_urls && voc.attachment_urls.length > 0 && (
          <>
            <span>·</span>
            <span className="flex items-center gap-0.5">
              <Paperclip size={10} /> {voc.attachment_urls.length}
            </span>
          </>
        )}
      </div>
    </button>
  );
}
