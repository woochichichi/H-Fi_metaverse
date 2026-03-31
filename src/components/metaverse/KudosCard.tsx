import { Trash2 } from 'lucide-react';
import { formatRelativeTime } from '../../lib/utils';
import type { KudosWithCounts, ReactionType } from '../../hooks/useKudos';
import { REACTION_EMOJIS } from '../../hooks/useKudos';

interface KudosCardProps {
  kudos: KudosWithCounts;
  readOnly: boolean;
  userId?: string;
  onToggleReaction: (kudosId: string, reaction: ReactionType) => void;
  onDelete: (kudosId: string) => void;
}

/** 포스트잇 배경색 팔레트 */
const POSTIT_COLORS = [
  'from-yellow-400/20 to-yellow-500/10 border-yellow-500/30',
  'from-pink-400/20 to-pink-500/10 border-pink-500/30',
  'from-sky-400/20 to-sky-500/10 border-sky-500/30',
  'from-lime-400/20 to-lime-500/10 border-lime-500/30',
  'from-orange-400/20 to-orange-500/10 border-orange-500/30',
  'from-violet-400/20 to-violet-500/10 border-violet-500/30',
];

const POSTIT_ROTATIONS = ['-rotate-1', 'rotate-1', '-rotate-[0.5deg]', 'rotate-[0.5deg]', 'rotate-0'];

function getColor(id: string) {
  return POSTIT_COLORS[id.charCodeAt(0) % POSTIT_COLORS.length];
}

function getRotation(id: string) {
  return POSTIT_ROTATIONS[id.charCodeAt(1) % POSTIT_ROTATIONS.length];
}

export default function KudosCard({ kudos, readOnly, userId, onToggleReaction, onDelete }: KudosCardProps) {
  return (
    <div className={`group relative rounded-lg border bg-gradient-to-br p-3 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg ${getColor(kudos.id)} ${getRotation(kudos.id)}`}>
      {/* 핀 장식 */}
      <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-red-400/80 shadow-sm shadow-red-500/30 border border-red-300/50" />

      {/* 삭제 버튼 (본인 글만) */}
      {kudos.is_mine && !readOnly && (
        <button
          onClick={() => onDelete(kudos.id)}
          className="absolute top-1 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity text-text-muted hover:text-red-400 p-0.5"
          title="삭제"
        >
          <Trash2 size={11} />
        </button>
      )}

      {/* To: 받는 사람 */}
      <div className="mb-1.5 flex items-center gap-1.5">
        <span className="text-[10px] font-medium text-text-muted italic">To.</span>
        <span className="text-xs font-bold text-amber-300">{kudos.target_name}</span>
      </div>

      {/* 메시지 */}
      <p className="mb-2 text-[12px] leading-relaxed text-text-secondary whitespace-pre-line break-words">
        {kudos.message}
      </p>

      {/* 반응 (디스코드 스타일 — 전부 나열) */}
      <div className="flex flex-wrap items-center gap-1">
        {REACTION_EMOJIS.map(emoji => {
          const r = kudos.reactions[emoji];
          const hasCount = r.count > 0;
          return (
            <button
              key={emoji}
              onClick={() => !readOnly && userId && onToggleReaction(kudos.id, emoji)}
              disabled={readOnly || !userId}
              className={`flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] transition-all ${
                r.mine
                  ? 'bg-accent/25 ring-1 ring-accent/40'
                  : hasCount
                    ? 'bg-white/10'
                    : 'bg-white/[.04] opacity-40 hover:opacity-100'
              } ${readOnly ? 'cursor-default' : 'cursor-pointer hover:bg-white/15'}`}
            >
              <span className="text-[13px] leading-none">{emoji}</span>
              {hasCount && <span className="font-medium text-text-secondary text-[10px]">{r.count}</span>}
            </button>
          );
        })}
        <span className="ml-auto text-[9px] text-text-muted italic shrink-0">{formatRelativeTime(kudos.created_at)}</span>
      </div>
    </div>
  );
}
