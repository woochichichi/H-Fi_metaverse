import { useState } from 'react';
import { Trash2, Send } from 'lucide-react';
import { formatRelativeTime } from '../../lib/utils';
import type { LabComment, Profile } from '../../types';

interface Props {
  comments: LabComment[];
  profiles: Record<string, Profile>;
  profileId: string;
  onSubmit: (content: string) => Promise<void>;
  onDelete: (id: string) => Promise<{ error: string | null }>;
}

export default function LabCommentSection({ comments, profiles, profileId, onSubmit, onDelete }: Props) {
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const trimmed = text.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    await onSubmit(trimmed);
    setText('');
    setSubmitting(false);
  };

  return (
    <div className="shrink-0 border-t border-white/[.06] px-5 py-3">
      <div className="mb-2.5 text-[12px] font-bold text-text-muted">
        💬 코멘트 <span className="ml-1 rounded-full bg-white/[.08] px-1.5 py-0.5 text-[10px]">{comments.length}</span>
      </div>

      {/* 코멘트 목록 */}
      {comments.length > 0 && (
        <div className="mb-2.5 max-h-[100px] overflow-y-auto scrollbar-thin">
          {comments.map((c) => {
            const p = profiles[c.author_id];
            const isMine = c.author_id === profileId;
            return (
              <div key={c.id} className="group mb-2 flex gap-2 text-[12px]">
                <div className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-white/[.06] text-[10px]">
                  {p?.avatar_emoji || '👤'}
                </div>
                <div className="flex-1">
                  <span className="font-semibold text-text-primary">{p?.nickname || p?.name || '알 수 없음'}</span>
                  <p className="mt-0.5 leading-snug text-text-secondary">{c.content}</p>
                  <span className="text-[10px] text-text-muted">{formatRelativeTime(c.created_at)}</span>
                </div>
                {isMine && (
                  <button
                    onClick={() => onDelete(c.id)}
                    className="opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <Trash2 size={11} className="text-text-muted hover:text-red-400" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 입력 */}
      <div className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              e.stopPropagation();
              handleSubmit();
            }
          }}
          placeholder="코멘트를 남겨주세요..."
          className="flex-1 rounded-lg border border-white/[.08] bg-white/[.04] px-3 py-2 text-[12px] text-text-primary outline-none placeholder:text-text-muted focus:border-accent/40"
        />
        <button
          onClick={handleSubmit}
          disabled={!text.trim() || submitting}
          className="flex items-center gap-1 rounded-lg bg-accent px-3 py-2 text-[11px] font-bold text-bg-primary transition-colors hover:bg-accent/80 disabled:opacity-40"
        >
          <Send size={12} /> 등록
        </button>
      </div>
    </div>
  );
}
