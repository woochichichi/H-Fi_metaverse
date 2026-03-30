import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { REACTION_EMOJIS } from '../../lib/constants';
import { useMetaverseStore } from '../../stores/metaverseStore';
import { useUiStore } from '../../stores/uiStore';

export default function BottomBar() {
  const { addEmojiFloat } = useMetaverseStore();
  const { openModal } = useUiStore();
  const [collapsed, setCollapsed] = useState(false);

  const actions = [
    { id: 'mood', label: '마음의소리', emoji: '💭' },
    { id: 'kpi', label: 'KPI', emoji: '📊' },
    { id: 'voc', label: 'VOC', emoji: '📞' },
    { id: 'idea', label: '아이디어', emoji: '💡' },
    { id: 'note', label: '쪽지', emoji: '✉️' },
  ];

  return (
    <div className="relative flex h-full flex-shrink-0">
      {/* 패널 본체 */}
      <div
        className={`flex flex-col border-r border-white/[.06] transition-all duration-200 ${collapsed ? 'w-0 overflow-hidden border-none' : 'w-[160px]'}`}
        style={{ background: 'rgba(30,30,48,.95)', backdropFilter: 'blur(12px)' }}
      >
        {!collapsed && (
          <div className="flex flex-1 flex-col justify-between p-3">
            {/* 액션 버튼 */}
            <div className="flex flex-col gap-1">
              {actions.map((a) => (
                <button
                  key={a.id}
                  onClick={() => openModal(a.id)}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[12px] font-semibold text-text-secondary transition-all duration-150 hover:bg-accent/15 hover:text-accent-light"
                >
                  <span className="text-base">{a.emoji}</span>
                  {a.label}
                </button>
              ))}
            </div>

            {/* 하단: 이모지 + 힌트 */}
            <div className="flex flex-col gap-2">
              <div className="h-px bg-white/[.06]" />
              <div className="flex flex-wrap gap-1">
                {REACTION_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => addEmojiFloat(emoji)}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-sm transition-all duration-150 hover:bg-accent/20 active:scale-[.92]"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 text-[9px] text-text-muted">
                <span><kbd className="rounded bg-white/[.08] px-1 py-0.5 font-mono text-[8px] text-text-secondary">↑↓←→</kbd> 이동</span>
                <span><kbd className="rounded bg-white/[.08] px-1 py-0.5 font-mono text-[8px] text-text-secondary">Space</kbd> 입장</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 접기/펼치기 토글 */}
      <button
        onClick={() => setCollapsed((v) => !v)}
        className="absolute top-1/2 -right-4 z-10 flex h-10 w-4 -translate-y-1/2 items-center justify-center rounded-r-md border border-l-0 border-white/[.1] text-text-muted transition-colors hover:bg-white/[.1] hover:text-text-secondary"
        style={{ background: 'rgba(30,30,48,.85)' }}
        title={collapsed ? '메뉴 열기' : '메뉴 접기'}
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </div>
  );
}
