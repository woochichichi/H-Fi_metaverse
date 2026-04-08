import { useState, useEffect, useRef } from 'react';
import { Trash2, Pencil, Check, X, Send } from 'lucide-react';
import ConfirmDialog from '../common/ConfirmDialog';
import { formatRelativeTime } from '../../lib/utils';
import type { LabComment, Profile } from '../../types';

interface Props {
  comments: LabComment[];
  profiles: Record<string, Profile>;
  profileId: string;
  onSubmit: (content: string) => Promise<void>;
  onUpdate: (id: string, content: string) => Promise<{ error: string | null }>;
  onDelete: (id: string) => Promise<{ error: string | null }>;
}

export default function LabCommentSection({ comments, profiles, profileId, onSubmit, onUpdate, onDelete }: Props) {
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // 가설 전환 시 편집 상태 초기화
  const prevFirstId = useRef(comments[0]?.id);
  useEffect(() => {
    if (comments[0]?.id !== prevFirstId.current) {
      setEditingId(null);
      setDeleteTarget(null);
      prevFirstId.current = comments[0]?.id;
    }
  }, [comments]);

  const handleSubmit = async () => {
    const trimmed = text.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    await onSubmit(trimmed);
    setText('');
    setSubmitting(false);
  };

  const startEdit = (c: LabComment) => {
    setEditingId(c.id);
    setEditText(c.content);
  };

  const saveEdit = async () => {
    if (!editingId || !editText.trim()) return;
    await onUpdate(editingId, editText.trim());
    setEditingId(null);
  };

  return (
    <div className="shrink-0 border-t border-white/[.06] px-5 py-3">
      <div className="mb-2.5 text-[12px] font-bold text-text-muted">
        💬 코멘트 <span className="ml-1 rounded-full bg-white/[.08] px-1.5 py-0.5 text-[10px]">{comments.length}</span>
      </div>

      {comments.length > 0 && (
        <div className="mb-2.5 max-h-[120px] overflow-y-auto scrollbar-thin">
          {comments.map((c) => {
            const p = profiles[c.author_id];
            const isMine = c.author_id === profileId;
            const isEditing = editingId === c.id;
            return (
              <div key={c.id} className="group mb-2 flex gap-2 text-[12px]">
                <div className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-white/[.06] text-[10px]">
                  {p?.avatar_emoji || '👤'}
                </div>
                <div className="flex-1">
                  <span className="font-semibold text-text-primary">{p?.nickname || p?.name || '알 수 없음'}</span>
                  {isEditing ? (
                    <div className="mt-1">
                      <input
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); saveEdit(); } }}
                        className="w-full rounded-md border border-white/[.1] bg-white/[.04] px-2 py-1 text-[12px] text-text-primary outline-none focus:border-accent/40"
                      />
                      <div className="mt-1 flex gap-1">
                        <button onClick={saveEdit} className="flex items-center gap-0.5 text-[10px] text-accent hover:text-accent/80">
                          <Check size={10} /> 저장
                        </button>
                        <button onClick={() => setEditingId(null)} className="flex items-center gap-0.5 text-[10px] text-text-muted hover:text-text-secondary">
                          <X size={10} /> 취소
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="mt-0.5 leading-snug text-text-secondary">{c.content}</p>
                      <span className="text-[10px] text-text-muted">{formatRelativeTime(c.created_at)}</span>
                    </>
                  )}
                </div>
                {isMine && !isEditing && (
                  <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button onClick={() => startEdit(c)}>
                      <Pencil size={10} className="text-text-muted hover:text-accent" />
                    </button>
                    <button onClick={() => setDeleteTarget(c.id)}>
                      <Trash2 size={10} className="text-text-muted hover:text-red-400" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); e.stopPropagation(); handleSubmit(); }
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

      <ConfirmDialog
        open={!!deleteTarget}
        title="코멘트 삭제"
        message="이 코멘트를 삭제하시겠습니까?"
        confirmLabel="삭제"
        danger
        onConfirm={() => { if (deleteTarget) onDelete(deleteTarget); setDeleteTarget(null); }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
