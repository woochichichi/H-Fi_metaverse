import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { MemberActivity, ActivityDetail } from '../../hooks/useKpi';

interface KpiMemberRowProps {
  member: MemberActivity;
  onExpand: (userId: string) => Promise<ActivityDetail[]>;
}

const TYPE_LABEL: Record<string, string> = {
  voc_submit: 'VoC',
  idea_submit: '아이디어',
  idea_vote: '아이디어 투표',
  event_join: '이벤트 참여',
  exchange_join: '교류 참여',
  notice_read: '공지 확인',
  note_send: '쪽지 발송',
};

const TYPE_ICON: Record<string, string> = {
  voc_submit: '📋',
  idea_submit: '💡',
  event_join: '🎪',
  exchange_join: '☕',
};

function CountBadge({ count }: { count: number }) {
  const color = count >= 3 ? 'text-success' : count >= 1 ? 'text-warning' : 'text-text-muted';
  return (
    <span className={`text-xs font-mono font-semibold ${color}`}>
      {count}
    </span>
  );
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export default function KpiMemberRow({ member, onExpand }: KpiMemberRowProps) {
  const [expanded, setExpanded] = useState(false);
  const [details, setDetails] = useState<ActivityDetail[] | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const totalCount = member.vocCount + member.ideaCount + member.eventJoinCount + member.exchangeJoinCount;

  const handleToggle = async () => {
    if (expanded) {
      setExpanded(false);
      return;
    }
    if (!details) {
      setLoadingDetail(true);
      const result = await onExpand(member.userId);
      // KPI에서 추적하는 4가지 타입만 필터
      const kpiTypes = ['voc_submit', 'idea_submit', 'event_join', 'exchange_join'];
      setDetails(result.filter((d) => kpiTypes.includes(d.activityType)));
      setLoadingDetail(false);
    }
    setExpanded(true);
  };

  return (
    <div className="rounded-lg bg-white/[.03] transition-colors hover:bg-white/[.06]">
      {/* 요약 행 */}
      <button
        onClick={handleToggle}
        disabled={totalCount === 0}
        className="grid w-full grid-cols-[1fr_repeat(4,40px)_20px] gap-1 items-center px-2 py-2 text-left disabled:cursor-default"
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/20 text-[10px] font-bold text-accent">
            {member.name.slice(-2)}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-text-primary truncate">{member.name}</p>
            {member.unit && (
              <p className="text-[9px] text-text-muted">{member.unit}</p>
            )}
          </div>
        </div>

        <div className="text-center"><CountBadge count={member.vocCount} /></div>
        <div className="text-center"><CountBadge count={member.ideaCount} /></div>
        <div className="text-center"><CountBadge count={member.eventJoinCount} /></div>
        <div className="text-center"><CountBadge count={member.exchangeJoinCount} /></div>

        <div className="flex items-center justify-center">
          {totalCount > 0 && (
            <ChevronDown
              size={12}
              className={`text-text-muted transition-transform ${expanded ? 'rotate-180' : ''}`}
            />
          )}
        </div>
      </button>

      {/* 상세 펼침 */}
      {expanded && (
        <div className="border-t border-white/[.06] px-3 py-2 space-y-1">
          {loadingDetail ? (
            <p className="text-[11px] text-text-muted py-1 animate-pulse">불러오는 중...</p>
          ) : details && details.length > 0 ? (
            details.map((d) => (
              <div key={d.id} className="flex items-center gap-2 py-0.5 text-[11px]">
                <span>{TYPE_ICON[d.activityType] ?? '📌'}</span>
                <span className="text-text-muted shrink-0">{formatDate(d.createdAt)}</span>
                <span className="text-text-secondary truncate">
                  {d.title ?? `${TYPE_LABEL[d.activityType] ?? d.activityType}`}
                </span>
              </div>
            ))
          ) : (
            <p className="text-[11px] text-text-muted py-1">활동 내역 없음</p>
          )}
        </div>
      )}
    </div>
  );
}
