import { useState, useEffect, useCallback } from 'react';
import { Search } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useUiStore } from '../../stores/uiStore';
import { useAuthStore } from '../../stores/authStore';
import { TEAMS } from '../../lib/constants';
import { getDisplayName } from '../../lib/utils';
import ConfirmChangeModal from './ConfirmChangeModal';
import ResignModal from './ResignModal';
import UserRow from './UserRow';
import type { Profile } from '../../types';

export default function UserManager() {
  const { addToast } = useUiStore();
  const { profile: myProfile } = useAuthStore();
  const isAdmin = myProfile?.role === 'admin' || myProfile?.role === 'director';
  const isLeader = myProfile?.role === 'leader';

  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterTeam, setFilterTeam] = useState(isLeader ? myProfile?.team || '' : '');
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
      let query = supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      // 리더는 자기 팀만 조회
      if (isLeader && myProfile?.team) {
        query = query.eq('team', myProfile.team);
      }

      const { data, error } = await query;
      if (error) {
        addToast('사용자 조회 실패: ' + error.message, 'error');
      } else {
        setUsers(data ?? []);
      }
    } catch (err) {
      addToast('서버 연결 실패 — 잠시 후 다시 시도해 주세요', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast, isLeader, myProfile?.team]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filtered = users.filter((u) => {
    const display = getDisplayName(u, true);
    if (search && !display.includes(search) && !u.name.includes(search) && !u.team.includes(search)) return false;
    if (filterTeam && u.team !== filterTeam) return false;
    return true;
  });

  const handleRoleChange = (userId: string, user: Profile, newRole: string) => {
    setConfirmModal({ userId, field: 'role', value: newRole, userName: getDisplayName(user, true) });
  };

  const handleStatusToggle = (userId: string, user: Profile) => {
    const newStatus = user.status === 'offline' ? 'online' : 'offline';
    setConfirmModal({ userId, field: 'status', value: newStatus, userName: getDisplayName(user, true) });
  };

  const handleResign = (userId: string, user: Profile) => {
    const isResigned = user.status === '퇴사';
    setResignModal({ userId, userName: getDisplayName(user, true), isResigned });
  };

  const confirmAction = async () => {
    if (!confirmModal) return;
    const { userId, field, value } = confirmModal;

    const { error } = await supabase
      .from('profiles')
      .update({ [field]: value })
      .eq('id', userId);

    if (error) {
      addToast('변경 실패: ' + error.message, 'error');
    } else {
      addToast('변경되었습니다', 'success');
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, [field]: value } : u))
      );
    }
    setConfirmModal(null);
  };

  const confirmResign = async () => {
    if (!resignModal) return;
    const { userId, isResigned } = resignModal;
    const newStatus = isResigned ? 'offline' : '퇴사';

    const { error } = await supabase
      .from('profiles')
      .update({ status: newStatus })
      .eq('id', userId);

    if (error) {
      addToast('처리 실패: ' + error.message, 'error');
    } else {
      addToast(isResigned ? '퇴사 처리가 복원되었습니다' : '퇴사 처리되었습니다', 'success');
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, status: newStatus as Profile['status'] } : u))
      );
    }
    setResignModal(null);
  };

  const roleLabel = (role: string) => {
    if (role === 'admin') return '관리자';
    if (role === 'director') return '금융담당';
    if (role === 'leader') return '리더';
    return '멤버';
  };

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-sm font-bold text-text-primary">
        사용자 관리 {isLeader && myProfile?.team && <span className="font-normal text-text-muted">({myProfile.team})</span>}
      </h3>

      {/* 필터 */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="별명, 이름 또는 팀 검색"
            className="w-full rounded-lg border border-white/[.1] bg-bg-primary py-2 pl-8 pr-3 text-xs text-text-primary placeholder:text-text-muted"
          />
        </div>
        {/* 리더는 팀 필터 고정 */}
        {isAdmin && (
          <select
            value={filterTeam}
            onChange={(e) => setFilterTeam(e.target.value)}
            className="rounded-lg border border-white/[.1] bg-bg-primary px-3 py-2 text-xs text-text-primary"
          >
            <option value="">전체 팀</option>
            {TEAMS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        )}
      </div>

      {/* 사용자 목록 */}
      {loading ? (
        <div className="py-8 text-center text-sm text-text-muted">로딩 중...</div>
      ) : filtered.length === 0 ? (
        <div className="py-8 text-center text-sm text-text-muted">사용자가 없습니다</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/[.06]">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/[.06] bg-white/[.03]">
                <th className="px-3 py-2 text-left font-semibold text-text-muted">이름</th>
                <th className="px-3 py-2 text-left font-semibold text-text-muted">팀</th>
                {isAdmin && <th className="px-3 py-2 text-center font-semibold text-text-muted">역할</th>}
                <th className="px-3 py-2 text-left font-semibold text-text-muted">가입일</th>
                <th className="px-3 py-2 text-center font-semibold text-text-muted">상태</th>
                <th className="px-3 py-2 text-center font-semibold text-text-muted">액션</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <UserRow
                  key={u.id}
                  user={u}
                  isAdmin={isAdmin}
                  isLeader={isLeader}
                  isSelf={u.id === myProfile?.id}
                  onRoleChange={handleRoleChange}
                  onStatusToggle={handleStatusToggle}
                  onResign={handleResign}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="text-[11px] text-text-muted">
        총 {filtered.length}명 {filterTeam && `(${filterTeam})`}
      </div>

      {/* 역할/상태 변경 확인 모달 */}
      {confirmModal && (
        <ConfirmChangeModal
          userName={confirmModal.userName}
          description={
            confirmModal.field === 'role'
              ? `역할을 "${roleLabel(confirmModal.value)}"(으)로`
              : `상태를 "${confirmModal.value}"(으)로`
          }
          onConfirm={confirmAction}
          onCancel={() => setConfirmModal(null)}
        />
      )}

      {/* 퇴사 처리 확인 모달 */}
      {resignModal && (
        <ResignModal
          userName={resignModal.userName}
          isResigned={resignModal.isResigned}
          onConfirm={confirmResign}
          onCancel={() => setResignModal(null)}
        />
      )}
    </div>
  );
}
