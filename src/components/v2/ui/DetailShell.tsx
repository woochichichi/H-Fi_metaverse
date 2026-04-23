import type { ReactNode } from 'react';
import { Paperclip, FileText, Image as ImageIcon, Download, Trash2 } from 'lucide-react';

/**
 * v2 상세 모달 공통 레이아웃 프리미티브.
 * 모든 콘텐츠 상세(공지/VOC/아이디어)의 시각 구조를 통일한다.
 *
 * 스코프: .v2-warm / .v2-dark 내부에서 사용 — CSS 토큰(--w-*)만 사용하여
 * 테마 전환에 자동 대응.
 */

/* =========================================================
   DetailBadges — 배지 컬렉션 (상단 분류/시급성/상태)
   배지 자체는 이미 .w-badge-* 존재. 여기는 컨테이너만 표준화.
========================================================= */
export function DetailBadges({ children }: { children: ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
      {children}
    </div>
  );
}

/* =========================================================
   MetaRow — 작성자/날짜/조회수 등을 아이콘 + 값 쌍으로 가로 배치
========================================================= */
interface MetaItem {
  icon: ReactNode;
  label: string;
  value: string | number;
}

export function MetaRow({ items }: { items: MetaItem[] }) {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 16,
        padding: '10px 12px',
        background: 'var(--w-surface-2)',
        border: '1px solid var(--w-border)',
        borderRadius: 'var(--w-radius-sm)',
        fontSize: 12,
        color: 'var(--w-text-soft)',
      }}
    >
      {items.map((it, i) => (
        <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: 'var(--w-text-muted)', display: 'inline-flex' }}>{it.icon}</span>
          <span style={{ color: 'var(--w-text-muted)' }}>{it.label}</span>
          <span style={{ color: 'var(--w-text)', fontWeight: 600 }}>{it.value}</span>
        </span>
      ))}
    </div>
  );
}

/* =========================================================
   DetailBody — 본문 (입력 pre-wrap 유지하되 타이포·리듬 개선)
========================================================= */
export function DetailBody({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        fontSize: 14,
        color: 'var(--w-text)',
        whiteSpace: 'pre-wrap',
        lineHeight: 1.75,
        padding: '4px 2px',
      }}
    >
      {children}
    </div>
  );
}

/* =========================================================
   SectionDivider — 시각적 구분선 + 섹션 라벨
========================================================= */
export function SectionDivider({ label }: { label?: string }) {
  if (!label) return <div style={{ height: 1, background: 'var(--w-border)', margin: '4px 0' }} />;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '4px 0' }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--w-text-muted)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 1, background: 'var(--w-border)' }} />
    </div>
  );
}

/* =========================================================
   AttachmentsGrid — 이미지 썸네일 + 비이미지 파일 카드
========================================================= */
const IMAGE_EXT = /\.(png|jpe?g|gif|webp|avif|svg)(\?|$)/i;

function filenameFromUrl(url: string): string {
  try {
    const u = new URL(url);
    const last = u.pathname.split('/').pop() ?? url;
    return decodeURIComponent(last);
  } catch {
    return url.split('/').pop() ?? url;
  }
}

export function AttachmentsGrid({ urls }: { urls: string[] | null | undefined }) {
  if (!urls || urls.length === 0) return null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--w-text-muted)' }}>
        <Paperclip size={13} />
        <span>첨부파일 {urls.length}건</span>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
          gap: 8,
        }}
      >
        {urls.map((url, i) => {
          const isImage = IMAGE_EXT.test(url);
          const name = filenameFromUrl(url);
          return isImage ? (
            <a
              key={i}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'block',
                aspectRatio: '4 / 3',
                borderRadius: 'var(--w-radius-sm)',
                overflow: 'hidden',
                border: '1px solid var(--w-border)',
                background: 'var(--w-surface-2)',
                position: 'relative',
              }}
              title={name}
            >
              <img
                src={url}
                alt={name}
                loading="lazy"
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
              <span
                aria-hidden
                style={{
                  position: 'absolute',
                  left: 6,
                  top: 6,
                  padding: '2px 6px',
                  borderRadius: 4,
                  background: 'rgba(0,0,0,0.55)',
                  color: '#fff',
                  fontSize: 10,
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3,
                }}
              >
                <ImageIcon size={10} /> 이미지
              </span>
            </a>
          ) : (
            <a
              key={i}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 12px',
                borderRadius: 'var(--w-radius-sm)',
                border: '1px solid var(--w-border)',
                background: 'var(--w-surface)',
                color: 'var(--w-text)',
                textDecoration: 'none',
                fontSize: 12,
                minHeight: 56,
              }}
              title={name}
            >
              <FileText size={18} style={{ color: 'var(--w-accent)', flexShrink: 0 }} />
              <span
                style={{
                  flex: 1,
                  minWidth: 0,
                  fontWeight: 600,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {name}
              </span>
              <Download size={13} style={{ color: 'var(--w-text-muted)', flexShrink: 0 }} />
            </a>
          );
        })}
      </div>
    </div>
  );
}

