import { useState, useEffect, useCallback } from 'react';
import { Plus, X, Filter, TrendingUp, Clock, RefreshCw } from 'lucide-react';
import IdeaCard from './IdeaCard';
import IdeaForm from './IdeaForm';
import LoadMore from '../common/LoadMore';
import { useIdeas } from '../../hooks/useIdeas';
import { useAuthStore } from '../../stores/authStore';
import { useUiStore } from '../../stores/uiStore';
import { IDEA_CATEGORIES, IDEA_STATUSES } from '../../lib/constants';
import type { IdeaCategory, IdeaStatus } from '../../lib/constants';

type ViewMode = 'list' | 'form';

interface IdeaPanelProps {
  onClose?: () => void;
}

export default function IdeaPanel({ onClose }: IdeaPanelProps) {
  const { profile, user } = useAuthStore();
  const { addToast } = useUiStore();
  const { ideas, loading, error, fetchIdeas, toggleVote, updateIdeaStatus, fetchUserVotes } = useIdeas();

  const [view, setView] = useState<ViewMode>('list');
  const [skeletonTimeout, setSkeletonTimeout] = useState(false);
  const [sortMode, setSortMode] = useState<'newest' | 'popular'>('newest');
  const [filterCategory, setFilterCategory] = useState<IdeaCategory | null>(null);
  const [filterStatus, setFilterStatus] = useState<IdeaStatus | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [displayCount, setDisplayCount] = useState(20);

  const loadIdeas = useCallback(() => {
    fetchIdeas({
      category: filterCategory,
      status: filterStatus,
      sort: sortMode,
    });
  }, [fetchIdeas, filterCategory, filterStatus, sortMode]);

  useEffect(() => {
    loadIdeas();
  }, [loadIdeas]);

  useEffect(() => {
    if (!loading) {
      setSkeletonTimeout(false);
      return;
    }
    const timer = setTimeout(() => setSkeletonTimeout(true), 10000);
    return () => clearTimeout(timer);
  }, [loading]);

  // 사용자 투표 상태 로드
  useEffect(() => {
    if (user && ideas.length > 0) {
      fetchUserVotes(user.id);
    }
  }, [user, ideas.length, fetchUserVotes]);

  const handleVote = async (ideaId: string) => {
    if (!user) {
      addToast('로그인이 필요합니다', 'error');
      return;
    }
    const { error } = await toggleVote(ideaId, user.id);
    if (error) addToast(`투표 실패: ${error}`, 'error');
  };

  const handleStatusChange = async (ideaId: string, status: IdeaStatus) => {
    const { error } = await updateIdeaStatus(ideaId, status);
    if (error) {
      addToast(`상태 변경 실패: ${error}`, 'error');
    } else {
      addToast(`상태가 "${status}"(으)로 변경되었습니다`, 'success');
    }
  };

  const handleCreated = () => {
    setView('list');
    loadIdeas();
  };

  if (view === 'form') {
    return <IdeaForm onClose={() => setView('list')} onCreated={handleCreated} />;
  }

  return (
    <div className="flex flex-col h-full">
      {/* 헤더 */}
      <div className="flex items-center justify-between border-b border-white/[.06] px-4 py-3">
        <h2 className="font-heading text-base font-bold text-text-primary">💡 아이디어 보드</h2>
        <div className="flex items-center gap-1">
          {/* 정렬 토글 */}
          <button
            onClick={() => setSortMode(sortMode === 'newest' ? 'popular' : 'newest')}
            className={`flex h-7 items-center gap-1 rounded-lg px-2 text-[11px] font-medium transition-colors ${
              sortMode === 'popular'
                ? 'bg-danger/15 text-danger'
                : 'text-text-muted hover:bg-white/10 hover:text-text-primary'
            }`}
            title={sortMode === 'newest' ? '인기순으로 전환' : '최신순으로 전환'}
          >
            {sortMode === 'popular' ? <TrendingUp size={13} /> : <Clock size={13} />}
            {sortMode === 'popular' ? '인기순' : '최신순'}
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
          <span className="font-semibold text-text-secondary">좋은 생각을 함께 키우는 공간</span> — 업무 효율화, 문화 개선 등 아이디어를 자유롭게 제안하세요. 동료들의 좋아요 투표로 우선순위가 정해지고, 채택된 아이디어는 실제 실행으로 이어집니다.
        </p>
      </div>

      {/* 필터 바 */}
      {showFilters && (
        <div className="border-b border-white/[.06] px-4 py-2 space-y-2">
          {/* 카테고리 칩 */}
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => setFilterCategory(null)}
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium transition-colors ${
                !filterCategory ? 'bg-accent text-white' : 'bg-white/[.06] text-text-muted hover:bg-white/10'
              }`}
            >
              전체
            </button>
            {IDEA_CATEGORIES.map((cat) => (
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
          {/* 상태 필터 */}
          <div className="flex gap-2">
            <select
              value={filterStatus ?? ''}
              onChange={(e) => setFilterStatus((e.target.value || null) as IdeaStatus | null)}
              className="flex-1 rounded-lg bg-white/[.06] px-2 py-1 text-[11px] text-text-secondary outline-none"
            >
              <option value="">상태: 전체</option>
              {IDEA_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* 아이디어 목록 */}
      <div className="flex-1 overflow-y-auto p-4">
        {(loading && skeletonTimeout) || error ? (
          <div className="flex flex-col items-center justify-center py-12">
            <span className="text-3xl mb-2">⚠️</span>
            <p className="text-sm text-text-muted mb-3">{error || '로딩에 실패했습니다. 새로고침해주세요'}</p>
            <button onClick={loadIdeas} className="flex items-center gap-1.5 rounded-lg bg-accent/20 px-3 py-1.5 text-xs font-medium text-accent transition-colors hover:bg-accent/30">
              <RefreshCw size={13} /> 새로고침
            </button>
          </div>
        ) : loading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-2 rounded-xl border border-white/[.06] bg-white/[.03] p-3 animate-pulse">
                <div className="flex justify-between">
                  <div className="h-4 w-14 rounded-full bg-white/10" />
                  <div className="h-4 w-10 rounded-full bg-white/10" />
                </div>
                <div className="h-4 w-3/4 rounded bg-white/10" />
                <div className="h-3 w-full rounded bg-white/[.06]" />
                <div className="h-3 w-1/2 rounded bg-white/[.06]" />
              </div>
            ))}
          </div>
        ) : ideas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <span className="text-3xl mb-2">💡</span>
            <p className="text-sm text-text-muted">첫 번째 아이디어를 공유해보세요</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {ideas.slice(0, displayCount).map((idea) => (
              <IdeaCard
                key={idea.id}
                idea={idea}
                onVote={handleVote}
                onStatusChange={profile?.role === 'admin' || profile?.role === 'director' || profile?.role === 'leader' ? handleStatusChange : undefined}
              />
            ))}
            <LoadMore current={Math.min(displayCount, ideas.length)} total={ideas.length} onLoadMore={() => setDisplayCount((c) => c + 20)} />
          </div>
        )}
      </div>

      {/* FAB: 새 아이디어 */}
      <button
        onClick={() => setView('form')}
        className="absolute bottom-6 right-6 flex h-12 w-12 items-center justify-center rounded-full bg-accent text-white shadow-lg transition-colors duration-200 hover:bg-accent/80"
        style={{ boxShadow: '0 4px 20px rgba(108,92,231,.4)' }}
        title="새 아이디어"
      >
        <Plus size={22} />
      </button>
    </div>
  );
}
