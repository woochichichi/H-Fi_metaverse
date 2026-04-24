import { Phone, Lightbulb, ClipboardList, Mail, Coffee } from 'lucide-react';

export type MobileTab = 'voc' | 'idea' | 'notice' | 'note' | 'more' | 'more_kpi' | 'more_gathering' | 'more_lounge' | 'more_admin' | 'more_omok' | 'more_reaction' | 'more_jumprope' | 'more_fortune' | 'more_faq';

interface BottomTabBarProps {
  activeTab: MobileTab;
  onTabChange: (tab: MobileTab) => void;
}

const TABS: { id: MobileTab; label: string; icon: typeof Phone }[] = [
  { id: 'voc', label: 'VOC', icon: Phone },
  { id: 'idea', label: '제안', icon: Lightbulb },
  { id: 'notice', label: '공지', icon: ClipboardList },
  { id: 'note', label: '쪽지', icon: Mail },
  { id: 'more', label: '더보기', icon: Coffee },
];

export default function BottomTabBar({ activeTab, onTabChange }: BottomTabBarProps) {
  return (
    <nav
      className="flex flex-shrink-0 items-center border-t border-white/[.06]"
      style={{
        background: 'rgba(30,30,48,.95)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        minHeight: 'calc(56px + env(safe-area-inset-bottom))',
      }}
    >
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-1 transition-colors duration-200 ${
              isActive ? 'text-accent' : 'text-text-muted'
            }`}
            style={{ minHeight: 44, minWidth: 44 }}
          >
            <Icon size={20} />
            <span className="text-[10px] font-medium">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
