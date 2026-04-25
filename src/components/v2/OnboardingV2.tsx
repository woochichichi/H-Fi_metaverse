import { useState, useEffect, type ReactNode, type ComponentType } from 'react';
import { createPortal } from 'react-dom';
import {
  Sparkles,
  Megaphone,
  MessageSquareHeart,
  Lightbulb,
  Mail,
  PartyPopper,
  Target,
  ArrowRight,
  ArrowLeft,
  X,
  CheckCircle2,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useV2Nav, type V2Page } from '../../stores/v2NavStore';

/* ============================================================
   OnboardingV2 — v2 워크스페이스 첫 진입 사용자용 4단계 가이드
   - 양 테마 자동 대응 (themeClass + var(--w-*) 토큰만)
   - 키보드: ← → 이동, Esc 건너뛰기, Enter 다음
   - 진행 인디케이터, skip, 부드러운 fade
   ============================================================ */

interface Props {
  themeClass: string;
  onComplete: () => void;
}

interface FeatureCard {
  icon: ComponentType<{ size?: number }>;
  tone: 'accent' | 'info' | 'todo' | 'success';
  label: string;
  desc: string;
}

interface QuickAction {
  page: V2Page;
  icon: ComponentType<{ size?: number }>;
  label: string;
  desc: string;
}

const FEATURES: FeatureCard[] = [
  { icon: Megaphone, tone: 'todo', label: '공지', desc: '팀 전체가 알아야 할 소식. 긴급·할일·참고 시급성별로 표시.' },
  { icon: MessageSquareHeart, tone: 'accent', label: '바라는점', desc: '팀원·팀장·회사에 바라는 점. 익명 제출 시 작성자 식별 정보가 DB에 저장되지 않음. 유닛 리더+팀장이 함께 처리.' },
  { icon: Lightbulb, tone: 'success', label: '아이디어', desc: '업무를 더 낫게 만들 아이디어. 공감 투표로 우선순위.' },
  { icon: Mail, tone: 'info', label: '쪽지', desc: '리더·관리자에게 한 줄 전하기. 발신자 완전 익명.' },
];

const QUICK_ACTIONS: QuickAction[] = [
  { page: 'dashboard', icon: Target, label: '대시보드 보기', desc: '오늘 처리할 일 한눈에' },
  { page: 'voc', icon: MessageSquareHeart, label: '바라는점 올리기', desc: '의견을 바로 전달하기' },
  { page: 'idea', icon: Lightbulb, label: '아이디어 올리기', desc: '개선 아이디어 공유하기' },
  { page: 'gathering', icon: PartyPopper, label: '소모임 구경', desc: '관심 모임에 참여하기' },
];

const TOTAL_STEPS = 4;

