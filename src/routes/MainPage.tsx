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

  // 모바일은 MobileLayout 구조 유지하되, v2 테마 선택 시 CSS 토큰 스코프를 덧씌워
  // 배경·텍스트·액센트 색이 warm/dark 팔레트로 전환되게 한다.
  // (v2 데스크탑 풀 레이아웃은 1440px 목업 기반이라 모바일엔 부적합 — Sidebar 등 생략)
  if (mode === 'mobile') {
    const mobileThemeClass =
      uiVersion === 'dark' ? 'v2-dark' : uiVersion === 'warm' ? 'v2-warm' : '';
    // 모바일은 메타버스 맵이 없어 키보드/WASD 기반 OnboardingGuide가 부적합 — 제외
    return (
      <div className={mobileThemeClass} style={{ minHeight: '100vh' }}>
        <MobileLayout />
      </div>
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
