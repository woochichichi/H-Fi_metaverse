import { useCallback, useEffect, useState } from 'react';
import { Plus, Download, RefreshCw, ChevronRight, GaugeCircle, X } from 'lucide-react';
import PageHeader from '../ui/PageHeader';
import EmptyState from '../ui/EmptyState';
import Modal from '../ui/Modal';
import { useAuthStore } from '../../../stores/authStore';
import { useUiStore } from '../../../stores/uiStore';
import { usePermissions } from '../../../hooks/usePermissions';
import {
  useUserActivities,
  type TeamStat,
  type UserStat,
  type UserDetailActivity,
} from '../../../hooks/useUserActivities';
import { TEAMS } from '../../../lib/constants';
import { getDisplayName } from '../../../lib/utils';
import { supabase } from '../../../lib/supabase';
import type { Profile, CustomEvalItem } from '../../../types';

const PERIODS = [
  { id: 'month', label: '월별' },
  { id: 'quarter', label: '분기별' },
  { id: 'half', label: '반기별' },
] as const;

const BASE_COLS = [
  { key: 'voc_submit', label: 'VOC' },
  { key: 'idea_submit', label: '아이디어' },
  { key: 'notice_read', label: '공지읽음' },
  { key: 'event_join', label: '이벤트' },
] as const;

const TYPE_LABELS: Record<string, string> = {
  voc_submit: 'VOC',
  idea_submit: '아이디어',
  idea_vote: '투표',
  notice_read: '공지읽음',
  event_join: '이벤트',
  note_send: '쪽지',
  exchange_join: '인적교류',
};

// coral tone heat color
function heatColor(rate: number): string {
  if (rate === 0) return 'var(--w-surface-2)';
  if (rate < 0.5) return 'rgba(232, 114, 92, 0.12)';
  if (rate < 1) return 'rgba(232, 114, 92, 0.22)';
  if (rate < 2) return 'rgba(232, 114, 92, 0.38)';
  if (rate < 3) return 'rgba(232, 114, 92, 0.55)';
  return 'rgba(232, 114, 92, 0.75)';
}

