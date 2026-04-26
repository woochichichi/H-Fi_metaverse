import { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, RefreshCw, ListChecks } from 'lucide-react';
import PageHeader from '../ui/PageHeader';
import PermissionGuard from '../ui/PermissionGuard';
import DataTable, { type Column } from '../ui/DataTable';
import Modal from '../ui/Modal';
import ConfirmDialog from '../ui/ConfirmDialog';
import { useAuthStore } from '../../../stores/authStore';
import { useUiStore } from '../../../stores/uiStore';
import { usePermissions } from '../../../hooks/usePermissions';
import { useCustomEvalItems } from '../../../hooks/useCustomEvalItems';
import { TEAMS } from '../../../lib/constants';
import type { CustomEvalItem } from '../../../types';

export default function AdminEvalItemsPage() {
  const { profile, user } = useAuthStore();
  const { addToast } = useUiStore();
  const perm = usePermissions();
  const { items, loading, fetchAllItems, createItem, updateItem, deleteItem } = useCustomEvalItems();

  const [filterTeam, setFilterTeam] = useState(perm.isAdmin ? '' : profile?.team ?? '');
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CustomEvalItem | null>(null);

  const [formTeam, setFormTeam] = useState(perm.isAdmin ? (TEAMS[0] as string) : profile?.team ?? '');
  const [formName, setFormName] = useState('');
  const [formPoints, setFormPoints] = useState(1);

  useEffect(() => {
    if (perm.canManageEvalItems) void fetchAllItems();
  }, [fetchAllItems, perm.canManageEvalItems]);

  const visible = useMemo(() => {
    const byFilter = filterTeam ? items.filter((i) => i.team === filterTeam) : items;
    return perm.isAdmin ? byFilter : byFilter.filter((i) => i.team === profile?.team);
  }, [items, filterTeam, perm.isAdmin, profile?.team]);

  if (!perm.canManageEvalItems) {
    return (
      <PermissionGuard
        allowed={false}
        title="평가 항목"
        crumbs={[{ label: '한울타리' }, { label: '관리' }, { label: '평가 항목' }]}
        requireDesc="평가 항목은 리더·담당·관리자만 관리할 수 있습니다."
      >
        {null}
      </PermissionGuard>
    );
  }

  const handleCreate = async () => {
    if (!formName.trim()) { addToast('항목 이름을 입력하세요', 'error'); return; }
    const targetTeam = perm.isAdmin ? formTeam : profile?.team ?? '';
    const { error } = await createItem(targetTeam, formName.trim(), formPoints, user?.id ?? '');
    if (error) { addToast('생성 실패: ' + error, 'error'); return; }
    addToast('평가 항목이 추가되었습니다', 'success');
    setShowForm(false); setFormName(''); setFormPoints(1);
    void fetchAllItems();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const { error } = await deleteItem(deleteTarget.id);
    if (error) addToast('삭제 실패: ' + error, 'error');
    else {
      addToast('항목이 비활성화되었습니다', 'success');
      void fetchAllItems();
    }
    setDeleteTarget(null);
  };

  const handlePointsChange = async (item: CustomEvalItem, points: number) => {
    const { error } = await updateItem(item.id, { points });
    if (error) { addToast('수정 실패: ' + error, 'error'); return; }
    void fetchAllItems();
  };

  const columns: Column<CustomEvalItem>[] = [
    { key: 'team', header: '팀', render: (it) => <span className="w-badge w-badge-muted">{it.team}</span> },
    { key: 'name', header: '항목 이름', render: (it) => <span style={{ fontWeight: 600 }}>{it.name}</span> },
    {
      key: 'points',
      header: '포인트',
      align: 'center',
      render: (it) => (
        <input
          type="number"
          min={0.5}
          step={0.5}
          defaultValue={it.points}
          onBlur={(e) => {
            const next = Number(e.target.value);
            if (next !== it.points) void handlePointsChange(it, next);
          }}
          style={{ width: 80, textAlign: 'center', fontSize: 12, padding: '4px 6px' }}
        />
      ),
    },
    {
      key: 'active',
      header: '상태',
      align: 'center',
      render: (it) => (
        <span
          className="w-badge"
          style={{
            background: it.active ? 'var(--w-success-soft)' : 'var(--w-surface-2)',
            color: it.active ? 'var(--w-success)' : 'var(--w-text-muted)',
          }}
        >
          {it.active ? '활성' : '비활성'}
        </span>
      ),
    },
    {
      key: 'action',
      header: '액션',
      align: 'center',
      render: (it) => (
        <button
          onClick={() => setDeleteTarget(it)}
          disabled={!it.active}
          title={it.active ? '비활성화' : '이미 비활성'}
          style={{
            background: 'transparent',
            padding: 4,
            color: 'var(--w-text-muted)',
            cursor: 'pointer',
            borderRadius: 'var(--w-radius-sm)',
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLButtonElement;
            el.style.background = 'var(--w-urgency-critical-soft)';
            el.style.color = 'var(--w-danger)';
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLButtonElement;
            el.style.background = 'transparent';
            el.style.color = 'var(--w-text-muted)';
          }}
        >
          <Trash2 size={13} />
        </button>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        crumbs={[
          { label: '한울타리' },
          { label: '관리' },
          {
            label: '평가 항목',
            badge: perm.isAdmin ? { text: '전체', tone: 'accent' } : { text: `내 팀 · ${profile?.team ?? ''}`, tone: 'info' },
          },
        ]}
        title="평가 항목"
        description="팀별 커스텀 평가 항목을 등록·비활성화해요. 삭제 시 기존 기록은 유지됩니다."
        actions={
          <>
            <button className="w-btn w-btn-ghost" onClick={() => void fetchAllItems()}>
              <RefreshCw size={14} /><span>새로고침</span>
            </button>
            <button className="w-btn w-btn-primary" onClick={() => setShowForm(true)}>
              <Plus size={14} /><span>항목 추가</span>
            </button>
          </>
        }
      />

      {perm.isAdmin && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <span style={{ fontSize: 12, color: 'var(--w-text-muted)' }}>팀</span>
          <select value={filterTeam} onChange={(e) => setFilterTeam(e.target.value)} style={{ fontSize: 12 }}>
            <option value="">전체 팀</option>
            {TEAMS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--w-text-muted)' }}>총 {visible.length}개</span>
        </div>
      )}

      <div className="w-card" style={{ overflow: 'hidden' }}>
        <DataTable<CustomEvalItem>
          columns={columns}
          rows={visible}
          rowKey={(it) => it.id}
          loading={loading}
          empty={
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <ListChecks size={22} color="var(--w-text-muted)" />
              <span>등록된 항목이 없어요</span>
            </div>
          }
        />
      </div>

      {deleteTarget && (
        <ConfirmDialog
          open
          title="평가 항목 비활성화"
          message={`"${deleteTarget.name}" 항목을 비활성화할까요?\n\n· 기존 기록은 유지됩니다.\n· 목록에서 "비활성"으로 표시됩니다.`}
          confirmLabel="비활성화"
          danger
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {showForm && (
        <Modal
          open
          onClose={() => setShowForm(false)}
          title="평가 항목 추가"
          width={480}
          footer={
            <>
              <button className="w-btn w-btn-ghost" onClick={() => setShowForm(false)}>취소</button>
              <button className="w-btn w-btn-primary" onClick={() => void handleCreate()}>추가</button>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {perm.isAdmin && (
              <Field label="대상 팀">
                <select value={formTeam} onChange={(e) => setFormTeam(e.target.value)}>
                  {TEAMS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </Field>
            )}
            <Field label="항목 이름">
              <input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="예: 고객응대, 팀미팅 참석" />
            </Field>
            <Field label="포인트">
              <input
                type="number" min={0.5} step={0.5}
                value={formPoints}
                onChange={(e) => setFormPoints(Number(e.target.value))}
              />
            </Field>
          </div>
        </Modal>
      )}
    </>
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
