import { useState } from 'react';
import { X } from 'lucide-react';
import { useIdeas } from '../../hooks/useIdeas';
import { useAuthStore } from '../../stores/authStore';
import { useUiStore } from '../../stores/uiStore';
import { IDEA_CATEGORIES } from '../../lib/constants';
import type { IdeaCategory } from '../../lib/constants';

interface IdeaFormProps {
  onClose: () => void;
  onCreated: () => void;
}

export default function IdeaForm({ onClose, onCreated }: IdeaFormProps) {
  const { user } = useAuthStore();
  const { createIdea } = useIdeas();
  const { addToast } = useUiStore();

  const [category, setCategory] = useState<IdeaCategory | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isValid = category && title.trim() && description.trim();

  const handleSubmit = async () => {
    if (!isValid || submitting || !user) return;
    setSubmitting(true);

    const { error } = await createIdea({
      title: title.trim(),
      description: description.trim(),
      category: category!,
      author_id: user.id,
    });

    setSubmitting(false);

    if (error) {
      addToast(`등록 실패: ${error}`, 'error');
      return;
    }

    addToast('💡 아이디어가 공유되었습니다!', 'success');
    onCreated();
  };

  return (
    <div className="flex flex-col h-full">
      {/* 헤더 */}
      <div className="flex items-center justify-between border-b border-white/[.06] px-4 py-3">
        <h2 className="font-heading text-base font-bold text-text-primary">아이디어 등록</h2>
        <button
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-white/10 hover:text-text-primary"
        >
          <X size={16} />
        </button>
      </div>

      {/* 폼 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* 카테고리 */}
        <div>
          <label className="text-xs font-medium text-text-muted mb-1.5 block">
            카테고리 <span className="text-danger">*</span>
          </label>
          <div className="flex flex-wrap gap-1.5">
            {IDEA_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors duration-200 ${
                  category === cat
                    ? 'bg-accent text-white'
                    : 'bg-white/[.06] text-text-secondary hover:bg-white/10'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* 제목 */}
        <div>
          <label className="text-xs font-medium text-text-muted mb-1.5 block">
            제목 <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value.slice(0, 100))}
            placeholder="아이디어 제목을 입력하세요"
            className="w-full rounded-lg bg-white/[.06] px-3 py-2 text-sm text-text-primary placeholder-text-muted outline-none focus:ring-1 focus:ring-accent"
          />
          <p className="text-[10px] text-text-muted mt-1 text-right">{title.length}/100</p>
        </div>

        {/* 설명 */}
        <div>
          <label className="text-xs font-medium text-text-muted mb-1.5 block">
            설명 <span className="text-danger">*</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value.slice(0, 500))}
            placeholder="아이디어를 상세히 설명해 주세요"
            rows={5}
            className="w-full resize-none rounded-lg bg-white/[.06] px-3 py-2 text-sm text-text-primary placeholder-text-muted outline-none focus:ring-1 focus:ring-accent"
          />
          <p className="text-[10px] text-text-muted mt-1 text-right">{description.length}/500</p>
        </div>
      </div>

      {/* 제출 */}
      <div className="border-t border-white/[.06] px-4 py-3">
        <button
          onClick={handleSubmit}
          disabled={!isValid || submitting}
          className="w-full rounded-xl bg-accent py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-accent/80 disabled:opacity-40"
        >
          {submitting ? '등록 중...' : '💡 아이디어 공유'}
        </button>
      </div>
    </div>
  );
}
