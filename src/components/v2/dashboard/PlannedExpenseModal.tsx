import { useState } from 'react';
import Modal from '../ui/Modal';
import DatePicker from '../ui/DatePicker';
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* 1행: 카테고리 (필수) — 가장 먼저 결정해야 색·분류가 잡히므로 위로 */}
        <Field label="카테고리" required>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {CATEGORY_OPTIONS.map((c) => {
              const active = category === c;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 999,
                    border: active ? `1.5px solid ${COLOR[c]}` : '1px solid var(--w-border)',
                    background: active ? `${COLOR[c]}1a` : 'var(--w-surface)',
                    color: active ? COLOR[c] : 'var(--w-text-soft)',
                    fontSize: 12,
                    fontWeight: active ? 700 : 500,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                  }}
                >
                  <span style={{ width: 8, height: 8, borderRadius: 999, background: COLOR[c] }} />
                  {c}
                </button>
              );
            })}
          </div>
        </Field>

        {/* 2행: 예정일 + 금액 — 좌/우 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="예정일" required>
            <DatePicker
              value={plannedDate}
              onChange={setPlannedDate}
              min={range.start}
              max={range.end}
              quickPicks={buildQuickPicks(range)}
            />
          </Field>

          <Field label="금액" required hint="원">
            <input
              type="text"
              inputMode="numeric"
              value={amount === '' ? '' : Number(amount).toLocaleString('ko-KR')}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="500,000"
              style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}
            />
          </Field>
        </div>

        {/* 3행: 메모 (선택) */}
        <Field label="메모" optional>
          <textarea
            rows={3}
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="예) 분기말 단합 회식 / 한식당 예약"
          />
        </Field>

        {/* 4행: 참석 인원 (선택, 작게) */}
        <Field label="참석 예정 인원" optional hint="명">
          <input
            type="text"
            inputMode="numeric"
            value={headcount}
            onChange={(e) => setHeadcount(e.target.value.replace(/[^0-9]/g, ''))}
            placeholder="12"
            style={{ maxWidth: 120, fontVariantNumeric: 'tabular-nums' }}
          />
        </Field>
      </div>
    </Modal>
  );
}

/** 분기 범위 안에서 자주 쓸 빠른 선택 칩 */
function buildQuickPicks(range: { start: string; end: string }): Array<{ label: string; date: string }> {
  const todayD = new Date();
  const today = `${todayD.getFullYear()}-${String(todayD.getMonth() + 1).padStart(2, '0')}-${String(todayD.getDate()).padStart(2, '0')}`;
  // 이번 주말(가장 가까운 토요일)
  const dow = todayD.getDay();
  const sat = new Date(todayD);
  sat.setDate(todayD.getDate() + ((6 - dow + 7) % 7 || 7));
  const weekend = `${sat.getFullYear()}-${String(sat.getMonth() + 1).padStart(2, '0')}-${String(sat.getDate()).padStart(2, '0')}`;
  return [
    { label: '오늘', date: today },
    { label: '이번 주말', date: weekend },
    { label: '분기 마지막', date: range.end },
  ];
}

function Field({
  label,
  children,
  required,
  optional,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  optional?: boolean;
  hint?: string;
}) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: 'var(--w-text)',
          display: 'flex',
          alignItems: 'baseline',
          gap: 5,
        }}
      >
        {label}
        {required && <span style={{ color: 'var(--w-accent)', fontSize: 12 }}>*</span>}
        {optional && <span style={{ fontSize: 10.5, color: 'var(--w-text-muted)', fontWeight: 500 }}>(선택)</span>}
        {hint && <span style={{ fontSize: 10.5, color: 'var(--w-text-muted)', fontWeight: 500, marginLeft: 'auto' }}>{hint}</span>}
      </span>
      {children}
    </label>
  );
}

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
