import { useEffect, useMemo, useState } from 'react';
import { Search, Users2 } from 'lucide-react';
import PageHeader from '../ui/PageHeader';
import FilterBar from '../ui/FilterBar';
import EmptyState from '../ui/EmptyState';
import { supabase } from '../../../lib/supabase';
import { usePermissions } from '../../../hooks/usePermissions';
import { TEAMS } from '../../../lib/constants';
import { getDisplayName } from '../../../lib/utils';
import type { Profile } from '../../../types';

export default function DirectoryPage() {
  const perm = usePermissions();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [team, setTeam] = useState<string | null>(null);
  const [q, setQ] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .neq('status', '퇴사')
        .order('team')
        .order('role')
        .order('name');
      if (!cancelled) {
        setProfiles((data as Profile[]) ?? []);
        setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return profiles.filter((p) => {
      if (team && p.team !== team) return false;
      if (!query) return true;
      return (
        p.name.toLowerCase().includes(query) ||
        (p.nickname ?? '').toLowerCase().includes(query) ||
        (p.team ?? '').toLowerCase().includes(query) ||
        (p.unit ?? '').toLowerCase().includes(query)
      );
    });
  }, [profiles, team, q]);

  // 팀별 그룹
  const grouped = useMemo(() => {
    const map = new Map<string, Profile[]>();
    filtered.forEach((p) => {
      const key = p.team ?? '미지정';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    });
    return Array.from(map.entries());
  }, [filtered]);

  return (
    <>
      <PageHeader
        crumbs={[{ label: '한울타리' }, { label: '피플' }]}
        title="피플 목록"
        description={`${filtered.length}명 · 팀·유닛별로 구성원을 확인해요.${perm.canSeeRealName ? ' (관리자 시점: 별명(실명) 함께 표시)' : ''}`}
      />

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 14 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 10px',
            background: 'var(--w-surface)',
            border: '1px solid var(--w-border)',
            borderRadius: 'var(--w-radius-sm)',
            minWidth: 260,
          }}
        >
          <Search size={14} color="var(--w-text-muted)" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="이름·별명·팀·유닛 검색"
            style={{
              border: 'none',
              padding: 0,
              flex: 1,
              fontSize: 13,
              background: 'transparent',
            }}
          />
        </div>
        <FilterBar
          label="팀"
          value={team}
          onChange={setTeam}
          options={[{ value: null, label: '전체' }, ...TEAMS.map((t) => ({ value: t as string, label: t }))]}
        />
      </div>

      {loading ? (
        <div className="w-card" style={{ padding: 40, textAlign: 'center', color: 'var(--w-text-muted)' }}>
          불러오는 중...
        </div>
      ) : filtered.length === 0 ? (
        <div className="w-card">
          <EmptyState icon={Users2} title="검색 결과가 없어요" />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {grouped.map(([teamName, list]) => (
            <div key={teamName} className="w-card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{teamName}</div>
                <span className="w-badge w-badge-muted">{list.length}명</span>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                  gap: 8,
                }}
              >
                {list.map((p) => <PersonRow key={p.id} profile={p} viewerIsAdmin={perm.canSeeRealName} />)}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function PersonRow({ profile, viewerIsAdmin }: { profile: Profile; viewerIsAdmin: boolean }) {
  const display = getDisplayName(profile, viewerIsAdmin);
  const roleLabel: Record<string, string> = {
    admin: '관리자',
    director: '담당',
    leader: '리더',
    member: '구성원',
  };
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: 10,
        background: 'var(--w-surface-2)',
        borderRadius: 'var(--w-radius-sm)',
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          background: profile.avatar_color || 'var(--w-accent-soft)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 15,
          flexShrink: 0,
        }}
      >
        {profile.mood_emoji || profile.avatar_emoji || '🙂'}
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--w-text)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {display}
        </div>
        <div style={{ fontSize: 11, color: 'var(--w-text-muted)', display: 'flex', gap: 4 }}>
          <span>{roleLabel[profile.role] ?? profile.role}</span>
          {profile.unit && <><span>·</span><span>{profile.unit}</span></>}
          {profile.status === '재택' && <><span>·</span><span style={{ color: 'var(--w-info)' }}>재택</span></>}
        </div>
      </div>
    </div>
  );
}