export default function AdminEvalDashboardPage() {
  const { profile } = useAuthStore();
  const { addToast } = useUiStore();
  const perm = usePermissions();
  const {
    teamStats, userStats, userDetail, customEvalItems, loading,
    fetchTeamStats, fetchUserStats, fetchUserDetail, manualLogActivity,
  } = useUserActivities();

  const [period, setPeriod] = useState<'month' | 'quarter' | 'half'>('month');
  const [filterTeam, setFilterTeam] = useState(perm.isAdmin ? '' : profile?.team ?? '');
  const [detailUser, setDetailUser] = useState<{ id: string; name: string } | null>(null);
  const [showManualForm, setShowManualForm] = useState(false);

  const [manualUserId, setManualUserId] = useState('');
  const [manualType, setManualType] = useState<string>('event_join');
  const [manualCustomItemId, setManualCustomItemId] = useState('');
  const [manualMemo, setManualMemo] = useState('');
  const [allUsers, setAllUsers] = useState<Profile[]>([]);

  const reload = useCallback(() => {
    void fetchTeamStats(period, filterTeam || undefined);
    void fetchUserStats(period, filterTeam || undefined);
  }, [period, filterTeam, fetchTeamStats, fetchUserStats]);

  useEffect(() => { reload(); }, [reload]);

  useEffect(() => {
    if (showManualForm && allUsers.length === 0) {
      let q = supabase.from('profiles').select('*').order('name');
      if (!perm.isAdmin && profile?.team) q = q.eq('team', profile.team);
      void q.then(({ data }) => setAllUsers((data as Profile[]) ?? []));
    }
  }, [showManualForm, allUsers.length, perm.isAdmin, profile?.team]);

  if (!perm.canAccessEvalDashboard) {
    return (
      <div className="w-card" style={{ padding: 40, textAlign: 'center', color: 'var(--w-text-muted)' }}>
        접근 권한이 없습니다.
      </div>
    );
  }

  const selectedUser = allUsers.find((u) => u.id === manualUserId);
  const userCustomItems = customEvalItems.filter((ci) => selectedUser && ci.team === selectedUser.team);

  const handleManualLog = async () => {
    if (!manualUserId) { addToast('대상 유저를 선택하세요', 'error'); return; }
    const u = allUsers.find((x) => x.id === manualUserId);
    if (!u) return;
    if (manualType === 'custom' && !manualCustomItemId) {
      addToast('커스텀 항목을 선택하세요', 'error'); return;
    }
    const { error } = await manualLogActivity(
      manualUserId, u.team, manualType as never,
      manualMemo || undefined,
      manualType === 'custom' ? manualCustomItemId : undefined,
    );
    if (error) { addToast('기록 실패: ' + error, 'error'); return; }
    addToast('활동이 기록되었습니다', 'success');
    setShowManualForm(false);
    setManualUserId(''); setManualType('event_join'); setManualCustomItemId(''); setManualMemo('');
    reload();
  };

  const handleViewDetail = async (userId: string) => {
    const u = userStats.find((x) => x.userId === userId);
    if (!u) return;
    setDetailUser({ id: userId, name: u.name });
    await fetchUserDetail(userId, period);
  };

  const handleExportCsv = () => {
    if (userStats.length === 0) return;
    const allTeams = [...new Set(userStats.map((s) => s.team))];
    const relevant = customEvalItems.filter((ci) => allTeams.includes(ci.team));

    const headers = [
      '이름', '팀', 'VOC', '아이디어', '투표', '공지읽음', '이벤트', '쪽지', '인적교류',
      ...relevant.map((ci) => `${ci.name}(${ci.team})`),
      '총포인트',
    ];
    const rows = userStats.map((s) => [
      s.name, s.team,
      s.voc_submit, s.idea_submit, s.idea_vote, s.notice_read, s.event_join, s.note_send, s.exchange_join,
      ...relevant.map((ci) => (ci.team === s.team ? s.customCounts[ci.id] || 0 : '')),
      s.totalPoints.toFixed(1),
    ]);
    const periodLabel = period === 'month' ? '월별' : period === 'quarter' ? '분기별' : '반기별';
    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const csv = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `한울타리_평가_${periodLabel}_${dateStr}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <PageHeader
        crumbs={[
          { label: '한울타리' },
          { label: '관리' },
          {
            label: '평가 대시보드',
            badge: perm.isAdmin ? { text: '전체', tone: 'accent' } : { text: `내 팀 · ${profile?.team ?? ''}`, tone: 'info' },
          },
        ]}
        title="평가 대시보드"
        description="VOC·아이디어·공지 확인·이벤트 참여 등 구성원 활동이 자동 누적됩니다. 기간과 팀을 바꿔가며 확인하고 CSV로 내보낼 수 있어요."
        actions={
          <>
            <button className="w-btn w-btn-ghost" onClick={reload} disabled={loading}>
              <RefreshCw size={14} /><span>새로고침</span>
            </button>
            <button className="w-btn w-btn-ghost" onClick={handleExportCsv} disabled={userStats.length === 0}>
              <Download size={14} /><span>CSV 내보내기</span>
            </button>
            <button className="w-btn w-btn-primary" onClick={() => setShowManualForm(true)}>
              <Plus size={14} /><span>활동 수동 기록</span>
            </button>
          </>
        }
      />

      {/* 필터 */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', marginBottom: 14 }}>
        <div
          style={{
            display: 'inline-flex',
            borderRadius: 'var(--w-radius-sm)',
            border: '1px solid var(--w-border)',
            overflow: 'hidden',
            background: 'var(--w-surface)',
          }}
        >
          {PERIODS.map((p) => {
            const active = period === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id)}
                style={{
                  padding: '6px 14px',
                  fontSize: 12,
                  fontWeight: 600,
                  background: active ? 'var(--w-accent)' : 'transparent',
                  color: active ? '#fff' : 'var(--w-text-muted)',
                  cursor: 'pointer',
                }}
              >
                {p.label}
              </button>
            );
          })}
        </div>
        {perm.isAdmin ? (
          <select value={filterTeam} onChange={(e) => setFilterTeam(e.target.value)} style={{ fontSize: 12 }}>
            <option value="">전체 팀</option>
            {TEAMS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        ) : (
          <span className="w-badge w-badge-info">{profile?.team}</span>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-card" style={{ padding: 16 }}>
              <div
                style={{
                  height: 16,
                  width: '30%',
                  marginBottom: 10,
                  background: 'linear-gradient(90deg, var(--w-surface-2) 25%, var(--w-border) 50%, var(--w-surface-2) 75%)',
                  backgroundSize: '400% 100%',
                  animation: 'v2Shimmer 1.4s infinite linear',
                  borderRadius: 4,
                }}
              />
              <div
                style={{
                  height: 80,
                  background: 'linear-gradient(90deg, var(--w-surface-2) 25%, var(--w-border) 50%, var(--w-surface-2) 75%)',
                  backgroundSize: '400% 100%',
                  animation: 'v2Shimmer 1.4s infinite linear',
                  borderRadius: 6,
                }}
              />
            </div>
          ))}
        </div>
      ) : teamStats.length === 0 && userStats.length === 0 ? (
        <div className="w-card">
          <EmptyState icon={GaugeCircle} title="데이터가 없어요" description="조건에 해당하는 활동 기록이 없습니다." />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <TeamHeatmapV2 stats={teamStats} customItems={customEvalItems} />

          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--w-text)' }}>개인별 활동 요약</span>
              <span style={{ fontSize: 11, color: 'var(--w-text-muted)' }}>({userStats.length}명)</span>
            </div>
            {userStats.length === 0 ? (
              <div className="w-card" style={{ padding: 24, textAlign: 'center', color: 'var(--w-text-muted)', fontSize: 12 }}>
                데이터가 없습니다
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: 10,
                }}
              >
                {userStats.map((s) => (
                  <UserActivityCardV2
                    key={s.userId}
                    stat={s}
                    customItems={customEvalItems}
                    onViewDetail={() => void handleViewDetail(s.userId)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 수동 기록 모달 */}
      {showManualForm && (
        <Modal
          open
          onClose={() => setShowManualForm(false)}
          title="활동 수동 기록"
          width={560}
          footer={
            <>
              <button className="w-btn w-btn-ghost" onClick={() => setShowManualForm(false)}>취소</button>
              <button className="w-btn w-btn-primary" onClick={() => void handleManualLog()}>기록</button>
            </>
          }
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="대상 유저">
              <select
                value={manualUserId}
                onChange={(e) => { setManualUserId(e.target.value); setManualCustomItemId(''); }}
              >
                <option value="">선택</option>
                {allUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {getDisplayName(u, true)} ({u.team})
                  </option>
                ))}
              </select>
            </Field>
            <Field label="활동 타입">
              <select
                value={manualType}
                onChange={(e) => {
                  setManualType(e.target.value);
                  if (e.target.value !== 'custom') setManualCustomItemId('');
                }}
              >
                <option value="event_join">이벤트 참여</option>
                <option value="exchange_join">인적교류 참여</option>
                {userCustomItems.length > 0 && <option value="custom">커스텀 항목</option>}
              </select>
            </Field>
            {manualType === 'custom' && (
              <Field label="커스텀 항목">
                <select value={manualCustomItemId} onChange={(e) => setManualCustomItemId(e.target.value)}>
                  <option value="">선택</option>
                  {userCustomItems.map((ci) => (
                    <option key={ci.id} value={ci.id}>{ci.name} ({ci.points}pt)</option>
                  ))}
                </select>
              </Field>
            )}
            <Field label="메모 (선택)">
              <input value={manualMemo} onChange={(e) => setManualMemo(e.target.value)} placeholder="활동 내용" />
            </Field>
          </div>
        </Modal>
      )}

      {/* 상세 모달 */}
      {detailUser && (
        <Modal
          open
          onClose={() => setDetailUser(null)}
          title={`${detailUser.name} 활동 상세`}
          width={520}
          footer={<button className="w-btn w-btn-primary" onClick={() => setDetailUser(null)}>닫기</button>}
        >
          {userDetail.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', fontSize: 12, color: 'var(--w-text-muted)' }}>
              활동 내역이 없어요.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 400, overflowY: 'auto' }}>
              {userDetail.map((d) => (
                <div
                  key={d.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 12px',
                    background: 'var(--w-surface-2)',
                    borderRadius: 'var(--w-radius-sm)',
                  }}
                >
                  <div>
                    <span style={{ fontSize: 13, color: 'var(--w-text)' }}>
                      {d.activity_type === 'custom' && d.customItemName
                        ? d.customItemName
                        : TYPE_LABELS[d.activity_type] ?? d.activity_type}
                    </span>
                    <span style={{ marginLeft: 6, fontSize: 11, color: 'var(--w-accent-hover)', fontWeight: 600 }}>
                      +{d.points}pt
                    </span>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--w-text-muted)' }}>
                    {new Date(d.created_at).toLocaleDateString('ko-KR', {
                      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}
    </>
  );
}

function TeamHeatmapV2({ stats, customItems }: { stats: TeamStat[]; customItems: CustomEvalItem[] }) {
  if (stats.length === 0) return null;
  const singleTeam = stats.length === 1 ? stats[0].team : null;
  const teamCustomCols = singleTeam ? customItems.filter((ci) => ci.team === singleTeam) : [];

  return (
    <div className="w-card" style={{ overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--w-border)' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--w-text)' }}>팀별 참여율 히트맵</div>
        <div style={{ fontSize: 11, color: 'var(--w-text-muted)', marginTop: 2 }}>
          색이 진할수록 인당 활동이 활발해요.
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--w-border)', background: 'var(--w-surface-2)' }}>
              <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, color: 'var(--w-text-muted)', width: 120 }}>팀</th>
              {BASE_COLS.map((col) => (
                <th
                  key={col.key}
                  style={{ padding: '10px 12px', textAlign: 'center', fontSize: 11, color: 'var(--w-text-muted)' }}
                >
                  {col.label}
                </th>
              ))}
              {teamCustomCols.map((ci) => (
                <th
                  key={ci.id}
                  style={{ padding: '10px 12px', textAlign: 'center', fontSize: 11, color: 'var(--w-accent-hover)' }}
                >
                  {ci.name}
                </th>
              ))}
              <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: 11, color: 'var(--w-text-muted)' }}>총합</th>
            </tr>
          </thead>
          <tbody>
            {stats.map((s) => {
              const baseTotal = s.voc_submit + s.idea_submit + s.notice_read + s.event_join;
              const customTotal = teamCustomCols.reduce((sum, ci) => sum + (s.customCounts[ci.id] || 0), 0);
              const total = baseTotal + customTotal;
              return (
                <tr key={s.team} style={{ borderBottom: '1px solid var(--w-border)' }}>
                  <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--w-text)' }}>{s.team}</td>
                  {BASE_COLS.map((col) => {
                    const count = s[col.key as keyof TeamStat] as number;
                    const rate = s.memberCount > 0 ? count / s.memberCount : 0;
                    return (
                      <td key={col.key} style={{ padding: '8px 12px', textAlign: 'center' }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: 36,
                            width: 56,
                            margin: '0 auto',
                            background: heatColor(rate),
                            borderRadius: 8,
                            fontSize: 13,
                            fontWeight: 700,
                            color: 'var(--w-text)',
                          }}
                          title={`${count}건 (인당 ${rate.toFixed(1)})`}
                        >
                          {count}
                        </div>
                      </td>
                    );
                  })}
                  {teamCustomCols.map((ci) => {
                    const count = s.customCounts[ci.id] || 0;
                    const rate = s.memberCount > 0 ? count / s.memberCount : 0;
                    return (
                      <td key={ci.id} style={{ padding: '8px 12px', textAlign: 'center' }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: 36,
                            width: 56,
                            margin: '0 auto',
                            background: heatColor(rate),
                            borderRadius: 8,
                            fontSize: 13,
                            fontWeight: 700,
                            color: 'var(--w-text)',
                          }}
                          title={`${ci.name}: ${count}건 (인당 ${rate.toFixed(1)})`}
                        >
                          {count}
                        </div>
                      </td>
                    );
                  })}
                  <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                    <span style={{ fontWeight: 700, color: 'var(--w-accent-hover)' }}>{total}</span>
                    <span style={{ marginLeft: 4, fontSize: 10, color: 'var(--w-text-muted)' }}>
                      ({s.memberCount > 0 ? (total / s.memberCount).toFixed(1) : '0'}/인)
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '8px 16px',
          borderTop: '1px solid var(--w-border)',
          fontSize: 10,
          color: 'var(--w-text-muted)',
        }}
      >
        <span>낮음</span>
        {[0.1, 0.5, 1, 2, 3].map((v) => (
          <div key={v} style={{ height: 10, width: 22, borderRadius: 2, background: heatColor(v) }} />
        ))}
        <span>높음</span>
      </div>
    </div>
  );
}

function UserActivityCardV2({
  stat,
  customItems,
  onViewDetail,
}: {
  stat: UserStat;
  customItems: CustomEvalItem[];
  onViewDetail: () => void;
}) {
  const teamCustom = customItems.filter((ci) => ci.team === stat.team);
  const totalActivities =
    stat.voc_submit + stat.idea_submit + stat.idea_vote +
    stat.notice_read + stat.event_join + stat.note_send + stat.exchange_join +
    teamCustom.reduce((sum, ci) => sum + (stat.customCounts[ci.id] || 0), 0);

  const badges: { key: string; icon: string; label: string; count: number }[] = [
    { key: 'voc', icon: '📞', label: 'VOC', count: stat.voc_submit },
    { key: 'idea', icon: '💡', label: '아이디어', count: stat.idea_submit },
    { key: 'vote', icon: '👍', label: '투표', count: stat.idea_vote },
    { key: 'notice', icon: '📋', label: '공지읽음', count: stat.notice_read },
    { key: 'event', icon: '🎉', label: '이벤트', count: stat.event_join },
    { key: 'note', icon: '✉️', label: '쪽지', count: stat.note_send },
    { key: 'exchange', icon: '🤝', label: '교류', count: stat.exchange_join },
  ].filter((b) => b.count > 0);

  return (
    <div className="w-card" style={{ padding: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--w-text)' }}>{stat.name}</span>
          <span style={{ marginLeft: 6, fontSize: 11, color: 'var(--w-text-muted)' }}>({stat.team})</span>
        </div>
        <span className="w-badge w-badge-accent" style={{ fontSize: 11, padding: '2px 10px' }}>
          {stat.totalPoints.toFixed(1)}pt
        </span>
      </div>

      {totalActivities === 0 ? (
        <div style={{ fontSize: 11, color: 'var(--w-text-muted)' }}>활동 없음</div>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 10px', fontSize: 11, color: 'var(--w-text-soft)' }}>
          {badges.map((b) => (
            <span key={b.key}>
              {b.icon} {b.label} {b.count}
            </span>
          ))}
          {teamCustom.map((ci) => {
            const count = stat.customCounts[ci.id] || 0;
            if (count === 0) return null;
            return (
              <span key={ci.id} style={{ color: 'var(--w-accent-hover)' }}>
                🏷️ {ci.name} {count}
              </span>
            );
          })}
        </div>
      )}

      <button
        onClick={onViewDetail}
        style={{
          marginTop: 8,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 2,
          fontSize: 11,
          fontWeight: 700,
          color: 'var(--w-accent-hover)',
          background: 'transparent',
          padding: 0,
          cursor: 'pointer',
        }}
      >
        상세 보기 <ChevronRight size={12} />
      </button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--w-text-soft)' }}>{label}</span>
      {children}
    </label>
  );
}
