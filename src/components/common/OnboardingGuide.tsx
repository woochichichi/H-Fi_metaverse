import { useState, useEffect, useRef, useCallback, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import {
  Move, MousePointerClick, DoorOpen, Navigation, MessageSquarePlus,
  PartyPopper, X, SkipForward,
} from 'lucide-react';
import { useMetaverseStore } from '../../stores/metaverseStore';
import { useUiStore } from '../../stores/uiStore';

/* ── 스텝 정의 ── */
interface OnboardingStep {
  id: string;
  icon: typeof Move;
  title: string;
  body: ReactNode;
  hint: string;          // 하단 힌트 텍스트
  color: string;
  check: 'move' | 'click-move' | 'enter-zone' | 'change-room' | 'visit-shared' | 'done';
}

const C = {
  blue: '#60A5FA',
  green: '#34D399',
  purple: '#A78BFA',
  orange: '#FB923C',
  pink: '#F472B6',
  gold: '#FBBF24',
};

const STEPS: OnboardingStep[] = [
  {
    id: 'move',
    icon: Move,
    title: '캐릭터를 움직여보세요!',
    body: (
      <>
        <span className="font-semibold" style={{ color: C.blue }}>방향키</span> 또는{' '}
        <span className="font-semibold" style={{ color: C.blue }}>WASD</span>로 캐릭터를 이동할 수 있어요.
      </>
    ),
    hint: '⌨️ 키보드로 캐릭터를 움직여보세요',
    color: C.blue,
    check: 'move',
  },
  {
    id: 'click-move',
    icon: MousePointerClick,
    title: '클릭으로도 이동돼요!',
    body: (
      <>
        맵의 <span className="font-semibold" style={{ color: C.green }}>빈 곳을 클릭</span>하면
        캐릭터가 자동으로 걸어갑니다.
      </>
    ),
    hint: '🖱️ 맵을 클릭해보세요',
    color: C.green,
    check: 'click-move',
  },
  {
    id: 'enter-zone',
    icon: DoorOpen,
    title: '방에 입장해보세요!',
    body: (
      <>
        <span className="font-semibold" style={{ color: C.purple }}>로비</span>나{' '}
        <span className="font-semibold" style={{ color: C.purple }}>KPI 방</span>을
        클릭하면 자동으로 걸어가서 입장돼요.{'\n'}
        가까이 가면 <span className="font-semibold" style={{ color: C.purple }}>Space</span>로도 입장 가능!
      </>
    ),
    hint: '🚪 아무 방이나 클릭해서 입장해보세요',
    color: C.purple,
    check: 'enter-zone',
  },
  {
    id: 'change-room',
    icon: Navigation,
    title: '다른 공간으로 이동해보세요!',
    body: (
      <>
        맵 아래쪽의 <span className="font-semibold" style={{ color: C.orange }}>포탈</span>로 걸어가면
        자동으로 이동돼요.{'\n'}
        왼쪽 <span className="font-semibold" style={{ color: C.orange }}>사이드바</span>에서도 바로 이동 가능!
      </>
    ),
    hint: '🌀 포탈 또는 사이드바로 다른 방에 가보세요',
    color: C.orange,
    check: 'change-room',
  },
  {
    id: 'visit-shared',
    icon: MessageSquarePlus,
    title: '중앙 광장을 둘러보세요!',
    body: (
      <>
        <span className="font-semibold" style={{ color: C.pink }}>VOC방</span>,{' '}
        <span className="font-semibold" style={{ color: C.pink }}>아이디어방</span>,{' '}
        <span className="font-semibold" style={{ color: C.pink }}>미니게임</span> 등
        다양한 공간이 있어요.{'\n'}
        아무 곳이나 입장해보세요!
      </>
    ),
    hint: '💡 중앙 광장의 아무 방이나 입장해보세요',
    color: C.pink,
    check: 'visit-shared',
  },
  {
    id: 'done',
    icon: PartyPopper,
    title: '온보딩 완료! 🎉',
    body: (
      <>
        이제 <span className="font-semibold" style={{ color: C.gold }}>한울타리</span>를 자유롭게 탐험해보세요!{'\n'}
        VOC, 아이디어, 칭찬보드, 미니게임 등{'\n'}
        다양한 기능이 기다리고 있어요.
      </>
    ),
    hint: '',
    color: C.gold,
    check: 'done',
  },
];

// 공용 존 ID 목록 (중앙 광장)
const SHARED_ZONE_IDS = ['voc', 'idea', 'worry', 'gathering', 'reaction', 'omok', 'jumprope', 'fortune'];

/* ── 컴포넌트 ── */
interface OnboardingGuideProps {
  onComplete: () => void;
}

export default function OnboardingGuide({ onComplete }: OnboardingGuideProps) {
  const [step, setStep] = useState(0);

  // store 구독
  const { playerPosition, moveTarget, currentRoom } = useMetaverseStore();
  const { modalOpen } = useUiStore();

  // 각 스텝 완료 감지용 refs
  const initialRoomRef = useRef(currentRoom);
  const moveDistRef = useRef(0);
  const prevPosRef = useRef(playerPosition);
  const stepCompletedRef = useRef(false);

  // 스텝 전환 시 초기화
  useEffect(() => {
    stepCompletedRef.current = false;
    initialRoomRef.current = currentRoom;
    moveDistRef.current = 0;
    prevPosRef.current = playerPosition;
  }, [step]); // eslint-disable-line react-hooks/exhaustive-deps

  // 자동 진행 감지
  const advanceStep = useCallback(() => {
    if (stepCompletedRef.current) return;
    stepCompletedRef.current = true;
    // 짧은 딜레이 후 다음 스텝
    setTimeout(() => {
      setStep((s) => Math.min(s + 1, STEPS.length - 1));
    }, 600);
  }, []);

  // Step 1: 키보드 이동 감지 — 누적 이동거리 60px 이상
  useEffect(() => {
    if (STEPS[step]?.check !== 'move') return;
    const dx = playerPosition.x - prevPosRef.current.x;
    const dy = playerPosition.y - prevPosRef.current.y;
    moveDistRef.current += Math.sqrt(dx * dx + dy * dy);
    prevPosRef.current = playerPosition;
    if (moveDistRef.current > 60) advanceStep();
  }, [playerPosition, step, advanceStep]);

  // Step 2: 클릭 이동 감지
  useEffect(() => {
    if (STEPS[step]?.check !== 'click-move') return;
    if (moveTarget) advanceStep();
  }, [moveTarget, step, advanceStep]);

  // Step 3: 존 입장 감지
  useEffect(() => {
    if (STEPS[step]?.check !== 'enter-zone') return;
    if (modalOpen) advanceStep();
  }, [modalOpen, step, advanceStep]);

  // Step 4: 방 이동 감지
  useEffect(() => {
    if (STEPS[step]?.check !== 'change-room') return;
    if (currentRoom !== initialRoomRef.current) advanceStep();
  }, [currentRoom, step, advanceStep]);

  // Step 5: 공용 존 방문 감지
  useEffect(() => {
    if (STEPS[step]?.check !== 'visit-shared') return;
    if (modalOpen && SHARED_ZONE_IDS.includes(modalOpen)) advanceStep();
  }, [modalOpen, step, advanceStep]);

  const current = STEPS[step];
  const Icon = current.icon;
  const isLast = step === STEPS.length - 1;
  const progress = Math.round((step / (STEPS.length - 1)) * 100);

  return createPortal(
    <div
      className="fixed z-[350] pointer-events-none"
      style={{ bottom: 24, left: '50%', transform: 'translateX(-50%)' }}
    >
      <div
        className="pointer-events-auto rounded-2xl border border-white/[.08] shadow-2xl animate-[slideUp_.3s_ease-out]"
        style={{
          background: 'rgba(20, 20, 32, .95)',
          backdropFilter: 'blur(12px)',
          width: 420,
          maxWidth: 'calc(100vw - 32px)',
        }}
      >
        {/* 진행 바 */}
        <div className="h-1 rounded-t-2xl overflow-hidden bg-white/[.06]">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progress}%`, background: current.color }}
          />
        </div>

        <div className="flex items-start gap-3 px-5 pt-4 pb-3">
          {/* 아이콘 */}
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            style={{ backgroundColor: `${current.color}20` }}
          >
            <Icon size={22} style={{ color: current.color }} />
          </div>

          {/* 텍스트 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-text-primary font-heading">
                {current.title}
              </h3>
              <span className="text-[10px] text-text-muted ml-2 shrink-0">
                {step + 1}/{STEPS.length}
              </span>
            </div>
            <p className="mt-1 whitespace-pre-line text-xs leading-relaxed text-text-secondary">
              {current.body}
            </p>
          </div>
        </div>

        {/* 힌트 + 버튼 */}
        <div className="flex items-center justify-between border-t border-white/[.06] px-4 py-2.5">
          {current.hint ? (
            <span className="text-[11px] text-text-muted animate-pulse">
              {current.hint}
            </span>
          ) : (
            <span />
          )}

          <div className="flex items-center gap-2">
            {/* 스킵 */}
            {!isLast && (
              <button
                onClick={() => setStep((s) => Math.min(s + 1, STEPS.length - 1))}
                className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] text-text-muted hover:bg-white/[.06] transition-colors"
                title="이 단계 건너뛰기"
              >
                <SkipForward size={12} /> 스킵
              </button>
            )}

            {/* 완료 / 전체 건너뛰기 */}
            {isLast ? (
              <button
                onClick={onComplete}
                className="flex items-center gap-1 rounded-lg px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:opacity-80"
                style={{ background: current.color }}
              >
                시작하기! <PartyPopper size={14} />
              </button>
            ) : (
              <button
                onClick={onComplete}
                className="flex items-center gap-0.5 rounded-lg px-2 py-1 text-[10px] text-text-muted/60 hover:text-text-muted hover:bg-white/[.04] transition-colors"
              >
                <X size={10} /> 전체 건너뛰기
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
