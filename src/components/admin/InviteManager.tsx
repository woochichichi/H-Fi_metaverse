import { useState, useEffect, useCallback } from 'react';
import { Plus, Copy, ToggleLeft, ToggleRight, RefreshCw, Trash2 } from 'lucide-react';
import ConfirmDialog from '../common/ConfirmDialog';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import { useUiStore } from '../../stores/uiStore';
import { TEAMS } from '../../lib/constants';
import type { InviteCode } from '../../types';

function generateCode(): string {
  return String(Math.floor(10000000 + Math.random() * 90000000));
}

export default function InviteManager() {
  const { user } = useAuthStore();
  const { addToast } = useUiStore();
  const [codes, setCodes] = useState<InviteCode[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; code: string } | null>(null);

  // 폼 상태
  const [formCode, setFormCode] = useState('');
  const [formTeam, setFormTeam] = useState<string>('');
  const [formRole, setFormRole] = useState<'member' | 'leader' | 'director'>('member');
  const [formMaxUses, setFormMaxUses] = useState(10);
  const [formExpires, setFormExpires] = useState('');

  const fetchCodes = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('invite_codes')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) {
        addToast('초대 코드 조회 실패: ' + error.message, 'error');
      } else {
        setCodes(data ?? []);
      }
    } catch (err) {
      addToast('서버 연결 실패 — 잠시 후 다시 시도해 주세요', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchCodes();
  }, [fetchCodes]);

  const handleCreate = async () => {
    const code = formCode.trim() || generateCode();
    const { error } = await supabase.from('invite_codes').insert({
      code,
      team: formTeam || null,
      role: formRole,
      max_uses: formMaxUses,
      expires_at: formExpires || null,
      active: true,
      created_by: user?.id ?? null,
    });
    if (error) {
      addToast('코드 생성 실패: ' + error.message, 'error');
      return;
    }
    addToast('초대 코드가 생성되었습니다', 'success');
    setShowForm(false);
    setFormCode('');
    setFormTeam('');
    setFormRole('member');
    setFormMaxUses(10);
    setFormExpires('');
    fetchCodes();
  };

  const toggleActive = async (id: string, currentActive: boolean) => {
    const { error } = await supabase
      .from('invite_codes')
      .update({ active: !currentActive })
      .eq('id', id);
    if (error) {
      addToast('상태 변경 실패', 'error');
      return;
    }
    setCodes((prev) => prev.map((c) => (c.id === id ? { ...c, active: !currentActive } : c)));
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    const { error } = await supabase
      .from('invite_codes')
      .delete()
      .eq('id', deleteTarget.id);
    if (error) {
      addToast('삭제 실패: ' + error.message, 'error');
    } else {
      setCodes((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      addToast('초대 코드가 삭제되었습니다', 'success');
    }
    setDeleteTarget(null);
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    addToast('📋 복사됨', 'success');
  };

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  return (
    <div className="flex flex-col gap-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-text-primary font-heading">초대 코드 관리</h3>
        <div className="flex gap-2">
          <button
            onClick={fetchCodes}
            className="flex items-center gap-1 rounded-lg border border-white/[.08] px-3 py-1.5 text-xs text-text-secondary transition-colors hover:bg-white/[.06]"
          >
            <RefreshCw size={12} /> 새로고침
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-accent/80"
          >
            <Plus size={12} /> 코드 생성
          </button>
        </div>
      </div>

      {/* 생성 폼 */}
      {showForm && (
        <div className="rounded-xl border border-white/[.08] bg-white/[.03] p-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="mb-1 block text-[11px] text-text-muted">코드 (비우면 자동 생성)</label>
              <input
                type="text"
                value={formCode}
                onChange={(e) => setFormCode(e.target.value)}
                placeholder="자동 생성 (8자리 숫자)"
                className="w-full rounded-lg border border-white/[.1] bg-bg-primary px-3 py-2 text-xs text-text-primary font-mono"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-text-muted">대상 팀</label>
              <select
                value={formTeam}
                onChange={(e) => setFormTeam(e.target.value)}
                className="w-full rounded-lg border border-white/[.1] bg-bg-primary px-3 py-2 text-xs text-text-primary"
              >
                <option value="">전체</option>
                {TEAMS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-text-muted">역할</label>
              <select
                value={formRole}
                onChange={(e) => setFormRole(e.target.value as 'member' | 'leader' | 'director')}
                className="w-full rounded-lg border border-white/[.1] bg-bg-primary px-3 py-2 text-xs text-text-primary"
              >
                <option value="member">member</option>
                <option value="leader">leader</option>
                <option value="director">director (금융담당)</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-text-muted">최대 사용 횟수</label>
              <input
                type="number"
                min={1}
                max={100}
                value={formMaxUses}
                onChange={(e) => setFormMaxUses(Number(e.target.value))}
                className="w-full rounded-lg border border-white/[.1] bg-bg-primary px-3 py-2 text-xs text-text-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-text-muted">만료일</label>
              <input
                type="date"
                value={formExpires}
                onChange={(e) => setFormExpires(e.target.value)}
                className="w-full rounded-lg border border-white/[.1] bg-bg-primary px-3 py-2 text-xs text-text-primary"
              />
            </div>
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <button
              onClick={() => setShowForm(false)}
              className="rounded-lg px-4 py-1.5 text-xs text-text-muted transition-colors hover:bg-white/[.06]"
            >
              취소
            </button>
            <button
              onClick={handleCreate}
              className="rounded-lg bg-accent px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-accent/80"
            >
              생성
            </button>
          </div>
        </div>
      )}

      {/* 코드 목록 */}
      {loading ? (
        <div className="py-8 text-center text-sm text-text-muted">로딩 중...</div>
      ) : codes.length === 0 ? (
        <div className="py-8 text-center text-sm text-text-muted">
          생성된 초대 코드가 없습니다
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/[.06]">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/[.06] bg-white/[.03]">
                <th className="px-3 py-2 text-left font-semibold text-text-muted">코드</th>
                <th className="px-3 py-2 text-left font-semibold text-text-muted">팀</th>
                <th className="px-3 py-2 text-left font-semibold text-text-muted">역할</th>
                <th className="px-3 py-2 text-center font-semibold text-text-muted">사용 현황</th>
                <th className="px-3 py-2 text-left font-semibold text-text-muted">만료일</th>
                <th className="px-3 py-2 text-center font-semibold text-text-muted">상태</th>
                <th className="px-3 py-2 text-center font-semibold text-text-muted">액션</th>
              </tr>
            </thead>
            <tbody>
              {codes.map((c) => {
                const expired = isExpired(c.expires_at);
                const full = c.used_count >= c.max_uses;
                return (
                  <tr key={c.id} className="border-b border-white/[.04] transition-colors hover:bg-white/[.02]">
                    <td className="px-3 py-2 font-mono text-text-primary">{c.code}</td>
                    <td className="px-3 py-2 text-text-secondary">{c.team || '전체'}</td>
                    <td className="px-3 py-2 text-text-secondary">{c.role}</td>
                    <td className="px-3 py-2 text-center">
                      <span className={full ? 'text-danger' : 'text-text-secondary'}>
                        {c.used_count}/{c.max_uses}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-text-secondary">
                      {c.expires_at
                        ? new Date(c.expires_at).toLocaleDateString('ko-KR')
                        : '무제한'}
                      {expired && <span className="ml-1 text-danger">(만료)</span>}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          c.active && !expired && !full
                            ? 'bg-success/20 text-success'
                            : 'bg-white/[.08] text-text-muted'
                        }`}
                      >
                        {c.active && !expired && !full ? '활성' : '비활성'}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => copyCode(c.code)}
                          className="rounded p-1 text-text-muted transition-colors hover:bg-white/[.08] hover:text-text-primary"
                          title="복사"
                        >
                          <Copy size={13} />
                        </button>
                        <button
                          onClick={() => toggleActive(c.id, c.active)}
                          className="rounded p-1 text-text-muted transition-colors hover:bg-white/[.08] hover:text-text-primary"
                          title={c.active ? '비활성화' : '활성화'}
                        >
                          {c.active ? <ToggleRight size={16} className="text-success" /> : <ToggleLeft size={16} />}
                        </button>
                        <button
                          onClick={() => setDeleteTarget({ id: c.id, code: c.code })}
                          className="rounded p-1 text-text-muted transition-colors hover:bg-danger/20 hover:text-danger"
                          title="삭제"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="초대 코드 삭제"
        message={`초대 코드 "${deleteTarget?.code}"를 삭제하시겠습니까?`}
        confirmLabel="삭제"
        danger
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
