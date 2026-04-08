import { Plus, Trash2 } from 'lucide-react';
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
  onAddClick: () => void;
  onDeleteEntry: (id: string) => Promise<{ error: string | null }>;
}

export default function LabEntryTimeline({ entries, isAdmin, onAddClick, onDeleteEntry }: Props) {
  return (
    <div className="flex-1 overflow-y-auto px-5 py-4 scrollbar-thin">
      {/* 헤더 */}
      <div className="mb-4 flex items-center justify-between">
        <h4 className="flex items-center gap-1.5 text-[13px] font-bold text-text-muted">
          히스토리
          <span className="rounded-full bg-white/[.08] px-1.5 py-0.5 text-[10px] font-semibold">
            {entries.length}
          </span>
        </h4>
        {isAdmin && (
          <button
            onClick={onAddClick}
            className="flex items-center gap-1 rounded-md bg-accent px-3 py-1.5 text-[11px] font-bold text-bg-primary transition-colors hover:bg-accent/80"
          >
            <Plus size={13} /> 기록 추가
          </button>
        )}
      </div>

      {entries.length === 0 ? (
        <div className="py-8 text-center text-xs text-text-muted">아직 기록이 없습니다</div>
      ) : (
        <div className="relative pl-6">
          {/* 타임라인 세로선 */}
          <div className="absolute bottom-1 left-[7px] top-1 w-0.5 rounded-full bg-white/[.06]" />

          {entries.map((entry) => {
            const cfg = ENTRY_CONFIG[entry.type];
            return (
              <div key={entry.id} className="group relative mb-5">
                {/* 타임라인 점 */}
                <div
                  className={`absolute -left-[17px] top-[18px] h-3 w-3 rounded-full border-2 ${cfg.dotColor}`}
                />

                <div className="rounded-xl border border-white/[.04] bg-white/[.02] p-3.5 transition-colors hover:border-white/[.08] hover:bg-white/[.04]">
                  <div className="mb-2 flex items-center justify-between">
                    <span className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold ${cfg.badgeCls}`}>
                      {cfg.emoji} {cfg.label}
                    </span>
                    {isAdmin && (
                      <button
                        onClick={() => {
                          if (confirm('이 기록을 삭제하시겠습니까?')) onDeleteEntry(entry.id);
                        }}
                        className="opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <Trash2 size={13} className="text-text-muted hover:text-red-400" />
                      </button>
                    )}
                  </div>
                  <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-text-secondary">
                    {entry.content}
                  </p>
                  {entry.attachment_urls.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap gap-2">
                      {entry.attachment_urls.map((url, i) => (
                        <a
                          key={i}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 rounded-md bg-white/[.03] px-2.5 py-1.5 text-[11px] text-text-muted transition-colors hover:bg-white/[.06]"
                        >
                          📎 첨부파일 {i + 1}
                        </a>
                      ))}
                    </div>
                  )}
                  <div className="mt-2 text-[10px] text-text-muted">{formatDate(entry.created_at)}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
