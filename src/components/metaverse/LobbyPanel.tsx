import { useState } from 'react';
import { X, Heart, ScrollText } from 'lucide-react';
import MoodPanel from './MoodPanel';
import ActivityPanel from '../activity/ActivityPanel';

interface LobbyPanelProps {
  onClose: () => void;
  team: string;
  readOnly: boolean;
}

const TABS = [
  { id: 'mood', label: '마음의소리', icon: Heart },
  { id: 'timeline', label: '활동 타임라인', icon: ScrollText },
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function LobbyPanel({ onClose, team, readOnly }: LobbyPanelProps) {
  const [activeTab, setActiveTab] = useState<TabId>('timeline');

  return (
    <div className="flex h-full flex-col">
      {/* 헤더 */}
      <div className="flex items-center justify-between border-b border-white/[.06] px-4 py-3">
        <h2 className="font-heading text-base font-bold text-text-primary">
          🏠 {team.replace('ITO', '')} 로비
        </h2>
        <button
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-white/[.08] hover:text-text-primary"
        >
          <X size={16} />
        </button>
      </div>

      {/* 탭 */}
      <div className="flex border-b border-white/[.06] px-4">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-semibold transition-colors ${
                activeTab === tab.id
                  ? 'border-accent text-accent'
                  : 'border-transparent text-text-muted hover:text-text-secondary'
              }`}
            >
              <Icon size={13} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 컨텐츠 */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'mood' && <MoodPanel />}
        {activeTab === 'timeline' && <ActivityPanel team={team} readOnly={readOnly} />}
      </div>
    </div>
  );
}