/* =========================================================
   StatusPicker — 상태 전환 버튼 그룹 (의미별 색상)
   어떤 의미에 어떤 색을 줄지는 페이지마다 다를 수 있어
   tone 매핑은 호출부에서 주입한다.
========================================================= */
export type StatusTone = 'neutral' | 'todo' | 'accent' | 'success' | 'danger';

interface StatusPickerProps<T extends string> {
  label?: string;
  current: T;
  options: T[];
  toneOf: (v: T) => StatusTone;
  onChange: (v: T) => void;
  disabled?: boolean;
}

function toneStyle(tone: StatusTone, selected: boolean): React.CSSProperties {
  if (!selected) {
    return {
      background: 'transparent',
      color: 'var(--w-text-soft)',
      border: '1px solid var(--w-border)',
    };
  }
  switch (tone) {
    case 'todo':
      return { background: 'var(--w-urgency-todo-soft)', color: 'var(--w-urgency-todo)', border: '1px solid transparent' };
    case 'accent':
      return { background: 'var(--w-accent)', color: '#fff', border: '1px solid transparent' };
    case 'success':
      return { background: 'rgba(63, 157, 110, 0.16)', color: 'var(--w-success)', border: '1px solid transparent' };
    case 'danger':
      return { background: 'var(--w-urgency-critical-soft)', color: 'var(--w-urgency-critical)', border: '1px solid transparent' };
    case 'neutral':
    default:
      return { background: 'var(--w-surface-2)', color: 'var(--w-text)', border: '1px solid var(--w-border-strong)' };
  }
}

export function StatusPicker<T extends string>({
  label,
  current,
  options,
  toneOf,
  onChange,
  disabled,
}: StatusPickerProps<T>) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {label && (
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--w-text-muted)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          {label}
        </div>
      )}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {options.map((opt) => {
          const selected = opt === current;
          return (
            <button
              key={opt}
              className="w-btn"
              style={{
                padding: '6px 12px',
                fontSize: 12,
                fontWeight: 600,
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.5 : 1,
                ...toneStyle(toneOf(opt), selected),
              }}
              disabled={disabled}
              onClick={() => !selected && onChange(opt)}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* =========================================================
   DetailPanelHeader — 상세 패널 공통 헤더
   제목 + 삭제 아이콘 (닫기 버튼 없음 — 다른 리스트 아이템 클릭하면 자연 전환)
========================================================= */
interface DetailPanelHeaderProps {
  title: string;
  /** 삭제 권한이 있을 때만 아이콘 노출 */
  canDelete?: boolean;
  onDelete?: () => void;
  /** 추가 액션(공감, 공유 등) — 헤더 우측 삭제 앞에 배치 */
  extraActions?: ReactNode;
}

export function DetailPanelHeader({ title, canDelete, onDelete, extraActions }: DetailPanelHeaderProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
      <h2
        style={{
          margin: 0,
          fontSize: 18,
          fontWeight: 700,
          color: 'var(--w-text)',
          flex: 1,
          lineHeight: 1.35,
          minWidth: 0,
          wordBreak: 'break-word',
        }}
      >
        {title}
      </h2>
      {extraActions}
      {canDelete && onDelete && (
        <button
          onClick={onDelete}
          title="삭제"
          aria-label="삭제"
          style={{
            width: 32,
            height: 32,
            flexShrink: 0,
            display: 'grid',
            placeItems: 'center',
            borderRadius: 'var(--w-radius-sm)',
            background: 'transparent',
            color: 'var(--w-text-muted)',
            border: '1px solid var(--w-border)',
            cursor: 'pointer',
            transition: 'all 0.12s ease',
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLButtonElement;
            el.style.background = 'var(--w-urgency-critical-soft)';
            el.style.color = 'var(--w-danger)';
            el.style.borderColor = 'transparent';
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLButtonElement;
            el.style.background = 'transparent';
            el.style.color = 'var(--w-text-muted)';
            el.style.borderColor = 'var(--w-border)';
          }}
        >
          <Trash2 size={14} />
        </button>
      )}
    </div>
  );
}

/* =========================================================
   ResolutionPanel — 리더 회신 박스 (읽기 전용 뷰)
========================================================= */
export function ResolutionPanel({ resolution }: { resolution: string }) {
  return (
    <div
      style={{
        padding: 12,
        background: 'var(--w-accent-soft)',
        borderRadius: 'var(--w-radius-sm)',
        fontSize: 13,
        color: 'var(--w-text)',
        whiteSpace: 'pre-wrap',
        lineHeight: 1.65,
        borderLeft: '3px solid var(--w-accent)',
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--w-accent-hover)', marginBottom: 6, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
        리더 회신
      </div>
      {resolution}
    </div>
  );
}
