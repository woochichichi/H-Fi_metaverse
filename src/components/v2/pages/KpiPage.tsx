import { useCallback, useEffect, useMemo, useState } from 'react';
import { Target, ChevronDown, ChevronRight, Save } from 'lucide-react';
import PageHeader from '../ui/PageHeader';
import FilterBar from '../ui/FilterBar';
import EmptyState from '../ui/EmptyState';
import { useAuthStore } from '../../../stores/authStore';
import { usePermissions } from '../../../hooks/usePermissions';
import { useKpi } from '../../../hooks/useKpi';
import { useV2Toast } from '../ui/Toast';
import { UNITS, TEAMS } from '../../../lib/constants';
import type { Unit } from '../../../lib/constants';
import type { KpiItem, KpiRecord } from '../../../types';

function getCurrentQuarter(): string {
  const now = new Date();
  const q = Math.ceil((now.getMonth() + 1) / 3);
  return `${now.getFullYear()}-Q${q}`;
}

function listQuarters(count = 4): string[] {
  const now = new Date();
  const result: string[] = [];
  let y = now.getFullYear();
  let q = Math.ceil((now.getMonth() + 1) / 3);
  for (let i = 0; i < count; i++) {
    result.push(`${y}-Q${q}`);
    q -= 1;
    if (q < 1) { q = 4; y -= 1; }
  }
  return result;
}

