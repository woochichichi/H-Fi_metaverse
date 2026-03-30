import { useState, useEffect, useCallback } from 'react';
import { Search, ChevronDown } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useUiStore } from '../../stores/uiStore';
import { TEAMS } from '../../lib/constants';
import type { Profile } from '../../types';

export default function UserManager() {
  const { addToast } = useUiStore();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterTeam, setFilterTeam] = useState('');
  const [confirmModal, setConfirmModal] = useState<{
    userId: string;
    field: 'role' | 'status';
    value: string;
    userName: string;
  } | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      console.error('사용자 조회 실패:', error.message);
    } else {
      setUsers(data ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filtered = users.filter((u) => {
    if (search && !u.name.includes(search) && !u.team.includes(search)) return false;
    if (filterTeam && u.team !== filterTeam) return false;
    return true;
  });

  const handleRoleChange = (userId: string, userName: string, newRole: string) => {
    setConfirmModal({ userId, field: 'role', value: newRole, userName });
  };

  const handleStatusToggle = (userId: string, userName: string, currentStatus: string) => {
    const newStatus = currentStatus === 'offline' ? 'online' : 'offline';
    setConfirmModal({ userId, field: 'status', value: newStatus, userName });
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

  const roleLabel = (role: string) => {
    if (role === 'admin') return '관리자';
    if (role === 'leader') return '리더';
    return '멤버';
  };

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-sm font-bold text-text-primary">사용자 관리</h3>

      {/* 필터 */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="이름 또는 팀 검색"
            className="w-full rounded-lg border border-white/[.1] bg-bg-primary py-2 pl-8 pr-3 text-xs text-text-primary placeholder:text-text-muted"
          />
        </div>
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
                <th className="px-3 py-2 text-center font-semibold text-text-muted">역할</th>
                <th className="px-3 py-2 text-left font-semibold text-text-muted">가입일</th>
                <th className="px-3 py-2 text-center font-semibold text-text-muted">상태</th>
                <th className="px-3 py-2 text-center font-semibold text-text-muted">액션</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-b border-white/[.04] transition-colors hover:bg-white/[.02]">
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="flex h-6 w-6 items-center justify-center rounded-full text-[10px]"
                        style={{ backgroundColor: u.avatar_color }}
                      >
                        {u.avatar_emoji}
                      </div>
                      <span className="text-text-primary">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-text-secondary">{u.team}</td>
                  <td className="px-3 py-2 text-center">
                    <div className="relative inline-block">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, u.name, e.target.value)}
                        className="appearance-none rounded-md border border-white/[.1] bg-bg-primary px-2 py-0.5 pr-5 text-[11px] text-text-primary"
                      >
                        <option value="member">멤버</option>
                        <option value="leader">리더</option>
                        <option value="admin">관리자</option>
                      </select>
                      <ChevronDown size={10} className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-text-muted" />
                    </div>
                  </td>
                  <td className="px-3 py-2 text-text-muted">
                    {new Date(u.created_at).toLocaleDateString('ko-KR')}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        u.status === 'online'
                          ? 'bg-success/20 text-success'
                          : u.status === '재택'
                            ? 'bg-info/20 text-info'
                            : 'bg-white/[.08] text-text-muted'
                      }`}
                    >
                      {u.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <button
                      onClick={() => handleStatusToggle(u.id, u.name, u.status)}
                      className={`rounded-md px-2 py-0.5 text-[10px] font-semibold transition-colors ${
                        u.status === 'offline'
                          ? 'bg-success/10 text-success hover:bg-success/20'
                          : 'bg-danger/10 text-danger hover:bg-danger/20'
                      }`}
                    >
                      {u.status === 'offline' ? '활성화' : '비활성화'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="text-[11px] text-text-muted">
        총 {filtered.length}명 {filterTeam && `(${filterTeam})`}
      </div>

      {/* 확인 모달 */}
      {confirmModal && (
        <>
          <div className="fixed inset-0 z-[300] bg-black/50" onClick={() => setConfirmModal(null)} />
          <div className="fixed left-1/2 top-1/2 z-[301] w-80 -translate-x-1/2 -translate-y-1/2 rounded-xl border border-white/[.08] bg-bg-secondary p-5 shadow-2xl">
            <h4 className="mb-3 text-sm font-bold text-text-primary">변경 확인</h4>
            <p className="mb-4 text-xs text-text-secondary">
              <strong>{confirmModal.userName}</strong>님의{' '}
              {confirmModal.field === 'role'
                ? `역할을 "${roleLabel(confirmModal.value)}"(으)로`
                : `상태를 "${confirmModal.value}"(으)로`}{' '}
              변경하시겠습니까?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmModal(null)}
                className="rounded-lg px-4 py-1.5 text-xs text-text-muted hover:bg-white/[.06]"
              >
                취소
              </button>
              <button
                onClick={confirmAction}
                className="rounded-lg bg-accent px-4 py-1.5 text-xs font-semibold text-white hover:bg-accent/80"
              >
                확인
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
