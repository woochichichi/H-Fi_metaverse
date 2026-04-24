import type { ReactNode } from 'react';
import { Trash2 } from 'lucide-react';
import { AttachmentsGrid } from './DetailShell';

/* ============================================================
   ConversationThread — 게시글 상세 패널 공통 셸
   VOC/공지/아이디어/익명쪽지 등의 우측 detail에서
   "대화 스레드" 형태로 발언/시스템 이벤트/회신/컴포저를 일관되게 표현.
   v2-warm/v2-dark 양 테마 자동 대응 (CSS 토큰만 사용).
   ============================================================ */

export function ThreadShell({ children }: { children: ReactNode }) {
  return <div className="w-thread-shell">{children}</div>;
}

interface ThreadHeaderProps {
  title: string;
  /** 상단 칩 컬렉션 (상태/카테고리/익명/심각도 등) */
  badges?: ReactNode;
  /** 우측 액션 (공감 등). 삭제 버튼은 별도 prop */
  extraActions?: ReactNode;
  canDelete?: boolean;
  onDelete?: () => void;
}

export function ThreadHeader({
  title,
  badges,
  extraActions,
  canDelete,
  onDelete,
}: ThreadHeaderProps) {
  return (
    <div className="w-thread-header">
      <div className="w-thread-header-main">
        {badges && <div className="w-thread-badges">{badges}</div>}
        <h2 className="w-thread-title">{title}</h2>
      </div>
      <div className="w-thread-actions">
        {extraActions}
        {canDelete && onDelete && (
          <button
            className="w-thread-action-btn w-thread-action-danger"
            onClick={onDelete}
            title="삭제"
            aria-label="삭제"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

export type AvatarTone = 'author' | 'anon' | 'leader' | 'admin' | 'system';

export function ThreadAvatar({ tone, label }: { tone: AvatarTone; label?: string }) {
  return <div className={`w-thread-av w-thread-av-${tone}`}>{label ?? '?'}</div>;
}

interface ThreadEntryProps {
  /** 말풍선 색 톤 */
  variant?: 'author' | 'leader' | 'admin';
  avatarTone: AvatarTone;
  avatarLabel?: string;
  /** 작성자 이름 (또는 '익명') */
  authorName: string;
  /** 작성자 옆 칩 (예: 리더, ADMIN) */
  authorBadge?: ReactNode;
  /** 시간 표시 (예: "2시간 전") */
  timestamp: string;
  /** 추가 메타 (예: 팀명) — 시간 옆에 점으로 구분되어 노출 */
  extraMeta?: ReactNode;
  /** 본문 (pre-wrap 유지) */
  children: ReactNode;
  /** 첨부 URL 리스트 */
  attachments?: string[] | null;
}

export function ThreadEntry({
  variant = 'author',
  avatarTone,
  avatarLabel,
  authorName,
  authorBadge,
  timestamp,
  extraMeta,
  children,
  attachments,
}: ThreadEntryProps) {
  return (
    <div className="w-thread-entry">
      <ThreadAvatar tone={avatarTone} label={avatarLabel} />
      <div className="w-thread-entry-body">
        <div className="w-thread-entry-meta">
          <span className="w-thread-author">{authorName}</span>
          {authorBadge}
          {extraMeta && (
            <>
              <span className="w-thread-meta-sep">·</span>
              {extraMeta}
            </>
          )}
          <span className="w-thread-meta-sep">·</span>
          <time>{timestamp}</time>
        </div>
        <div className={`w-thread-bubble w-thread-bubble-${variant}`}>
          <div className="w-thread-body">{children}</div>
          {attachments && attachments.length > 0 && (
            <div className="w-thread-bubble-attachments">
              <AttachmentsGrid urls={attachments} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface ThreadEventProps {
  icon?: ReactNode;
  children: ReactNode;
}

export function ThreadEvent({ icon, children }: ThreadEventProps) {
  return (
    <div className="w-thread-event">
      <div className="w-thread-av w-thread-av-system">{icon ?? '·'}</div>
      <div className="w-thread-event-text">{children}</div>
    </div>
  );
}

interface ThreadComposerProps {
  /** 라벨 텍스트 (예: "리더 회신") */
  label?: string;
  /** 라벨 우측 영역 (예: 상태 picker) */
  topActions?: ReactNode;
  /** textarea를 표시할지 (false면 라벨 + topActions만 사용 — 상태 picker 단독 등) */
  textarea?: {
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    rows?: number;
  };
  /** 좌측 보조 텍스트 */
  helper?: ReactNode;
  /** 저장 버튼 텍스트 */
  submitLabel?: string;
  submitDisabled?: boolean;
  onSubmit?: () => void;
}

export function ThreadComposer({
  label,
  topActions,
  textarea,
  helper,
  submitLabel = '저장',
  submitDisabled,
  onSubmit,
}: ThreadComposerProps) {
  return (
    <div className="w-thread-composer-card">
      {(label || topActions) && (
        <div className="w-thread-composer-head">
          {label && <span className="w-thread-composer-label">{label}</span>}
          {topActions}
        </div>
      )}
      {textarea && (
        <textarea
          className="w-thread-composer-textarea"
          rows={textarea.rows ?? 3}
          placeholder={textarea.placeholder}
          value={textarea.value}
          onChange={(e) => textarea.onChange(e.target.value)}
        />
      )}
      {(helper || onSubmit) && (
        <div className="w-thread-composer-foot">
          {helper}
          {onSubmit && (
            <button
              className="w-btn w-btn-primary w-thread-submit"
              onClick={onSubmit}
              disabled={submitDisabled}
            >
              {submitLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
