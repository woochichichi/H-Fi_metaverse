import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Inbox, LogOut, Palette, Search } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { usePermissions } from '../../hooks/usePermissions';
import { useNotices } from '../../hooks/useNotices';
import { useInbox } from '../../hooks/useInbox';
import { useV2Nav } from '../../stores/v2NavStore';

export default function V2TopBar() {
  const navigate = useNavigate();
  const { profile, user, logout } = useAuthStore();
  const perm = usePermissions();
  const setPage = useV2Nav((s) => s.setPage);
  const { fetchUnreadCount } = useNotices();
  const { unreadCount: inboxUnread } = useInbox(user?.id ?? null);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!user) return;
    const poll = () => fetchUnreadCount(user.id).then(setUnread).catch(() => {});
    void poll();
    const t = setInterval(poll, 30_000);
    return () => clearInterval(t);
  }, [user, fetchUnreadCount]);

  const displayName = profile?.nickname || profile?.name || '사용자';

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        height: 56,
        flexShrink: 0,
        padding: '0 20px',
        background: 'var(--w-surface)',
        borderBottom: '1px solid var(--w-border)',
      }}
    >
      {/* 검색 (placeholder — 기능은 차후) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flex: 1,
          maxWidth: 420,
          padding: '8px 12px',
          background: 'var(--w-surface-2)',
          border: '1px solid transparent',
          borderRadius: 'var(--w-radius-sm)',
          color: 'var(--w-text-muted)',
          fontSize: 13,
        }}
      >
        <Search size={14} />
        <span>공지·VOC·아이디어·사람 검색 (준비 중)</span>
      </div>

      <div style={{ flex: 1 }} />

      {/* 우측 액션 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <IconButton
          title="수집함"
          badge={inboxUnread}
          onClick={() => {
            // 기존 수집함 모달은 v1 전용. v2에서는 일단 대시보드로 이동(후속 연결)
          }}
        >
          <Inbox size={17} />
        </IconButton>

        <IconButton
          title="공지사항"
          badge={unread}
          onClick={() => setPage('notice')}
        >
          <Bell size={17} />
        </IconButton>

        <button
          onClick={() => navigate('/ui-version')}
          className="w-btn w-btn-ghost"
          title="디자인 테마 변경"
          style={{ padding: '6px 10px', fontSize: 12 }}
        >
          <Palette size={14} />
          <span>디자인</span>
        </button>

        {/* 프로필 칩 */}
        {profile && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '4px 6px 4px 4px',
              marginLeft: 4,
              background: 'var(--w-surface-2)',
              borderRadius: 999,
            }}
          >
            <div
              aria-hidden
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: profile.avatar_color || 'var(--w-accent-soft)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 14,
              }}
            >
              {profile.mood_emoji || profile.avatar_emoji || '🙂'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--w-text)' }}>
                {displayName}
              </span>
              <span style={{ fontSize: 10, color: 'var(--w-text-muted)' }}>
                {roleKoreanLabel(perm.role)} · {profile.team ?? '-'}
              </span>
            </div>
          </div>
        )}

        <IconButton title="로그아웃" onClick={logout}>
          <LogOut size={16} />
        </IconButton>
      </div>
    </header>
  );
}

function IconButton({
  children,
  onClick,
  title,
  badge,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  title?: string;
  badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        position: 'relative',
        width: 34,
        height: 34,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--w-text-soft)',
        background: 'transparent',
        borderRadius: 'var(--w-radius-sm)',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = 'var(--w-surface-2)')}
      onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = 'transparent')}
    >
      {children}
      {badge !== undefined && badge > 0 && (
        <span
          style={{
            position: 'absolute',
            top: 4,
            right: 4,
            minWidth: 16,
            height: 16,
            padding: '0 4px',
            borderRadius: 999,
            background: 'var(--w-urgency-critical)',
            color: '#fff',
            fontSize: 10,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            lineHeight: 1,
          }}
        >
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </button>
  );
}

function roleKoreanLabel(role: string | null): string {
  switch (role) {
    case 'admin': return '관리자';
    case 'director': return '담당';
    case 'leader': return '리더';
    case 'member': return '구성원';
    default: return '';
  }
}
