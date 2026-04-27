import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { useThemeStore } from '../../../stores/themeStore';

interface Props {
  /** 선택된 날짜 (YYYY-MM-DD) */
  value: string;
  onChange: (date: string) => void;
  /** 선택 가능 최소 (포함). YYYY-MM-DD */
  min?: string;
  /** 선택 가능 최대 (포함) */
  max?: string;
  /** 빠른 선택 칩 — undefined 이면 안 표시 */
  quickPicks?: Array<{ label: string; date: string }>;
  /** placeholder */
  placeholder?: string;
}

/**
 * 커스텀 캘린더 입력 — input[type=date] 대신.
 * 클릭 시 드롭다운 달력. 분기 범위(min/max) 밖은 비활성. 빠른 선택 칩 옵션.
 *
 * 디자인: v2 토큰. 토요일 파랑, 일요일 빨강.
 */
const POPUP_HEIGHT = 360; // 빠른 칩 + 헤더 + 6주 그리드 대략
const POPUP_WIDTH = 280;

export default function DatePicker({ value, onChange, min, max, quickPicks, placeholder = '날짜 선택' }: Props) {
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => firstDayOf(value || max || todayStr()));
  const wrapRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const [popupPos, setPopupPos] = useState<{ top: number; left: number } | null>(null);
  const themeClass = useThemeStore((s) => (s.version === 'dark' ? 'v2-dark' : 'v2-warm'));

  // 바깥 클릭 닫기 — popup 도 wrap 외부에 있으니 popup 안 클릭은 허용해야 함
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (
        wrapRef.current && !wrapRef.current.contains(t) &&
        popupRef.current && !popupRef.current.contains(t)
      ) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // 팝업 위치 계산 — 입력 아래 공간 부족하면 위로 flip, 화면 우측 밖으로 나가면 좌측 정렬
  useLayoutEffect(() => {
    if (!open || !wrapRef.current) return;
    const update = () => {
      const r = wrapRef.current!.getBoundingClientRect();
      const vh = window.innerHeight;
      const vw = window.innerWidth;
      const margin = 8;
      const spaceBelow = vh - r.bottom - margin;
      const spaceAbove = r.top - margin;
      // 아래 공간 부족 + 위에 더 많은 공간 → 위로 flip
      const placeAbove = spaceBelow < POPUP_HEIGHT && spaceAbove > spaceBelow;
      const top = placeAbove ? Math.max(margin, r.top - POPUP_HEIGHT - 4) : Math.min(vh - POPUP_HEIGHT - margin, r.bottom + 4);
      // 좌측 정렬 기본, 우측 넘치면 좌측으로 당김
      const desiredLeft = r.left;
      const left = Math.min(Math.max(margin, desiredLeft), vw - POPUP_WIDTH - margin);
      setPopupPos({ top, left });
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [open]);

  // value 바뀌면 view 도 그 달로
  useEffect(() => {
    if (value) setViewMonth(firstDayOf(value));
  }, [value]);

  const minDate = min ? new Date(min + 'T00:00:00') : null;
  const maxDate = max ? new Date(max + 'T00:00:00') : null;

  const canPrev = !minDate || addMonths(viewMonth, -1) >= firstDayOfDate(minDate);
  const canNext = !maxDate || addMonths(viewMonth, 1) <= firstDayOfDate(maxDate);

  const days = buildCalendar(viewMonth);
  const monthLabel = `${viewMonth.getFullYear()}년 ${viewMonth.getMonth() + 1}월`;

  const isInRange = (d: Date) => {
    if (minDate && d < startOfDay(minDate)) return false;
    if (maxDate && d > startOfDay(maxDate)) return false;
    return true;
  };

  const handleSelect = (d: Date) => {
    onChange(fmtDate(d));
    setOpen(false);
  };

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          width: '100%',
          padding: '8px 10px',
          border: '1px solid var(--w-border)',
          borderRadius: 6,
          background: 'var(--w-surface)',
          color: value ? 'var(--w-text)' : 'var(--w-text-muted)',
          fontSize: 13,
          textAlign: 'left',
          fontFamily: 'inherit',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <CalendarIcon size={14} style={{ color: 'var(--w-text-muted)', flexShrink: 0 }} />
        <span style={{ flex: 1 }}>
          {value ? `${value.replace(/-/g, '/')} (${weekdayLabel(value)})` : placeholder}
        </span>
      </button>

      {open && popupPos && createPortal(
        <div
          ref={popupRef}
          className={themeClass}
          style={{
            // body 로 portal — 부모 모달 overflow:hidden 영향 없이 항상 보임
            position: 'fixed',
            top: popupPos.top,
            left: popupPos.left,
            // Modal(zIndex 400) 위에 떠야 함
            zIndex: 500,
            background: 'var(--w-surface)',
            border: '1px solid var(--w-border)',
            borderRadius: 10,
            boxShadow: '0 8px 24px rgba(42,31,26,.18)',
            padding: 12,
            width: POPUP_WIDTH,
          }}
        >
          {/* 빠른 선택 칩 */}
          {quickPicks && quickPicks.length > 0 && (
            <div
              style={{
                display: 'flex',
                gap: 6,
                marginBottom: 10,
                paddingBottom: 10,
                borderBottom: '1px solid var(--w-border)',
                flexWrap: 'wrap',
              }}
            >
              {quickPicks.map((q) => {
                const inRange = isInRange(new Date(q.date + 'T00:00:00'));
                return (
                  <button
                    key={q.label}
                    type="button"
                    onClick={() => inRange && handleSelect(new Date(q.date + 'T00:00:00'))}
                    disabled={!inRange}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 999,
                      border: '1px solid var(--w-border)',
                      background: value === q.date ? 'var(--w-accent-soft)' : 'var(--w-surface-2)',
                      color: value === q.date ? 'var(--w-accent-hover)' : 'var(--w-text-soft)',
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: inRange ? 'pointer' : 'not-allowed',
                      opacity: inRange ? 1 : 0.4,
                      fontFamily: 'inherit',
                    }}
                  >
                    {q.label}
                  </button>
                );
              })}
            </div>
          )}

          {/* 월 네비 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <button
              type="button"
              onClick={() => canPrev && setViewMonth(addMonths(viewMonth, -1))}
              disabled={!canPrev}
              style={navBtn(canPrev)}
              aria-label="이전 달"
            >
              <ChevronLeft size={16} />
            </button>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--w-text)' }}>{monthLabel}</div>
            <button
              type="button"
              onClick={() => canNext && setViewMonth(addMonths(viewMonth, 1))}
              disabled={!canNext}
              style={navBtn(canNext)}
              aria-label="다음 달"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* 요일 헤더 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
            {WEEK_LABELS.map((w, i) => (
              <div
                key={w}
                style={{
                  textAlign: 'center',
                  fontSize: 10.5,
                  fontWeight: 700,
                  padding: '4px 0',
                  color: i === 0 ? 'var(--w-danger)' : i === 6 ? 'var(--w-info)' : 'var(--w-text-muted)',
                }}
              >
                {w}
              </div>
            ))}
          </div>

          {/* 날짜 그리드 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
            {days.map((d, i) => {
              const inMonth = d.getMonth() === viewMonth.getMonth();
              const inRange = isInRange(d);
              const isSelected = value === fmtDate(d);
              const isToday = fmtDate(d) === todayStr();
              const wd = d.getDay();
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => inRange && handleSelect(d)}
                  disabled={!inRange}
                  style={{
                    height: 30,
                    border: 0,
                    borderRadius: 6,
                    background: isSelected ? 'var(--w-accent)' : isToday ? 'var(--w-accent-soft)' : 'transparent',
                    color: isSelected
                      ? '#fff'
                      : !inRange || !inMonth
                        ? 'var(--w-text-muted)'
                        : wd === 0
                          ? 'var(--w-danger)'
                          : wd === 6
                            ? 'var(--w-info)'
                            : 'var(--w-text)',
                    fontSize: 12.5,
                    fontWeight: isSelected || isToday ? 700 : 500,
                    cursor: inRange ? 'pointer' : 'not-allowed',
                    opacity: !inMonth ? 0.35 : !inRange ? 0.3 : 1,
                    fontFamily: 'inherit',
                  }}
                  onMouseEnter={(e) => {
                    if (inRange && !isSelected) (e.currentTarget as HTMLButtonElement).style.background = 'var(--w-surface-2)';
                  }}
                  onMouseLeave={(e) => {
                    if (inRange && !isSelected) {
                      (e.currentTarget as HTMLButtonElement).style.background = isToday
                        ? 'var(--w-accent-soft)'
                        : 'transparent';
                    }
                  }}
                >
                  {d.getDate()}
                </button>
              );
            })}
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}

const WEEK_LABELS = ['일', '월', '화', '수', '목', '금', '토'];
const WEEKDAYS_FULL = ['일', '월', '화', '수', '목', '금', '토'];

function navBtn(active: boolean): React.CSSProperties {
  return {
    width: 28,
    height: 28,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'transparent',
    border: 0,
    borderRadius: 6,
    cursor: active ? 'pointer' : 'not-allowed',
    color: active ? 'var(--w-text-soft)' : 'var(--w-text-muted)',
    opacity: active ? 1 : 0.4,
  };
}

function fmtDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function todayStr(): string {
  return fmtDate(new Date());
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function firstDayOf(dateStr: string): Date {
  if (!dateStr) return startOfDay(new Date());
  const d = new Date(dateStr + 'T00:00:00');
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function firstDayOfDate(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

function weekdayLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return WEEKDAYS_FULL[d.getDay()];
}

/** 한 달 뷰의 6주 × 7일 = 42칸 (이전 달·다음 달 일부 포함) */
function buildCalendar(monthStart: Date): Date[] {
  const startDay = monthStart.getDay(); // 0=일
  const out: Date[] = [];
  // 그리드 시작은 그 달 1일이 속한 주의 일요일
  const gridStart = new Date(monthStart);
  gridStart.setDate(monthStart.getDate() - startDay);
  for (let i = 0; i < 42; i++) {
    out.push(new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i));
  }
  return out;
}
