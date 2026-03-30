import { useState } from 'react';
import { X, Coffee, Heart, ScrollText } from 'lucide-react';
import MoodPanel from './MoodPanel';
import ActivityTimeline from './ActivityTimeline';

interface LoungePanelProps {
  onClose: () => void;
}

const TABS = [
  { id: 'rest', label: '쉬어가기', icon: Coffee },
  { id: 'mood', label: '마음의소리', icon: Heart },
  { id: 'timeline', label: '활동 타임라인', icon: ScrollText },
] as const;

type TabId = (typeof TABS)[number]['id'];

// 기존 커피/간식 컨텐츠
function RestTab() {
  const snacks = [
    { emoji: '☕', name: '아메리카노', desc: '든든한 오후의 시작' },
    { emoji: '🍵', name: '녹차라떼', desc: '달달한 휴식' },
    { emoji: '🍩', name: '도넛', desc: '간식 타임!' },
    { emoji: '🍪', name: '쿠키', desc: '바삭바삭' },
    { emoji: '🧃', name: '주스', desc: '비타민 충전' },
    { emoji: '🍫', name: '초콜릿', desc: '당 보충' },
  ];

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-sm font-bold text-text-primary">오늘의 간식</h3>
      <div className="grid grid-cols-2 gap-2">
        {snacks.map((s) => (
          <div
            key={s.name}
            className="flex items-center gap-3 rounded-xl border border-white/[.06] bg-white/[.03] p-3 transition-colors hover:bg-white/[.06]"
          >
            <span className="text-2xl">{s.emoji}</span>
            <div>
              <p className="text-xs font-semibold text-text-primary">{s.name}</p>
              <p className="text-[10px] text-text-muted">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-accent/20 bg-accent/[.05] p-4 text-center">
        <p className="text-lg">🛋️</p>
        <p className="mt-1 text-xs text-text-secondary">
          잠시 쉬어가세요. 휴식도 생산성의 일부입니다.
        </p>
      </div>
    </div>
  );
}

export default function LoungePanel({ onClose }: LoungePanelProps) {
  const [activeTab, setActiveTab] = useState<TabId>('rest');

  return (
    <div className="flex h-full flex-col">
      {/* 헤더 */}
      <div className="flex items-center justify-between border-b border-white/[.06] px-4 py-3">
        <h2 className="font-heading text-base font-bold text-text-primary">
          ☕ 라운지
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
        {activeTab === 'rest' && <RestTab />}
        {activeTab === 'mood' && <MoodPanel />}
        {activeTab === 'timeline' && <ActivityTimeline />}
      </div>
    </div>
  );
}
