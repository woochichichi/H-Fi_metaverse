import { useCallback, useEffect, useState } from 'react';
import { Plus, Copy, ToggleLeft, ToggleRight, RefreshCw, Trash2, KeyRound } from 'lucide-react';
import PageHeader from '../ui/PageHeader';
import DataTable, { type Column } from '../ui/DataTable';
import Modal from '../ui/Modal';
import ConfirmDialog from '../ui/ConfirmDialog';
import { supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../../stores/authStore';
import { useUiStore } from '../../../stores/uiStore';
import { usePermissions } from '../../../hooks/usePermissions';
import { TEAMS } from '../../../lib/constants';
import type { InviteCode } from '../../../types';

function generateCode(): string {
  return String(Math.floor(10000000 + Math.random() * 90000000));
}

export default function AdminInvitesPage() {
  const { user } = useAuthStore();
  const { addToast } = useUiStore();
  const perm = usePermissions();
  const [codes, setCodes] = useState<InviteCode[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; code: string } | null>(null);

  const [formCode, setFormCode] = useState('');
  const [formTeam, setFormTeam] = useState('');
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
      if (error) addToast('초대 코드 조회 실패: ' + error.message, 'error');
      else setCodes((data as InviteCode[]) ?? []);
    } catch {
      addToast('서버 연결 실패 — 잠시 후 다시 시도해 주세요', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => { void fetchCodes(); }, [fetchCodes]);

  if (!perm.canManageInvites) {
    return (
      <div className="w-card" style={{ padding: 40, textAlign: 'center', color: 'var(--w-text-muted)' }}>
        ADMIN 권한이 필요합니다.
      </div>
    );
  }

  const resetForm = () => {
    setFormCode(''); setFormTeam(''); setFormRole('member'); setFormMaxUses(10); setFormExpires('');
  };

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
    resetForm();
    void fetchCodes();
  };

  const toggleActive = async (id: string, currentActive: boolean) => {
    const { error } = await supabase.from('invite_codes').update({ active: !currentActive }).eq('id', id);
    if (error) {
      addToast('상태 변경 실패', 'error');
      return;
    }
    setCodes((prev) => prev.map((c) => (c.id === id ? { ...c, active: !currentActive } : c)));
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    // .select('id')로 실제 삭제된 row 수 확인 (RLS가 막으면 빈 배열 반환, error는 null)
    const { data, error } = await supabase
      .from('invite_codes')
      .delete()
      .eq('id', deleteTarget.id)
      .select('id');
    if (error) {
      addToast('삭제 실패: ' + error.message, 'error');
    } else if (!data || data.length === 0) {
      addToast('삭제 권한이 없거나 이미 삭제된 코드입니다', 'error');
    } else {
      setCodes((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      addToast('초대 코드가 삭제되었습니다', 'success');
    }
    setDeleteTarget(null);
  };

  const copyCode = (code: string) => {
    void navigator.clipboard.writeText(code);
    addToast('복사되었습니다', 'success');
  };

  const isExpired = (expiresAt: string | null) => !!expiresAt && new Date(expiresAt) < new Date();

  const columns: Column<InviteCode>[] = [
    {
      key: 'code',
      header: '코드',
      render: (c) => <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--w-text)' }}>{c.code}</span>,
    },
    { key: 'team', header: '팀', render: (c) => <span style={{ color: 'var(--w-text-soft)' }}>{c.team || '전체'}</span> },
    { key: 'role', header: '역할', render: (c) => <span className="w-badge w-badge-muted">{c.role}</span> },
    {
      key: 'uses',
      header: '사용',
      align: 'center',
      render: (c) => {
        const full = c.used_count >= c.max_uses;
        return (
          <span style={{ color: full ? 'var(--w-danger)' : 'var(--w-text-soft)', fontWeight: 600 }}>
            {c.used_count} / {c.max_uses}
          </span>
        );
      },
    },
    {
      key: 'expires',
      header: '만료',
      render: (c) => {
        const expired = isExpired(c.expires_at);
        return (
          <span style={{ color: expired ? 'var(--w-danger)' : 'var(--w-text-soft)', fontSize: 11 }}>
            {c.expires_at ? new Date(c.expires_at).toLocaleDateString('ko-KR') : '무제한'}
            {expired && ' (만료)'}
          </span>
        );
      },
    },
    {
      key: 'status',
      header: '상태',
      align: 'center',
      render: (c) => {
        const expired = isExpired(c.expires_at);
        const full = c.used_count >= c.max_uses;
        const active = c.active && !expired && !full;
        return (
          <span
            className="w-badge"
            style={{
              background: active ? '#E8F5EE' : 'var(--w-surface-2)',
              color: active ? 'var(--w-success)' : 'var(--w-text-muted)',
            }}
          >
            {active ? '활성' : '비활성'}
          </span>
        );
      },
    },
    {
      key: 'actions',
      header: '액션',
      align: 'center',
      render: (c) => (
        <div style={{ display: 'flex', gap: 3, justifyContent: 'center' }}>
          <IconButton title="복사" onClick={() => copyCode(c.code)}><Copy size={13} /></IconButton>
          <IconButton title={c.active ? '비활성화' : '활성화'} onClick={() => void toggleActive(c.id, c.active)}>
            {c.active ? <ToggleRight size={16} color="var(--w-success)" /> : <ToggleLeft size={16} />}
          </IconButton>
          <IconButton
            title="삭제"
            onClick={() => setDeleteTarget({ id: c.id, code: c.code })}
            danger
          >
            <Trash2 size={13} />
          </IconButton>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        crumbs={[
          { label: '한울타리' },
          { label: '관리' },
          { label: '초대 코드', badge: { text: 'ADMIN', tone: 'accent' } },
        ]}
        title="초대 코드"
        description="신규 구성원 초대 코드를 발급·만료·삭제해요. 코드는 8자리 숫자로 자동 생성됩니다."
        actions={
          <>
            <button className="w-btn w-btn-ghost" onClick={() => void fetchCodes()}>
              <RefreshCw size={14} />
              <span>새로고침</span>
            </button>
            <button className="w-btn w-btn-primary" onClick={() => setShowForm(true)}>
              <Plus size={14} />
              <span>코드 생성</span>
            </button>
          </>
        }
      />

      <div className="w-card" style={{ overflow: 'hidden' }}>
        <DataTable<InviteCode>
          columns={columns}
          rows={codes}
          rowKey={(c) => c.id}
          loading={loading}
          empty={
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <KeyRound size={22} color="var(--w-text-muted)" />
              <span>생성된 초대 코드가 없어요</span>
            </div>
          }
        />
      </div>

      {/* 생성 모달 */}
      {showForm && (
        <Modal
          open
          onClose={() => { setShowForm(false); resetForm(); }}
          title="초대 코드 생성"
          width={520}
          footer={
            <>
              <button className="w-btn w-btn-ghost" onClick={() => { setShowForm(false); resetForm(); }}>취소</button>
              <button className="w-btn w-btn-primary" onClick={() => void handleCreate()}>생성</button>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Field label="코드 (비우면 자동 생성)">
              <input
                value={formCode}
                onChange={(e) => setFormCode(e.target.value)}
                placeholder="자동 생성 (8자리 숫자)"
                style={{ fontFamily: 'monospace' }}
              />
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="대상 팀">
                <select value={formTeam} onChange={(e) => setFormTeam(e.target.value)}>
                  <option value="">전체</option>
                  {TEAMS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="역할">
                <select value={formRole} onChange={(e) => setFormRole(e.target.value as 'member' | 'leader' | 'director')}>
                  <option value="member">member</option>
                  <option value="leader">leader</option>
                  <option value="director">director</option>
                </select>
              </Field>
              <Field label="최대 사용 횟수">
                <input
                  type="number" min={1} max={100}
                  value={formMaxUses}
                  onChange={(e) => setFormMaxUses(Number(e.target.value))}
                />
              </Field>
              <Field label="만료일 (선택)">
                <input type="date" value={formExpires} onChange={(e) => setFormExpires(e.target.value)} />
              </Field>
            </div>
          </div>
        </Modal>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="초대 코드 삭제"
        message={`초대 코드 "${deleteTarget?.code}"를 정말 삭제할까요?\n삭제 후 복구할 수 없습니다.`}
        confirmLabel="삭제"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}

function IconButton({ children, title, onClick, danger }: { children: React.ReactNode; title: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        background: 'transparent',
        padding: 4,
        color: 'var(--w-text-muted)',
        cursor: 'pointer',
        borderRadius: 'var(--w-radius-sm)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLButtonElement;
        el.style.background = danger ? 'var(--w-urgency-critical-soft)' : 'var(--w-surface-2)';
        el.style.color = danger ? 'var(--w-danger)' : 'var(--w-text)';
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLButtonElement;
        el.style.background = 'transparent';
        el.style.color = 'var(--w-text-muted)';
      }}
    >
      {children}
    </button>
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
