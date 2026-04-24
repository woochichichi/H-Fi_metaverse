import { useState, useEffect, useMemo } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function detectStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.matchMedia('(display-mode: standalone)').matches) return true;
  // iOS Safari는 navigator.standalone 사용
  if ((window.navigator as unknown as { standalone?: boolean }).standalone) return true;
  return false;
}

function detectIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(ua)) return true;
  // iPadOS 13+ 는 데스크탑 UA를 위장 — maxTouchPoints로 구분
  if (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) return true;
  return false;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(() => detectStandalone());

  const isIOS = useMemo(() => detectIOS(), []);

  useEffect(() => {
    if (isInstalled) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const installedHandler = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', installedHandler);
    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installedHandler);
    };
  }, [isInstalled]);

  const install = async () => {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    return outcome === 'accepted';
  };

  // Chrome/Android/Edge 경로: beforeinstallprompt 사용 가능
  const canChromeInstall = !!deferredPrompt && !isInstalled;
  // iOS Safari 경로: prompt 없지만 수동 안내 가능
  const canIOSInstall = isIOS && !isInstalled;
  // UI 노출 여부: 둘 중 하나라도 가능하면
  const canInstall = canChromeInstall || canIOSInstall;

  return { canInstall, canChromeInstall, canIOSInstall, isIOS, isInstalled, install };
}
