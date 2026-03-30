import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Bell, Inbox, Users, LogOut, Settings, Pencil } from 'lucide-react';
import InboxPanel from '../inbox/InboxPanel';
import InboxBadge from '../inbox/InboxBadge';
import AdminPanel from '../admin/AdminPanel';
import MoodPicker from './MoodPicker';
import NicknameEditor from './NicknameEditor';
import { useAuthStore } from '../../stores/authStore';
import { useUiStore } from '../../stores/uiStore';
import { useDeviceMode } from '../../hooks/useDeviceMode';
import { useNotices } from '../../hooks/useNotices';
import { useInbox } from '../../hooks/useInbox';
import { TEAM_TO_ROOM } from '../../lib/constants';

export default function TopBar() {
  const { profile, user, logout } = useAuthStore();
  const { sidebarOpen, toggleSidebar, openModal, closeModal } = useUiStore();
  const { fetchUnreadCount } = useNotices();
  const { items, loading: inboxLoading, unreadCount: inboxUnread, markAsRead, markAllAsRead } = useInbox(user?.id ?? null);
  const mode = useDeviceMode();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showInbox, setShowInbox] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showMood, setShowMood] = useState(false);
  const [showNicknameEditor, setShowNicknameEditor] = useState(false);
  const inboxRef = useRef<HTMLDivElement>(null);
  const moodRef = useRef<HTMLDivElement>(null);
  const moodBtnRef = useRef<HTMLDivElement>(null);

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
    // 팀별 공지 zone으로 열기 (예: stock-notice)
    const roomId = profile?.team ? TEAM_TO_ROOM[profile.team as keyof typeof TEAM_TO_ROOM] : null;
    openModal(roomId ? `${roomId}-notice` : 'notice');
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

  // 바깥 클릭으로 기분 선택 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        moodRef.current && !moodRef.current.contains(target) &&
        moodBtnRef.current && !moodBtnRef.current.contains(target)
      ) {
        setShowMood(false);
      }
    };
    if (showMood) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMood]);

  return (
    <>
      <header className="flex h-12 flex-shrink-0 items-center justify-between border-b border-white/[.06] px-4" style={{ background: 'rgba(42,31,40,.97)', backdropFilter: 'blur(12px)' }}>
        {/* 왼쪽: 로고 */}
        <div className="flex items-center gap-2">
          <img src="/favicon.svg" alt="한울타리" className="h-7 w-7" />
          <h1 className="font-heading text-base font-bold tracking-tight text-text-primary">
            한울타리
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

          {/* 관리자 패널 (admin/director) */}
          {(profile?.role === 'admin' || profile?.role === 'director') && (
            <button
              onClick={handleOpenAdmin}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary transition-colors duration-200 hover:bg-bg-tertiary hover:text-text-primary"
              title="관리자 패널"
            >
              <Settings size={18} />
            </button>
          )}

          {/* 프로필 아바타 + 별명 + 로그아웃 */}
          {profile && (
            <div className="flex items-center gap-2 ml-1">
              <div ref={moodBtnRef}>
                <button
                  onClick={() => setShowMood((v) => !v)}
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm transition-all duration-200 hover:ring-2 hover:ring-accent/50 ${showMood ? 'ring-2 ring-accent' : ''}`}
                  style={{ backgroundColor: profile.avatar_color }}
                >
                  {profile.mood_emoji || profile.avatar_emoji}
                </button>
              </div>
              <button
                onClick={() => setShowNicknameEditor(true)}
                className="group flex items-center gap-1 rounded-lg px-1.5 py-1 text-xs text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-text-primary"
                title="별명 변경"
              >
                <span className="max-w-[80px] truncate">{profile.nickname || profile.name}</span>
                <Pencil size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
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
      </header>

      {/* 기분/감정 표현 드롭다운 — createPortal로 body에 렌더링 (backdrop-filter stacking context 회피) */}
      {showMood && createPortal(
        <div ref={moodRef} className="fixed z-[200]" style={{ top: 48, right: 80 }}>
          <MoodPicker onClose={() => setShowMood(false)} />
        </div>,
        document.body
      )}

      {/* 별명 변경 모달 */}
      {showNicknameEditor && (
        <NicknameEditor onClose={() => setShowNicknameEditor(false)} />
      )}

      {/* 관리자 패널 모달 — createPortal로 body에 렌더링 (backdrop-filter stacking context 회피) */}
      {showAdmin && createPortal(
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
        </>,
        document.body
      )}
    </>
  );
}
