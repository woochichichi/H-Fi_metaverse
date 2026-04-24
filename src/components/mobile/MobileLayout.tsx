import { useState } from 'react';
import TopBar from '../layout/TopBar';
import BottomTabBar, { type MobileTab } from './BottomTabBar';
import MobileHome from './MobileHome';
import PwaInstallBanner from '../common/PwaInstallBanner';

export default function MobileLayout() {
  const [activeTab, setActiveTab] = useState<MobileTab>('voc');

  return (
    <div className="flex h-screen flex-col bg-bg-primary">
      <TopBar />
      <main className="flex flex-1 overflow-y-auto">
        <MobileHome activeTab={activeTab} />
      </main>
      <BottomTabBar activeTab={activeTab} onTabChange={setActiveTab} />
      <PwaInstallBanner />
    </div>
  );
}
