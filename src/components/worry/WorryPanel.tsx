import { useState, useEffect, useCallback } from 'react';
import { Plus, X, RefreshCw } from 'lucide-react';
import { useWorries, WORRY_CATEGORIES, type Worry, type WorryCategory } from '../../hooks/useWorries';

import WorryForm from './WorryForm';
import WorryDetail from './WorryDetail';

type ViewMode = 'list' | 'form' | 'detail' | 'edit';

interface WorryPanelProps {
  onClose?: () => void;
}

const CATEGORY_EMOJIS: Record<WorryCategory, string> = {
  '일상': '🌿',
  '업무': '💼',
  '인간관계': '🤝',
  '성장': '🌱',
  '기타': '📌',
};

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '방금';
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  return `${Math.floor(hours / 24)}일 전`;
}

export default function WorryPanel({ onClose }: WorryPanelProps) {

  const { worries, loading, error, fetchWorries } = useWorries();

  const [view, setView] = useState<ViewMode>('list');
  const [filterCategory, setFilterCategory] = useState<WorryCategory | null>(null);
  const [selectedWorry, setSelectedWorry] = useState<Worry | null>(null);
  const [skeletonTimeout, setSkeletonTimeout] = useState(false);

  const load = useCallback(() => {
    fetchWorries(filterCategory);
  }, [fetchWorries, filterCategory]);

  useEffect(() => { load(); }, [load]);

  // 수정 후 목록 갱신 시 selectedWorry도 최신 데이터로 동기화
  useEffect(() => {
    if (selectedWorry) {
      const updated = worries.find((w) => w.id === selectedWorry.id);
      if (updated) setSelectedWorry(updated);
    }
  }, [worries]);

  useEffect(() => {
    if (!loading) { setSkeletonTimeout(false); return; }
    const t = setTimeout(() => setSkeletonTimeout(true), 10000);
    return () => clearTimeout(t);
  }, [loading]);

  const handleCreated = () => {
    setView('list');
    load();
  };

  const handleDeleted = () => {
    setView('list');
    load();
  };

  const handleEdit = (worry: Worry) => {
    setSelectedWorry(worry);
    setView('edit');
  };

  const handleEditDone = () => {
    setView('detail');
    load();
  };

  return (
    <div className="relative flex flex-col h-full overflow-hidden">
      {/* ── 목록 뷰 ── */}
      <div className={`flex flex-col h-full ${view !== 'list' ? 'invisible' : ''}`}>
        {/* 헤더 */}
        <div className="flex items-center justify-between border-b border-white/[.06] px-4 py-3">
          <h2 className="font-heading text-base font-bold text-text-primary">🫂 고민방</h2>
          <div className="flex items-center gap-1">
            <button
              onClick={load}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-white/10 hover:text-text-primary"
              title="새로고침"
            >
              <RefreshCw size={14} />
            </button>
            <button
              onClick={() => setView('form')}
              className="flex h-7 items-center gap-1 rounded-lg bg-rose-500/20 px-2.5 text-[11px] font-semibold text-rose-300 transition-colors hover:bg-rose-500/30"
            >
              <Plus size={12} /> 글쓰기
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

        {/* 방 설명 */}
        <div className="border-b border-white/[.06] bg-rose-500/[.05] px-4 py-2.5">
          <p className="text-[11px] leading-relaxed text-text-muted">
            <span className="font-semibold text-rose-300">말 못 했던 이야기, 여기서는 괜찮아요</span> — 요즘 너무 교류가 없는 세상, 여기서라도 위로가 되었으면 해요. 어른의 조언도, 동료의 응원도 기다리고 있어요.
          </p>
        </div>

        {/* 카테고리 필터 */}
        <div className="border-b border-white/[.06] px-4 py-2">
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => setFilterCategory(null)}
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium transition-colors ${
                !filterCategory ? 'bg-rose-500/70 text-white' : 'bg-white/[.06] text-text-muted hover:bg-white/10'
              }`}
            >
              전체
            </button>
            {WORRY_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(filterCategory === cat ? null : cat)}
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium transition-colors ${
                  filterCategory === cat
                    ? 'bg-rose-500/70 text-white'
                    : 'bg-white/[.06] text-text-muted hover:bg-white/10'
                }`}
              >
                {CATEGORY_EMOJIS[cat]} {cat}
              </button>
            ))}
          </div>
        </div>

        {/* 목록 */}
        <div className="flex-1 overflow-y-auto p-4">
          {(loading && skeletonTimeout) || error ? (
            <div className="flex flex-col items-center justify-center py-12">
              <span className="text-3xl mb-2">⚠️</span>
              <p className="text-sm text-text-muted mb-3">{error || '로딩 실패. 새로고침해주세요.'}</p>
              <button
                onClick={load}
                className="flex items-center gap-1.5 rounded-lg bg-rose-500/20 px-3 py-1.5 text-xs font-medium text-rose-300 transition-colors hover:bg-rose-500/30"
              >
                <RefreshCw size={13} /> 새로고침
              </button>
            </div>
          ) : loading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="flex flex-col gap-2 rounded-xl border border-white/[.06] bg-white/[.03] p-3 animate-pulse"
                >
                  <div className="flex gap-2">
                    <div className="h-4 w-12 rounded-full bg-white/10" />
                    <div className="h-4 w-8 rounded-full bg-white/10" />
                  </div>
                  <div className="h-4 w-3/4 rounded bg-white/10" />
                  <div className="h-3 w-full rounded bg-white/[.06]" />
                </div>
              ))}
            </div>
          ) : worries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2">
              <span className="text-4xl">🫂</span>
              <p className="text-sm font-medium text-text-secondary">아직 사연이 없어요</p>
              <p className="text-[11px] text-text-muted">첫 번째로 이야기를 꺼내보세요</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {worries.map((worry) => (
                <button
                  key={worry.id}
                  onClick={() => { setSelectedWorry(worry); setView('detail'); }}
                  className="w-full text-left flex flex-col gap-2 rounded-xl border border-white/[.06] bg-white/[.03] p-3 transition-colors hover:bg-white/[.06] hover:border-rose-500/20"
                >
                  {/* 메타 */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="rounded-full bg-rose-500/15 px-2 py-0.5 text-[10px] font-medium text-rose-300">
                      {CATEGORY_EMOJIS[worry.category]} {worry.category}
                    </span>
                    {worry.anonymous && (
                      <span className="rounded-full bg-white/[.06] px-2 py-0.5 text-[10px] text-text-muted">익명</span>
                    )}
                    <span className="ml-auto text-[10px] text-text-muted">{formatRelativeTime(worry.created_at)}</span>
                  </div>

                  {/* 제목 */}
                  <p className="text-sm font-semibold text-text-primary line-clamp-1">{worry.title}</p>

                  {/* 내용 미리보기 */}
                  <p className="text-[11px] leading-relaxed text-text-muted line-clamp-2">{worry.content}</p>

                  {/* 통계 */}
                  <div className="flex items-center gap-3 text-[10px] text-text-muted">
                    <span>🫂 {worry.reaction_count}</span>
                    <span>💬 {worry.comment_count}</span>
                    <span>👁 {worry.view_count ?? 0}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* FAB */}
        <button
          onClick={() => setView('form')}
          className="absolute bottom-6 right-6 flex h-12 w-12 items-center justify-center rounded-full text-white shadow-lg transition-colors duration-200"
          style={{ background: 'rgba(244,63,94,0.75)', boxShadow: '0 4px 20px rgba(244,63,94,.35)' }}
          title="사연 올리기"
        >
          <Plus size={22} />
        </button>
      </div>

      {/* ── 글쓰기 뷰 ── */}
      {view === 'form' && (
        <div className="absolute inset-0 z-10 flex flex-col bg-bg-primary animate-[slideInRight_.2s_ease-out]">
          <WorryForm onClose={() => setView('list')} onCreated={handleCreated} />
        </div>
      )}

      {/* ── 상세 뷰 ── */}
      {view === 'detail' && selectedWorry && (
        <div className="absolute inset-0 z-10 flex flex-col bg-bg-primary animate-[slideInRight_.2s_ease-out]">
          <WorryDetail
            worry={selectedWorry}
            onBack={() => setView('list')}
            onDeleted={handleDeleted}
            onEdit={handleEdit}
          />
        </div>
      )}

      {view === 'edit' && selectedWorry && (
        <div className="absolute inset-0 z-10 flex flex-col bg-bg-primary animate-[slideInRight_.2s_ease-out]">
          <WorryForm
            onClose={() => setView('detail')}
            onCreated={handleEditDone}
            editId={selectedWorry.id}
            initialData={{
              title: selectedWorry.title,
              content: selectedWorry.content,
              category: selectedWorry.category,
            }}
          />
        </div>
      )}
    </div>
  );
}
