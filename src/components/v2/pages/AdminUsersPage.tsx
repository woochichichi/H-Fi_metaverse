import { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, UserX, ChevronDown } from 'lucide-react';
import PageHeader from '../ui/PageHeader';
import DataTable, { type Column } from '../ui/DataTable';
import ConfirmDialog from '../ui/ConfirmDialog';
import { supabase } from '../../../lib/supabase';
import { useUiStore } from '../../../stores/uiStore';
import { useAuthStore } from '../../../stores/authStore';
import { usePermissions } from '../../../hooks/usePermissions';
import { TEAMS } from '../../../lib/constants';
import { formatDate, getDisplayName } from '../../../lib/utils';
import type { Profile } from '../../../types';

const ROLE_LABEL: Record<string, string> = {
  admin: '관리자',
  director: '금융담당',
  leader: '리더',
  member: '멤버',
};

const STATUS_CLASS: Record<string, string> = {
  '퇴사': 'w-badge',
  online: 'w-badge',
  offline: 'w-badge w-badge-muted',
  재택: 'w-badge w-badge-info',
};

function statusStyle(status: string): React.CSSProperties {
  if (status === '퇴사') return { background: 'var(--w-urgency-critical-soft)', color: 'var(--w-danger)' };
  if (status === 'online') return { background: 'var(--w-success-soft)', color: 'var(--w-success)' };
  if (status === '재택') return { background: 'var(--w-urgency-info-soft)', color: 'var(--w-info)' };
  return { background: 'var(--w-surface-2)', color: 'var(--w-text-muted)' };
}

