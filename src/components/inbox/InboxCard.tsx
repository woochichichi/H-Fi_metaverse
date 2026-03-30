import { formatRelativeTime } from '../../lib/utils';
import type { Notification } from '../../types';

// 타입별 아이콘/색상 매핑
const TYPE_CONFIG: Record<string, { icon: string; color: string }> = {
  'new_notice_긴급': { icon: '🔴', color: '#ef4444' },
  'new_notice_할일': { icon: '🟡', color: '#f59e0b' },
  'new_notice_참고': { icon: '🔵', color: '#3b82f6' },
  'new_voc': { icon: '📞', color: '#22c55e' },
  'new_idea': { icon: '💡', color: '#f59e0b' },
  'new_note': { icon: '✉️', color: '#a29bfe' },
  'voc_status': { icon: '📞', color: '#22c55e' },
  'idea_status': { icon: '💡', color: '#f59e0b' },
};

function getConfig(notification: Notification) {
  // 공지 알림은 시급성 따라 아이콘 분리
  if (notification.type === 'new_notice') {
    return TYPE_CONFIG[`new_notice_${notification.urgency}`] ?? { icon: '🔔', color: '#94a3b8' };
  }
  return TYPE_CONFIG[notification.type] ?? { icon: '🔔', color: '#94a3b8' };
}

interface InboxCardProps {
  notification: Notification;
  onClick: () => void;
}

export default function InboxCard({ notification, onClick }: InboxCardProps) {
  const config = getConfig(notification);

  return (
    <button
      onClick={onClick}
      className={`flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors duration-200 ${
        notification.read
          ? 'bg-transparent hover:bg-white/[.04]'
          : 'bg-accent/[.06] hover:bg-accent/[.10]'
      }`}
    >
      {/* 아이콘 */}
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-white/[.06] text-base">
        {config.icon}
      </div>

      {/* 내용 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-sm font-medium line-clamp-1 ${
            notification.read ? 'text-text-secondary' : 'text-text-primary'
          }`}>
            {notification.title}
          </p>
          <span className="flex-shrink-0 text-[10px] text-text-muted">
            {formatRelativeTime(notification.created_at)}
          </span>
        </div>
        {notification.body && (
          <p className="mt-0.5 text-xs text-text-muted line-clamp-1">{notification.body}</p>
        )}
      </div>

      {/* 안읽은 표시 */}
      {!notification.read && (
        <span className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-info" />
      )}
    </button>
  );
}
