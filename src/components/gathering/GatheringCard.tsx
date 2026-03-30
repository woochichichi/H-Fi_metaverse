import { Users, Clock, Calendar } from 'lucide-react';
import type { Gathering } from '../../types';
import { GATHERING_STATUS_LABELS } from '../../lib/constants';

interface GatheringCardProps {
  gathering: Gathering;
  joined: boolean;
  onClick: () => void;
}

const CATEGORY_EMOJI: Record<string, string> = {
  운동: '🏃',
  맛집: '🍽️',
  스터디: '📚',
  취미: '🎮',
  기타: '✨',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return '방금';
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  const d = Math.floor(h / 24);
  return `${d}일 전`;
}

function deadlineLabel(deadline: string | null): string | null {
  if (!deadline) return null;
  const d = new Date(deadline);
  const now = new Date();
  if (d < now) return '기한 지남';
  const diff = d.getTime() - now.getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 24) return `${hours}시간 남음`;
  const days = Math.floor(hours / 24);
  return `${days}일 남음`;
}

export default function GatheringCard({ gathering, joined, onClick }: GatheringCardProps) {
  const isRecruiting = gathering.status === 'recruiting';
  const statusLabel = GATHERING_STATUS_LABELS[gathering.status];
  const dl = deadlineLabel(gathering.deadline);

  return (
    <button
      onClick={onClick}
      className="flex flex-col gap-2 rounded-xl border border-white/[.06] bg-white/[.03] p-3 text-left transition-colors hover:bg-white/[.06]"
    >
      {/* 상단: 카테고리 + 상태 */}
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1 rounded-full bg-white/[.06] px-2 py-0.5 text-[10px] font-medium text-text-muted">
          {CATEGORY_EMOJI[gathering.category] ?? '✨'} {gathering.category}
        </span>
        <div className="flex items-center gap-1.5">
          {joined && (
            <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-bold text-accent">
              참여중
            </span>
          )}
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
              isRecruiting
                ? 'bg-success/20 text-success'
                : gathering.status === 'closed'
                ? 'bg-warning/20 text-warning'
                : 'bg-white/[.08] text-text-muted'
            }`}
          >
            {statusLabel}
          </span>
        </div>
      </div>

      {/* 제목 */}
      <h3 className="text-sm font-semibold text-text-primary line-clamp-1">{gathering.title}</h3>

      {/* 설명 */}
      <p className="text-xs text-text-muted line-clamp-2">{gathering.description}</p>

      {/* 하단 메타 */}
      <div className="flex items-center gap-3 text-[11px] text-text-muted">
        <span className="flex items-center gap-1">
          <Users size={12} />
          {gathering.member_count}
          {gathering.max_members ? `/${gathering.max_members}` : ''}명
        </span>
        {dl && (
          <span className="flex items-center gap-1">
            <Calendar size={12} />
            {dl}
          </span>
        )}
        <span className="flex items-center gap-1 ml-auto">
          <Clock size={12} />
          {timeAgo(gathering.created_at)}
        </span>
      </div>
    </button>
  );
}
