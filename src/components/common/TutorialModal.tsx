import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Map, MessageSquare, Lightbulb, Gamepad2, ChevronRight, ChevronLeft, X } from 'lucide-react';

const STEPS = [
  {
    icon: Map,
    title: '메타버스에 오신 걸 환영합니다!',
    desc: '캐릭터를 클릭/터치하면 맵 위를 이동할 수 있어요.\n각 방(로비, 공지, VOC, 아이디어 등)을 자유롭게 탐험해보세요.',
    color: '#6C63FF',
  },
  {
    icon: MessageSquare,
    title: '소통하기',
    desc: '하단 채팅창으로 같은 방 사람들과 대화할 수 있어요.\n사이드바에서 동료를 우클릭하면 마음의 편지도 보낼 수 있답니다.',
    color: '#FF6B9D',
  },
  {
    icon: Lightbulb,
    title: 'VOC & 아이디어',
    desc: 'VOC 방에서 건의사항을, 아이디어 방에서 제안을 남겨주세요.\n익명 작성도 가능하니 부담없이 의견을 나눠보세요.',
    color: '#4ECDC4',
  },
  {
    icon: Gamepad2,
    title: '미니게임',
    desc: '게임방에서 줄넘기, 오목, 반응속도 게임을 즐길 수 있어요.\n팀 동료들과 랭킹 경쟁도 해보세요!',
    color: '#FFD93D',
  },
];

interface TutorialModalProps {
  onClose: () => void;
}

export default function TutorialModal({ onClose }: TutorialModalProps) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const Icon = current.icon;
  const isLast = step === STEPS.length - 1;

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
          <div
            className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ backgroundColor: `${current.color}20` }}
          >
            <Icon size={28} style={{ color: current.color }} />
          </div>
          <h3 className="mb-2 text-center text-sm font-bold text-text-primary">
            {current.title}
          </h3>
          <p className="whitespace-pre-line text-center text-xs leading-relaxed text-text-secondary">
            {current.desc}
          </p>
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