export default function OnboardingV2({ themeClass, onComplete }: Props) {
  const profile = useAuthStore((s) => s.profile);
  const setPage = useV2Nav((s) => s.setPage);
  const [step, setStep] = useState(0);
  const [mounted, setMounted] = useState(false);

  // mount 후 transition 시작 (CSS opacity 0→1)
  useEffect(() => {
    const t = window.requestAnimationFrame(() => setMounted(true));
    return () => window.cancelAnimationFrame(t);
  }, []);

  const next = () => {
    if (step < TOTAL_STEPS - 1) setStep(step + 1);
    else onComplete();
  };
  const prev = () => {
    if (step > 0) setStep(step - 1);
  };

  // 키보드 네비게이션
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onComplete();
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        e.preventDefault();
        next();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prev();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const greetName = profile?.nickname || profile?.name || '환영해요';
  const team = profile?.team;

  const overlay = (
    <div
      className={themeClass}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'var(--w-bg)',
        opacity: mounted ? 1 : 0,
        transition: 'opacity 0.24s ease',
      }}
    >
      {/* 배경 그라데이션 액센트 */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: '-30%',
          right: '-10%',
          width: 720,
          height: 720,
          borderRadius: '50%',
          background:
            'radial-gradient(circle at center, var(--w-accent-soft), transparent 60%)',
          pointerEvents: 'none',
          opacity: 0.7,
        }}
      />
      <div
        aria-hidden
        style={{
          position: 'absolute',
          bottom: '-20%',
          left: '-10%',
          width: 540,
          height: 540,
          borderRadius: '50%',
          background:
            'radial-gradient(circle at center, var(--w-accent-soft), transparent 70%)',
          pointerEvents: 'none',
          opacity: 0.5,
        }}
      />

      {/* 우상단 skip */}
      <button
        onClick={onComplete}
        title="건너뛰기 (Esc)"
        aria-label="건너뛰기"
        style={{
          position: 'absolute',
          top: 24,
          right: 24,
          width: 40,
          height: 40,
          display: 'grid',
          placeItems: 'center',
          background: 'transparent',
          color: 'var(--w-text-muted)',
          border: '1px solid var(--w-border)',
          borderRadius: '50%',
          cursor: 'pointer',
          transition: 'all 0.12s ease',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = 'var(--w-surface)';
          (e.currentTarget as HTMLButtonElement).style.color = 'var(--w-text)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
          (e.currentTarget as HTMLButtonElement).style.color = 'var(--w-text-muted)';
        }}
      >
        <X size={18} />
      </button>

      {/* 중앙 카드 */}
      <div
        style={{
          position: 'relative',
          display: 'grid',
          placeItems: 'center',
          minHeight: '100vh',
          padding: '32px 16px',
        }}
      >
        <div
          style={{
            width: 'min(680px, 100%)',
            background: 'var(--w-surface)',
            border: '1px solid var(--w-border)',
            borderRadius: 20,
            boxShadow: 'var(--w-shadow-lg)',
            padding: '44px 48px 36px',
            display: 'flex',
            flexDirection: 'column',
            gap: 24,
          }}
        >
          {/* 진행 인디케이터 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--w-text-muted)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              한울타리 시작하기 · {step + 1} / {TOTAL_STEPS}
            </div>
            <ProgressDots count={TOTAL_STEPS} active={step} />
          </div>

          {/* 콘텐츠 */}
          <div style={{ minHeight: 320, display: 'flex', flexDirection: 'column' }}>
            {step === 0 && <StepWelcome name={greetName} team={team} />}
            {step === 1 && <StepFeatures />}
            {step === 2 && <StepWorkflow />}
            {step === 3 && (
              <StepStart
                onPick={(p) => {
                  setPage(p);
                  onComplete();
                }}
              />
            )}
          </div>

          {/* 네비게이션 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              paddingTop: 16,
              borderTop: '1px solid var(--w-border)',
            }}
          >
            <button
              onClick={prev}
              disabled={step === 0}
              style={{
                padding: '10px 16px',
                fontSize: 13,
                fontWeight: 600,
                background: 'transparent',
                color: step === 0 ? 'var(--w-text-muted)' : 'var(--w-text-soft)',
                border: '1px solid var(--w-border)',
                borderRadius: 'var(--w-radius-sm)',
                cursor: step === 0 ? 'not-allowed' : 'pointer',
                opacity: step === 0 ? 0.5 : 1,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <ArrowLeft size={14} /> 이전
            </button>
            <div style={{ flex: 1, fontSize: 11, color: 'var(--w-text-muted)' }}>
              <kbd style={kbdStyle}>←</kbd> <kbd style={kbdStyle}>→</kbd> 키로도 이동 ·{' '}
              <kbd style={kbdStyle}>Esc</kbd> 건너뛰기
            </div>
            <button
              onClick={next}
              style={{
                padding: '10px 18px',
                fontSize: 13,
                fontWeight: 700,
                background: 'var(--w-accent)',
                color: '#fff',
                border: 'none',
                borderRadius: 'var(--w-radius-sm)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {step === TOTAL_STEPS - 1 ? (
                <>
                  시작하기 <CheckCircle2 size={15} />
                </>
              ) : (
                <>
                  다음 <ArrowRight size={14} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(overlay, document.body);
}

/* ============================================================
   Step 1 — 환영
   ============================================================ */
function StepWelcome({ name, team }: { name: string; team?: string | null }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', flex: 1, justifyContent: 'center' }}>
      <div
        style={{
          width: 88,
          height: 88,
          borderRadius: '50%',
          background:
            'linear-gradient(135deg, var(--w-accent) 0%, var(--w-accent-hover) 100%)',
          display: 'grid',
          placeItems: 'center',
          color: '#fff',
          marginBottom: 20,
          boxShadow: '0 12px 28px rgba(232, 114, 92, 0.32)',
        }}
      >
        <Sparkles size={40} />
      </div>
      <h1
        style={{
          margin: 0,
          fontSize: 28,
          fontWeight: 700,
          color: 'var(--w-text)',
          lineHeight: 1.25,
        }}
      >
        {name}님, 환영합니다 ✨
      </h1>
      <p
        style={{
          margin: '12px 0 0',
          fontSize: 15,
          color: 'var(--w-text-soft)',
          lineHeight: 1.65,
          maxWidth: 480,
        }}
      >
        <b>한울타리</b>는 금융ITO 4팀의 조직문화 플랫폼이에요.
        {team && (
          <>
            {' '}
            <span
              className="w-badge w-badge-accent"
              style={{ marginLeft: 4, verticalAlign: 'middle' }}
            >
              {team}
            </span>
          </>
        )}
        <br />
        잠깐 둘러보고 시작해 볼까요?
      </p>
    </div>
  );
}

