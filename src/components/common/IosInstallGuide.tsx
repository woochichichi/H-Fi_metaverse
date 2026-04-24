import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Share, PlusSquare, CheckCircle2 } from 'lucide-react';

interface Props {
  onClose: () => void;
}

/**
 * iOS Safari 전용 "홈 화면에 추가" 수동 안내 바텀시트.
 * iOS는 beforeinstallprompt를 지원하지 않아 사용자 수동 조작 필요.
 */
export default function IosInstallGuide({ onClose }: Props) {
  // ESC로 닫기
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[400] bg-black/55"
        onClick={onClose}
        style={{ backdropFilter: 'blur(2px)' }}
      />
      <div
        className="fixed inset-x-0 bottom-0 z-[401] flex flex-col rounded-t-3xl bg-bg-primary shadow-2xl"
        style={{
          paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)',
          border: '1px solid rgba(255,255,255,0.08)',
          animation: 'slideUp .25s ease-out',
        }}
      >
        {/* 드래그 핸들 */}
        <div className="flex justify-center pt-2 pb-1">
          <div className="h-1 w-10 rounded-full bg-white/20" />
        </div>

        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-3">
          <h3 className="font-heading text-base font-bold text-text-primary">
            📲 홈 화면에 추가하기
          </h3>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-white/10 hover:text-text-primary"
            aria-label="닫기"
          >
            <X size={18} />
          </button>
        </div>

        {/* 안내 본문 */}
        <div className="px-5 pb-4 space-y-3">
          <p className="text-xs leading-relaxed text-text-secondary">
            한울타리를 앱처럼 사용하려면 Safari에서 홈 화면에 추가하세요.
            설치 후 홈 화면 아이콘을 탭하면 전체 화면으로 바로 실행됩니다.
          </p>

          <Step
            index={1}
            icon={<Share size={18} />}
            title="공유 버튼 탭"
            desc="화면 하단(또는 상단)의 공유 버튼 (□↑) 을 눌러주세요."
          />
          <Step
            index={2}
            icon={<PlusSquare size={18} />}
            title="홈 화면에 추가"
            desc='메뉴에서 "홈 화면에 추가"를 선택하세요.'
          />
          <Step
            index={3}
            icon={<CheckCircle2 size={18} />}
            title="추가 완료"
            desc='우측 상단 "추가" 를 누르면 홈 화면에 아이콘이 생깁니다.'
          />
        </div>

        <div className="px-5">
          <button
            onClick={onClose}
            className="w-full rounded-xl bg-accent py-3 text-sm font-semibold text-white transition-colors hover:bg-accent/80"
          >
            확인했어요
          </button>
        </div>
      </div>
    </>,
    document.body,
  );
}

function Step({
  index,
  icon,
  title,
  desc,
}: {
  index: number;
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex gap-3 rounded-xl border border-white/[.06] bg-white/[.03] p-3">
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-accent/20 text-accent">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold text-accent-light">STEP {index}</p>
        <p className="text-sm font-semibold text-text-primary">{title}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-text-secondary">{desc}</p>
      </div>
    </div>
  );
}
