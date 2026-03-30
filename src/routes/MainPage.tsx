import { useDeviceMode } from '../hooks/useDeviceMode';
import TopBar from '../components/layout/TopBar';
import Sidebar from '../components/layout/Sidebar';
import MetaverseLayout from '../components/metaverse/MetaverseLayout';
import MobileLayout from '../components/mobile/MobileLayout';

export default function MainPage() {
  const mode = useDeviceMode();

  if (mode === 'mobile') {
    return <MobileLayout />;
  }

  return (
    <div className="flex h-screen flex-col bg-bg-primary">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <MetaverseLayout />
        <Sidebar />
      </div>
    </div>
  );
}