/* ============================================================
   Step 2 — 핵심 기능 4종
   ============================================================ */
function StepFeatures() {
  return (
    <>
      <SectionHeader
        eyebrow="STEP 02"
        title="핵심 기능 한눈에"
        sub="네 가지 채널로 의견을 나누고 처리해요."
      />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 12,
        }}
      >
        {FEATURES.map((f) => (
          <FeatureBox key={f.label} icon={f.icon} tone={f.tone} label={f.label} desc={f.desc} />
        ))}
      </div>
    </>
  );
}

/* ============================================================
   Step 3 — 워크플로우 / 안내
   ============================================================ */
function StepWorkflow() {
  return (
    <>
      <SectionHeader
        eyebrow="STEP 03"
        title="이렇게 사용해요"
        sub="좌측 사이드바에서 페이지를 고르면, 우측에 콘텐츠가 표시됩니다."
      />
      <div
        style={{
          background: 'var(--w-surface-2)',
          border: '1px solid var(--w-border)',
          borderRadius: 'var(--w-radius)',
          padding: 20,
          display: 'flex',
          gap: 16,
          alignItems: 'stretch',
        }}
      >
        {/* 미니 사이드바 일러스트 */}
        <div
          style={{
            width: 100,
            background: 'var(--w-bg)',
            borderRadius: 'var(--w-radius-sm)',
            padding: 10,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            border: '1px solid var(--w-border)',
          }}
        >
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: 8,
              background: 'var(--w-accent)',
              marginBottom: 4,
            }}
          />
          <MiniNavRow active />
          <MiniNavRow />
          <MiniNavRow />
          <MiniNavRow />
        </div>
        {/* 미니 메인 콘텐츠 */}
        <div
          style={{
            flex: 1,
            background: 'var(--w-bg)',
            borderRadius: 'var(--w-radius-sm)',
            padding: 14,
            border: '1px solid var(--w-border)',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <div
            style={{
              height: 12,
              width: '40%',
              borderRadius: 4,
              background: 'var(--w-text-muted)',
              opacity: 0.4,
            }}
          />
          <div
            style={{
              height: 8,
              width: '70%',
              borderRadius: 4,
              background: 'var(--w-border-strong)',
              opacity: 0.4,
            }}
          />
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 6,
              marginTop: 6,
            }}
          >
            <MiniCard tone="accent" />
            <MiniCard tone="muted" />
            <MiniCard tone="muted" />
            <MiniCard tone="muted" />
          </div>
        </div>
      </div>
      <ul
        style={{
          margin: '14px 0 0',
          padding: 0,
          listStyle: 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          fontSize: 13,
          color: 'var(--w-text-soft)',
        }}
      >
        <Bullet>
          <b>대시보드</b>에서 오늘의 미확인 공지·진행중 바라는점·신규 아이디어를 한눈에 확인
        </Bullet>
        <Bullet>
          상단 검색과 알림 종, 우상단 메뉴에서 <b>테마(웜/다크)</b> 변경 가능
        </Bullet>
        <Bullet>
          긴급 공지가 있으면 로그인 직후 <b>먼저 안내</b>됩니다
        </Bullet>
      </ul>
    </>
  );
}

/* ============================================================
   Step 4 — 빠른 시작
   ============================================================ */
function StepStart({ onPick }: { onPick: (p: V2Page) => void }) {
  return (
    <>
      <SectionHeader
        eyebrow="STEP 04"
        title="어디서부터 시작할까요?"
        sub="아래 버튼을 누르면 해당 페이지로 바로 이동해요. (혹은 시작하기 → 대시보드로)"
      />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 10,
        }}
      >
        {QUICK_ACTIONS.map((a) => (
          <QuickActionBox
            key={a.page}
            Icon={a.icon}
            label={a.label}
            desc={a.desc}
            onClick={() => onPick(a.page)}
          />
        ))}
      </div>
    </>
  );
}

/* ============================================================
   서브 컴포넌트
   ============================================================ */
function SectionHeader({ eyebrow, title, sub }: { eyebrow: string; title: string; sub: string }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: 'var(--w-accent-hover)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          marginBottom: 6,
        }}
      >
        {eyebrow}
      </div>
      <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--w-text)' }}>{title}</h2>
      <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--w-text-soft)' }}>{sub}</p>
    </div>
  );
}

