import { useState, useEffect } from 'react';
import { useDeviceMode } from '../hooks/useDeviceMode';
import { useAuthStore } from '../stores/authStore';
import { useThemeStore, UI_VERSIONS } from '../stores/themeStore';
import TopBar from '../components/layout/TopBar';
import Sidebar from '../components/layout/Sidebar';
import MetaverseLayout from '../components/metaverse/MetaverseLayout';
import MobileLayout from '../components/mobile/MobileLayout';
import OnboardingGuide from '../components/common/OnboardingGuide';
import V2Workspace from '../components/v2/V2Workspace';

const TUTORIAL_KEY = 'hanultari_tutorial_done';

export default function MainPage() {
  const mode = useDeviceMode();
  const { user } = useAuthStore();
  const uiVersion = useThemeStore((s) => s.version);
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    const key = `${TUTORIAL_KEY}_${user.id}`;
    if (!localStorage.getItem(key)) {
      setShowTutorial(true);
    }
  }, [user?.id]);

  // "튜토리얼 다시 보기" 이벤트 리스너
  useEffect(() => {
    const handler = () => setShowTutorial(true);
    window.addEventListener('restart-onboarding', handler);
    return () => window.removeEventListener('restart-onboarding', handler);
  }, []);

  const closeTutorial = () => {
    setShowTutorial(false);
    if (user?.id) {
      localStorage.setItem(`${TUTORIAL_KEY}_${user.id}`, '1');
    }
  };

  // 모바일은 기존 classic 레이아웃만 지원 (1440px 데스크탑 목업이 모바일엔 부적합)
  if (mode === 'mobile') {
    return (
      <>
        <MobileLayout />
        {showTutorial && <OnboardingGuide onComplete={closeTutorial} />}
      </>
    );
  }

  // v2: Warm Minimal은 실제 React 구현, 나머지 버전은 정적 HTML 미리보기 유지
  if (uiVersion === 'warm') {
    return <V2Workspace />;
  }

  if (uiVersion !== 'classic') {
    const meta = UI_VERSIONS.find((v) => v.id === uiVersion);
    return (
      <div className="flex h-screen flex-col bg-bg-primary">
        <TopBar />
        {meta?.preview ? (
          <iframe
            src={meta.preview}
            title={meta.name}
            className="flex-1 w-full border-0 bg-white"
          />
        ) : (
          <div className="flex-1 grid place-items-center text-text-muted">
            선택한 디자인({uiVersion})을 찾을 수 없어요.
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-bg-primary">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <MetaverseLayout />
        <Sidebar />
      </div>
      {showTutorial && <OnboardingGuide onComplete={closeTutorial} />}
    </div>
  );
}
