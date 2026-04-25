import { useState } from 'react';
import Modal from '../ui/Modal';
import { COLOR, type PurposeLabel } from '../../../lib/corpCardMockData';
import type { PlannedExpense, PlannedExpenseInput } from '../../../hooks/usePlannedExpenses';
import { quarterRange } from '../../../hooks/useCorpCardQuarters';

interface Props {
  mode: 'create' | 'edit';
  /** 활성 분기 (예: "202604") — 예정일 입력의 min/max 범위 가이드용 */
  periodYm: string;
  /** edit 모드일 때 초기값 */
  initial?: PlannedExpense;
  onClose: () => void;
  onSubmit: (input: PlannedExpenseInput) => void;
}

const CATEGORY_OPTIONS: PurposeLabel[] = [
  '회식', '교육', '간담회', '회의', '교통', '점검', '야근', '현업미팅', '팀원교류', '공용', '기타',
];

export default function PlannedExpenseModal({ mode, periodYm, initial, onClose, onSubmit }: Props) {
  const range = quarterRange(periodYm);

  const [plannedDate, setPlannedDate] = useState(initial?.planned_date ?? defaultDate(range));
  const [category, setCategory] = useState<PurposeLabel>(
    (initial?.category as PurposeLabel) ?? '회식',
  );
  const [amount, setAmount] = useState<string>(initial ? String(initial.amount) : '');
  const [memo, setMemo] = useState(initial?.memo ?? '');
  const [headcount, setHeadcount] = useState<string>(initial?.headcount ? String(initial.headcount) : '');
  const [submitting, setSubmitting] = useState(false);

  const amountNum = parseInt(amount.replace(/[^0-9]/g, ''), 10);
  const headcountNum = headcount.trim() ? parseInt(headcount.replace(/[^0-9]/g, ''), 10) : null;
  const valid =
    !!plannedDate &&
    plannedDate >= range.start &&
    plannedDate <= range.end &&
    !!category &&
    Number.isFinite(amountNum) &&
    amountNum > 0;

  const handleSubmit = () => {
    if (!valid || submitting) return;
    setSubmitting(true);
    onSubmit({
      planned_date: plannedDate,
      category,
      amount: amountNum,
      memo: memo.trim() || null,
      headcount: headcountNum,
    });
    // 부모가 닫음 — 여기서 setSubmitting(false) 안 함 (unmount 전 set state 경고 방지)
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={mode === 'create' ? '예정 지출 추가' : '예정 지출 수정'}
      width={520}
      footer={
        <>
          <button className="w-btn w-btn-ghost" onClick={onClose} disabled={submitting}>
            취소
          </button>
          <button
            className="w-btn"
            disabled={!valid || submitting}
            onClick={handleSubmit}
            style={{
              background: 'var(--w-accent)',
              color: '#fff',
              border: 0,
              fontWeight: 700,
              opacity: !valid || submitting ? 0.5 : 1,
            }}
          >
            {submitting ? (mode === 'create' ? '등록 중...' : '저장 중...') : mode === 'create' ? '등록' : '저장'}
          </button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="예정일">
            <input
              type="date"
              value={plannedDate}
              onChange={(e) => setPlannedDate(e.target.value)}
              min={range.start}
              max={range.end}
            />
            <small style={hintStyle}>
              분기 범위: {range.start} ~ {range.end}
            </small>
          </Field>
          <Field label="카테고리">
            <select value={category} onChange={(e) => setCategory(e.target.value as PurposeLabel)}>
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <span style={{ width: 10, height: 10, borderRadius: 999, background: COLOR[category] }} />
              <small style={hintStyle}>차트·도넛에서 이 색으로 구분됩니다</small>
            </div>
          </Field>
        </div>

        <Field label="금액 (원)">
          <input
            type="text"
            inputMode="numeric"
            value={amount === '' ? '' : Number(amount).toLocaleString('ko-KR')}
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ''))}
            placeholder="500,000"
          />
        </Field>

        <Field label="메모 (선택)">
          <textarea
            rows={3}
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="예) 분기말 단합 회식 / 한식당 예약"
          />
        </Field>

        <Field label="참석 예정 인원 (선택)">
          <input
            type="text"
            inputMode="numeric"
            value={headcount}
            onChange={(e) => setHeadcount(e.target.value.replace(/[^0-9]/g, ''))}
            placeholder="12"
            style={{ maxWidth: 120 }}
          />
        </Field>
      </div>
    </Modal>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--w-text-soft)' }}>{label}</span>
      {children}
    </label>
  );
}

const hintStyle: React.CSSProperties = {
  fontSize: 10.5,
  color: 'var(--w-text-muted)',
  marginTop: 2,
};

function defaultDate(range: { start: string; end: string }): string {
  // 오늘이 분기 범위 안이면 오늘, 아니면 분기 끝
  const todayParts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const get = (t: string) => todayParts.find((p) => p.type === t)?.value ?? '';
  const today = `${get('year')}-${get('month')}-${get('day')}`;
  if (today >= range.start && today <= range.end) return today;
  return range.end;
}