function FeatureBox({
  icon: Icon,
  tone,
  label,
  desc,
}: {
  icon: ComponentType<{ size?: number }>;
  tone: 'accent' | 'info' | 'todo' | 'success';
  label: string;
  desc: string;
}) {
  const toneBg =
    tone === 'accent'
      ? 'var(--w-accent-soft)'
      : tone === 'info'
        ? 'var(--w-urgency-info-soft)'
        : tone === 'todo'
          ? 'var(--w-urgency-todo-soft)'
          : 'var(--w-success-soft)';
  const toneColor =
    tone === 'accent'
      ? 'var(--w-accent-hover)'
      : tone === 'info'
        ? 'var(--w-urgency-info)'
        : tone === 'todo'
          ? 'var(--w-urgency-todo)'
          : 'var(--w-success)';
  return (
    <div
      style={{
        background: 'var(--w-surface-2)',
        border: '1px solid var(--w-border)',
        borderRadius: 'var(--w-radius)',
        padding: 14,
        display: 'flex',
        gap: 12,
        alignItems: 'flex-start',
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: toneBg,
          color: toneColor,
          display: 'grid',
          placeItems: 'center',
          flexShrink: 0,
        }}
      >
        <Icon size={18} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--w-text)' }}>{label}</div>
        <div
          style={{
            fontSize: 11.5,
            color: 'var(--w-text-soft)',
            marginTop: 4,
            lineHeight: 1.5,
          }}
        >
          {desc}
        </div>
      </div>
    </div>
  );
}

function QuickActionBox({
  Icon,
  label,
  desc,
  onClick,
}: {
  Icon: ComponentType<{ size?: number }>;
  label: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'var(--w-surface-2)',
        border: '1px solid var(--w-border)',
        borderRadius: 'var(--w-radius)',
        padding: 16,
        textAlign: 'left',
        display: 'flex',
        gap: 12,
        alignItems: 'center',
        cursor: 'pointer',
        transition: 'all 0.12s ease',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLButtonElement;
        el.style.background = 'var(--w-accent-soft)';
        el.style.borderColor = 'var(--w-accent)';
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLButtonElement;
        el.style.background = 'var(--w-surface-2)';
        el.style.borderColor = 'var(--w-border)';
      }}
    >
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: 10,
          background: 'var(--w-accent-soft)',
          color: 'var(--w-accent-hover)',
          display: 'grid',
          placeItems: 'center',
          flexShrink: 0,
        }}
      >
        <Icon size={18} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--w-text)' }}>{label}</div>
        <div style={{ fontSize: 11, color: 'var(--w-text-muted)', marginTop: 2 }}>{desc}</div>
      </div>
      <ArrowRight size={14} color="var(--w-text-muted)" />
    </button>
  );
}

function ProgressDots({ count, active }: { count: number; active: number }) {
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          style={{
            width: i === active ? 22 : 8,
            height: 8,
            borderRadius: 999,
            background: i === active ? 'var(--w-accent)' : 'var(--w-border-strong)',
            transition: 'width 0.2s ease, background 0.2s ease',
          }}
        />
      ))}
    </div>
  );
}

function MiniNavRow({ active = false }: { active?: boolean }) {
  return (
    <div
      style={{
        height: 8,
        borderRadius: 4,
        background: active ? 'var(--w-accent-soft)' : 'var(--w-surface-2)',
        border: active ? '1px solid var(--w-accent)' : '1px solid transparent',
      }}
    />
  );
}

function MiniCard({ tone }: { tone: 'accent' | 'muted' }) {
  return (
    <div
      style={{
        height: 28,
        borderRadius: 6,
        background: tone === 'accent' ? 'var(--w-accent-soft)' : 'var(--w-surface-2)',
        border: tone === 'accent' ? '1px solid var(--w-accent)' : '1px solid var(--w-border)',
      }}
    />
  );
}

function Bullet({ children }: { children: ReactNode }) {
  return (
    <li style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
      <CheckCircle2 size={14} color="var(--w-accent-hover)" style={{ flexShrink: 0, marginTop: 2 }} />
      <span>{children}</span>
    </li>
  );
}

const kbdStyle: React.CSSProperties = {
  display: 'inline-block',
  padding: '1px 6px',
  borderRadius: 4,
  background: 'var(--w-surface-2)',
  border: '1px solid var(--w-border)',
  fontFamily: 'JetBrains Mono, ui-monospace, Menlo, monospace',
  fontSize: 10,
  color: 'var(--w-text-soft)',
  margin: '0 2px',
};
