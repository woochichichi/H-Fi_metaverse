import { useState } from 'react';
import { X } from 'lucide-react';
import { useNotes } from '../../hooks/useNotes';
import { useAuthStore } from '../../stores/authStore';
import { useUiStore } from '../../stores/uiStore';
import { NOTE_CATEGORIES } from '../../lib/constants';
import type { NoteCategory } from '../../lib/constants';

interface NoteFormProps {
  onClose: () => void;
  onCreated: () => void;
  targetName?: string | null;
  targetId?: string | null;
}

export default function NoteForm({ onClose, onCreated, targetName, targetId }: NoteFormProps) {
  const { profile, user } = useAuthStore();
  const { createNote } = useNotes();
  const { addToast } = useUiStore();

  const [anonymous, setAnonymous] = useState(true);
  const [category, setCategory] = useState<NoteCategory | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isValid = category && title.trim() && content.trim();

  const handleSubmit = async () => {
    if (!isValid || submitting || !profile) return;
    setSubmitting(true);

    try {
      const { error } = await createNote({
        anonymous,
        recipient_role: 'leader',
        recipient_team: null,
        recipient_id: targetId ?? null,
        category: category!,
        title: title.trim(),
        content: content.trim(),
        team: profile.team,
        sender_id: anonymous ? null : user?.id,
      });

      if (error) {
        addToast(`편지 발송 실패: ${error}`, 'error');
        return;
      }

      addToast('💌 마음의 편지가 전달되었습니다', 'success');
      onCreated();
    } catch (err) {
      const msg = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다';
      addToast(`발송 실패: ${msg}`, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* 헤더 */}
      <div className="flex items-center justify-between border-b border-white/[.06] px-4 py-3">
        <h2 className="font-heading text-base font-bold text-text-primary">💌 마음의 편지</h2>
        <button
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-white/10 hover:text-text-primary"
        >
          <X size={16} />
        </button>
      </div>

      {/* 폼 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* 안내 문구 */}
        <div className="rounded-xl bg-accent/10 px-4 py-3 space-y-1">
          <p className="text-xs font-medium text-accent-light">
            {targetName
              ? `${targetName}님에게 마음을 전해보세요`
              : '평소 하지 못했던 말, 전하고 싶은 마음을 적어보세요'}
          </p>
          <p className="text-[11px] text-text-muted">
            감사·응원·고민·솔직한 이야기 모두 괜찮아요 ✨
          </p>
        </div>

        {/* 익명 토글 */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-text-secondary">익명으로 보내기</span>
          <button
            onClick={() => setAnonymous(!anonymous)}
            className={`relative h-6 w-11 rounded-full transition-colors duration-200 ${
              anonymous ? 'bg-accent' : 'bg-white/20'
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform duration-200 ${
                anonymous ? 'left-[22px]' : 'left-0.5'
              }`}
            />
          </button>
        </div>

        {/* 카테고리 */}
        <div>
          <label className="text-xs font-medium text-text-muted mb-1.5 block">
            어떤 마음인가요? <span className="text-danger">*</span>
          </label>
          <div className="flex flex-wrap gap-1.5">
            {NOTE_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors duration-200 ${
                  category === cat
                    ? 'bg-info/30 text-info'
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
            placeholder="한 줄로 마음을 요약해 주세요"
            className="w-full rounded-lg bg-white/[.06] px-3 py-2 text-sm text-text-primary placeholder-text-muted outline-none focus:ring-1 focus:ring-accent"
          />
          <p className="text-[10px] text-text-muted mt-1 text-right">{title.length}/100</p>
        </div>

        {/* 내용 */}
        <div>
          <label className="text-xs font-medium text-text-muted mb-1.5 block">
            하고 싶은 말 <span className="text-danger">*</span>
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value.slice(0, 1000))}
            placeholder="고마웠던 일, 응원의 한마디, 솔직한 건의 — 무엇이든 좋아요"
            rows={5}
            className="w-full resize-none rounded-lg bg-white/[.06] px-3 py-2 text-sm text-text-primary placeholder-text-muted outline-none focus:ring-1 focus:ring-accent"
          />
          <p className="text-[10px] text-text-muted mt-1 text-right">{content.length}/1000</p>
        </div>

        {/* 익명 안내 */}
        {anonymous && (
          <p className="rounded-lg bg-white/[.04] px-3 py-2 text-[11px] text-text-muted">
            🔒 익명이 보장됩니다 — 관리자도 누가 보냈는지 알 수 없어요
          </p>
        )}
      </div>

      {/* 제출 */}
      <div className="border-t border-white/[.06] px-4 py-3">
        <button
          onClick={handleSubmit}
          disabled={!isValid || submitting}
          className="w-full rounded-xl bg-accent py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-accent/80 disabled:opacity-40"
        >
          {submitting ? '전송 중...' : '💌 편지 보내기'}
        </button>
      </div>
    </div>
  );
}
