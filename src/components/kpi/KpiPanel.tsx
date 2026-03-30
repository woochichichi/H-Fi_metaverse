import { useState, useEffect, useCallback } from 'react';
import { X, Edit3, RefreshCw } from 'lucide-react';
import KpiCard from './KpiCard';
import KpiChart from './KpiChart';
import KpiForm from './KpiForm';
import { useKpi } from '../../hooks/useKpi';
import { useAuthStore } from '../../stores/authStore';
import { UNITS } from '../../lib/constants';

type ViewMode = 'dashboard' | 'form';

interface KpiPanelProps {
  onClose?: () => void;
}

export default function KpiPanel({ onClose }: KpiPanelProps) {
  const { profile } = useAuthStore();
  const { kpiItems, kpiRecords, loading, error, fetchKpiItems, fetchAllRecords } = useKpi();

  const [view, setView] = useState<ViewMode>('dashboard');
  const [filterUnit, setFilterUnit] = useState<string>('');
  const [skeletonTimeout, setSkeletonTimeout] = useState(false);

  const isLeader = profile?.role === 'admin' || profile?.role === 'director' || profile?.role === 'leader';

  const loadData = useCallback(async () => {
    await fetchKpiItems(filterUnit || null);
  }, [fetchKpiItems, filterUnit]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!loading) {
      setSkeletonTimeout(false);
      return;
    }
    const timer = setTimeout(() => setSkeletonTimeout(true), 10000);
    return () => clearTimeout(timer);
  }, [loading]);

  // KPI 항목이 로드되면 해당 records도 로드
  useEffect(() => {
    if (kpiItems.length > 0) {
      fetchAllRecords(kpiItems.map((i) => i.id));
    }
  }, [kpiItems, fetchAllRecords]);

  const handleSaved = () => {
    setView('dashboard');
    loadData();
  };

  if (view === 'form') {
    return (
      <KpiForm
        items={kpiItems}
        onClose={() => setView('dashboard')}
        onSaved={handleSaved}
      />
    );
  }

  // KPI 항목별 records 매핑
  const getRecordsForItem = (itemId: string) =>
    kpiRecords.filter((r) => r.kpi_item_id === itemId);

  return (
    <div className="flex flex-col h-full">
      {/* 헤더 */}
      <div className="flex items-center justify-between border-b border-white/[.06] px-4 py-3">
        <h2 className="font-heading text-base font-bold text-text-primary">📊 KPI 대시보드</h2>
        <div className="flex items-center gap-1">
          {isLeader && (
            <button
              onClick={() => setView('form')}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-white/10 hover:text-text-primary"
              title="실적 입력"
            >
              <Edit3 size={15} />
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

      {/* 유닛 필터 */}
      <div className="border-b border-white/[.06] px-4 py-2">
        <div className="flex gap-1">
          <button
            onClick={() => setFilterUnit('')}
            className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium transition-colors ${
              !filterUnit ? 'bg-accent text-white' : 'bg-white/[.06] text-text-muted hover:bg-white/10'
            }`}
          >
            전체
          </button>
          {UNITS.map((u) => (
            <button
              key={u}
              onClick={() => setFilterUnit(filterUnit === u ? '' : u)}
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium transition-colors ${
                filterUnit === u ? 'bg-accent text-white' : 'bg-white/[.06] text-text-muted hover:bg-white/10'
              }`}
            >
              {u}
            </button>
          ))}
        </div>
      </div>

      {/* 대시보드 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {(loading && skeletonTimeout) || error ? (
          <div className="flex flex-col items-center justify-center py-12">
            <span className="text-3xl mb-2">⚠️</span>
            <p className="text-sm text-text-muted mb-3">{error || '로딩에 실패했습니다. 새로고침해주세요'}</p>
            <button onClick={loadData} className="flex items-center gap-1.5 rounded-lg bg-accent/20 px-3 py-1.5 text-xs font-medium text-accent transition-colors hover:bg-accent/30">
              <RefreshCw size={13} /> 새로고침
            </button>
          </div>
        ) : loading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-white/[.06] bg-white/[.03] p-3 animate-pulse">
                <div className="h-4 w-2/3 rounded bg-white/10 mb-3" />
                <div className="h-2 w-full rounded-full bg-white/[.08]" />
              </div>
            ))}
          </div>
        ) : kpiItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <span className="text-3xl mb-2">📊</span>
            <p className="text-sm text-text-muted">등록된 KPI 항목이 없습니다</p>
          </div>
        ) : (
          <>
            {/* KPI 카드 그리드 */}
            <div className="grid grid-cols-1 gap-3">
              {kpiItems.map((item) => (
                <KpiCard
                  key={item.id}
                  item={item}
                  records={getRecordsForItem(item.id)}
                />
              ))}
            </div>

            {/* 추이 차트 */}
            <KpiChart items={kpiItems} records={kpiRecords} />
          </>
        )}
      </div>
    </div>
  );
}
