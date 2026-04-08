import { useState, useEffect, useRef } from 'react';
import { Trash2, Pin, PinOff, ChevronDown } from 'lucide-react';
import LabEntryTimeline from './LabEntryTimeline';
import LabCommentSection from './LabCommentSection';
import LabEntryForm from './LabEntryForm';
import { StatusBadge } from './LabHypothesisList';
import { formatDate } from '../../lib/utils';
import type {
  LabHypothesis,
  LabEntry,
  LabComment,
  LabHypothesisStatus,
  LabHypothesisCategory,
  LabEntryType,
  Profile,
} from '../../types';

const STATUSES: LabHypothesisStatus[] = ['탐색중', '실험중', '성공', '실패', '보류'];

interface Props {
  hypothesis: LabHypothesis;
  entries: LabEntry[];
  comments: LabComment[];
  commentProfiles: Record<string, Profile>;
  isAdmin: boolean;
  profileId: string;
  onUpdateHypothesis: (id: string, updates: { title?: string; description?: string; status?: LabHypothesisStatus; category?: LabHypothesisCategory; pinned?: boolean }) => Promise<{ error: string | null }>;
  onDeleteHypothesis: (id: string) => Promise<void>;
  onCreateEntry: (input: { hypothesis_id: string; type: LabEntryType; content: string; author_id: string; attachment_urls?: string[] }) => Promise<{ error: string | null }>;
  onDeleteEntry: (id: string) => Promise<{ error: string | null }>;
  onCreateComment: (input: { hypothesis_id: string; author_id: string; content: string }) => Promise<{ error: string | null }>;
  onDeleteComment: (id: string) => Promise<{ error: string | null }>;
  showEntryForm: boolean;
  onShowEntryForm: (show: boolean) => void;
}

export default function LabHypothesisDetail({
  hypothesis,
  entries,
  comments,
  commentProfiles,
  isAdmin,
  profileId,
  onUpdateHypothesis,
  onDeleteHypothesis,
  onCreateEntry,
  onDeleteEntry,
  onCreateComment,
  onDeleteComment,
  showEntryForm,
  onShowEntryForm,
}: Props) {
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const statusMenuRef = useRef<HTMLDivElement>(null);

  // 상태 메뉴 바깥 클릭 닫기
  useEffect(() => {
    if (!showStatusMenu) return;
    const handler = (e: MouseEvent) => {
      if (statusMenuRef.current && !statusMenuRef.current.contains(e.target as Node)) {
        setShowStatusMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showStatusMenu]);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* 상세 헤더 */}
      <div className="shrink-0 border-b border-white/[.04] px-5 pb-4 pt-5">
        <div className="flex items-start justify-between">
          <div className="flex-1 pr-3">
            <h3 className="text-lg font-bold leading-snug text-text-primary">
              {hypothesis.pinned && <Pin size={14} className="mr-1.5 inline text-amber-400" />}
              {hypothesis.title}
            </h3>
            <p className="mt-2 text-[13px] leading-relaxed text-text-secondary">
              {hypothesis.description}
            </p>
          </div>

          {isAdmin && (
            <div className="flex shrink-0 gap-1.5">
              {/* 상태 변경 */}
              <div className="relative" ref={statusMenuRef}>
                <button
                  onClick={() => setShowStatusMenu(!showStatusMenu)}
                  className="flex items-center gap-1 rounded-md border border-white/[.1] bg-transparent px-2.5 py-1 text-[11px] text-text-muted transition-colors hover:bg-white/[.06]"
                >
                  상태 변경 <ChevronDown size={12} />
                </button>
                {showStatusMenu && (
                  <div className="absolute right-0 top-full z-10 mt-1 w-28 rounded-lg border border-white/[.1] bg-bg-secondary py-1 shadow-xl">
                    {STATUSES.map((s) => (
                      <button
                        key={s}
                        onClick={() => {
                          onUpdateHypothesis(hypothesis.id, { status: s });
                          setShowStatusMenu(false);
                        }}
                        className={`w-full px-3 py-1.5 text-left text-[11px] transition-colors hover:bg-white/[.06] ${
                          hypothesis.status === s ? 'font-bold text-accent' : 'text-text-secondary'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 핀 토글 */}
              <button
                onClick={() => onUpdateHypothesis(hypothesis.id, { pinned: !hypothesis.pinned })}
                className="rounded-md border border-white/[.1] px-2 py-1 text-text-muted transition-colors hover:bg-white/[.06]"
                title={hypothesis.pinned ? '핀 해제' : '핀 고정'}
              >
                {hypothesis.pinned ? <PinOff size={13} /> : <Pin size={13} />}
              </button>

              {/* 삭제 */}
              <button
                onClick={() => {
                  if (confirm('이 가설과 모든 기록을 삭제하시겠습니까?')) {
                    onDeleteHypothesis(hypothesis.id);
                  }
                }}
                className="rounded-md border border-white/[.1] px-2 py-1 text-text-muted transition-colors hover:bg-red-500/10 hover:text-red-400"
                title="삭제"
              >
                <Trash2 size={13} />
              </button>
            </div>
          )}
        </div>

        <div className="mt-3 flex items-center gap-3 text-[11px] text-text-muted">
          <StatusBadge status={hypothesis.status} />
          <span className="rounded-md bg-white/[.06] px-1.5 py-0.5">{hypothesis.category}</span>
          <span>{formatDate(hypothesis.created_at)} 시작</span>
          <span>댓글 {comments.length}</span>
        </div>
      </div>

      {/* 타임라인 */}
      <LabEntryTimeline
        entries={entries}
        isAdmin={isAdmin}
        onAddClick={() => onShowEntryForm(true)}
        onDeleteEntry={onDeleteEntry}
      />

      {/* 코멘트 */}
      <LabCommentSection
        comments={comments}
        profiles={commentProfiles}
        profileId={profileId}
        onSubmit={async (content) => {
          await onCreateComment({
            hypothesis_id: hypothesis.id,
            author_id: profileId,
            content,
          });
        }}
        onDelete={onDeleteComment}
      />

      {/* 엔트리 추가 폼 */}
      {showEntryForm && (
        <LabEntryForm
          onSubmit={async (input) => {
            const result = await onCreateEntry({
              ...input,
              hypothesis_id: hypothesis.id,
              author_id: profileId,
            });
            if (!result.error) onShowEntryForm(false);
            return result;
          }}
          onClose={() => onShowEntryForm(false)}
        />
      )}
    </div>
  );
}
