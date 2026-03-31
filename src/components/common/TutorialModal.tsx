import { useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import {
  Megaphone, MessageSquarePlus, BarChart3, Mail,
  Gamepad2, ChevronRight, ChevronLeft, X, MapPin,
} from 'lucide-react';

/* ── 하이라이트 헬퍼 ── */
function HL({ color, children }: { color: string; children: ReactNode }) {
  return <span className="font-semibold" style={{ color }}>{children}</span>;
}

function LocationTag({ label }: { label: string }) {
  return (
    <span className="mr-1.5 inline-flex items-center gap-0.5 rounded-full bg-white/[.08] px-2 py-0.5 text-[10px] text-text-muted">
      <MapPin size={9} className="shrink-0" /> {label}
    </span>
  );
}

/* ── 스텝 정의 ── */
interface Step {
  icon: typeof Megaphone;
  title: string;
  body: ReactNode;
  locations: string[];
  color: string;
}

const C = {
  purple: '#6C63FF',
  pink: '#FF6B9D',
  teal: '#4ECDC4',
  orange: '#F97316',
  violet: '#A78BFA',
  yellow: '#FFD93D',
};

const STEPS: Step[] = [
  {
    icon: Megaphone,
    title: '한울타리에 오신 걸 환영해요!',
    body: (
      <>
        공지·할 일·급한 건이 뒤섞여서 피곤하셨죠?{'\n'}
        <HL color={C.pink}>필요한 정보만 딱딱</HL> 정리해드릴게요.{'\n'}
        무겁지 않게, 편하게 둘러보세요.
      </>
    ),
    locations: [],
    color: C.purple,
  },
  {
    icon: MessageSquarePlus,
    title: '하고 싶은 말, 편하게 꺼내세요',
    body: (
      <>
        건의사항은 <HL color={C.teal}>VOC 센터</HL>에,{'\n'}
        번뜩이는 아이디어는 <HL color={C.teal}>아이디어 보드</HL>에 남겨주세요.{'\n'}
        익명도 되니까 부담 제로! 진짜 <HL color={C.teal}>쌍방향 소통</HL>이 되는 곳.
      </>
    ),
    locations: ['공용 맵 → VOC 센터', '공용 맵 → 아이디어 보드'],
    color: C.teal,
  },
  {
    icon: BarChart3,
    title: '활동 기록? 알아서 쌓여요',
    body: (
      <>
        평가 시즌에 몰아쓰느라 고생했죠?{'\n'}
        여기선 활동이 <HL color={C.orange}>그때그때 자동 축적</HL>돼요.{'\n'}
        유닛장·팀장은 <HL color={C.orange}>대시보드</HL>에서 한눈에 확인!
      </>
    ),
    locations: ['하단 바 → 팀 KPI 방'],
    color: C.orange,
  },
  {
    icon: Mail,
    title: '익명 쪽지로 솔직하게',
    body: (
      <>
        하고 싶은 말, <HL color={C.violet}>수평적으로</HL> 전해보세요.{'\n'}
        로그인하면 <HL color={C.violet}>쪽지함</HL>에서 바로 확인할 수 있어요.{'\n'}
        누가 보냈는지? 아무도 몰라요.
      </>
    ),
    locations: ['하단 바 → 수집함'],
    color: C.violet,
  },
  {
    icon: Gamepad2,
    title: '잠깐, 쉬어가세요',
    body: (
      <>
        줄넘기·오목·반응속도 <HL color={C.yellow}>미니게임</HL>으로 리프레시!{'\n'}
        동료들과 <HL color={C.yellow}>랭킹 경쟁</HL>도 은근 재밌어요.
      </>
    ),
    locations: ['하단 바 → 게임 탭'],
    color: C.yellow,
  },
];

/* ── 컴포넌트 ── */
interface TutorialModalProps {
  onClose: () => void;
}

export default function TutorialModal({ onClose }: TutorialModalProps) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const Icon = current.icon;
  const isLast = step === STEPS.length - 1;
  const isFirst = step === 0;

  return createPortal(
    <>
      <div className="fixed inset-0 z-[400] bg-black/60" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 z-[401] w-[340px] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/[.08] bg-bg-secondary shadow-2xl">
        {/* 닫기 */}
        <button
          onClick={onClose}
          className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-lg text-text-muted hover:bg-white/[.08] hover:text-text-primary"
        >
          <X size={14} />
        </button>

        {/* 콘텐츠 */}
        <div className="flex flex-col items-center px-6 pt-8 pb-5">
          {/* 첫 화면: 로고, 나머지: 아이콘 */}
          {isFirst ? (
            <img src="/favicon.svg" alt="한울타리" className="mb-4 h-14 w-14" />
          ) : (
            <div
              className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
              style={{ backgroundColor: `${current.color}20` }}
            >
              <Icon size={28} style={{ color: current.color }} />
            </div>
          )}

          <h3 className="mb-2 text-center text-base font-bold text-text-primary font-heading">
            {current.title}
          </h3>
          <p className="whitespace-pre-line text-center text-xs leading-relaxed text-text-secondary">
            {current.body}
          </p>

          {/* 위치 태그 */}
          {current.locations.length > 0 && (
            <div className="mt-3 flex flex-wrap justify-center gap-1">
              {current.locations.map((loc) => (
                <LocationTag key={loc} label={loc} />
              ))}
            </div>
          )}
        </div>

        {/* 스텝 인디케이터 */}
        <div className="flex justify-center gap-1.5 pb-4">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === step ? 'w-4 bg-accent' : 'w-1.5 bg-white/[.15]'
              }`}
            />
          ))}
        </div>

        {/* 버튼 */}
        <div className="flex items-center justify-between border-t border-white/[.06] px-4 py-3">
          {step > 0 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs text-text-muted hover:bg-white/[.06]"
            >
              <ChevronLeft size={12} /> 이전
            </button>
          ) : (
            <button
              onClick={onClose}
              className="rounded-lg px-3 py-1.5 text-xs text-text-muted hover:bg-white/[.06]"
            >
              건너뛰기
            </button>
          )}
          <button
            onClick={() => (isLast ? onClose() : setStep(step + 1))}
            className="flex items-center gap-1 rounded-lg bg-accent px-4 py-1.5 text-xs font-semibold text-white hover:bg-accent/80"
          >
            {isLast ? '시작하기!' : <>다음 <ChevronRight size={12} /></>}
          </button>
        </div>
      </div>
    </>,
    document.body
  );
}
