import { useState } from 'react';
import { ArrowLeft, EyeOff, User, Trash2 } from 'lucide-react';
import ThreadPanel from '../thread/ThreadPanel';
import ConfirmDialog from '../common/ConfirmDialog';
import { useNotes } from '../../hooks/useNotes';
import { useAuthStore } from '../../stores/authStore';
import { useUiStore } from '../../stores/uiStore';
import { supabase } from '../../lib/supabase';
import { formatRelativeTime } from '../../lib/utils';
import type { AnonymousNote } from '../../types';

const STATUS_CONFIG: Record<string, { color: string; bg: string }> = {
  '미읽음': { color: '#3b82f6', bg: 'rgba(59,130,246,.15)' },
  '읽음': { color: '#94a3b8', bg: 'rgba(148,163,184,.15)' },
  '답변완료': { color: '#22c55e', bg: 'rgba(34,197,94,.15)' },
};

interface NoteDetailProps {
  note: AnonymousNote;
  onBack: () => void;
  onUpdated: (note: AnonymousNote) => void;
  onDeleted?: () => void;
}

export default function NoteDetail({ note, onBack, onUpdated, onDeleted }: NoteDetailProps) {
  const { profile } = useAuthStore();
  const { updateNoteStatus, isAnonymousAuthor, deleteNote } = useNotes();
  const { addToast } = useUiStore();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isRecipient = note.recipient_id === profile?.id;
  const isAdmin = profile?.role === 'admin' || profile?.role === 'director';
  const canReplyAsAuthor = note.anonymous
    ? isAnonymousAuthor(note.id, note.session_token)
    : note.sender_id === profile?.id;
  const canDelete = isAdmin || canReplyAsAuthor;

  const statusConfig = STATUS_CONFIG[note.status] ?? STATUS_CONFIG['미읽음'];

  const handleMarkAsRead = async () => {
    if (note.status !== '미읽음') return;
    const { data, error } = await updateNoteStatus(note.id, '읽음');
    if (error) {
      addToast(`상태 변경 실패: ${error}`, 'error');
      return;
    }
    if (data) onUpdated(data);
  };

  // 답변 시 자동으로 '답변완료' 처리 + 실명 작성자에게 notification
  const handleThreadReply = async () => {
    if (note.status !== '답변완료') {
      const { data, error } = await updateNoteStatus(note.id, '답변완료');
      if (error) {
        addToast(`상태 변경 실패: ${error}`, 'error');
        return;
      }
      if (data) onUpdated(data);
    }

    // 실명 쪽지 작성자에게 답변 알림
    if (!note.anonymous && note.sender_id) {
      try {
        await supabase.from('notifications').insert({
          user_id: note.sender_id,
          type: 'note_reply',
          urgency: '할일',
          title: '쪽지에 답변이 도착했습니다',
          body: note.title,
          link: `/note/${note.id}`,
          channel: 'in_app',
        });
      } catch {
        // notification 실패해도 답변은 정상 완료
      }
    }
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
          쪽지 상세
        </h2>
        <span
          className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium"
          style={{ color: statusConfig.color, backgroundColor: statusConfig.bg }}
        >
          {note.status}
        </span>
      </div>

      {/* 본문 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* 카테고리 + 메타 */}
        <div className="flex items-center gap-2 text-xs text-text-muted">
          {note.category && (
            <span className="rounded-full bg-accent/20 px-2 py-0.5 text-accent font-medium">
              {note.category}
            </span>
          )}
          <span>·</span>
          <span>{note.team}</span>
          <span>·</span>
          <span>{formatRelativeTime(note.created_at)}</span>
        </div>

        {/* 제목 */}
        <h3 className="text-lg font-bold text-text-primary">{note.title}</h3>

        {/* 작성자 */}
        <div className="flex items-center gap-1 text-xs text-text-muted">
          {note.anonymous ? (
            <>
              <EyeOff size={12} /> 익명
            </>
          ) : (
            <>
              <User size={12} /> 실명
            </>
          )}
        </div>

        {/* 내용 */}
        <div className="rounded-xl bg-white/[.04] p-3">
          <p className="text-sm text-text-secondary whitespace-pre-wrap leading-relaxed">
            {note.content}
          </p>
        </div>

        {/* 리더 전용: 읽음 처리 버튼 */}
        {isRecipient && note.status === '미읽음' && (
          <button
            onClick={handleMarkAsRead}
            className="w-full rounded-lg border border-info/20 bg-info/[.08] py-2 text-sm font-medium text-info transition-colors hover:bg-info/[.15]"
          >
            읽음 처리
          </button>
        )}

        {/* 대화 스레드 */}
        <ThreadPanel
          refType="note"
          refId={note.id}
          canReplyAsAuthor={canReplyAsAuthor}
          canReplyAsManager={isRecipient}
          onMessageSent={isRecipient ? handleThreadReply : undefined}
        />
      </div>
    </div>
  );
}
