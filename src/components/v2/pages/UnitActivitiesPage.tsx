import { useEffect, useState } from 'react';
import { Building2 } from 'lucide-react';
import PageHeader from '../ui/PageHeader';
import FilterBar from '../ui/FilterBar';
import EmptyState from '../ui/EmptyState';
import { useAuthStore } from '../../../stores/authStore';
import { usePermissions } from '../../../hooks/usePermissions';
import { useUnitActivities } from '../../../hooks/useUnitActivities';
import { TEAMS } from '../../../lib/constants';
import { formatDate } from '../../../lib/utils';

const STATUS_TONE: Record<string, string> = {
  진행중: 'w-badge w-badge-accent',
  계획: 'w-badge w-badge-info',
  보류: 'w-badge w-badge-todo',
  완료: 'w-badge w-badge-muted',
};

export default function UnitActivitiesPage() {
  const { user, profile } = useAuthStore();
  const perm = usePermissions();
  const { activities, loading, fetchActivities } = useUnitActivities();
  const [team, setTeam] = useState<string>(profile?.team ?? TEAMS[0]);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  useEffect(() => {
    if (!team) return;
    void fetchActivities(team, user?.id);
  }, [team, user?.id, fetchActivities]);

  const filtered = statusFilter ? activities.filter((a) => a.status === statusFilter) : activities;

  return (
    <>
      <PageHeader
        crumbs={[
          { label: '한울타리' },
          {
            label: '조직 활동',
            badge: { text: '읽기 전용', tone: 'muted' },
          },
        ]}
        title="조직 활동"
        description="팀·유닛 단위 진행 활동 요약입니다. 편집은 v1 클래식에서 가능합니다."
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
        <FilterBar
          label="상태"
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { value: null, label: '전체' },
            { value: '진행중', label: '진행중' },
            { value: '계획', label: '계획' },
            { value: '보류', label: '보류' },
            { value: '완료', label: '완료' },
          ]}
        />
      </div>

      {loading ? (
        <div className="w-card" style={{ padding: 40, textAlign: 'center', color: 'var(--w-text-muted)' }}>
          불러오는 중...
        </div>
      ) : filtered.length === 0 ? (
        <div className="w-card">
          <EmptyState icon={Building2} title="활동이 없어요" />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map((a) => (
            <div key={a.id} className="w-card" style={{ padding: 14 }}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}>
                <span className={STATUS_TONE[a.status] ?? 'w-badge w-badge-muted'}>{a.status}</span>
                {a.unit && <span className="w-badge w-badge-muted">{a.unit}</span>}
                {a.category && <span className="w-badge w-badge-info">{a.category}</span>}
                <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--w-text-muted)' }}>
                  {formatDate(a.created_at)}
                </span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--w-text)' }}>{a.title}</div>
              {a.description && (
                <div style={{ fontSize: 12, color: 'var(--w-text-soft)', marginTop: 4, whiteSpace: 'pre-wrap' }}>
                  {a.description}
                </div>
              )}
              <div style={{ display: 'flex', gap: 10, marginTop: 8, fontSize: 11, color: 'var(--w-text-muted)' }}>
                <span>♡ {a.reaction_count}</span>
                <span>💬 {a.comment_count}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