export default function KpiPage() {
  const { profile } = useAuthStore();
  const perm = usePermissions();
  const {
    kpiItems,
    members,
    kpiRecords,
    loading,
    fetchKpiItems,
    fetchMemberActivities,
    fetchMemberUnitScores,
    memberUnitScores,
    fetchAllRecords,
    upsertKpiRecord,
  } = useKpi();
  const showToast = useV2Toast((s) => s.show);

  const [team, setTeam] = useState<string>(perm.isAdmin ? profile?.team ?? TEAMS[0] : profile?.team ?? '');
  const [unit, setUnit] = useState<Unit | null>(null);
  const [quarter, setQuarter] = useState(getCurrentQuarter());
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!team) return;
    void fetchKpiItems(team, unit);
    void fetchMemberActivities(team, quarter);
    void fetchMemberUnitScores(team, quarter);
  }, [team, unit, quarter, fetchKpiItems, fetchMemberActivities, fetchMemberUnitScores]);

  const filteredItems = useMemo(() => {
    if (!unit) return kpiItems;
    return kpiItems.filter((k) => k.unit === unit);
  }, [kpiItems, unit]);

  // 리더/관리자가 점수 입력 펼침 — 그 시점에 해당 분기 KPI 항목들의 records 조회
  useEffect(() => {
    if (!perm.isLeader || !expandedUserId) return;
    const itemIds = filteredItems.map((k) => k.id);
    if (itemIds.length === 0) return;
    void fetchAllRecords(itemIds);
  }, [perm.isLeader, expandedUserId, filteredItems, fetchAllRecords]);

  // 팀원은 본인 행만, 리더/관리자는 모든 행
  const visibleMembers = useMemo(() => {
    if (perm.isLeader) return members;
    return members.filter((m) => m.userId === profile?.id);
  }, [members, perm.isLeader, profile?.id]);

  const quarters = useMemo(() => listQuarters(4), []);

  const handleScoreSave = useCallback(
    async (kpiItemId: string, userId: string, month: string, score: number, evidence?: string) => {
      const { error } = await upsertKpiRecord({ kpi_item_id: kpiItemId, user_id: userId, month, score, evidence });
      if (error) {
        showToast(`저장 실패: ${error}`, 'error');
        return;
      }
      showToast('점수가 저장되었습니다', 'success');
      // 갱신
      const itemIds = filteredItems.map((k) => k.id);
      if (itemIds.length > 0) void fetchAllRecords(itemIds);
      void fetchMemberUnitScores(team, quarter);
    },
    [upsertKpiRecord, showToast, filteredItems, fetchAllRecords, fetchMemberUnitScores, team, quarter],
  );

  return (
    <>
      <PageHeader
        crumbs={[
          { label: '한울타리' },
          {
            label: '팀 KPI',
            badge: profile?.team ? { text: profile.team, tone: 'accent' } : undefined,
          },
        ]}
        title="팀 KPI"
        description="분기별 KPI 항목과 팀원별 활동 현황을 확인합니다. 리더는 실적 입력과 유닛 점수를 관리할 수 있어요."
      />

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
        {perm.isAdmin && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, color: 'var(--w-text-muted)' }}>팀</span>
            <select value={team} onChange={(e) => setTeam(e.target.value)} style={{ fontSize: 12 }}>
              {TEAMS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, color: 'var(--w-text-muted)' }}>분기</span>
          <select value={quarter} onChange={(e) => setQuarter(e.target.value)} style={{ fontSize: 12 }}>
            {quarters.map((q) => <option key={q} value={q}>{q}</option>)}
          </select>
        </div>
        <FilterBar
          label="유닛"
          value={unit}
          onChange={setUnit}
          options={[{ value: null, label: '전체' }, ...UNITS.map((u) => ({ value: u as Unit, label: u }))]}
        />
      </div>

      {loading ? (
        <div className="w-card" style={{ padding: 40, textAlign: 'center', color: 'var(--w-text-muted)' }}>
          불러오는 중...
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 16 }}>
          {/* KPI 항목 */}
          <div className="w-card" style={{ padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Target size={14} color="var(--w-accent-hover)" />
              <div style={{ fontSize: 13, fontWeight: 700 }}>KPI 항목 ({filteredItems.length})</div>
            </div>
            {filteredItems.length === 0 ? (
              <EmptyState
                icon={Target}
                title="등록된 KPI 항목이 없어요"
                description={perm.isLeader ? '리더/관리자가 평가 항목에서 추가할 수 있습니다.' : undefined}
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {filteredItems.map((k) => (
                  <div
                    key={k.id}
                    style={{
                      padding: 12,
                      background: 'var(--w-surface-2)',
                      borderRadius: 'var(--w-radius-sm)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                    }}
                  >
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <span className="w-badge w-badge-muted">{k.unit}</span>
                      <span className="w-badge w-badge-accent">{k.quarter}</span>
                      <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--w-text-muted)' }}>
                        최대 {k.max_score}점
                      </span>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--w-text)' }}>{k.title}</div>
                    {k.description && (
                      <div style={{ fontSize: 12, color: 'var(--w-text-soft)' }}>{k.description}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 팀원 활동 현황 — 팀원은 본인 행만, 리더/관리자는 전체 + 점수 입력 펼침 */}
          <div className="w-card" style={{ padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>
                팀원 활동 현황 ({quarter})
                {!perm.isLeader && (
                  <span className="w-badge w-badge-muted" style={{ marginLeft: 6, fontSize: 10 }}>
                    본인만 표시
                  </span>
                )}
              </div>
              {perm.isLeader && (
                <span style={{ fontSize: 10.5, color: 'var(--w-text-muted)' }}>행 클릭 시 점수 입력</span>
              )}
            </div>
            {visibleMembers.length === 0 ? (
              <EmptyState title="팀원 정보가 없어요" />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {visibleMembers.map((m) => {
                  const scores = memberUnitScores.find((s) => s.userId === m.userId)?.unitScores ?? {};
                  const isExpanded = expandedUserId === m.userId;
                  const canEdit = perm.isLeader; // 팀원은 보기만, 리더/관리자만 점수 입력
                  return (
                    <div
                      key={m.userId}
                      style={{
                        background: 'var(--w-surface-2)',
                        borderRadius: 'var(--w-radius-sm)',
                        overflow: 'hidden',
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => canEdit && setExpandedUserId(isExpanded ? null : m.userId)}
                        disabled={!canEdit}
                        style={{
                          width: '100%',
                          padding: 12,
                          background: 'transparent',
                          border: 0,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 6,
                          textAlign: 'left',
                          cursor: canEdit ? 'pointer' : 'default',
                          fontFamily: 'inherit',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {canEdit && (isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />)}
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--w-text)' }}>
                            {m.name}
                            {m.unit && (
                              <span className="w-badge w-badge-muted" style={{ marginLeft: 6 }}>
                                {m.unit}
                              </span>
                            )}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 11, color: 'var(--w-text-muted)', paddingLeft: canEdit ? 20 : 0 }}>
                          <span>바라는점 {m.vocCount}</span>
                          <span>아이디어 {m.ideaCount}</span>
                          <span>이벤트 {m.eventJoinCount}</span>
                          <span>교류 {m.exchangeJoinCount}</span>
                        </div>
                        {Object.keys(scores).length > 0 && (
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 2, paddingLeft: canEdit ? 20 : 0 }}>
                            {Object.entries(scores).map(([u, s]) => (
                              <span key={u} className="w-badge w-badge-info">
                                {u} {s}점
                              </span>
                            ))}
                          </div>
                        )}
                      </button>

                      {canEdit && isExpanded && (
                        <ScoreInputPanel
                          userId={m.userId}
                          userName={m.name}
                          quarter={quarter}
                          items={filteredItems}
                          records={kpiRecords}
                          onSave={handleScoreSave}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

/**
 * 리더/관리자가 한 팀원의 KPI 점수를 분기 안 3개월에 걸쳐 입력하는 인라인 패널.
 * - 행: KPI 항목 (filtered)
 * - 열: 분기 3개월 (예: 2026-Q2 → 4월/5월/6월)
 * - 셀: number input + Enter/blur 저장 (upsertKpiRecord)
 */
function ScoreInputPanel({
  userId,
  userName,
  quarter,
  items,
  records,
  onSave,
}: {
  userId: string;
  userName: string;
  quarter: string;
  items: KpiItem[];
  records: KpiRecord[];
  onSave: (kpiItemId: string, userId: string, month: string, score: number, evidence?: string) => Promise<void>;
}) {
  const months = useMemo(() => quarterMonths(quarter), [quarter]);

  const recordOf = (kpiItemId: string, month: string): KpiRecord | undefined =>
    records.find((r) => r.kpi_item_id === kpiItemId && r.user_id === userId && r.month === month);

  if (items.length === 0) {
    return (
      <div style={{ padding: 14, fontSize: 11.5, color: 'var(--w-text-muted)', borderTop: '1px solid var(--w-border)' }}>
        이 유닛/분기에 등록된 KPI 항목이 없어요.
      </div>
    );
  }

  return (
    <div style={{ borderTop: '1px solid var(--w-border)', padding: 12, background: 'var(--w-surface)' }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--w-text-muted)', marginBottom: 8 }}>
        {userName} · {quarter} 점수 입력
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr>
              <th style={{ ...thStyle, textAlign: 'left' }}>KPI 항목</th>
              {months.map((m) => (
                <th key={m} style={thStyle}>
                  {m.slice(5)}월
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.id}>
                <td style={{ ...tdStyle, textAlign: 'left' }} title={it.description ?? ''}>
                  <div style={{ fontWeight: 600, color: 'var(--w-text)' }}>{it.title}</div>
                  <div style={{ fontSize: 10.5, color: 'var(--w-text-muted)' }}>
                    {it.unit} · 최대 {it.max_score}점
                  </div>
                </td>
                {months.map((m) => {
                  const rec = recordOf(it.id, m);
                  return (
                    <td key={m} style={tdStyle}>
                      <ScoreCell
                        max={it.max_score}
                        initial={rec?.score ?? null}
                        onCommit={(score) => onSave(it.id, userId, m, score, rec?.evidence ?? undefined)}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ScoreCell({
  max,
  initial,
  onCommit,
}: {
  max: number;
  initial: number | null;
  onCommit: (score: number) => Promise<void> | void;
}) {
  const [val, setVal] = useState<string>(initial == null ? '' : String(initial));
  const [saving, setSaving] = useState(false);
  const dirty = val.trim() !== (initial == null ? '' : String(initial));

  const commit = async () => {
    if (!dirty) return;
    const n = parseFloat(val);
    if (Number.isNaN(n) || n < 0 || n > max) {
      setVal(initial == null ? '' : String(initial));
      return;
    }
    setSaving(true);
    await onCommit(n);
    setSaving(false);
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
      <input
        type="number"
        min={0}
        max={max}
        step="0.1"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            (e.currentTarget as HTMLInputElement).blur();
          }
        }}
        disabled={saving}
        placeholder="—"
        style={{
          width: 60,
          padding: '4px 6px',
          fontSize: 12,
          textAlign: 'right',
          border: dirty ? '1px solid var(--w-accent)' : '1px solid var(--w-border)',
          borderRadius: 4,
          background: 'var(--w-surface)',
          color: 'var(--w-text)',
          fontFamily: 'inherit',
        }}
      />
      {dirty && !saving && <Save size={11} style={{ color: 'var(--w-accent)' }} />}
    </div>
  );
}

const thStyle: React.CSSProperties = {
  padding: '6px 8px',
  textAlign: 'center',
  fontSize: 10.5,
  fontWeight: 600,
  color: 'var(--w-text-muted)',
  background: 'var(--w-surface-2)',
  borderBottom: '1px solid var(--w-border)',
  whiteSpace: 'nowrap',
};

const tdStyle: React.CSSProperties = {
  padding: '6px 8px',
  textAlign: 'right',
  borderBottom: '1px solid var(--w-border)',
  verticalAlign: 'middle',
};

/** "2026-Q2" → ["2026-04", "2026-05", "2026-06"] */
function quarterMonths(quarter: string): string[] {
  const [y, qPart] = quarter.split('-Q');
  const year = Number(y);
  const q = Number(qPart);
  const start = (q - 1) * 3 + 1;
  return [start, start + 1, start + 2].map((m) => `${year}-${String(m).padStart(2, '0')}`);
}
