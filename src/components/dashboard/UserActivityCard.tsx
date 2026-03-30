import { ChevronRight } from 'lucide-react';
import type { UserStat, UserDetailActivity } from '../../hooks/useUserActivities';

interface UserActivityCardProps {
  stat: UserStat;
  onViewDetail: (userId: string) => void;
}

const TYPE_LABELS: Record<string, string> = {
  voc_submit: 'VOC',
  idea_submit: '아이디어',
  idea_vote: '투표',
  notice_read: '공지읽음',
  event_join: '이벤트',
  note_send: '쪽지',
  exchange_join: '인적교류',
};

export default function UserActivityCard({ stat, onViewDetail }: UserActivityCardProps) {
  const totalActivities =
    stat.voc_submit + stat.idea_submit + stat.idea_vote +
    stat.notice_read + stat.event_join + stat.note_send + stat.exchange_join;

  return (
    <div className="rounded-xl border border-white/[.06] bg-white/[.03] p-3 transition-colors hover:bg-white/[.04]">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <span className="text-xs font-semibold text-text-primary">{stat.name}</span>
          <span className="ml-1.5 text-[10px] text-text-muted">({stat.team})</span>
        </div>
        <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-bold text-accent">
          {stat.totalPoints.toFixed(1)}pt
        </span>
      </div>

      {/* 활동 요약 */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-text-secondary">
        {stat.voc_submit > 0 && <span>📞 VOC {stat.voc_submit}건</span>}
        {stat.idea_submit > 0 && <span>💡 아이디어 {stat.idea_submit}건</span>}
        {stat.idea_vote > 0 && <span>👍 투표 {stat.idea_vote}건</span>}
        {stat.notice_read > 0 && <span>📋 공지읽음 {stat.notice_read}건</span>}
        {stat.event_join > 0 && <span>🎉 이벤트 {stat.event_join}건</span>}
        {stat.note_send > 0 && <span>✉️ 쪽지 {stat.note_send}건</span>}
        {stat.exchange_join > 0 && <span>🤝 인적교류 {stat.exchange_join}건</span>}
        {totalActivities === 0 && <span className="text-text-muted">활동 없음</span>}
      </div>

      {/* 상세 보기 */}
      <button
        onClick={() => onViewDetail(stat.userId)}
        className="mt-2 flex items-center gap-0.5 text-[10px] font-semibold text-accent transition-colors hover:text-accent-light"
      >
        상세 보기 <ChevronRight size={11} />
      </button>
    </div>
  );
}

// 상세 모달 컴포넌트
interface UserDetailModalProps {
  userName: string;
  details: UserDetailActivity[];
  onClose: () => void;
}

export function UserDetailModal({ userName, details, onClose }: UserDetailModalProps) {
  const timeAgo = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <>
      <div className="fixed inset-0 z-[300] bg-black/50" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 z-[301] w-96 max-h-[70vh] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-white/[.08] bg-bg-secondary shadow-2xl flex flex-col">
        <div className="flex items-center justify-between border-b border-white/[.06] px-4 py-3">
          <h4 className="text-sm font-bold text-text-primary">{userName} 활동 상세</h4>
          <button
            onClick={onClose}
            className="text-xs text-text-muted hover:text-text-primary"
          >
            닫기
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {details.length === 0 ? (
            <p className="py-4 text-center text-xs text-text-muted">활동 내역이 없습니다</p>
          ) : (
            <div className="flex flex-col gap-2">
              {details.map((d) => (
                <div
                  key={d.id}
                  className="flex items-center justify-between rounded-lg bg-white/[.03] px-3 py-2"
                >
                  <div>
                    <span className="text-xs text-text-primary">
                      {TYPE_LABELS[d.activity_type] || d.activity_type}
                    </span>
                    <span className="ml-2 text-[10px] text-text-muted">+{d.points}pt</span>
                  </div>
                  <span className="text-[10px] text-text-muted">{timeAgo(d.created_at)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
