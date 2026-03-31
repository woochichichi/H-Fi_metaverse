import { Heart, ArrowRight } from 'lucide-react';
import { formatRelativeTime } from '../../lib/utils';
import type { KudosWithCounts } from '../../hooks/useKudos';

interface KudosCardProps {
  kudos: KudosWithCounts;
  readOnly: boolean;
  userId?: string;
  onToggleLike: (kudosId: string) => void;
}

const PRAISE_EMOJIS = ['👏', '🌟', '💪', '🎯', '🔥', '✨', '💎', '🏆'];

function getEmoji(id: string) {
  const idx = id.charCodeAt(0) % PRAISE_EMOJIS.length;
  return PRAISE_EMOJIS[idx];
}

export default function KudosCard({ kudos, readOnly, userId, onToggleLike }: KudosCardProps) {
  return (
    <div className="group rounded-xl border border-white/[.06] bg-gradient-to-br from-white/[.04] to-white/[.01] p-3 transition-all duration-200 hover:border-accent/20 hover:shadow-lg hover:shadow-accent/5">
      {/* 상단: 보낸 사람 → 받는 사람 */}
      <div className="mb-2 flex items-center gap-1.5">
        <span className="text-base">{getEmoji(kudos.id)}</span>
        <span className="text-xs font-bold text-accent">{kudos.author_name}</span>
        <ArrowRight size={10} className="text-text-muted" />
        <span className="text-xs font-bold text-amber-400">{kudos.target_name}</span>
      </div>

      {/* 메시지 */}
      <p className="mb-2.5 text-[13px] leading-relaxed text-text-secondary whitespace-pre-line">
        {kudos.message}
      </p>

      {/* 하단: 좋아요 + 시간 */}
      <div className="flex items-center gap-3 text-[11px] text-text-muted">
        <button
          onClick={() => !readOnly && userId && onToggleLike(kudos.id)}
          disabled={readOnly || !userId}
          className={`flex items-center gap-1 transition-all duration-200 ${
            readOnly
              ? 'cursor-default opacity-50'
              : kudos.my_like
                ? 'text-rose-400 scale-105'
                : 'hover:text-rose-400 hover:scale-105'
          }`}
        >
          <Heart size={13} fill={kudos.my_like ? 'currentColor' : 'none'} strokeWidth={kudos.my_like ? 0 : 2} />
          {kudos.like_count > 0 && <span className="font-medium">{kudos.like_count}</span>}
        </button>
        <span className="ml-auto">{formatRelativeTime(kudos.created_at)}</span>
      </div>
    </div>
  );
}
