import { useState, useEffect, useCallback } from 'react';
import { Plus, X, Filter, RefreshCw } from 'lucide-react';
import GatheringCard from './GatheringCard';
import GatheringForm from './GatheringForm';
import GatheringDetail from './GatheringDetail';
import { useGatherings } from '../../hooks/useGatherings';
import { useAuthStore } from '../../stores/authStore';
import { GATHERING_CATEGORIES, GATHERING_STATUSES, GATHERING_STATUS_LABELS } from '../../lib/constants';
import type { GatheringCategory, GatheringStatus } from '../../lib/constants';
import type { Gathering } from '../../types';

type ViewMode = 'list' | 'form' | 'detail';

interface GatheringPanelProps {
  onClose?: () => void;
}

export default function GatheringPanel({ onClose }: GatheringPanelProps) {
  const { user } = useAuthStore();
  const { gatherings, loading, error, fetchGatherings, fetchMyJoins } = useGatherings();

  const [view, setView] = useState<ViewMode>('list');
  const [selected, setSelected] = useState<Gathering | null>(null);
  const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set());
  const [filterCategory, setFilterCategory] = useState<GatheringCategory | null>(null);
  const [filterStatus, setFilterStatus] = useState<GatheringStatus | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [skeletonTimeout, setSkeletonTimeout] = useState(false);

  const loadGatherings = useCallback(() => {
    fetchGatherings({
      category: filterCategory,
      status: filterStatus,
    });
  }, [fetchGatherings, filterCategory, filterStatus]);

  useEffect(() => {
    loadGatherings();
  }, [loadGatherings]);

  useEffect(() => {
    if (!loading) {
      setSkeletonTimeout(false);
      return;
    }
    const timer = setTimeout(() => setSkeletonTimeout(true), 10000);
    return () => clearTimeout(timer);
  }, [loading]);

  // 내 참여 상태 로드
  useEffect(() => {
    if (user && gatherings.length > 0) {
      fetchMyJoins(user.id).then(setJoinedIds);
    }
  }, [user, gatherings.length, fetchMyJoins]);

  const handleCreated = () => {
    setView('list');
    loadGatherings();
  };

  const handleRefresh = () => {
    loadGatherings();
    if (user) fetchMyJoins(user.id).then(setJoinedIds);
  };

  const handleCardClick = (g: Gathering) => {
    setSelected(g);
    setView('detail');
  };

  if (view === 'form') {
    return <GatheringForm onClose={() => setView('list')} onCreated={handleCreated} />;
  }

  if (view === 'detail' && selected) {
    // 최신 데이터 반영
    const latest = gatherings.find((g) => g.id === selected.id) ?? selected;
    return (
      <GatheringDetail
        gathering={latest}
        joined={joinedIds.has(latest.id)}
        isAuthor={latest.author_id === user?.id}
        onClose={() => { setView('list'); setSelected(null); }}
        onRefresh={handleRefresh}
      />
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* 헤더 */}
      <div className="flex items-center justify-between border-b border-white/[.06] px-4 py-3">
        <h2 className="font-heading text-base font-bold text-text-primary">🎉 모임방</h2>
        <div className="flex items-center gap-1">
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
            {GATHERING_CATEGORIES.map((cat) => (
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
              onChange={(e) => setFilterStatus((e.target.value || null) as GatheringStatus | null)}
              className="flex-1 rounded-lg bg-white/[.06] px-2 py-1 text-[11px] text-text-secondary outline-none"
            >
              <option value="">상태: 전체</option>
              {GATHERING_STATUSES.map((s) => (
                <option key={s} value={s}>{GATHERING_STATUS_LABELS[s]}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* 모임 목록 */}
      <div className="flex-1 overflow-y-auto p-4">
        {(loading && skeletonTimeout) || error ? (
          <div className="flex flex-col items-center justify-center py-12">
            <span className="text-3xl mb-2">⚠️</span>
            <p className="text-sm text-text-muted mb-3">{error || '로딩에 실패했습니다'}</p>
            <button onClick={loadGatherings} className="flex items-center gap-1.5 rounded-lg bg-accent/20 px-3 py-1.5 text-xs font-medium text-accent transition-colors hover:bg-accent/30">
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
              </div>
            ))}
          </div>
        ) : gatherings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <span className="text-3xl mb-2">🎉</span>
            <p className="text-sm text-text-muted">첫 번째 모임을 만들어보세요!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {gatherings.map((g) => (
              <GatheringCard
                key={g.id}
                gathering={g}
                joined={joinedIds.has(g.id)}
                onClick={() => handleCardClick(g)}
              />
            ))}
          </div>
        )}
      </div>

      {/* FAB: 새 모임 */}
      <button
        onClick={() => setView('form')}
        className="absolute bottom-6 right-6 flex h-12 w-12 items-center justify-center rounded-full bg-accent text-white shadow-lg transition-colors duration-200 hover:bg-accent/80"
        style={{ boxShadow: '0 4px 20px rgba(108,92,231,.4)' }}
        title="새 모임"
      >
        <Plus size={22} />
      </button>
    </div>
  );
}
