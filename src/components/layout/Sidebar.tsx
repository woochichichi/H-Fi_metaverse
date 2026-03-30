import { useState, useEffect, useRef } from 'react';
import { Search, Mail } from 'lucide-react';
import { useUiStore } from '../../stores/uiStore';
import { useAuthStore } from '../../stores/authStore';
import { getDisplayName } from '../../lib/utils';

// 하드코딩 피플 데이터 (Sprint 2에서 DB 연동)
// 하드코딩 피플 데이터 — Sprint 2에서 DB 연동 시 nickname 사용
const MOCK_PEOPLE = [
  { id: '1', name: '김민수', nickname: '불꽃민수', team: '증권ITO', status: 'online' as const, mood: '🔥', avatar_color: '#6C5CE7', avatar_emoji: '😎' },
  { id: '2', name: '이서연', nickname: '여우서연', team: '생명ITO', status: 'online' as const, mood: '😊', avatar_color: '#E91E63', avatar_emoji: '🦊' },
  { id: '3', name: '박준혁', nickname: '곰탱이', team: '손보ITO', status: 'online' as const, mood: '☕', avatar_color: '#FF9800', avatar_emoji: '🐻' },
  { id: '4', name: '최유진', nickname: '고양이유진', team: '한금서', status: '재택' as const, mood: '😴', avatar_color: '#5DC878', avatar_emoji: '🐱' },
  { id: '5', name: '정하늘', nickname: '하늘이', team: '증권ITO', status: '재택' as const, mood: '😊', avatar_color: '#6BC5FF', avatar_emoji: '🐶' },
  { id: '6', name: '한지우', nickname: '토끼지우', team: '생명ITO', status: 'offline' as const, mood: null, avatar_color: '#a29bfe', avatar_emoji: '🐰' },
  { id: '7', name: '윤도현', nickname: '사자왕', team: '손보ITO', status: 'offline' as const, mood: null, avatar_color: '#FF9800', avatar_emoji: '🦁' },
];

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
  const { profile: myProfile } = useAuthStore();
  const isAdmin = myProfile?.role === 'admin' || myProfile?.role === 'director';
  const [search, setSearch] = useState('');
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; person: typeof MOCK_PEOPLE[0] } | null>(null);
  const ctxRef = useRef<HTMLDivElement>(null);

  // 컨텍스트 메뉴 외부 클릭/ESC 닫기
  useEffect(() => {
    if (!ctxMenu) return;
    const handleClick = (e: MouseEvent) => {
      if (ctxRef.current && !ctxRef.current.contains(e.target as Node)) setCtxMenu(null);
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setCtxMenu(null);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [ctxMenu]);

  if (!sidebarOpen) return null;

  const filtered = MOCK_PEOPLE.filter((p) => {
    const display = getDisplayName(p, isAdmin);
    return display.includes(search) || p.team.includes(search);
  });

  const groups: StatusGroup[] = ['online', '재택', 'offline'];

  return (
    <aside className="flex w-[260px] flex-shrink-0 flex-col border-l border-white/[.06]" style={{ background: 'rgba(30,30,48,.97)', backdropFilter: 'blur(16px)' }}>
      {/* 헤더 */}
      <div className="flex h-10 items-center justify-between px-4 pt-3 pb-1">
        <span className="text-sm font-medium text-text-secondary">피플</span>
        <span className="font-mono text-xs text-text-muted">
          {filtered.filter((p) => p.status !== 'offline').length}명 접속
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
                <span className="text-xs font-medium text-text-muted">
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
                      <span className="truncate text-sm text-text-primary">{getDisplayName(p, isAdmin)}</span>
                      {p.mood && <span className="text-xs">{p.mood}</span>}
                    </div>
                    <span className="text-xs text-text-muted">{p.team}</span>
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* 우클릭 컨텍스트 메뉴 */}
      {ctxMenu && (
        <div
          ref={ctxRef}
          className="fixed z-[200] min-w-[160px] rounded-lg border border-white/[.1] bg-bg-secondary py-1 shadow-xl"
          style={{ top: ctxMenu.y, left: ctxMenu.x }}
        >
          <button
            onClick={() => {
              setCtxMenu(null);
              openModal('note');
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-text-secondary transition-colors duration-150 hover:bg-accent/15 hover:text-accent-light"
          >
            <Mail size={14} />
            익명 쪽지 보내기
          </button>
        </div>
      )}
    </aside>
  );
}
