import { CheckCheck, X } from 'lucide-react';
import InboxCard from './InboxCard';
import { useUiStore } from '../../stores/uiStore';
import { useAuthStore } from '../../stores/authStore';
import { TEAM_TO_ROOM } from '../../lib/constants';
import type { Notification } from '../../types';

interface InboxPanelProps {
  items: Notification[];
  loading: boolean;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClose: () => void;
}

export default function InboxPanel({
  items,
  loading,
  onMarkAsRead,
  onMarkAllAsRead,
  onClose,
}: InboxPanelProps) {
  const { openModal } = useUiStore();
  const { profile } = useAuthStore();

  const unreadItems = items.filter((n) => !n.read);
  const readItems = items.filter((n) => n.read);

  const handleItemClick = (notification: Notification) => {
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }

    // link 필드로 해당 기능 이동
    if (notification.link) {
      const match = notification.link.match(/^\/(voc|note|notice|idea)\//);
      if (match) {
        let modalId = match[1];
        // notice → 팀별 zone ID로 변환 (예: stock-notice)
        if (modalId === 'notice' && profile?.team) {
          const roomId = TEAM_TO_ROOM[profile.team as keyof typeof TEAM_TO_ROOM];
          if (roomId) modalId = `${roomId}-notice`;
        }
        openModal(modalId);
        onClose();
      }
    }
  };

  return (
    <div className="flex flex-col max-h-[480px] w-80">
      {/* 헤더 */}
      <div className="flex items-center justify-between border-b border-white/[.06] px-4 py-3">
        <h3 className="font-heading text-sm font-bold text-text-primary">수집함</h3>
        <div className="flex items-center gap-1">
          {unreadItems.length > 0 && (
            <button
              onClick={onMarkAllAsRead}
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] text-text-muted transition-colors hover:bg-white/10 hover:text-text-primary"
              title="모두 읽음"
            >
              <CheckCheck size={14} />
              모두 읽음
            </button>
          )}
          <button
            onClick={onClose}
            className="flex h-6 w-6 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-white/10 hover:text-text-primary"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* 보드 설명 */}
      <div className="border-b border-white/[.06] bg-accent/[.04] px-3 py-1.5">
        <p className="text-[10px] leading-relaxed text-text-muted">
          <span className="font-semibold text-text-secondary">놓친 소식 모아보기</span> — 확인하지 못한 알림, 쪽지, VOC 답변을 시급성 순으로 정리해 보여줍니다.
        </p>
      </div>

      {/* 목록 */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="space-y-2 p-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-2 rounded-lg bg-white/[.03] p-2.5 animate-pulse">
                <div className="h-8 w-8 rounded-lg bg-white/10 flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-3/4 rounded bg-white/10" />
                  <div className="h-2.5 w-1/2 rounded bg-white/[.06]" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8">
            <span className="text-3xl mb-2">✨</span>
            <p className="text-sm text-text-muted">모든 알림을 확인했어요</p>
          </div>
        ) : (
          <div className="p-2 space-y-0.5">
            {/* 안읽은 항목 */}
            {unreadItems.length > 0 && (
              <>
                <p className="px-3 py-1 text-[10px] font-medium text-text-muted uppercase">
                  새로운 ({unreadItems.length})
                </p>
                {unreadItems.map((item) => (
                  <InboxCard
                    key={item.id}
                    notification={item}
                    onClick={() => handleItemClick(item)}
                  />
                ))}
              </>
            )}

            {/* 읽은 항목 */}
            {readItems.length > 0 && (
              <>
                <p className="px-3 py-1 text-[10px] font-medium text-text-muted uppercase mt-2">
                  이전 ({readItems.length})
                </p>
                {readItems.slice(0, 20).map((item) => (
                  <InboxCard
                    key={item.id}
                    notification={item}
                    onClick={() => handleItemClick(item)}
                  />
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
