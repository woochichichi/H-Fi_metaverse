import { useState } from 'react';
import { X, Award, MessageSquareText, ScrollText } from 'lucide-react';
import KudosPanel from './KudosPanel';
import TeamBoardPanel from './TeamBoardPanel';
import ActivityPanel from '../activity/ActivityPanel';

interface LobbyPanelProps {
  onClose: () => void;
  team: string;
  readOnly: boolean;
}

const TABS = [
  { id: 'kudos', label: '칭찬보드', icon: Award },
  { id: 'board', label: '게시판', icon: MessageSquareText },
  { id: 'timeline', label: '타임라인', icon: ScrollText },
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function LobbyPanel({ onClose, team, readOnly }: LobbyPanelProps) {
  const [activeTab, setActiveTab] = useState<TabId>('kudos');

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
      <div className="flex border-b border-white/[.06] px-3">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1 border-b-2 px-2.5 py-2 text-xs font-semibold transition-colors ${
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
        {activeTab === 'kudos' && <KudosPanel team={team} readOnly={readOnly} />}
        {activeTab === 'board' && <TeamBoardPanel team={team} readOnly={readOnly} />}
        {activeTab === 'timeline' && <ActivityPanel team={team} readOnly={readOnly} />}
      </div>
    </div>
  );
}
