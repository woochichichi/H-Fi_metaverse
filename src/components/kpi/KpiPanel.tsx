import { useState, useEffect, useCallback } from 'react';
import { X, RefreshCw, ChevronDown } from 'lucide-react';
import KpiMemberRow from './KpiMemberRow';
import { useKpi } from '../../hooks/useKpi';
import { useAuthStore } from '../../stores/authStore';
import { UNITS } from '../../lib/constants';

interface KpiPanelProps {
  onClose?: () => void;
}

/** 분기 목록 생성 (현재 ~ 2분기 전) */
function getQuarterOptions(): { value: string; label: string }[] {
  const now = new Date();
  const options: { value: string; label: string }[] = [];
  for (let i = 0; i < 3; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i * 3, 1);
    const q = Math.ceil((d.getMonth() + 1) / 3);
    const val = `${d.getFullYear()}-Q${q}`;
    if (options.find((o) => o.value === val)) continue;
    options.push({ value: val, label: `${d.getFullYear()}년 ${q}분기` });
  }
  return options;
}

export default function KpiPanel({ onClose }: KpiPanelProps) {
  const { profile } = useAuthStore();
  const { kpiItems, members, loading, error, fetchKpiItems, fetchMemberActivities } = useKpi();

  const quarters = getQuarterOptions();
  const [selectedQuarter, setSelectedQuarter] = useState(quarters[0]?.value ?? '');
  const [filterUnit, setFilterUnit] = useState<string>('');
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  const isAdmin = profile?.role === 'admin' || profile?.role === 'director';
  const isLeader = isAdmin || profile?.role === 'leader';
  const userTeam = profile?.team ?? '';

  const loadData = useCallback(async () => {
    // fetchKpiItems가 loading 상태를 관리, 유닛 필터는 항목에만 적용
    await fetchKpiItems(userTeam, filterUnit || null);
    await fetchMemberActivities(userTeam, selectedQuarter);
  }, [fetchKpiItems, fetchMemberActivities, userTeam, filterUnit, selectedQuarter]);

  useEffect(() => {
    if (userTeam) loadData();
  }, [loadData, userTeam]);

  // 권한별 멤버 필터
  const visibleMembers = isLeader
    ? members
    : members.filter((m) => m.userId === profile?.id);

  // KPI 항목별 설명 토글
  const toggleItem = (id: string) =>
    setExpandedItem((prev) => (prev === id ? null : id));

  return (
    <div className="flex flex-col h-full">
      {/* 헤더 */}
      <div className="flex items-center justify-between border-b border-white/[.06] px-4 py-3">
        <h2 className="font-heading text-base font-bold text-text-primary">📊 KPI 활동 현황</h2>
        <div className="flex items-center gap-1">
          <button
            onClick={loadData}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-white/10 hover:text-text-primary"
            title="새로고침"
          >
            <RefreshCw size={14} />
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

      {/* 안내 */}
      <div className="border-b border-white/[.06] bg-accent/[.04] px-4 py-2">
        <p className="text-[11px] leading-relaxed text-text-muted">
          <span className="font-semibold text-text-secondary">플랫폼 활동 자동 집계</span> — VoC·아이디어·이벤트·교류 활동을 자동으로 추적합니다. 실제 채점은 별도 평가 문서에서 진행됩니다.
        </p>
      </div>

      {/* 필터: 분기 + 유닛 */}
      <div className="border-b border-white/[.06] px-4 py-2 space-y-2">
        {/* 분기 선택 */}
        <div className="relative">
          <select
            value={selectedQuarter}
            onChange={(e) => setSelectedQuarter(e.target.value)}
            className="w-full appearance-none rounded-lg bg-white/[.06] px-3 py-1.5 pr-8 text-xs text-text-primary outline-none focus:ring-1 focus:ring-accent"
          >
            {quarters.map((q) => (
              <option key={q.value} value={q.value}>{q.label}</option>
            ))}
          </select>
          <ChevronDown size={12} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
        </div>

        {/* 유닛 필터 */}
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

      {/* 본문 */}
      <div className="flex-1 overflow-y-auto">
        {error ? (
          <div className="flex flex-col items-center justify-center py-12">
            <span className="text-3xl mb-2">⚠️</span>
            <p className="text-sm text-text-muted mb-3">{error}</p>
            <button onClick={loadData} className="flex items-center gap-1.5 rounded-lg bg-accent/20 px-3 py-1.5 text-xs font-medium text-accent transition-colors hover:bg-accent/30">
              <RefreshCw size={13} /> 새로고침
            </button>
          </div>
        ) : loading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-white/[.06] bg-white/[.03] p-3 animate-pulse">
                <div className="h-4 w-1/3 rounded bg-white/10 mb-2" />
                <div className="h-3 w-2/3 rounded bg-white/[.06]" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* 평가 항목 (접이식) */}
            <div className="border-b border-white/[.06] px-4 py-3">
              <h3 className="text-[11px] font-semibold text-text-muted mb-2 uppercase tracking-wider">평가 항목 ({kpiItems.length})</h3>
              <div className="space-y-1">
                {kpiItems.map((item, idx) => (
                  <button
                    key={item.id}
                    onClick={() => toggleItem(item.id)}
                    className="w-full text-left rounded-lg bg-white/[.03] px-3 py-2 transition-colors hover:bg-white/[.06]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-text-primary">
                        <span className="text-text-muted mr-1.5">{idx + 1}.</span>
                        {item.title}
                      </span>
                      <span className="text-[10px] text-text-muted font-mono">0~{item.max_score}</span>
                    </div>
                    {expandedItem === item.id && item.description && (
                      <p className="mt-1.5 text-[11px] leading-relaxed text-text-muted whitespace-pre-line">
                        {item.description}
                      </p>
                    )}
                  </button>
                ))}
                {kpiItems.length === 0 && (
                  <p className="text-xs text-text-muted py-2">등록된 평가 항목이 없습니다</p>
                )}
              </div>
            </div>

            {/* 팀원 활동 현황 */}
            <div className="px-4 py-3">
              <h3 className="text-[11px] font-semibold text-text-muted mb-2 uppercase tracking-wider">
                팀원 활동 현황 ({visibleMembers.length}명)
              </h3>

              {visibleMembers.length === 0 ? (
                <div className="flex flex-col items-center py-8">
                  <span className="text-2xl mb-2">👥</span>
                  <p className="text-xs text-text-muted">표시할 팀원이 없습니다</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {/* 헤더 */}
                  <div className="grid grid-cols-[1fr_repeat(4,40px)] gap-1 px-2 text-[9px] font-medium text-text-muted text-center">
                    <span className="text-left">이름</span>
                    <span title="VoC 제출">VoC</span>
                    <span title="아이디어 제안">💡</span>
                    <span title="이벤트 참석">🎪</span>
                    <span title="교류+커피챗">☕</span>
                  </div>
                  {visibleMembers.map((m) => (
                    <KpiMemberRow key={m.userId} member={m} />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
