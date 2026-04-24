import { useState, useEffect, useCallback } from 'react';
import { X, Filter, MousePointerClick, Clock, TrendingUp } from 'lucide-react';
import NoteList from './NoteList';
import NoteForm from './NoteForm';
import NoteDetail from './NoteDetail';
import { useNotes, useNoteRealtime } from '../../hooks/useNotes';
import { usePullToRefresh } from '../../hooks/usePullToRefresh';
import PullToRefreshIndicator from '../common/PullToRefreshIndicator';
import { useAuthStore } from '../../stores/authStore';
import { useUiStore } from '../../stores/uiStore';
import { NOTE_CATEGORIES, NOTE_STATUSES } from '../../lib/constants';
import type { AnonymousNote } from '../../types';
import type { NoteCategory, NoteStatus } from '../../lib/constants';

type ViewMode = 'list' | 'form' | 'detail';

interface NotePanelProps {
  onClose?: () => void;
}

export default function NotePanel({ onClose }: NotePanelProps) {
  const { user } = useAuthStore();
  const { addToast, modalContext } = useUiStore();
  const { notes, loading, error, fetchNotes } = useNotes();

  const [view, setView] = useState<ViewMode>(modalContext?.targetName ? 'form' : 'list');
  const [selectedNote, setSelectedNote] = useState<AnonymousNote | null>(null);

  // 필터
  const [filterCategory, setFilterCategory] = useState<NoteCategory | null>(null);
  const [filterStatus, setFilterStatus] = useState<NoteStatus | null>(null);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [showFilters, setShowFilters] = useState(false);

  // RLS가 본인 수신/발신만 필터링 — 역할 구분 불필요
  const loadNotes = useCallback(() => {
    fetchNotes({
      category: filterCategory,
      status: filterStatus,
      sort: sortOrder,
    });
  }, [fetchNotes, filterCategory, filterStatus, sortOrder]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  // Pull-to-refresh
  const { containerRef, pullDistance, isRefreshing, willTrigger } = usePullToRefresh(loadNotes, {
    disabled: loading,
  });

  // Realtime: 새 쪽지 알림
  useNoteRealtime(
    useCallback(
      (newNote: AnonymousNote) => {
        if (newNote.recipient_id === user?.id) {
          addToast(`💌 새 편지 도착 — ${newNote.title}`, 'info');
        }
        loadNotes();
      },
      [user, addToast, loadNotes]
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

  // 수신/발신 분리
  const received = notes.filter((n) => n.recipient_id === user?.id);
  const sent = notes.filter((n) => n.sender_id === user?.id);

  return (
    <div className="relative flex flex-col h-full overflow-hidden">
      <div className={`flex flex-col h-full ${view !== 'list' ? 'invisible' : ''}`}>
      {/* 헤더 */}
      <div className="flex items-center justify-between border-b border-white/[.06] px-4 py-3">
        <h2 className="font-heading text-base font-bold text-text-primary">
          💌 마음의 편지
        </h2>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
            className={`flex h-7 items-center gap-1 rounded-lg px-2 text-[11px] font-medium transition-colors ${
              sortOrder === 'oldest'
                ? 'bg-info/15 text-info'
                : 'text-text-muted hover:bg-white/10 hover:text-text-primary'
            }`}
            title={sortOrder === 'newest' ? '오래된순으로 전환' : '최신순으로 전환'}
          >
            {sortOrder === 'oldest' ? <TrendingUp size={13} /> : <Clock size={13} />}
            {sortOrder === 'oldest' ? '오래된순' : '최신순'}
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
              showFilters ? 'bg-accent/20 text-accent' : 'text-text-muted hover:bg-white/10 hover:text-text-primary'
            }`}
            title="필터"
          >
            <Filter size={15} />
          </button>
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
          <span className="font-semibold text-text-secondary">마음을 전하는 비밀 우체통</span> — 익명 또는 실명으로 편지를 보내고, 답장을 통해 대화를 이어갈 수 있습니다.
        </p>
      </div>

      {/* 카테고리 칩 — 항상 표시 */}
      <div className="border-b border-white/[.06] px-4 py-2">
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
      </div>

      {/* 상태 필터 — 토글 */}
      {showFilters && (
        <div className="border-b border-white/[.06] px-4 py-2">
          <select
            value={filterStatus ?? ''}
            onChange={(e) => setFilterStatus((e.target.value || null) as NoteStatus | null)}
            className="w-full rounded-lg bg-white/[.06] px-2 py-1 text-[11px] text-text-secondary outline-none"
          >
            <option value="">상태: 전체</option>
            {NOTE_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      )}

      {/* 쪽지 목록 */}
      <div ref={containerRef} className="relative flex-1 overflow-y-auto p-4 space-y-4">
        <PullToRefreshIndicator pullDistance={pullDistance} isRefreshing={isRefreshing} willTrigger={willTrigger} />
        {/* 받은 편지 */}
        {received.length > 0 && (
          <div>
            <p className="text-[10px] font-medium text-text-muted uppercase mb-2">받은 편지 ({received.length})</p>
            <NoteList notes={received} loading={false} error={null} onSelect={handleSelectNote} onRetry={loadNotes} />
          </div>
        )}

        {/* 보낸 편지 */}
        {sent.length > 0 && (
          <div>
            <p className="text-[10px] font-medium text-text-muted uppercase mb-2">보낸 편지 ({sent.length})</p>
            <NoteList notes={sent} loading={false} error={null} onSelect={handleSelectNote} onRetry={loadNotes} />
          </div>
        )}

        {/* 로딩/에러/빈 상태 */}
        {loading && received.length === 0 && sent.length === 0 && (
          <NoteList notes={[]} loading={true} error={null} onSelect={handleSelectNote} onRetry={loadNotes} />
        )}
        {error && (
          <NoteList notes={[]} loading={false} error={error} onSelect={handleSelectNote} onRetry={loadNotes} />
        )}
        {!loading && !error && received.length === 0 && sent.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <span className="text-3xl mb-2">💌</span>
            <p className="text-sm text-text-muted">아직 편지가 없습니다</p>
          </div>
        )}
      </div>

      {/* 온보딩: 편지 보내기 안내 */}
      <div className="border-t border-white/[.06] px-4 py-3">
        <div className="flex items-center gap-2.5 rounded-xl bg-accent/10 px-4 py-3">
          <MousePointerClick size={18} className="flex-shrink-0 text-accent-light" />
          <p className="text-xs leading-relaxed text-text-secondary">
            편지를 보내려면 <span className="font-semibold text-accent-light">우측 피플 목록</span>에서 상대방을 <span className="font-semibold text-accent-light">우클릭</span>하세요
          </p>
        </div>
      </div>
      </div>

      {view === 'form' && (
        <div className="absolute inset-0 z-10 flex flex-col bg-bg-primary animate-[slideInRight_.2s_ease-out]">
          <NoteForm onClose={handleBack} onCreated={handleCreated} targetName={modalContext?.targetName} targetId={modalContext?.targetId} />
        </div>
      )}
      {view === 'detail' && selectedNote && (
        <div className="absolute inset-0 z-10 flex flex-col bg-bg-primary animate-[slideInRight_.2s_ease-out]">
          <NoteDetail note={selectedNote} onBack={handleBack} onUpdated={handleNoteUpdated} onDeleted={handleBack} />
        </div>
      )}
    </div>
  );
}
