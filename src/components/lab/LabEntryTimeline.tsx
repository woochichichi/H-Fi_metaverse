import { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Pencil, Check, X, Loader2 } from 'lucide-react';
import ConfirmDialog from '../common/ConfirmDialog';
import { formatDate } from '../../lib/utils';
import type { LabEntry, LabEntryType } from '../../types';

const ENTRY_CONFIG: Record<LabEntryType, { emoji: string; label: string; dotColor: string; badgeCls: string }> = {
  '시도': { emoji: '🧪', label: '시도', dotColor: 'border-blue-500 bg-blue-500/20', badgeCls: 'bg-blue-500/10 text-blue-400' },
  '결과': { emoji: '📊', label: '결과', dotColor: 'border-emerald-500 bg-emerald-500/20', badgeCls: 'bg-emerald-500/10 text-emerald-400' },
  '학습': { emoji: '💡', label: '학습', dotColor: 'border-amber-500 bg-amber-500/20', badgeCls: 'bg-amber-500/10 text-amber-400' },
  '메모': { emoji: '📝', label: '메모', dotColor: 'border-zinc-500 bg-zinc-500/20', badgeCls: 'bg-zinc-500/10 text-zinc-400' },
};

interface Props {
  entries: LabEntry[];
  isAdmin: boolean;
  loading: boolean;
  onAddClick: () => void;
  onUpdateEntry: (id: string, updates: { content?: string; type?: LabEntryType }) => Promise<{ error: string | null }>;
  onDeleteEntry: (id: string) => Promise<{ error: string | null }>;
}

export default function LabEntryTimeline({ entries, isAdmin, loading, onAddClick, onUpdateEntry, onDeleteEntry }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const prevCount = useRef(entries.length);

  // 가설 전환 시 편집 상태 초기화 (entries 배열 참조 변경 감지)
  const prevFirstId = useRef(entries[0]?.id);
  useEffect(() => {
    if (entries[0]?.id !== prevFirstId.current) {
      setEditingId(null);
      setDeleteTarget(null);
      prevFirstId.current = entries[0]?.id;
    }
  }, [entries]);

  // 엔트리 추가 시 하단 스크롤
  useEffect(() => {
    if (entries.length > prevCount.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevCount.current = entries.length;
  }, [entries.length]);

  const startEdit = (entry: LabEntry) => {
    setEditingId(entry.id);
    setEditContent(entry.content);
  };

  const saveEdit = async (id: string) => {
    if (!editContent.trim()) return;
    await onUpdateEntry(id, { content: editContent.trim() });
    setEditingId(null);
  };

  return (
    <div className="flex-1 overflow-y-auto px-5 py-4 scrollbar-thin">
      <div className="mb-4 flex items-center justify-between">
        <h4 className="flex items-center gap-1.5 text-[13px] font-bold text-text-muted">
          히스토리
          <span className="rounded-full bg-white/[.08] px-1.5 py-0.5 text-[10px] font-semibold">{entries.length}</span>
        </h4>
        {isAdmin && (
          <button onClick={onAddClick} className="flex items-center gap-1 rounded-md bg-accent px-3 py-1.5 text-[11px] font-bold text-bg-primary transition-colors hover:bg-accent/80">
            <Plus size={13} /> 기록 추가
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 text-text-muted">
          <Loader2 size={20} className="animate-spin" />
        </div>
      ) : entries.length === 0 ? (
        <div className="py-8 text-center text-xs text-text-muted">아직 기록이 없습니다</div>
      ) : (
        <div className="relative pl-6">
          <div className="absolute bottom-1 left-[7px] top-1 w-0.5 rounded-full bg-white/[.06]" />
          {entries.map((entry) => {
            const cfg = ENTRY_CONFIG[entry.type];
            const isEditing = editingId === entry.id;
            return (
              <div key={entry.id} className="group relative mb-5">
                <div className={`absolute -left-[17px] top-[18px] h-3 w-3 rounded-full border-2 ${cfg.dotColor}`} />
                <div className="rounded-xl border border-white/[.04] bg-white/[.02] p-3.5 transition-colors hover:border-white/[.08] hover:bg-white/[.04]">
                  <div className="mb-2 flex items-center justify-between">
                    <span className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold ${cfg.badgeCls}`}>
                      {cfg.emoji} {cfg.label}
                    </span>
                    {isAdmin && !isEditing && (
                      <div className="flex gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                        <button onClick={() => startEdit(entry)}>
                          <Pencil size={12} className="text-text-muted hover:text-accent" />
                        </button>
                        <button onClick={() => setDeleteTarget(entry.id)}>
                          <Trash2 size={12} className="text-text-muted hover:text-red-400" />
                        </button>
                      </div>
                    )}
                  </div>
                  {isEditing ? (
                    <div>
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        rows={3}
                        className="w-full resize-y rounded-lg border border-white/[.1] bg-white/[.04] px-3 py-2 text-[13px] leading-relaxed text-text-primary outline-none focus:border-accent/40"
                      />
                      <div className="mt-1.5 flex gap-1.5">
                        <button onClick={() => saveEdit(entry.id)} className="flex items-center gap-1 rounded-md bg-accent px-2 py-1 text-[10px] font-semibold text-bg-primary hover:bg-accent/80">
                          <Check size={11} /> 저장
                        </button>
                        <button onClick={() => setEditingId(null)} className="flex items-center gap-1 rounded-md bg-white/[.06] px-2 py-1 text-[10px] text-text-muted hover:bg-white/[.1]">
                          <X size={11} /> 취소
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-text-secondary">{entry.content}</p>
                  )}
                  {!isEditing && entry.attachment_urls.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap gap-2">
                      {entry.attachment_urls.map((url, i) => {
                        const isImage = /\.(png|jpe?g|gif|webp|svg)(\?|$)/i.test(url);
                        return isImage ? (
                          <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                            <img src={url} alt={`첨부 ${i + 1}`} className="h-16 rounded-md border border-white/[.08] object-cover transition-opacity hover:opacity-80" />
                          </a>
                        ) : (
                          <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1.5 rounded-md bg-white/[.03] px-2.5 py-1.5 text-[11px] text-text-muted transition-colors hover:bg-white/[.06]">
                            📎 첨부파일 {i + 1}
                          </a>
                        );
                      })}
                    </div>
                  )}
                  {!isEditing && <div className="mt-2 text-[10px] text-text-muted">{formatDate(entry.created_at)}</div>}
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="기록 삭제"
        message="이 기록을 삭제하시겠습니까?"
        confirmLabel="삭제"
        danger
        onConfirm={() => { if (deleteTarget) onDeleteEntry(deleteTarget); setDeleteTarget(null); }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