export default function AdminUsersPage() {
  const { addToast } = useUiStore();
  const { profile: myProfile } = useAuthStore();
  const perm = usePermissions();

  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterTeam, setFilterTeam] = useState(perm.isLeaderOnly ? myProfile?.team ?? '' : '');

  const [confirmModal, setConfirmModal] = useState<{
    userId: string;
    field: 'role' | 'status';
    value: string;
    userName: string;
  } | null>(null);

  const [resignModal, setResignModal] = useState<{
    userId: string;
    userName: string;
    isResigned: boolean;
  } | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (perm.isLeaderOnly && myProfile?.team) {
        query = query.eq('team', myProfile.team);
      }
      const { data, error } = await query;
      if (error) addToast('사용자 조회 실패: ' + error.message, 'error');
      else setUsers((data as Profile[]) ?? []);
    } catch {
      addToast('서버 연결 실패 — 잠시 후 다시 시도해 주세요', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast, perm.isLeaderOnly, myProfile?.team]);

  useEffect(() => {
    if (perm.canManageUsers) void fetchUsers();
  }, [fetchUsers, perm.canManageUsers]);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      if (filterTeam && u.team !== filterTeam) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        u.name.toLowerCase().includes(q) ||
        (u.nickname ?? '').toLowerCase().includes(q) ||
        (u.team ?? '').toLowerCase().includes(q)
      );
    });
  }, [users, filterTeam, search]);

  if (!perm.canManageUsers) {
    return (
      <div className="w-card" style={{ padding: 40, textAlign: 'center', color: 'var(--w-text-muted)' }}>
        접근 권한이 없습니다.
      </div>
    );
  }

  const columns: Column<Profile>[] = [
    {
      key: 'name',
      header: '이름',
      render: (u) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              background: u.avatar_color || 'var(--w-accent-soft)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              flexShrink: 0,
            }}
          >
            {u.avatar_emoji || '🙂'}
          </div>
          <span style={{ fontWeight: 600 }}>{getDisplayName(u, true)}</span>
          {u.id === myProfile?.id && (
            <span className="w-badge w-badge-muted" style={{ fontSize: 10 }}>본인</span>
          )}
        </div>
      ),
    },
    { key: 'team', header: '팀', render: (u) => <span style={{ color: 'var(--w-text-soft)' }}>{u.team}</span> },
    {
      key: 'role',
      header: '역할',
      align: 'center',
      render: (u) =>
        perm.isAdmin ? (
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <select
              value={u.role}
              onChange={(e) => {
                setConfirmModal({
                  userId: u.id,
                  field: 'role',
                  value: e.target.value,
                  userName: getDisplayName(u, true),
                });
              }}
              disabled={u.status === '퇴사'}
              style={{ fontSize: 11, padding: '3px 22px 3px 8px', opacity: u.status === '퇴사' ? 0.5 : 1 }}
            >
              <option value="member">멤버</option>
              <option value="leader">리더</option>
              <option value="director">금융담당</option>
              <option value="admin">관리자</option>
            </select>
            <ChevronDown
              size={11}
              style={{
                position: 'absolute',
                right: 6,
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
                color: 'var(--w-text-muted)',
              }}
            />
          </div>
        ) : (
          <span style={{ color: 'var(--w-text-soft)' }}>{ROLE_LABEL[u.role] ?? u.role}</span>
        ),
    },
    { key: 'created_at', header: '가입일', render: (u) => <span style={{ color: 'var(--w-text-muted)', fontSize: 11 }}>{formatDate(u.created_at)}</span> },
    {
      key: 'status',
      header: '상태',
      align: 'center',
      render: (u) => <span className={STATUS_CLASS[u.status] ?? 'w-badge w-badge-muted'} style={statusStyle(u.status)}>{u.status}</span>,
    },
    {
      key: 'actions',
      header: '액션',
      align: 'center',
      render: (u) => {
        const isSelf = u.id === myProfile?.id;
        const canResign = !isSelf && (perm.isAdmin || (perm.isLeaderOnly && u.role === 'member'));
        return (
          <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
            {perm.isAdmin && u.status !== '퇴사' && (
              <button
                onClick={() =>
                  setConfirmModal({
                    userId: u.id,
                    field: 'status',
                    value: u.status === 'offline' ? 'online' : 'offline',
                    userName: getDisplayName(u, true),
                  })
                }
                className="w-btn"
                style={{
                  padding: '3px 8px',
                  fontSize: 11,
                  background: u.status === 'offline' ? 'var(--w-success-soft)' : 'var(--w-urgency-critical-soft)',
                  color: u.status === 'offline' ? 'var(--w-success)' : 'var(--w-danger)',
                }}
              >
                {u.status === 'offline' ? '활성화' : '비활성화'}
              </button>
            )}
            {canResign && (
              <button
                onClick={() => setResignModal({ userId: u.id, userName: getDisplayName(u, true), isResigned: u.status === '퇴사' })}
                className="w-btn"
                style={{
                  padding: '3px 8px',
                  fontSize: 11,
                  background: u.status === '퇴사' ? 'var(--w-success-soft)' : 'var(--w-urgency-critical-soft)',
                  color: u.status === '퇴사' ? 'var(--w-success)' : 'var(--w-danger)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 3,
                }}
              >
                <UserX size={11} />
                {u.status === '퇴사' ? '복원' : '퇴사'}
              </button>
            )}
          </div>
        );
      },
    },
  ];

  const confirmAction = async () => {
    if (!confirmModal) return;
    const { userId, field, value } = confirmModal;
    const { data, error } = await supabase
      .from('profiles')
      .update({ [field]: value })
      .eq('id', userId)
      .select('id');

    if (error) addToast('변경 실패: ' + error.message, 'error');
    else if (!data || data.length === 0) addToast('변경 권한이 없습니다', 'error');
    else {
      addToast('변경되었습니다', 'success');
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, [field]: value } as Profile : u)));
    }
    setConfirmModal(null);
  };

  const confirmResign = async () => {
    if (!resignModal) return;
    const { userId, isResigned } = resignModal;
    const newStatus = isResigned ? 'offline' : '퇴사';
    const { data, error } = await supabase
      .from('profiles')
      .update({ status: newStatus })
      .eq('id', userId)
      .select('id');

    if (error) addToast('처리 실패: ' + error.message, 'error');
    else if (!data || data.length === 0) addToast('변경 권한이 없습니다', 'error');
    else {
      addToast(isResigned ? '퇴사 처리가 복원되었습니다' : '퇴사 처리되었습니다', 'success');
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, status: newStatus as Profile['status'] } : u)));
    }
    setResignModal(null);
  };

  return (
    <>
      <PageHeader
        crumbs={[
          { label: '한울타리' },
          { label: '관리' },
          {
            label: '사용자 관리',
            badge: perm.isLeaderOnly
              ? { text: `내 팀 · ${myProfile?.team ?? ''}`, tone: 'info' }
              : { text: '전체', tone: 'accent' },
          },
        ]}
        title="사용자 관리"
        description="구성원 역할·상태를 조회하고 변경해요. 리더는 내 팀 구성원만 볼 수 있어요."
      />

      {/* 필터 */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 14 }}>
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
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="별명·이름·팀 검색"
            style={{ border: 'none', padding: 0, flex: 1, fontSize: 13, background: 'transparent' }}
          />
        </div>
        {perm.isAdmin && (
          <select
            value={filterTeam}
            onChange={(e) => setFilterTeam(e.target.value)}
            style={{ fontSize: 12 }}
          >
            <option value="">전체 팀</option>
            {TEAMS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        )}
        <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--w-text-muted)' }}>
          총 {filtered.length}명 {filterTeam && `(${filterTeam})`}
        </span>
      </div>

      <div className="w-card" style={{ overflow: 'hidden' }}>
        <DataTable<Profile>
          columns={columns}
          rows={filtered}
          rowKey={(u) => u.id}
          loading={loading}
          empty="사용자가 없습니다"
        />
      </div>

      {confirmModal && (
        <ConfirmDialog
          open
          title={confirmModal.field === 'role' ? '역할 변경' : '상태 변경'}
          message={`${confirmModal.userName}님의 ${confirmModal.field === 'role' ? '역할' : '상태'}을 "${
            confirmModal.field === 'role' ? ROLE_LABEL[confirmModal.value] ?? confirmModal.value : confirmModal.value
          }"(으)로 변경할까요?`}
          onConfirm={confirmAction}
          onCancel={() => setConfirmModal(null)}
        />
      )}

      {resignModal && (
        <ConfirmDialog
          open
          title={resignModal.isResigned ? '퇴사 복원' : '퇴사 처리'}
          message={
            resignModal.isResigned
              ? `${resignModal.userName}님의 퇴사 처리를 복원할까요? (offline 상태로 돌아갑니다)`
              : `${resignModal.userName}님을 퇴사 처리할까요?\n\n· 로그인 차단\n· 목록에서 흐려짐\n· 기존 데이터는 유지됨`
          }
          confirmLabel={resignModal.isResigned ? '복원' : '퇴사 처리'}
          danger={!resignModal.isResigned}
          onConfirm={confirmResign}
          onCancel={() => setResignModal(null)}
        />
      )}
    </>
  );
}
