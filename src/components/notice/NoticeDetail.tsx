import { useState, useEffect } from 'react';
import { ArrowLeft, Paperclip, Users, Trash2, Pencil } from 'lucide-react';
import UrgencyBadge from '../common/UrgencyBadge';
import ConfirmDialog from '../common/ConfirmDialog';
import NoticeComments from './NoticeComments';
import { useNotices } from '../../hooks/useNotices';
import { useAuthStore } from '../../stores/authStore';
import { useUiStore } from '../../stores/uiStore';
import { formatRelativeTime, getDisplayName } from '../../lib/utils';
import type { Notice, Profile } from '../../types';

interface NoticeDetailProps {
  notice: Notice;
  onBack: () => void;
  onDeleted?: () => void;
  onEdit?: (notice: Notice) => void;
}

export default function NoticeDetail({ notice, onBack, onDeleted, onEdit }: NoticeDetailProps) {
  const { profile, user } = useAuthStore();
  const { markAsRead, fetchReadStatus, deleteNotice, fetchNoticeComments, addNoticeComment, deleteNoticeComment } = useNotices();
  const { addToast } = useUiStore();

  const isLeader = profile?.role === 'admin' || profile?.role === 'director' || profile?.role === 'leader';
  const isAdmin = profile?.role === 'admin' || profile?.role === 'director';
  const isAuthor = notice.author_id === profile?.id;
  const canDelete = isAdmin || isAuthor;
  const [readers, setReaders] = useState<Profile[]>([]);
  const [readTotal, setReadTotal] = useState(0);
  const [showReaders, setShowReaders] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // 열리면 자동으로 읽음 처리
  useEffect(() => {
    if (user) {
      markAsRead(notice.id, user.id);
    }
  }, [notice.id, user, markAsRead]);

  // 리더: 읽음 현황 로드
  useEffect(() => {
    if (isLeader) {
      fetchReadStatus(notice.id).then(({ readers: r, total }) => {
        setReaders(r);
        setReadTotal(total);
      });
    }
  }, [isLeader, notice.id, fetchReadStatus]);

  const handleDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    const { error } = await deleteNotice(notice.id);
    setDeleting(false);
    setShowDeleteConfirm(false);
    if (error) {
      addToast(`삭제 실패: ${error}`, 'error');
      return;
    }
    addToast('공지가 삭제되었습니다', 'success');
    onDeleted?.();
  };

  return (
    <div className="flex flex-col h-full">
      {/* 헤더 */}
      <div className="flex items-center gap-2 border-b border-white/[.06] px-4 py-3">
        <button
          onClick={onBack}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-white/10 hover:text-text-primary"
        >
          <ArrowLeft size={16} />
        </button>
        <h2 className="flex-1 font-heading text-base font-bold text-text-primary truncate">
          공지 상세
        </h2>
        {isAuthor && onEdit && (
          <button
            onClick={() => onEdit(notice)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-accent/20 hover:text-accent"
            title="수정"
          >
            <Pencil size={14} />
          </button>
        )}
        {canDelete && (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            disabled={deleting}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-danger/20 hover:text-danger disabled:opacity-40"
            title="삭제"
          >
            <Trash2 size={15} />
          </button>
        )}
        <UrgencyBadge urgency={notice.urgency} size="md" />
      </div>

      {/* 본문 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* 메타 */}
        <div className="flex items-center gap-2 text-xs text-text-muted flex-wrap">
          <span className="rounded-full bg-accent/20 px-2 py-0.5 text-accent font-medium">
            {notice.category}
          </span>
          {notice.pinned && <span className="text-warning">📌 고정</span>}
          <span>·</span>
          <span>{formatRelativeTime(notice.created_at)}</span>
          {notice.team && (
            <>
              <span>·</span>
              <span>{notice.team}</span>
            </>
          )}
        </div>

        {/* 제목 */}
        <h3 className="text-lg font-bold text-text-primary font-body">{notice.title}</h3>

        {/* 내용 */}
        <div className="rounded-xl bg-white/[.04] p-3">
          <p className="text-sm text-text-secondary whitespace-pre-wrap leading-relaxed">
            {notice.content}
          </p>
        </div>

        {/* 첨부파일 */}
        {notice.attachment_urls && notice.attachment_urls.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-text-muted flex items-center gap-1">
              <Paperclip size={12} /> 첨부파일 ({notice.attachment_urls.length})
            </p>
            {notice.attachment_urls.map((url, i) => (
              <a
                key={i}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="block truncate rounded-lg bg-white/[.04] px-3 py-1.5 text-xs text-info hover:bg-white/[.08] transition-colors"
              >
                첨부파일 {i + 1}
              </a>
            ))}
          </div>
        )}

        {/* 댓글 */}
        <NoticeComments
          noticeId={notice.id}
          fetchComments={fetchNoticeComments}
          addComment={addNoticeComment}
          deleteComment={deleteNoticeComment}
        />

        {/* 리더 전용: 읽음 현황 */}
        {isLeader && (
          <div className="rounded-xl border border-accent/20 bg-accent/[.06] p-3 space-y-2">
            <button
              onClick={() => setShowReaders(!showReaders)}
              className="flex items-center gap-2 text-xs font-semibold text-accent"
            >
              <Users size={14} />
              읽음 현황: {readTotal}명 읽음
            </button>
            {showReaders && readers.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {readers.map((r) => (
                  <span
                    key={r.id}
                    className="inline-flex items-center gap-1 rounded-full bg-white/[.08] px-2 py-0.5 text-[10px] text-text-secondary"
                  >
                    <span
                      className="h-4 w-4 rounded-full flex items-center justify-center text-[8px]"
                      style={{ backgroundColor: r.avatar_color }}
                    >
                      {r.avatar_emoji}
                    </span>
                    {getDisplayName(r, isLeader)}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={showDeleteConfirm}
        title="공지 삭제"
        message="이 공지를 삭제하시겠습니까? 삭제 후 복구할 수 없습니다."
        confirmLabel="삭제"
        danger
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}
