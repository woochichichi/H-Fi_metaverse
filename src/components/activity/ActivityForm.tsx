import { useState } from 'react';
import { X } from 'lucide-react';
import { UNITS } from '../../lib/constants';

const CATEGORIES = ['이벤트', '인적교류', 'VoC', '소프트랜딩', '기타'] as const;
const STATUS_OPTIONS = ['계획', '진행중', '완료', '보류'] as const;

interface ActivityFormProps {
  onSubmit: (data: {
    title: string;
    description: string | null;
    category: string | null;
    status: string;
    unit: string | null;
  }) => void;
  onCancel: () => void;
  initialData?: {
    title: string;
    description: string | null;
    category: string | null;
    status: string;
    unit: string | null;
  };
  isEdit?: boolean;
}

export default function ActivityForm({ onSubmit, onCancel, initialData, isEdit }: ActivityFormProps) {
  const [title, setTitle] = useState(initialData?.title ?? '');
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [category, setCategory] = useState<string | null>(initialData?.category ?? null);
  const [status, setStatus] = useState(initialData?.status ?? '계획');
  const [unit, setUnit] = useState<string | null>(initialData?.unit ?? null);

  const handleSubmit = () => {
    if (!title.trim()) return;
    onSubmit({
      title: title.trim(),
      description: description.trim() || null,
      category,
      status,
      unit,
    });
  };

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-accent/20 bg-accent/[.03] p-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-accent">{isEdit ? '활동 수정' : '활동 등록'}</h4>
        <button onClick={onCancel} className="text-text-muted hover:text-text-primary">
          <X size={14} />
        </button>
      </div>

      {/* 제목 */}
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="제목 (필수)"
        maxLength={100}
        className="rounded-lg border border-white/[.08] bg-white/[.04] px-3 py-2 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-accent/50"
      />

      {/* 설명 */}
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="설명 / 일정 / 장소 등"
        maxLength={500}
        rows={3}
        className="resize-none rounded-lg border border-white/[.08] bg-white/[.04] px-3 py-2 text-xs text-text-primary placeholder:text-text-muted outline-none focus:border-accent/50"
      />

      {/* 카테고리 칩 */}
      <div>
        <label className="text-[10px] font-semibold text-text-muted mb-1 block">카테고리</label>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(category === c ? null : c)}
              className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
                category === c
                  ? 'bg-accent/20 text-accent border border-accent/40'
                  : 'bg-white/[.04] text-text-muted border border-white/[.06] hover:bg-white/[.08]'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* 상태 */}
      <div>
        <label className="text-[10px] font-semibold text-text-muted mb-1 block">상태</label>
        <div className="flex gap-1.5">
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
                status === s
                  ? 'bg-accent/20 text-accent border border-accent/40'
                  : 'bg-white/[.04] text-text-muted border border-white/[.06] hover:bg-white/[.08]'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* 대상 유닛 */}
      <div>
        <label className="text-[10px] font-semibold text-text-muted mb-1 block">대상 유닛</label>
        <div className="flex gap-1.5">
          {[...UNITS, '전체'].map((u) => (
            <button
              key={u}
              onClick={() => setUnit(unit === u ? null : u)}
              className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
                unit === u
                  ? 'bg-accent/20 text-accent border border-accent/40'
                  : 'bg-white/[.04] text-text-muted border border-white/[.06] hover:bg-white/[.08]'
              }`}
            >
              {u}
            </button>
          ))}
        </div>
      </div>

      {/* 등록 버튼 */}
      <button
        onClick={handleSubmit}
        disabled={!title.trim()}
        className="mt-1 rounded-lg bg-accent px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-accent/80 disabled:opacity-40"
      >
        {isEdit ? '수정 완료' : '등록'}
      </button>
    </div>
  );
}
