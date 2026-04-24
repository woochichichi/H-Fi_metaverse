import type { ReactNode } from 'react';
import { Trash2 } from 'lucide-react';
import { AttachmentsGrid } from './DetailShell';

/* ============================================================
   PostDetail — C안 (Workflow Tracker) 패턴
   대시보드와 동일한 시각 언어로 게시글 상세를 구성하는
   building blocks. CSS 토큰만 사용 → v2-warm/v2-dark 자동 대응.
   ============================================================ */

export type PdTone = 'accent' | 'info' | 'todo' | 'crit' | 'success' | 'muted';

/* ---------- HeaderCard: 큰 아이콘 + ID + 칩 + 제목 + 메타 + 액션 ---------- */
interface PostHeaderCardProps {
  icon?: ReactNode;
  iconTone?: PdTone;
  badgeId?: string;
  badges?: ReactNode;
  title: string;
  metaLine?: ReactNode;
  extraActions?: ReactNode;
  canDelete?: boolean;
  onDelete?: () => void;
}

export function PostHeaderCard({
  icon,
  iconTone = 'accent',
  badgeId,
  badges,
  title,
  metaLine,
  extraActions,
  canDelete,
  onDelete,
}: PostHeaderCardProps) {
  return (
    <div className="w-pd-card w-pd-header">
      {icon && <div className={`w-pd-header-ic w-pd-tone-${iconTone}`}>{icon}</div>}
      <div className="w-pd-header-body">
        {(badgeId || badges) && (
          <div className="w-pd-header-badges">
            {badgeId && <span className="w-pd-id">{badgeId}</span>}
            {badges}
          </div>
        )}
        <h2 className="w-pd-title">{title}</h2>
        {metaLine && <div className="w-pd-meta">{metaLine}</div>}
      </div>
      {(extraActions || (canDelete && onDelete)) && (
        <div className="w-pd-header-actions">
          {extraActions}
          {canDelete && onDelete && (
            <button
              className="w-pd-icon-btn w-pd-icon-danger"
              onClick={onDelete}
              title="삭제"
              aria-label="삭제"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------- WorkflowStepper: 상태 단계 시각화 + 빠른 진행 액션 ---------- */
interface WorkflowStep<T extends string> {
  key: T;
  label: string;
  time?: string;
}
interface WorkflowStepperProps<T extends string> {
  title?: string;
  steps: WorkflowStep<T>[];
  currentKey: T;
  quickActions?: ReactNode;
  progressText?: string;
}

export function WorkflowStepper<T extends string>({
  title = '워크플로우',
  steps,
  currentKey,
  quickActions,
  progressText,
}: WorkflowStepperProps<T>) {
  const idx = steps.findIndex((s) => s.key === currentKey);
  const text =
    progressText ??
    (idx >= 0
      ? `${idx + 1}단계 / ${steps.length}단계 (${Math.round(((idx + 1) / steps.length) * 100)}%)`
      : '');
  return (
    <div className="w-pd-card w-pd-stepper">
      <div className="w-pd-stepper-head">
        <div className="w-pd-stepper-title">{title}</div>
        {text && <div className="w-pd-stepper-progress">{text}</div>}
      </div>
      <div className="w-pd-stepper-track">
        {steps.map((s, i) => {
          const state = i < idx ? 'done' : i === idx ? 'current' : 'future';
          return (
            <div key={s.key} className={`w-pd-step w-pd-step-${state}`}>
              <div className="w-pd-step-circle">
                {state === 'done' ? '✓' : state === 'current' ? '●' : i + 1}
              </div>
              <div className="w-pd-step-lbl">{s.label}</div>
              {s.time && <div className="w-pd-step-time">{s.time}</div>}
              {i < steps.length - 1 && <div className="w-pd-step-line" />}
            </div>
          );
        })}
      </div>
      {quickActions && <div className="w-pd-stepper-actions">{quickActions}</div>}
    </div>
  );
}

/* ---------- DescriptionCard: 본문 + 첨부 ---------- */
interface DescriptionCardProps {
  label?: string;
  timestamp?: string;
  children: ReactNode;
  attachments?: string[] | null;
}

export function DescriptionCard({
  label = '본문',
  timestamp,
  children,
  attachments,
}: DescriptionCardProps) {
  return (
    <div className="w-pd-card w-pd-description">
      <div className="w-pd-card-head">
        <span className="w-pd-card-label">{label}</span>
        {timestamp && <span className="w-pd-card-meta">{timestamp}</span>}
      </div>
      <div className="w-pd-body">{children}</div>
      {attachments && attachments.length > 0 && (
        <div className="w-pd-attachments">
          <AttachmentsGrid urls={attachments} />
        </div>
      )}
    </div>
  );
}

/* ---------- ReplyCard: 그라데이션 강조 카드 (리더 회신 등) ---------- */
interface ReplyCardProps {
  authorName: string;
  authorBadge?: ReactNode;
  avatarLabel: string;
  timestamp: string;
  variant?: 'leader' | 'system';
  tag?: string;
  children: ReactNode;
}

export function ReplyCard({
  authorName,
  authorBadge,
  avatarLabel,
  timestamp,
  variant = 'leader',
  tag = 'REPLY',
  children,
}: ReplyCardProps) {
  return (
    <div className={`w-pd-card w-pd-reply w-pd-reply-${variant}`}>
      <div className="w-pd-reply-head">
        <div className={`w-pd-av w-pd-av-${variant}`}>{avatarLabel}</div>
        <div className="w-pd-reply-meta">
          <div className="w-pd-reply-author">
            {authorName}
            {authorBadge}
          </div>
          <div className="w-pd-reply-time">{timestamp}</div>
        </div>
        <div className="w-pd-reply-tag">{tag}</div>
      </div>
      <div className="w-pd-reply-body">{children}</div>
    </div>
  );
}

/* ---------- ComposerCard: 라벨 + 우측 액션(status picker) + textarea + submit ---------- */
interface ComposerCardProps {
  label?: string;
  topActions?: ReactNode;
  textarea?: {
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    rows?: number;
  };
  helper?: ReactNode;
  submitLabel?: string;
  submitDisabled?: boolean;
  onSubmit?: () => void;
}

export function ComposerCard({
  label,
  topActions,
  textarea,
  helper,
  submitLabel = '저장',
  submitDisabled,
  onSubmit,
}: ComposerCardProps) {
  return (
    <div className="w-pd-card w-pd-composer">
      {(label || topActions) && (
        <div className="w-pd-composer-head">
          {label && <div className="w-pd-composer-label">{label}</div>}
          {topActions}
        </div>
      )}
      {textarea && (
        <textarea
          className="w-pd-composer-textarea"
          rows={textarea.rows ?? 3}
          placeholder={textarea.placeholder}
          value={textarea.value}
          onChange={(e) => textarea.onChange(e.target.value)}
        />
      )}
      {(helper || onSubmit) && (
        <div className="w-pd-composer-foot">
          {helper}
          {onSubmit && (
            <button
              className="w-btn w-btn-primary w-pd-composer-submit"
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

/* ---------- MiniStat: 사이드 KPI 위젯 ---------- */
interface MiniStatProps {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  trend?: 'up' | 'down' | 'flat';
}

export function MiniStat({ label, value, sub, trend = 'flat' }: MiniStatProps) {
  return (
    <div className="w-pd-card w-pd-ministat">
      <div className="w-pd-ministat-label">{label}</div>
      <div className="w-pd-ministat-value">{value}</div>
      {sub && <div className={`w-pd-ministat-sub w-pd-trend-${trend}`}>{sub}</div>}
    </div>
  );
}

/* ---------- ActivityLogCard ---------- */
interface ActivityItem {
  dot?: PdTone;
  text: ReactNode;
  timestamp: string;
}
interface ActivityLogCardProps {
  items: ActivityItem[];
  label?: string;
}

export function ActivityLogCard({ items, label = '활동 로그' }: ActivityLogCardProps) {
  if (items.length === 0) return null;
  return (
    <div className="w-pd-card w-pd-activity">
      <div className="w-pd-card-head">
        <span className="w-pd-card-label">{label}</span>
        <span className="w-pd-card-meta">{items.length}건</span>
      </div>
      <ul className="w-pd-activity-list">
        {items.map((it, i) => (
          <li key={i}>
            <span className={`w-pd-activity-dot w-pd-tone-${it.dot ?? 'accent'}`} />
            <span className="w-pd-activity-text">{it.text}</span>
            <span className="w-pd-activity-time">{it.timestamp}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
