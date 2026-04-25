import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Download, X } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import IosInstallGuide from './IosInstallGuide';

const DISMISS_KEY = 'hwiki_pwa_install_dismissed_v1';

/**
 * 모바일 전용 "홈 화면에 추가" 프롬프트 배너.
 * 하단 탭바 위에 슬림하게 떠오르고, "나중에" 선택 시 영구 무시.
 * iOS Safari는 수동 안내 시트를 띄우고, Chrome/Android는 네이티브 프롬프트를 호출.
 */
export default function PwaInstallBanner() {
  const { canInstall, canIOSInstall, canChromeInstall, isInstalled, install } = usePWAInstall();
  const [dismissed, setDismissed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem(DISMISS_KEY) === '1';
  });
  const [showIosGuide, setShowIosGuide] = useState(false);
  // 페이지 로드 직후 튀어나오지 않고 3초 뒤 노출 — 첫 인상을 방해하지 않기 위해
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 3000);
    return () => clearTimeout(t);
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, '1');
    setDismissed(true);
  };

  const handleInstall = async () => {
    if (canChromeInstall) {
      const ok = await install();
      if (ok) handleDismiss();
      return;
    }
    if (canIOSInstall) {
      setShowIosGuide(true);
    }
  };

  if (isInstalled || dismissed || !canInstall || !ready) {
    return showIosGuide ? <IosInstallGuide onClose={() => setShowIosGuide(false)} /> : null;
  }

  return createPortal(
    <>
      <div
        className="fixed inset-x-0 z-[150] mx-3 rounded-2xl border border-accent/30 bg-bg-secondary shadow-xl"
        style={{
          bottom: 'calc(env(safe-area-inset-bottom) + 64px)',
          backdropFilter: 'blur(12px)',
          animation: 'slideUp .3s ease-out',
        }}
      >
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-accent/20 text-accent">
            <Download size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-text-primary">홈 화면에 추가하기</p>
            <p className="text-[11px] leading-tight text-text-muted">
              앱처럼 전체화면으로 한울타리를 빠르게 열어보세요
            </p>
          </div>
          <button
            onClick={handleInstall}
            className="flex-shrink-0 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-accent/80"
          >
            {canIOSInstall ? '방법 보기' : '설치'}
          </button>
          <button
            onClick={handleDismiss}
            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-white/10 hover:text-text-primary"
            aria-label="배너 닫기"
            title="다시 보지 않기"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {showIosGuide && <IosInstallGuide onClose={() => setShowIosGuide(false)} />}
    </>,
    document.body,
  );
}
