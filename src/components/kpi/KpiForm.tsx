import { useState } from 'react';
import { X } from 'lucide-react';
import { useKpi } from '../../hooks/useKpi';
import { useAuthStore } from '../../stores/authStore';
import { useUiStore } from '../../stores/uiStore';
import type { KpiItem } from '../../types';

interface KpiFormProps {
  items: KpiItem[];
  onClose: () => void;
  onSaved: () => void;
}

// 최근 6개월 목록 생성
function getRecentMonths(): string[] {
  const months: string[] = [];
  const now = new Date();
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    );
  }
  return months;
}

export default function KpiForm({ items, onClose, onSaved }: KpiFormProps) {
  const { user } = useAuthStore();
  const { upsertKpiRecord } = useKpi();
  const { addToast } = useUiStore();

  const months = getRecentMonths();

  const [selectedItem, setSelectedItem] = useState<string>(items[0]?.id ?? '');
  const [selectedMonth, setSelectedMonth] = useState<string>(months[0]);
  const [score, setScore] = useState<string>('');
  const [evidence, setEvidence] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isValid = selectedItem && selectedMonth && score !== '' && Number(score) >= 0 && Number(score) <= 3;

  const handleSubmit = async () => {
    if (!isValid || submitting || !user) return;
    setSubmitting(true);

    const { error } = await upsertKpiRecord({
      kpi_item_id: selectedItem,
      user_id: user.id,
      month: selectedMonth,
      score: Number(score),
      evidence: evidence.trim() || null,
    });

    setSubmitting(false);

    if (error) {
      addToast(`KPI 저장 실패: ${error}`, 'error');
      return;
    }

    addToast('📊 KPI 실적이 저장되었습니다', 'success');
    onSaved();
  };

  return (
    <div className="flex flex-col h-full">
      {/* 헤더 */}
      <div className="flex items-center justify-between border-b border-white/[.06] px-4 py-3">
        <h2 className="font-heading text-base font-bold text-text-primary">KPI 실적 입력</h2>
        <button
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-white/10 hover:text-text-primary"
        >
          <X size={16} />
        </button>
      </div>

      {/* 폼 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* KPI 항목 선택 */}
        <div>
          <label className="text-xs font-medium text-text-muted mb-1.5 block">
            KPI 항목 <span className="text-danger">*</span>
          </label>
          <select
            value={selectedItem}
            onChange={(e) => setSelectedItem(e.target.value)}
            className="w-full rounded-lg bg-white/[.06] px-3 py-2 text-sm text-text-primary outline-none focus:ring-1 focus:ring-accent"
          >
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </select>
        </div>

        {/* 월 선택 */}
        <div>
          <label className="text-xs font-medium text-text-muted mb-1.5 block">
            대상 월 <span className="text-danger">*</span>
          </label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full rounded-lg bg-white/[.06] px-3 py-2 text-sm text-text-primary outline-none focus:ring-1 focus:ring-accent"
          >
            {months.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        {/* 점수 */}
        <div>
          <label className="text-xs font-medium text-text-muted mb-1.5 block">
            점수 (0~3) <span className="text-danger">*</span>
          </label>
          <input
            type="number"
            min={0}
            max={3}
            step={0.1}
            value={score}
            onChange={(e) => setScore(e.target.value)}
            placeholder="0.0 ~ 3.0"
            className="w-full rounded-lg bg-white/[.06] px-3 py-2 text-sm text-text-primary placeholder-text-muted outline-none focus:ring-1 focus:ring-accent font-mono"
          />
        </div>

        {/* 증적 설명 */}
        <div>
          <label className="text-xs font-medium text-text-muted mb-1.5 block">증적 설명</label>
          <textarea
            value={evidence}
            onChange={(e) => setEvidence(e.target.value.slice(0, 500))}
            placeholder="실적 근거를 입력하세요 (선택)"
            rows={4}
            className="w-full resize-none rounded-lg bg-white/[.06] px-3 py-2 text-sm text-text-primary placeholder-text-muted outline-none focus:ring-1 focus:ring-accent"
          />
          <p className="text-[10px] text-text-muted mt-1 text-right">{evidence.length}/500</p>
        </div>
      </div>

      {/* 제출 */}
      <div className="border-t border-white/[.06] px-4 py-3">
        <button
          onClick={handleSubmit}
          disabled={!isValid || submitting}
          className="w-full rounded-xl bg-accent py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-accent/80 disabled:opacity-40"
        >
          {submitting ? '저장 중...' : '📊 실적 저장'}
        </button>
      </div>
    </div>
  );
}
