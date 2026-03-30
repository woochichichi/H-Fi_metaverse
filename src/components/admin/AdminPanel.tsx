import { useState } from 'react';
import { X, KeyRound, Users, BarChart3 } from 'lucide-react';
import InviteManager from './InviteManager';
import UserManager from './UserManager';
import EvalDashboard from '../dashboard/EvalDashboard';

interface AdminPanelProps {
  onClose: () => void;
}

const TABS = [
  { id: 'invite', label: '초대 코드', icon: KeyRound },
  { id: 'users', label: '사용자 관리', icon: Users },
  { id: 'eval', label: '평가 대시보드', icon: BarChart3 },
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function AdminPanel({ onClose }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<TabId>('invite');

  return (
    <div className="flex h-full flex-col">
      {/* 헤더 */}
      <div className="flex items-center justify-between border-b border-white/[.06] px-4 py-3">
        <h2 className="font-heading text-base font-bold text-text-primary">
          관리자 패널
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

      {/* 탭 컨텐츠 */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'invite' && <InviteManager />}
        {activeTab === 'users' && <UserManager />}
        {activeTab === 'eval' && <EvalDashboard />}
      </div>
    </div>
  );
}
