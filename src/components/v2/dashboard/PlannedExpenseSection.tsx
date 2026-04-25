import { useMemo, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { fmt, COLOR, type PurposeLabel } from '../../../lib/corpCardMockData';
import { useAuthStore } from '../../../stores/authStore';
import {
  usePlannedExpenses,
  type PlannedExpense,
  type PlannedExpenseInput,
} from '../../../hooks/usePlannedExpenses';
import { useV2Toast } from '../ui/Toast';
import { confirm } from '../ui/dialog';
import PlannedExpenseModal from './PlannedExpenseModal';
import { HelpDot } from '../ui/Tip';

interface Props {
  /** 활성 분기 (예: "202604") — 이 분기의 예정 지출만 노출. */
  periodYm: string;
  /** 합계 표시 위해 필요한 분기 시작/끝 (D-N 계산용) */
  todayISO: string;
  /** 부모로부터 hook 인스턴스 받음 — Hero 보조 표시도 같이 쓰니 단일 소스로 공유 */
  planned: ReturnType<typeof usePlannedExpenses>;
}

export default function PlannedExpenseSection({ periodYm, todayISO, planned }: Props) {
  const { user, profile } = useAuthStore();
  const { items, loading, total, create, update, remove } = planned;
  const showToast = useV2Toast((s) => s.show);

  const [editing, setEditing] = useState<PlannedExpense | null>(null);
  const [creating, setCreating] = useState(false);

  const sorted = useMemo(
    () => [...items].sort((a, b) => a.planned_date.localeCompare(b.planned_date)),
    [items],
  );

  const handleCreate = async (input: PlannedExpenseInput) => {
    if (!user || !profile) {
      showToast('로그인 정보가 없습니다', 'error');
      return;
    }
    const { error } = await create(input, { id: user.id, name: profile.name });
    if (error) {
      showToast(`등록 실패: ${error}`, 'error');
      return;
    }
    showToast('예정 지출이 등록되었습니다', 'success');
    setCreating(false);
  };

  const handleUpdate = async (id: string, input: PlannedExpenseInput) => {
    const { error } = await update(id, input);
    if (error) {
      showToast(`수정 실패: ${error}`, 'error');
      return;
    }
    showToast('수정되었습니다', 'success');
    setEditing(null);
  };

  const handleDelete = async (item: PlannedExpense) => {
    const ok = await confirm({
      title: '예정 지출 삭제',
      message: `${item.planned_date} ${item.category} (${fmt(item.amount)}원) 항목을 삭제할까요?`,
    });
    if (!ok) return;
    const { error } = await remove(item.id);
    if (error) {
      showToast(`삭제 실패: ${error}`, 'error');
      return;
    }
    showToast('삭제되었습니다', 'success');
  };

  return (
    <div className="w-cc-card">
      <div
        className="w-cc-card-head"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}
      >
        <div className="w-cc-card-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          예정 지출
          <span className="w-cc-count">{items.length}</span>
          <HelpDot
            tip={
              <>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>예정 지출이란?</div>
                <div style={{ fontSize: 11.5, lineHeight: 1.6 }}>
                  분기 말 회식·교육 등 예정된 지출 계획을 미리 등록해두면
                  팀장이 "어떤 일정에 어떤 규모 지출 예정인지" 한눈에 파악할 수 있어요.
                  <br />
                  <br />
                  <b>실제 사용 합계엔 영향 없음</b> (별도 계획 풀).
                  Hero 의 "예정 차감 시" 표시에만 반영.
                </div>
              </>
            }
          />
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {items.length > 0 && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'baseline',
                gap: 6,
                padding: '6px 12px',
                background: 'var(--w-warning-soft)',
                color: 'var(--w-warning)',
                borderRadius: 8,
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              이번 분기 예정 합계
              <b style={{ fontSize: 13.5, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>
                {fmt(total)}원
              </b>
            </span>
          )}
          <button
            type="button"
            onClick={() => setCreating(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '6px 12px',
              background: 'var(--w-accent)',
              color: '#fff',
              border: 0,
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            <Plus size={13} /> 예정 추가
          </button>
        </div>
      </div>

      {loading ? (
        <div className="w-cc-empty">불러오는 중...</div>
      ) : items.length === 0 ? (
        <div
          style={{
            padding: '32px 20px',
            textAlign: 'center',
            color: 'var(--w-text-muted)',
            fontSize: 12.5,
            lineHeight: 1.7,
          }}
        >
          등록된 예정 지출이 없습니다.
          <br />
          <span style={{ fontSize: 11.5 }}>"예정 추가" 로 분기 말 회식·교육 등 예정 일정을 미리 남겨보세요.</span>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={{ ...thStyle, textAlign: 'left' }}>예정일</th>
                <th style={{ ...thStyle, textAlign: 'left' }}>카테고리</th>
                <th style={{ ...thStyle, textAlign: 'left' }}>메모</th>
                <th style={thStyle}>참석</th>
                <th style={{ ...thStyle, textAlign: 'left' }}>등록자</th>
                <th style={thStyle}>금액</th>
                <th style={{ ...thStyle, width: 70 }}></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((p) => {
                const dDay = daysUntil(p.planned_date, todayISO);
                const cat = p.category as PurposeLabel;
                const color = COLOR[cat] ?? '#94a3b8';
                const isPast = dDay < 0;
                return (
                  <tr key={p.id} style={isPast ? { opacity: 0.55 } : undefined}>
                    <td style={{ ...tdStyle, textAlign: 'left', whiteSpace: 'nowrap' }}>
                      <div style={{ fontWeight: 700 }}>{p.planned_date.slice(5)}</div>
                      <div style={{ fontSize: 10.5, color: 'var(--w-text-muted)' }}>
                        {dDay === 0 ? '오늘' : dDay > 0 ? `D-${dDay}` : `${-dDay}일 지남`}
                      </div>
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'left' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '2px 8px',
                          borderRadius: 999,
                          fontSize: 11,
                          fontWeight: 700,
                          background: `${color}1a`,
                          color,
                        }}
                      >
                        <span style={{ width: 6, height: 6, borderRadius: 999, background: color }} />
                        {p.category}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'left', color: 'var(--w-text-soft)' }} title={p.memo ?? ''}>
                      {p.memo || '—'}
                    </td>
                    <td style={tdStyle}>{p.headcount ? `${p.headcount}명` : '—'}</td>
                    <td style={{ ...tdStyle, textAlign: 'left', color: 'var(--w-text-soft)' }}>
                      {p.author_name}
                    </td>
                    <td style={{ ...tdStyle, fontWeight: 800, fontSize: 13.5 }}>
                      {fmt(p.amount)}
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          onClick={() => setEditing(p)}
                          aria-label="수정"
                          style={iconBtnStyle}
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => { void handleDelete(p); }}
                          aria-label="삭제"
                          style={iconBtnStyle}
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

      {creating && (
        <PlannedExpenseModal
          mode="create"
          periodYm={periodYm}
          onClose={() => setCreating(false)}
          onSubmit={(input) => { void handleCreate(input); }}
        />
      )}
      {editing && (
        <PlannedExpenseModal
          mode="edit"
          periodYm={periodYm}
          initial={editing}
          onClose={() => setEditing(null)}
          onSubmit={(input) => { void handleUpdate(editing.id, input); }}
        />
      )}
    </div>
  );
}

function daysUntil(dateStr: string, todayISO: string): number {
  const d = new Date(dateStr + 'T00:00:00Z').getTime();
  const t = new Date(todayISO + 'T00:00:00Z').getTime();
  return Math.round((d - t) / (24 * 60 * 60 * 1000));
}

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: 12.5,
  fontVariantNumeric: 'tabular-nums',
};

const thStyle: React.CSSProperties = {
  padding: '10px 8px',
  textAlign: 'right',
  fontSize: 11,
  fontWeight: 600,
  color: 'var(--w-text-muted)',
  background: 'var(--w-surface-2)',
  borderBottom: '1px solid var(--w-border-strong)',
  whiteSpace: 'nowrap',
};

const tdStyle: React.CSSProperties = {
  padding: '11px 8px',
  textAlign: 'right',
  borderBottom: '1px solid var(--w-border)',
  verticalAlign: 'middle',
};

const iconBtnStyle: React.CSSProperties = {
  width: 24,
  height: 24,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'transparent',
  color: 'var(--w-text-muted)',
  border: 0,
  borderRadius: 4,
  cursor: 'pointer',
};
