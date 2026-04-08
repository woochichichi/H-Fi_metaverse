import { Pin, Plus, Loader2 } from 'lucide-react';
import type { LabHypothesis, LabHypothesisStatus } from '../../types';

const STATUS_FILTERS: { label: string; value: LabHypothesisStatus | null }[] = [
  { label: '전체', value: null },
  { label: '탐색중', value: '탐색중' },
  { label: '실험중', value: '실험중' },
  { label: '성공', value: '성공' },
  { label: '실패', value: '실패' },
  { label: '보류', value: '보류' },
];

const STATUS_STYLE: Record<LabHypothesisStatus, string> = {
  '탐색중': 'bg-blue-500/10 text-blue-400 before:bg-blue-500',
  '실험중': 'bg-amber-500/10 text-amber-400 before:bg-amber-500',
  '성공': 'bg-emerald-500/10 text-emerald-400 before:bg-emerald-500',
  '실패': 'bg-red-500/10 text-red-400 before:bg-red-500',
  '보류': 'bg-zinc-500/10 text-zinc-400 before:bg-zinc-500',
};

interface Props {
  hypotheses: LabHypothesis[];
  selectedId: string | null;
  statusFilter: LabHypothesisStatus | null;
  loading: boolean;
  isAdmin: boolean;
  onSelect: (h: LabHypothesis) => void;
  onFilterChange: (s: LabHypothesisStatus | null) => void;
  onAddClick: () => void;
}

export default function LabHypothesisList({
  hypotheses,
  selectedId,
  statusFilter,
  loading,
  isAdmin,
  onSelect,
  onFilterChange,
  onAddClick,
}: Props) {
  return (
    <div className="flex w-[300px] shrink-0 flex-col border-r border-white/[.06] bg-black/20">
      {/* 필터 */}
      <div className="flex flex-wrap gap-1.5 border-b border-white/[.04] px-3 py-2.5">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.label}
            onClick={() => onFilterChange(f.value)}
            className={`rounded-xl px-2.5 py-1 text-[11px] font-medium transition-colors ${
              statusFilter === f.value
                ? 'border border-accent bg-accent/10 text-accent'
                : 'border border-white/[.08] text-text-muted hover:text-text-secondary'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* 목록 */}
      <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-text-muted">
            <Loader2 size={20} className="animate-spin" />
          </div>
        ) : hypotheses.length === 0 ? (
          <div className="py-12 text-center text-xs text-text-muted">
            {statusFilter ? '해당 상태의 가설이 없습니다' : '등록된 가설이 없습니다'}
          </div>
        ) : (
          hypotheses.map((h) => (
            <button
              key={h.id}
              onClick={() => onSelect(h)}
              className={`mb-1 w-full rounded-lg border p-3 text-left transition-all ${
                selectedId === h.id
                  ? 'border-accent/30 bg-accent/[.06]'
                  : 'border-transparent hover:bg-white/[.03]'
              }`}
            >
              <div className="mb-1.5 text-[13px] font-semibold leading-snug text-text-primary">
                {h.pinned && <Pin size={11} className="mr-1 inline text-amber-400" />}
                {h.title}
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={h.status} />
                <span className="rounded-md bg-white/[.06] px-1.5 py-0.5 text-[10px] text-text-muted">
                  {h.category}
                </span>
              </div>
            </button>
          ))
        )}
      </div>

      {/* 추가 버튼 (관리자만) */}
      {isAdmin && (
        <div className="border-t border-white/[.04] p-3">
          <button
            onClick={onAddClick}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-accent/40 py-2 text-xs font-semibold text-accent transition-colors hover:border-accent hover:bg-accent/[.06]"
          >
            <Plus size={14} /> 새 가설 추가
          </button>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: LabHypothesisStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold before:h-1.5 before:w-1.5 before:rounded-full ${STATUS_STYLE[status]}`}
    >
      {status}
    </span>
  );
}

export { StatusBadge, STATUS_STYLE };
