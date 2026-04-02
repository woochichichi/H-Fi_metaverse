import { useState } from 'react';
import { X, Send } from 'lucide-react';
import { useWorries, WORRY_CATEGORIES, type WorryCategory } from '../../hooks/useWorries';
import { useAuthStore } from '../../stores/authStore';
import { useUiStore } from '../../stores/uiStore';

interface WorryFormProps {
  onClose: () => void;
  onCreated: () => void;
  /** 수정 모드 */
  editId?: string;
  initialData?: { title: string; content: string; category: WorryCategory };
}

export default function WorryForm({ onClose, onCreated, editId, initialData }: WorryFormProps) {
  const { user } = useAuthStore();
  const { addToast } = useUiStore();
  const { createWorry, updateWorry } = useWorries();

  const isEdit = !!editId;

  const [title, setTitle] = useState(initialData?.title ?? '');
  const [content, setContent] = useState(initialData?.content ?? '');
  const [category, setCategory] = useState<WorryCategory>(initialData?.category ?? '일상');
  const [anonymous, setAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user) { addToast('로그인이 필요합니다', 'error'); return; }
    if (!title.trim()) { addToast('제목을 입력해주세요', 'error'); return; }
    if (!content.trim()) { addToast('내용을 입력해주세요', 'error'); return; }

    setSubmitting(true);

    if (isEdit && editId) {
      const { error } = await updateWorry(editId, {
        title: title.trim(),
        content: content.trim(),
        category,
      });
      setSubmitting(false);
      if (error) { addToast(`수정 실패: ${error}`, 'error'); return; }
      addToast('사연이 수정되었습니다', 'success');
    } else {
      const { error } = await createWorry({
        title: title.trim(),
        content: content.trim(),
        category,
        anonymous,
        author_id: user.id,
      });
      setSubmitting(false);
      if (error) { addToast(`등록 실패: ${error}`, 'error'); return; }
      addToast('사연이 등록되었습니다 🫂', 'success');
    }
    onCreated();
  };

  return (
    <div className="flex flex-col h-full">
      {/* 헤더 */}
      <div className="flex items-center justify-between border-b border-white/[.06] px-4 py-3">
        <h2 className="font-heading text-base font-bold text-text-primary">{isEdit ? '✏️ 사연 수정' : '🫂 사연 올리기'}</h2>
        <button
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-white/10 hover:text-text-primary"
        >
          <X size={16} />
        </button>
      </div>

      {/* 안내문 */}
      <div className="border-b border-white/[.06] bg-rose-500/[.06] px-4 py-2.5">
        <p className="text-[11px] leading-relaxed text-text-muted">
          <span className="font-semibold text-rose-300">털어놓으세요</span> — 말 못 했던 이야기, 여기서는 괜찮아요. 동료들이 공감과 응원으로 함께합니다.
        </p>
      </div>

      {/* 폼 */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {/* 카테고리 */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-medium text-text-muted">카테고리</label>
          <div className="flex flex-wrap gap-1.5">
            {WORRY_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors ${
                  category === cat
                    ? 'bg-rose-500/80 text-white'
                    : 'bg-white/[.06] text-text-muted hover:bg-white/10'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* 제목 */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-medium text-text-muted">
            제목 <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={100}
            placeholder="한 줄로 표현해보세요"
            className="w-full rounded-xl border border-white/[.08] bg-white/[.04] px-3 py-2 text-sm text-text-primary placeholder-text-muted outline-none focus:border-rose-500/50 focus:bg-white/[.06]"
          />
          <span className="text-right text-[10px] text-text-muted">{title.length}/100</span>
        </div>

        {/* 내용 */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-medium text-text-muted">
            내용 <span className="text-rose-400">*</span>
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={2000}
            rows={8}
            placeholder="자유롭게 털어놓으세요. 판단 없이 들어드릴게요."
            className="w-full resize-none rounded-xl border border-white/[.08] bg-white/[.04] px-3 py-2 text-sm text-text-primary placeholder-text-muted outline-none focus:border-rose-500/50 focus:bg-white/[.06]"
          />
          <span className="text-right text-[10px] text-text-muted">{content.length}/2000</span>
        </div>

        {/* 익명 옵션 (신규 작성 시만) */}
        {!isEdit && (
          <label className="flex cursor-pointer items-center gap-2.5">
            <div
              onClick={() => setAnonymous(!anonymous)}
              className={`relative h-5 w-9 rounded-full transition-colors ${
                anonymous ? 'bg-rose-500/70' : 'bg-white/20'
              }`}
            >
              <span
                className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                  anonymous ? 'translate-x-4' : 'translate-x-0.5'
                }`}
              />
            </div>
            <span className="text-[12px] text-text-secondary">익명으로 올리기</span>
            {anonymous && (
              <span className="text-[10px] text-text-muted">(작성자 이름이 표시되지 않습니다)</span>
            )}
          </label>
        )}
      </div>

      {/* 하단 버튼 */}
      <div className="border-t border-white/[.06] p-4">
        <button
          onClick={handleSubmit}
          disabled={submitting || !title.trim() || !content.trim()}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-500/80 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-rose-500 disabled:opacity-40"
        >
          <Send size={14} />
          {submitting ? (isEdit ? '수정 중...' : '등록 중...') : isEdit ? '수정 완료' : '사연 올리기'}
        </button>
      </div>
    </div>
  );
}
