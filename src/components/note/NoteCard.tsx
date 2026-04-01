import { EyeOff, User } from 'lucide-react';
import { formatRelativeTime } from '../../lib/utils';
import type { AnonymousNote } from '../../types';
import type { NoteCategory } from '../../lib/constants';

const CATEGORY_CONFIG: Record<NoteCategory, { color: string; bg: string }> = {
  '건의': { color: '#3b82f6', bg: 'rgba(59,130,246,.15)' },
  '질문': { color: '#f59e0b', bg: 'rgba(245,158,11,.15)' },
  '감사': { color: '#22c55e', bg: 'rgba(34,197,94,.15)' },
  '불편': { color: '#ef4444', bg: 'rgba(239,68,68,.15)' },
  '기타': { color: '#94a3b8', bg: 'rgba(148,163,184,.15)' },
};

const STATUS_CONFIG: Record<string, { dot: string; label: string }> = {
  '미읽음': { dot: 'bg-info', label: '미읽음' },
  '읽음': { dot: 'bg-text-muted', label: '읽음' },
  '답변완료': { dot: 'bg-success', label: '답변완료' },
};

interface NoteCardProps {
  note: AnonymousNote;
  onClick: () => void;
}

export default function NoteCard({ note, onClick }: NoteCardProps) {
  const catConfig = note.category ? CATEGORY_CONFIG[note.category] : null;
  const statusConfig = STATUS_CONFIG[note.status] ?? STATUS_CONFIG['미읽음'];

  return (
    <button
      onClick={onClick}
      className={`flex w-full flex-col gap-2 rounded-xl border p-3 text-left transition-colors duration-200 ${
        note.status === '미읽음'
          ? 'border-info/20 bg-info/[.04] hover:bg-info/[.08]'
          : 'border-white/[.06] bg-white/[.03] hover:bg-white/[.06]'
      }`}
    >
      {/* 상단: 카테고리 + 상태 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {catConfig && (
            <span
              className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium"
              style={{ color: catConfig.color, backgroundColor: catConfig.bg }}
            >
              {note.category}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`h-2 w-2 rounded-full ${statusConfig.dot}`} />
          <span className="text-[10px] text-text-muted">{statusConfig.label}</span>
        </div>
      </div>

      {/* 제목 */}
      <h3 className="text-sm font-semibold text-text-primary line-clamp-1 tracking-wide font-body">{note.title}</h3>

      {/* 하단: 메타 정보 */}
      <div className="flex items-center gap-2 text-[11px] text-text-muted">
        {note.anonymous ? (
          <span className="flex items-center gap-1">
            <EyeOff size={11} /> 익명
          </span>
        ) : (
          <span className="flex items-center gap-1">
            <User size={11} /> 실명
          </span>
        )}
        <span>·</span>
        <span>{note.team}</span>
        <span>·</span>
        <span>{formatRelativeTime(note.created_at)}</span>
      </div>
    </button>
  );
}
