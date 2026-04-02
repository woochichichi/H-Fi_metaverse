import { useState, useEffect, useCallback } from 'react';
import { Plus, X, BarChart3, Filter } from 'lucide-react';
import VocList from './VocList';
import VocForm from './VocForm';
import VocDetail from './VocDetail';
import VocStats from './VocStats';
import { useVocs, useVocRealtime } from '../../hooks/useVocs';
import { useAuthStore } from '../../stores/authStore';
import { useUiStore } from '../../stores/uiStore';
import { supabase } from '../../lib/supabase';
import { VOC_CATEGORIES, VOC_STATUSES, TEAM_CONFIGS } from '../../lib/constants';
import type { Voc } from '../../types';
import type { VocCategory, VocStatus } from '../../lib/constants';

type ViewMode = 'list' | 'form' | 'detail' | 'stats';

interface VocPanelProps {
  onClose?: () => void;
}

export default function VocPanel({ onClose }: VocPanelProps) {
  const { profile } = useAuthStore();
  const { addToast } = useUiStore();
  const { vocs, loading, error, fetchVocs } = useVocs();

  const [view, setView] = useState<ViewMode>('list');
  const [selectedVoc, setSelectedVoc] = useState<Voc | null>(null);

  // 필터
  const [filterCategory, setFilterCategory] = useState<VocCategory | null>(null);
  const [filterStatus, setFilterStatus] = useState<VocStatus | null>(null);
  const [filterTeam, setFilterTeam] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [assigneeNames, setAssigneeNames] = useState<Record<string, string>>({});

  const isLeader = profile?.role === 'admin' || profile?.role === 'director' || profile?.role === 'leader';

  // 담당자 이름 맵 로드
  useEffect(() => {
    const ids = [...new Set(vocs.map((v) => v.assignee_id).filter(Boolean))] as string[];
    if (ids.length === 0) return;
    supabase.from('profiles').select('id, name, nickname').in('id', ids).then(({ data }) => {
      const map: Record<string, string> = {};
      (data ?? []).forEach((p) => { map[p.id] = p.nickname || p.name; });
      setAssigneeNames(map);
    });
  }, [vocs]);

  const loadVocs = useCallback(() => {
    fetchVocs({
      category: filterCategory,
      status: filterStatus,
      team: filterTeam,
      sort: sortOrder,
    });
  }, [fetchVocs, filterCategory, filterStatus, filterTeam, sortOrder]);

  useEffect(() => {
    loadVocs();
  }, [loadVocs]);

  // Realtime: 새 VOC 알림
  useVocRealtime(
    useCallback(
      (newVoc: Voc) => {
        if (isLeader) {
          addToast(`📞 새 VOC 접수 — ${newVoc.title}`, 'info');
        }
        loadVocs();
      },
      [isLeader, addToast, loadVocs]
    )
  );

  // 뷰 전환 핸들러
  const handleSelectVoc = (voc: Voc) => {
    setSelectedVoc(voc);
    setView('detail');
  };

  const handleBack = () => {
    setSelectedVoc(null);
    setView('list');
    loadVocs();
  };

  const handleCreated = () => {
    setView('list');
    loadVocs();
  };

  const handleVocUpdated = (updatedVoc: Voc) => {
    setSelectedVoc(updatedVoc);
  };

  return (
    <div className="relative flex flex-col h-full overflow-hidden">
      <div className={`flex flex-col h-full ${view !== 'list' ? 'invisible' : ''}`}>
      {/* 헤더 */}
      <div className="flex items-center justify-between border-b border-white/[.06] px-4 py-3">
        <h2 className="font-heading text-base font-bold text-text-primary">📞 VOC방</h2>
        <div className="flex items-center gap-1">
          {isLeader && (
            <button
              onClick={() => setView('stats')}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-white/10 hover:text-text-primary"
              title="통계"
            >
              <BarChart3 size={15} />
            </button>
          )}
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
          <span className="font-semibold text-text-secondary">현장의 목소리를 전달하는 창구</span> — 업무 중 느낀 불편, 개선 요청, 칭찬을 자유롭게 접수하세요. 익명으로도 남길 수 있어 솔직한 의견이 가능합니다. 접수된 VOC는 리더가 확인하고 양방향 대화로 해결해 나갑니다.
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
          {VOC_CATEGORIES.map((cat) => (
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

      {/* 상태 + 팀 + 정렬 — 토글 */}
      {showFilters && (
        <div className="border-b border-white/[.06] px-4 py-2">
          <div className="flex gap-2">
            <select
              value={filterStatus ?? ''}
              onChange={(e) => setFilterStatus((e.target.value || null) as VocStatus | null)}
              className="flex-1 rounded-lg bg-white/[.06] px-2 py-1 text-[11px] text-text-secondary outline-none"
            >
              <option value="">상태: 전체</option>
              {VOC_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <select
              value={filterTeam ?? ''}
              onChange={(e) => setFilterTeam(e.target.value || null)}
              className="flex-1 rounded-lg bg-white/[.06] px-2 py-1 text-[11px] text-text-secondary outline-none"
            >
              <option value="">팀: 전체</option>
              {Object.keys(TEAM_CONFIGS).map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
              className="rounded-lg bg-white/[.06] px-2 py-1 text-[11px] text-text-secondary outline-none"
            >
              <option value="newest">최신순</option>
              <option value="oldest">오래된순</option>
            </select>
          </div>
        </div>
      )}

      {/* VOC 목록 — 비공개(is_hidden) VOC는 리더 이상에게만 표시 */}
      <div className="flex-1 overflow-y-auto p-4">
        <VocList
          vocs={isLeader ? vocs : vocs.filter((v) => !v.is_hidden)}
          loading={loading}
          error={error}
          onSelect={handleSelectVoc}
          onRetry={loadVocs}
          assigneeNames={assigneeNames}
        />
      </div>

      {/* FAB: 새 VOC */}
      <button
        onClick={() => setView('form')}
        className="absolute bottom-6 right-6 flex h-12 w-12 items-center justify-center rounded-full bg-accent text-white shadow-lg transition-colors duration-200 hover:bg-accent/80"
        style={{ boxShadow: '0 4px 20px rgba(108,92,231,.4)' }}
        title="새 VOC 접수"
      >
        <Plus size={22} />
      </button>
      </div>

      {view === 'form' && (
        <div className="absolute inset-0 z-10 flex flex-col bg-bg-primary animate-[slideInRight_.2s_ease-out]">
          <VocForm onClose={handleBack} onCreated={handleCreated} />
        </div>
      )}
      {view === 'detail' && selectedVoc && (
        <div className="absolute inset-0 z-10 flex flex-col bg-bg-primary animate-[slideInRight_.2s_ease-out]">
          <VocDetail voc={selectedVoc} onBack={handleBack} onUpdated={handleVocUpdated} onDeleted={handleBack} />
        </div>
      )}
      {view === 'stats' && (
        <div className="absolute inset-0 z-10 flex flex-col bg-bg-primary animate-[slideInRight_.2s_ease-out]">
          <VocStats vocs={vocs} onBack={handleBack} />
        </div>
      )}
    </div>
  );
}
