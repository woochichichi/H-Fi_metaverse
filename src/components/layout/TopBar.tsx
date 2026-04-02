import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Bell, Inbox, Users, LogOut, Settings, Pencil, Palette } from 'lucide-react';
import InboxBadge from '../inbox/InboxBadge';
import AdminPanel from '../admin/AdminPanel';
import MoodPicker from './MoodPicker';
import NicknameEditor from './NicknameEditor';
import CharacterCustomModal from '../metaverse/CharacterCustomModal';
import { useAuthStore } from '../../stores/authStore';
import { useUiStore } from '../../stores/uiStore';
import { useMetaverseStore } from '../../stores/metaverseStore';
import { useDeviceMode } from '../../hooks/useDeviceMode';
import { useNotices } from '../../hooks/useNotices';
import { useInbox } from '../../hooks/useInbox';
import { TEAM_TO_ROOM } from '../../lib/constants';

export default function TopBar() {
  const { profile, user, logout } = useAuthStore();
  const { sidebarOpen, toggleSidebar, openModal, closeModal, modalOpen } = useUiStore();
  const setCurrentRoom = useMetaverseStore((s) => s.setCurrentRoom);
  const { fetchUnreadCount } = useNotices();
  const { unreadCount: inboxUnread } = useInbox(user?.id ?? null);
  const mode = useDeviceMode();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showMood, setShowMood] = useState(false);
  const [showNicknameEditor, setShowNicknameEditor] = useState(false);
  const [showCharacterCustom, setShowCharacterCustom] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const moodRef = useRef<HTMLDivElement>(null);
  const moodBtnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    const poll = () => fetchUnreadCount(user.id).then(setUnreadCount).catch(() => {});
    poll();
    const interval = setInterval(poll, 30000);
    // 탭 복귀 시에도 갱신
    const onVisible = () => { if (document.visibilityState === 'visible') poll(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => { clearInterval(interval); document.removeEventListener('visibilitychange', onVisible); };
  }, [user, fetchUnreadCount]);

  // 패널 간 상호 배타 처리
  const handleToggleSidebar = () => {
    setShowAdmin(false);
    closeModal();
    toggleSidebar();
  };

  const handleToggleInbox = () => {
    setShowAdmin(false);
    if (sidebarOpen) toggleSidebar();
    // 이미 inbox 패널이 열려있으면 닫기, 아니면 열기
    if (modalOpen === 'inbox') {
      closeModal();
    } else {
      openModal('inbox');
    }
  };

  const handleOpenNotice = () => {
    setShowAdmin(false);
    if (sidebarOpen) toggleSidebar();
    // 팀별 공지 zone으로 열기 (예: stock-notice)
    const roomId = profile?.team ? TEAM_TO_ROOM[profile.team as keyof typeof TEAM_TO_ROOM] : null;
    openModal(roomId ? `${roomId}-notice` : 'notice');
  };

  const handleOpenAdmin = () => {
    closeModal();
    if (sidebarOpen) toggleSidebar();
    setShowAdmin(true);
  };

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
        {/* 왼쪽: 로고 — 클릭 시 내 팀 방(홈)으로 이동 */}
        <button
          onClick={() => {
            const homeRoom = profile?.team ? TEAM_TO_ROOM[profile.team as keyof typeof TEAM_TO_ROOM] : null;
            if (homeRoom) setCurrentRoom(homeRoom);
            closeModal();
            if (sidebarOpen) toggleSidebar();
            setShowAdmin(false);
          }}
          className="flex items-center gap-2 rounded-lg px-1 -ml-1 transition-colors hover:bg-bg-tertiary"
        >
          <img src="/favicon.svg" alt="한울타리" className="h-7 w-7" />
          <h1 className="font-heading text-base font-bold tracking-tight text-text-primary">
            한울타리
          </h1>
        </button>

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
          <button
            onClick={handleToggleInbox}
            className="relative flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary transition-colors duration-200 hover:bg-bg-tertiary hover:text-text-primary"
            title="수집함"
          >
            <Inbox size={18} />
            <InboxBadge count={inboxUnread} />
          </button>

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

          {/* 관리자 패널 (admin/director/leader) */}
          {(profile?.role === 'admin' || profile?.role === 'director' || profile?.role === 'leader') && (
            <button
              onClick={handleOpenAdmin}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary transition-colors duration-200 hover:bg-bg-tertiary hover:text-text-primary"
              title={profile?.role === 'leader' ? '팀 관리' : '관리자 패널'}
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
                onClick={() => setShowCharacterCustom(true)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary transition-colors duration-200 hover:bg-bg-tertiary hover:text-accent"
                title="캐릭터 꾸미기"
              >
                <Palette size={16} />
              </button>
              <button
                onClick={() => setShowNicknameEditor(true)}
                className="group flex items-center gap-1 rounded-lg px-1.5 py-1 text-xs text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-text-primary"
                title="별명 변경"
              >
                <span className="max-w-[80px] truncate">{profile.nickname || profile.name}</span>
                <Pencil size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
              <button
                onClick={() => setShowLogoutConfirm(true)}
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

      {/* 캐릭터 꾸미기 모달 */}
      {showCharacterCustom && (
        <CharacterCustomModal onClose={() => setShowCharacterCustom(false)} />
      )}

      {/* 로그아웃 확인 모달 */}
      {showLogoutConfirm && createPortal(
        <>
          <div className="fixed inset-0 z-[300] bg-black/50" onClick={() => setShowLogoutConfirm(false)} />
          <div className="fixed left-1/2 top-1/2 z-[301] w-72 -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/10 bg-bg-secondary p-6 shadow-2xl">
            <div className="mb-1 flex items-center gap-2 text-danger">
              <LogOut size={18} />
              <span className="font-semibold text-text-primary text-base">로그아웃</span>
            </div>
            <p className="mb-5 text-sm text-text-secondary">정말 로그아웃 하시겠어요?</p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => { setShowLogoutConfirm(false); logout(); }}
                className="rounded-lg bg-danger/90 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-danger"
              >
                로그아웃
              </button>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="rounded-lg px-4 py-2 text-sm text-text-muted transition-colors hover:bg-bg-tertiary"
              >
                취소
              </button>
            </div>
          </div>
        </>,
        document.body
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
