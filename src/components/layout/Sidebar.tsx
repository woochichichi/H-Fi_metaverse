import { useState } from 'react';
import { Search } from 'lucide-react';
import { useUiStore } from '../../stores/uiStore';

// 하드코딩 피플 데이터 (Sprint 2에서 DB 연동)
const MOCK_PEOPLE = [
  { id: '1', name: '김민수', team: '증권ITO', status: 'online' as const, mood: '🔥', avatar_color: '#6C5CE7', avatar_emoji: '😎' },
  { id: '2', name: '이서연', team: '생명ITO', status: 'online' as const, mood: '😊', avatar_color: '#E91E63', avatar_emoji: '🦊' },
  { id: '3', name: '박준혁', team: '손보ITO', status: 'online' as const, mood: '☕', avatar_color: '#FF9800', avatar_emoji: '🐻' },
  { id: '4', name: '최유진', team: '한금서', status: '재택' as const, mood: '😴', avatar_color: '#5DC878', avatar_emoji: '🐱' },
  { id: '5', name: '정하늘', team: '증권ITO', status: '재택' as const, mood: '😊', avatar_color: '#6BC5FF', avatar_emoji: '🐶' },
  { id: '6', name: '한지우', team: '생명ITO', status: 'offline' as const, mood: null, avatar_color: '#a29bfe', avatar_emoji: '🐰' },
  { id: '7', name: '윤도현', team: '손보ITO', status: 'offline' as const, mood: null, avatar_color: '#FF9800', avatar_emoji: '🦁' },
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
  const { sidebarOpen } = useUiStore();
  const [search, setSearch] = useState('');

  if (!sidebarOpen) return null;

  const filtered = MOCK_PEOPLE.filter((p) =>
    p.name.includes(search) || p.team.includes(search)
  );

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
                  className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors duration-200 hover:bg-bg-tertiary"
                >
                  <div
                    className="flex h-7 w-7 items-center justify-center rounded-full text-xs"
                    style={{ backgroundColor: p.avatar_color }}
                  >
                    {p.avatar_emoji}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <span className="truncate text-sm text-text-primary">{p.name}</span>
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
    </aside>
  );
}
