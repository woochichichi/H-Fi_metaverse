import { useEffect, useMemo, useState } from 'react';
import { Target } from 'lucide-react';
import PageHeader from '../ui/PageHeader';
import FilterBar from '../ui/FilterBar';
import EmptyState from '../ui/EmptyState';
import { useAuthStore } from '../../../stores/authStore';
import { usePermissions } from '../../../hooks/usePermissions';
import { useKpi } from '../../../hooks/useKpi';
import { UNITS, TEAMS } from '../../../lib/constants';
import type { Unit } from '../../../lib/constants';

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
  const { kpiItems, members, loading, fetchKpiItems, fetchMemberActivities, fetchMemberUnitScores, memberUnitScores } = useKpi();

  const [team, setTeam] = useState<string>(perm.isAdmin ? profile?.team ?? TEAMS[0] : profile?.team ?? '');
  const [unit, setUnit] = useState<Unit | null>(null);
  const [quarter, setQuarter] = useState(getCurrentQuarter());

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

  const quarters = useMemo(() => listQuarters(4), []);

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

          {/* 팀원 활동 현황 */}
          <div className="w-card" style={{ padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>
              팀원 활동 현황 ({quarter})
            </div>
            {members.length === 0 ? (
              <EmptyState title="팀원 정보가 없어요" />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {members.map((m) => {
                  const scores = memberUnitScores.find((s) => s.userId === m.userId)?.unitScores ?? {};
                  return (
                    <div
                      key={m.userId}
                      style={{
                        padding: 12,
                        background: 'var(--w-surface-2)',
                        borderRadius: 'var(--w-radius-sm)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 6,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--w-text)' }}>
                          {m.name}
                          {m.unit && (
                            <span className="w-badge w-badge-muted" style={{ marginLeft: 6 }}>
                              {m.unit}
                            </span>
                          )}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 11, color: 'var(--w-text-muted)' }}>
                        <span>바라는점 {m.vocCount}</span>
                        <span>아이디어 {m.ideaCount}</span>
                        <span>이벤트 {m.eventJoinCount}</span>
                        <span>교류 {m.exchangeJoinCount}</span>
                      </div>
                      {Object.keys(scores).length > 0 && (
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 2 }}>
                          {Object.entries(scores).map(([u, s]) => (
                            <span key={u} className="w-badge w-badge-info">
                              {u} {s}점
                            </span>
                          ))}
                        </div>
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
