import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Search, Heart } from 'lucide-react';
import { useUiStore } from '../../stores/uiStore';
import { useAuthStore } from '../../stores/authStore';
import { useMetaverseStore } from '../../stores/metaverseStore';
import { ROOMS_DATA } from '../../lib/constants';
import { getDisplayName } from '../../lib/utils';
import { supabase } from '../../lib/supabase';
import type { Profile } from '../../types/database';

type StatusGroup = 'online' | '재택' | 'offline';

const STATUS_LABELS: Record<StatusGroup, string> = {
  online: '출근',
  '재택': '재택',
  offline: '오프라인',
};

const STATUS_COLORS: Record<StatusGroup, string> = {
  online: 'bg-success',
  '재택': 'bg-warning',
  offline: 'bg-text-muted',
};

export default function Sidebar() {
  const { sidebarOpen, openModal } = useUiStore();
  const { profile: myProfile, user } = useAuthStore();
  const currentRoom = useMetaverseStore((s) => s.currentRoom);
  const otherPlayers = useMetaverseStore((s) => s.otherPlayers);
  const room = ROOMS_DATA[currentRoom];
  const isAdmin = myProfile?.role === 'admin' || myProfile?.role === 'director';
  const [search, setSearch] = useState('');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; person: Profile } | null>(null);
  const ctxRef = useRef<HTMLDivElement>(null);

  // 프로필 목록 가져오기
  useEffect(() => {
    const fetchProfiles = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .order('name');
      if (data) setProfiles(data);
    };
    fetchProfiles();

    // 실시간 변경 구독
    const channel = supabase
      .channel('sidebar-profiles')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        fetchProfiles();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // 컨텍스트 메뉴 외부 클릭/ESC 닫기
  useEffect(() => {
    if (!ctxMenu) return;
    const handleClick = (e: MouseEvent) => {
      if (ctxRef.current && !ctxRef.current.contains(e.target as Node)) setCtxMenu(null);
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setCtxMenu(null);
    };
    document.addEventListener('click', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [ctxMenu]);

  if (!sidebarOpen) return null;

  // 온라인 유저: 현재 Realtime presence에 있는 유저들
  const onlinePlayerIds = new Set<string>();
  otherPlayers.forEach((_, id) => onlinePlayerIds.add(id));
  if (user?.id) onlinePlayerIds.add(user.id);

  // 프로필에 실시간 상태 반영
  const peopleWithStatus = profiles.map((p) => ({
    ...p,
    status: onlinePlayerIds.has(p.id) ? ('online' as const) : ('offline' as const),
  }));

  const filtered = peopleWithStatus.filter((p) => {
    const display = getDisplayName(p, isAdmin);
    return display.includes(search) || p.team.includes(search);
  });

  const groups: StatusGroup[] = ['online', '재택', 'offline'];

  return (
    <>
    <aside className="flex w-[260px] flex-shrink-0 flex-col border-l border-white/[.06]" style={{ background: 'rgba(42,31,40,.97)', backdropFilter: 'blur(16px)' }}>
      {/* 현재 룸 */}
      <div className="flex items-center justify-center px-4 pt-3 pb-1">
        <span className="rounded-md px-3 py-1 text-[11px] font-bold text-white" style={{ background: `${room.theme.main}66` }}>
          📍 {room.label}
        </span>
      </div>
      {/* 헤더 */}
      <div className="flex h-10 items-center justify-between px-4 pt-1 pb-1">
        <span className="text-sm font-medium text-text-secondary">피플</span>
        <span className="font-mono text-xs text-text-secondary">
          {filtered.filter((p) => p.status === 'online').length}명 접속
        </span>
      </div>

      {/* 검색 */}
      <div className="px-3 py-2">
        <div className="flex items-center gap-2 rounded-lg bg-bg-primary px-3 py-1.5">
          <Search size={14} className="text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="이름, 팀 검색..."
            className="w-full bg-transparent text-sm text-text-primary placeholder-text-muted outline-none"
          />
        </div>
      </div>

      {/* 피플 목록 */}
      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {groups.map((status) => {
          const people = filtered.filter((p) => p.status === status);
          if (people.length === 0) return null;
          return (
            <div key={status} className="mb-2">
              <div className="flex items-center gap-1.5 px-2 py-1">
                <span className={`h-2 w-2 rounded-full ${STATUS_COLORS[status]}`} />
                <span className="text-xs font-medium text-text-secondary">
                  {STATUS_LABELS[status]} ({people.length})
                </span>
              </div>
              {people.map((p) => (
                <div
                  key={p.id}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setCtxMenu({ x: e.clientX, y: e.clientY, person: p });
                  }}
                  className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors duration-200 hover:bg-bg-tertiary cursor-default"
                >
                  <div
                    className="flex h-7 w-7 items-center justify-center rounded-full text-xs"
                    style={{ backgroundColor: p.avatar_color }}
                  >
                    {p.avatar_emoji}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <span className="truncate text-sm text-text-primary">
                        {getDisplayName(p, isAdmin)}
                        {p.id === user?.id && <span className="ml-1 text-xs text-accent">(나)</span>}
                      </span>
                      {p.mood_emoji && <span className="text-xs">{p.mood_emoji}</span>}
                    </div>
                    <span className="text-xs text-text-secondary">{p.team}</span>
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>

    </aside>

      {/* 우클릭 컨텍스트 메뉴 — backdrop-filter stacking context 회피를 위해 body에 portal */}
      {ctxMenu && createPortal(
        <div
          ref={ctxRef}
          className="fixed z-[9999] min-w-[160px] border border-white/[.1] bg-bg-secondary py-1 shadow-xl"
          style={{ top: ctxMenu.y, left: ctxMenu.x }}
        >
          <button
            onClick={() => {
              const targetName = getDisplayName(ctxMenu.person, isAdmin);
              setCtxMenu(null);
              openModal('note', { targetName });
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-text-secondary transition-colors duration-150 hover:bg-accent/15 hover:text-accent-light"
          >
            <Heart size={14} />
            💌 마음의 편지 보내기
          </button>
        </div>,
        document.body
      )}
    </>
  );
}
