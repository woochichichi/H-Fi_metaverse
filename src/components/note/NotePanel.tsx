import { useState, useEffect, useCallback } from 'react';
import { Plus, X, Filter } from 'lucide-react';
import NoteList from './NoteList';
import NoteForm from './NoteForm';
import NoteDetail from './NoteDetail';
import { useNotes, useNoteRealtime } from '../../hooks/useNotes';
import { useAuthStore } from '../../stores/authStore';
import { useUiStore } from '../../stores/uiStore';
import { NOTE_CATEGORIES, NOTE_STATUSES, TEAMS } from '../../lib/constants';
import type { AnonymousNote } from '../../types';
import type { NoteCategory, NoteStatus } from '../../lib/constants';

type ViewMode = 'list' | 'form' | 'detail';

interface NotePanelProps {
  onClose?: () => void;
}

export default function NotePanel({ onClose }: NotePanelProps) {
  const { profile, user } = useAuthStore();
  const { addToast, modalContext } = useUiStore();
  const { notes, loading, error, fetchNotes, fetchMyNotes } = useNotes();

  const [view, setView] = useState<ViewMode>(modalContext?.targetName ? 'form' : 'list');
  const [selectedNote, setSelectedNote] = useState<AnonymousNote | null>(null);

  // 필터
  const [filterCategory, setFilterCategory] = useState<NoteCategory | null>(null);
  const [filterStatus, setFilterStatus] = useState<NoteStatus | null>(null);
  const [filterTeam, setFilterTeam] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const isLeader = profile?.role === 'admin' || profile?.role === 'director' || profile?.role === 'leader';

  const loadNotes = useCallback(() => {
    if (isLeader) {
      fetchNotes({
        category: filterCategory,
        status: filterStatus,
        team: filterTeam,
        sort: 'newest',
      });
    } else if (user) {
      fetchMyNotes(user.id);
    }
  }, [isLeader, user, fetchNotes, fetchMyNotes, filterCategory, filterStatus, filterTeam]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  // Realtime: 새 쪽지 알림
  useNoteRealtime(
    useCallback(
      (newNote: AnonymousNote) => {
        if (isLeader) {
          addToast(`💌 새 편지 도착 — ${newNote.title}`, 'info');
        }
        loadNotes();
      },
      [isLeader, addToast, loadNotes]
    )
  );

  const handleSelectNote = (note: AnonymousNote) => {
    setSelectedNote(note);
    setView('detail');
  };

  const handleBack = () => {
    setSelectedNote(null);
    setView('list');
    loadNotes();
  };

  const handleCreated = () => {
    setView('list');
    loadNotes();
  };

  const handleNoteUpdated = (updatedNote: AnonymousNote) => {
    setSelectedNote(updatedNote);
  };

  // 폼 뷰
  if (view === 'form') {
    return <NoteForm onClose={handleBack} onCreated={handleCreated} targetName={modalContext?.targetName} />;
  }

  // 상세 뷰
  if (view === 'detail' && selectedNote) {
    return (
      <NoteDetail
        note={selectedNote}
        onBack={handleBack}
        onUpdated={handleNoteUpdated}
      />
    );
  }

  // 목록 뷰
  return (
    <div className="flex flex-col h-full">
      {/* 헤더 */}
      <div className="flex items-center justify-between border-b border-white/[.06] px-4 py-3">
        <h2 className="font-heading text-base font-bold text-text-primary">
          💌 {isLeader ? '받은 편지함' : '마음의 편지'}
        </h2>
        <div className="flex items-center gap-1">
          {isLeader && (
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
                showFilters ? 'bg-accent/20 text-accent' : 'text-text-muted hover:bg-white/10 hover:text-text-primary'
              }`}
              title="필터"
            >
              <Filter size={15} />
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-white/10 hover:text-text-primary"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* 보드 설명 */}
      <div className="border-b border-white/[.06] bg-accent/[.04] px-4 py-2">
        <p className="text-[11px] leading-relaxed text-text-muted">
          {isLeader ? (
            <><span className="font-semibold text-text-secondary">팀원들의 솔직한 목소리를 받는 곳</span> — 익명으로 전달된 건의·질문·피드백을 확인하고, 답장을 통해 양방향 대화를 이어갈 수 있습니다.</>
          ) : (
            <><span className="font-semibold text-text-secondary">수평적 소통을 위한 비밀 우체통</span> — 리더에게 건의·질문·피드백을 익명으로 전달하세요. 누가 보냈는지 알 수 없지만, 리더의 답장을 받을 수 있습니다.</>
          )}
        </p>
      </div>

      {/* 필터 바 (리더만) */}
      {isLeader && showFilters && (
        <div className="border-b border-white/[.06] px-4 py-2 space-y-2">
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => setFilterCategory(null)}
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium transition-colors ${
                !filterCategory ? 'bg-accent text-white' : 'bg-white/[.06] text-text-muted hover:bg-white/10'
              }`}
            >
              전체
            </button>
            {NOTE_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(filterCategory === cat ? null : cat)}
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium transition-colors ${
                  filterCategory === cat ? 'bg-accent text-white' : 'bg-white/[.06] text-text-muted hover:bg-white/10'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <select
              value={filterStatus ?? ''}
              onChange={(e) => setFilterStatus((e.target.value || null) as NoteStatus | null)}
              className="flex-1 rounded-lg bg-white/[.06] px-2 py-1 text-[11px] text-text-secondary outline-none"
            >
              <option value="">상태: 전체</option>
              {NOTE_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <select
              value={filterTeam ?? ''}
              onChange={(e) => setFilterTeam(e.target.value || null)}
              className="flex-1 rounded-lg bg-white/[.06] px-2 py-1 text-[11px] text-text-secondary outline-none"
            >
              <option value="">팀: 전체</option>
              {TEAMS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* 쪽지 목록 */}
      <div className="flex-1 overflow-y-auto p-4">
        <NoteList notes={notes} loading={loading} error={error} onSelect={handleSelectNote} onRetry={loadNotes} />
      </div>

      {/* FAB: 새 쪽지 (멤버용 — 리더도 보내기 가능) */}
      <button
        onClick={() => setView('form')}
        className="absolute bottom-6 right-6 flex h-12 w-12 items-center justify-center rounded-full bg-accent text-white shadow-lg transition-colors duration-200 hover:bg-accent/80"
        style={{ boxShadow: '0 4px 20px rgba(108,92,231,.4)' }}
        title="마음의 편지 쓰기"
      >
        <Plus size={22} />
      </button>
    </div>
  );
}
