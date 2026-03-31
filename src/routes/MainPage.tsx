import { useState, useEffect } from 'react';
import { useDeviceMode } from '../hooks/useDeviceMode';
import { useAuthStore } from '../stores/authStore';
import TopBar from '../components/layout/TopBar';
import Sidebar from '../components/layout/Sidebar';
import MetaverseLayout from '../components/metaverse/MetaverseLayout';
import MobileLayout from '../components/mobile/MobileLayout';
import TutorialModal from '../components/common/TutorialModal';

const TUTORIAL_KEY = 'hanultari_tutorial_done';

export default function MainPage() {
  const mode = useDeviceMode();
  const { user } = useAuthStore();
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    const key = `${TUTORIAL_KEY}_${user.id}`;
    if (!localStorage.getItem(key)) {
      setShowTutorial(true);
    }
  }, [user?.id]);

  const closeTutorial = () => {
    setShowTutorial(false);
    if (user?.id) {
      localStorage.setItem(`${TUTORIAL_KEY}_${user.id}`, '1');
    }
  };

  if (mode === 'mobile') {
    return (
      <>
        <MobileLayout />
        {showTutorial && <TutorialModal onClose={closeTutorial} />}
      </>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-bg-primary">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <MetaverseLayout />
        <Sidebar />
      </div>
      {showTutorial && <TutorialModal onClose={closeTutorial} />}
    </div>
  );
}
