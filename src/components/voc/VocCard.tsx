import { Paperclip, User, EyeOff } from 'lucide-react';
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

interface VocCardProps {
  voc: Voc;
  onClick: () => void;
}

export default function VocCard({ voc, onClick }: VocCardProps) {
  const catConfig = CATEGORY_CONFIG[voc.category];

  return (
    <button
      onClick={onClick}
      className="flex w-full flex-col gap-2 rounded-xl border border-white/[.06] bg-white/[.03] p-3 text-left transition-colors duration-200 hover:bg-white/[.06]"
    >
      {/* 상단: 카테고리 + 상태 */}
      <div className="flex items-center justify-between">
        <span
          className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium"
          style={{ color: catConfig.color, backgroundColor: catConfig.bg }}
        >
          {voc.category}
        </span>
        <StatusBadge status={voc.status} />
      </div>

      {/* 제목 */}
      <h3 className="text-sm font-semibold text-text-primary line-clamp-1">{voc.title}</h3>

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
