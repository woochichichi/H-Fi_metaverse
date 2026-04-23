import { useState, useEffect } from 'react';
import { useDeviceMode } from '../hooks/useDeviceMode';
import { useAuthStore } from '../stores/authStore';
import { useThemeStore } from '../stores/themeStore';
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

  // v2: Warm Minimal / Modern Dark 모두 V2Workspace로 렌더 (테마는 .v2-warm/.v2-dark 스코프)
  if (uiVersion === 'warm' || uiVersion === 'dark') {
    return <V2Workspace />;
  }

  // classic: 메타버스 맵
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
