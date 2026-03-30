import { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import TeamHeatmap from './TeamHeatmap';
import UserActivityCard, { UserDetailModal } from './UserActivityCard';
import ExportCsv from './ExportCsv';
import { useUserActivities } from '../../hooks/useUserActivities';
import { useAuthStore } from '../../stores/authStore';
import { useUiStore } from '../../stores/uiStore';
import { TEAMS } from '../../lib/constants';
import { supabase } from '../../lib/supabase';
import type { Profile } from '../../types';

const PERIODS = [
  { id: 'month', label: '월별' },
  { id: 'quarter', label: '분기별' },
  { id: 'half', label: '반기별' },
] as const;

export default function EvalDashboard() {
  const { profile } = useAuthStore();
  const { addToast } = useUiStore();
  const {
    teamStats, userStats, userDetail, loading,
    fetchTeamStats, fetchUserStats, fetchUserDetail, manualLogActivity,
  } = useUserActivities();

  const [period, setPeriod] = useState('month');
  const [filterTeam, setFilterTeam] = useState('');
  const [detailUser, setDetailUser] = useState<{ id: string; name: string } | null>(null);
  const [showManualForm, setShowManualForm] = useState(false);

  // 수동 기록 폼
  const [manualUserId, setManualUserId] = useState('');
  const [manualType, setManualType] = useState<'event_join' | 'exchange_join'>('event_join');
  const [manualMemo, setManualMemo] = useState('');
  const [allUsers, setAllUsers] = useState<Profile[]>([]);

  useEffect(() => {
    fetchTeamStats(period, filterTeam || undefined);
    fetchUserStats(period, filterTeam || undefined);
  }, [period, filterTeam, fetchTeamStats, fetchUserStats]);

  // 사용자 목록 (수동 기록용)
  useEffect(() => {
    if (showManualForm && allUsers.length === 0) {
      supabase
        .from('profiles')
        .select('*')
        .order('name')
        .then(({ data }) => setAllUsers(data ?? []));
    }
  }, [showManualForm, allUsers.length]);

  const handleViewDetail = async (userId: string) => {
    const user = userStats.find((u) => u.userId === userId);
    if (!user) return;
    setDetailUser({ id: userId, name: user.name });
    await fetchUserDetail(userId, period);
  };

  const handleManualLog = async () => {
    if (!manualUserId) {
      addToast('대상 유저를 선택하세요', 'error');
      return;
    }
    const user = allUsers.find((u) => u.id === manualUserId);
    if (!user) return;

    const { error } = await manualLogActivity(
      manualUserId,
      user.team,
      manualType,
      manualMemo || undefined
    );
    if (error) {
      addToast('기록 실패: ' + error, 'error');
    } else {
      addToast('활동이 기록되었습니다', 'success');
      setShowManualForm(false);
      setManualUserId('');
      setManualMemo('');
      fetchTeamStats(period, filterTeam || undefined);
      fetchUserStats(period, filterTeam || undefined);
    }
  };

  const canAccess = profile?.role === 'admin' || profile?.role === 'leader';
  if (!canAccess) {
    return (
      <div className="py-8 text-center text-sm text-text-muted">
        접근 권한이 없습니다 (관리자 또는 리더만 접근 가능)
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* 상단 필터 */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex gap-2">
          {/* 기간 필터 */}
          <div className="flex rounded-lg border border-white/[.08] overflow-hidden">
            {PERIODS.map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id)}
                className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
                  period === p.id
                    ? 'bg-accent text-white'
                    : 'text-text-muted hover:bg-white/[.06]'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* 팀 필터 */}
          <select
            value={filterTeam}
            onChange={(e) => setFilterTeam(e.target.value)}
            className="rounded-lg border border-white/[.1] bg-bg-primary px-3 py-1.5 text-xs text-text-primary"
          >
            <option value="">전체 팀</option>
            {TEAMS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          {/* 수동 기록 버튼 */}
          <button
            onClick={() => setShowManualForm(!showManualForm)}
            className="flex items-center gap-1 rounded-lg border border-white/[.08] px-3 py-1.5 text-xs font-semibold text-text-secondary transition-colors hover:bg-white/[.06]"
          >
            <Plus size={12} /> 활동 수동 기록
          </button>

          {/* CSV 내보내기 */}
          <ExportCsv stats={userStats} period={period} />
        </div>
      </div>

      {/* 수동 기록 폼 */}
      {showManualForm && (
        <div className="rounded-xl border border-white/[.08] bg-white/[.03] p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-text-primary">활동 수동 기록</h4>
            <button onClick={() => setShowManualForm(false)} className="text-text-muted hover:text-text-primary">
              <X size={14} />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1 block text-[11px] text-text-muted">대상 유저</label>
              <select
                value={manualUserId}
                onChange={(e) => setManualUserId(e.target.value)}
                className="w-full rounded-lg border border-white/[.1] bg-bg-primary px-3 py-2 text-xs text-text-primary"
              >
                <option value="">선택</option>
                {allUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.team})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-text-muted">활동 타입</label>
              <select
                value={manualType}
                onChange={(e) => setManualType(e.target.value as 'event_join' | 'exchange_join')}
                className="w-full rounded-lg border border-white/[.1] bg-bg-primary px-3 py-2 text-xs text-text-primary"
              >
                <option value="event_join">이벤트 참여</option>
                <option value="exchange_join">인적교류 참여</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-text-muted">메모 (선택)</label>
              <input
                value={manualMemo}
                onChange={(e) => setManualMemo(e.target.value)}
                placeholder="활동 내용"
                className="w-full rounded-lg border border-white/[.1] bg-bg-primary px-3 py-2 text-xs text-text-primary placeholder:text-text-muted"
              />
            </div>
          </div>
          <div className="mt-3 flex justify-end">
            <button
              onClick={handleManualLog}
              className="rounded-lg bg-accent px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-accent/80"
            >
              기록
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="py-8 text-center text-sm text-text-muted">데이터 로딩 중...</div>
      ) : (
        <>
          {/* 팀별 히트맵 */}
          <TeamHeatmap stats={teamStats} />

          {/* 개인별 활동 */}
          <div>
            <h4 className="mb-3 text-xs font-bold text-text-primary">
              개인별 활동 요약
              <span className="ml-2 text-text-muted font-normal">({userStats.length}명)</span>
            </h4>
            {userStats.length === 0 ? (
              <div className="py-6 text-center text-xs text-text-muted">데이터가 없습니다</div>
            ) : (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {userStats.map((s) => (
                  <UserActivityCard
                    key={s.userId}
                    stat={s}
                    onViewDetail={handleViewDetail}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* 상세 모달 */}
      {detailUser && (
        <UserDetailModal
          userName={detailUser.name}
          details={userDetail}
          onClose={() => setDetailUser(null)}
        />
      )}
    </div>
  );
}
