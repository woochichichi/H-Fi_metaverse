import { useState, useEffect, useRef } from 'react';
import { Bell, Inbox, Users, LogOut, Settings } from 'lucide-react';
import InboxPanel from '../inbox/InboxPanel';
import InboxBadge from '../inbox/InboxBadge';
import AdminPanel from '../admin/AdminPanel';
import { useAuthStore } from '../../stores/authStore';
import { useUiStore } from '../../stores/uiStore';
import { useDeviceMode } from '../../hooks/useDeviceMode';
import { useNotices } from '../../hooks/useNotices';
import { useInbox } from '../../hooks/useInbox';

export default function TopBar() {
  const { profile, user, logout } = useAuthStore();
  const { sidebarOpen, toggleSidebar, openModal, closeModal, modalOpen } = useUiStore();
  const { fetchUnreadCount } = useNotices();
  const { items, loading: inboxLoading, unreadCount: inboxUnread, markAsRead, markAllAsRead } = useInbox(user?.id ?? null);
  const mode = useDeviceMode();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showInbox, setShowInbox] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const inboxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      fetchUnreadCount(user.id).then(setUnreadCount);
      const interval = setInterval(() => {
        fetchUnreadCount(user.id).then(setUnreadCount);
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [user, fetchUnreadCount]);

  // 패널 간 상호 배타 처리
  const handleToggleSidebar = () => {
    setShowInbox(false);
    setShowAdmin(false);
    closeModal();
    toggleSidebar();
  };

  const handleToggleInbox = () => {
    setShowAdmin(false);
    closeModal();
    if (sidebarOpen) toggleSidebar();
    setShowInbox((v) => !v);
  };

  const handleOpenNotice = () => {
    setShowInbox(false);
    setShowAdmin(false);
    if (sidebarOpen) toggleSidebar();
    openModal('notice');
  };

  const handleOpenAdmin = () => {
    setShowInbox(false);
    closeModal();
    if (sidebarOpen) toggleSidebar();
    setShowAdmin(true);
  };

  // 바깥 클릭으로 수집함 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (inboxRef.current && !inboxRef.current.contains(e.target as Node)) {
        setShowInbox(false);
      }
    };
    if (showInbox) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showInbox]);

  return (
    <header className="flex h-12 flex-shrink-0 items-center justify-between border-b border-white/[.06] px-4" style={{ background: 'rgba(30,30,48,.95)', backdropFilter: 'blur(12px)' }}>
      {/* 왼쪽: 로고 */}
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg text-sm" style={{ background: 'linear-gradient(135deg,#6C5CE7,#a29bfe)' }}>
          🏢
        </div>
        <h1 className="font-heading text-base font-bold tracking-tight text-white">
          ITO 메타버스
        </h1>
      </div>

      {/* 오른쪽: 액션 버튼들 */}
      <div className="flex items-center gap-2">
        {/* PC 전용: 피플 토글 */}
        {mode === 'metaverse' && (
          <button
            onClick={handleToggleSidebar}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary transition-colors duration-200 hover:bg-bg-tertiary hover:text-text-primary"
            title="피플 목록"
          >
            <Users size={18} />
          </button>
        )}

        {/* 수집함 */}
        <div ref={inboxRef} className="relative">
          <button
            onClick={handleToggleInbox}
            className="relative flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary transition-colors duration-200 hover:bg-bg-tertiary hover:text-text-primary"
            title="수집함"
          >
            <Inbox size={18} />
            <InboxBadge count={inboxUnread} />
          </button>

          {/* 수집함 드롭다운 */}
          {showInbox && (
            <div className="absolute right-0 top-full mt-2 z-[200] rounded-xl border border-white/[.08] bg-bg-secondary shadow-2xl">
              <InboxPanel
                items={items}
                loading={inboxLoading}
                onMarkAsRead={markAsRead}
                onMarkAllAsRead={markAllAsRead}
                onClose={() => setShowInbox(false)}
              />
            </div>
          )}
        </div>

        {/* 알림 (공지 안읽은 수) */}
        <button
          onClick={handleOpenNotice}
          className="relative flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary transition-colors duration-200 hover:bg-bg-tertiary hover:text-text-primary"
          title="공지사항"
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[9px] font-bold text-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {/* 관리자 패널 (admin만) */}
        {profile?.role === 'admin' && (
          <button
            onClick={handleOpenAdmin}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary transition-colors duration-200 hover:bg-bg-tertiary hover:text-text-primary"
            title="관리자 패널"
          >
            <Settings size={18} />
          </button>
        )}

        {/* 프로필 아바타 + 로그아웃 */}
        {profile && (
          <div className="flex items-center gap-2 ml-1">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full text-sm"
              style={{ backgroundColor: profile.avatar_color }}
              title={profile.name}
            >
              {profile.avatar_emoji}
            </div>
            <button
              onClick={logout}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-colors duration-200 hover:bg-bg-tertiary hover:text-danger"
              title="로그아웃"
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>

      {/* 관리자 패널 모달 */}
      {showAdmin && (
        <>
          <div
            className="fixed inset-0 z-[200] bg-black/40"
            onClick={() => setShowAdmin(false)}
          />
          <div
            className="fixed right-0 top-0 z-[201] flex h-full w-full max-w-2xl flex-col bg-bg-primary shadow-2xl animate-[slideInRight_.25s_ease-out]"
            style={{ borderLeft: '1px solid rgba(255,255,255,.06)' }}
          >
            <AdminPanel onClose={() => setShowAdmin(false)} />
          </div>
        </>
      )}
    </header>
  );
}
