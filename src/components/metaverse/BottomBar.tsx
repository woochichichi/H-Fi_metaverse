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
    <div
      className="absolute left-0 top-1/2 z-[50] flex -translate-y-1/2 items-start"
    >
      {/* 패널 본체 */}
      <div
        className={`flex flex-col gap-2 rounded-r-xl border border-l-0 border-white/[.06] p-2 transition-all duration-200 ${collapsed ? 'w-0 overflow-hidden border-none p-0' : ''}`}
        style={{ background: 'rgba(30,30,48,.92)', backdropFilter: 'blur(12px)' }}
      >
        {!collapsed && (
          <>
            {/* 액션 버튼 */}
            {actions.map((a) => (
              <button
                key={a.id}
                onClick={() => openModal(a.id)}
                className="flex items-center gap-2 rounded-lg border border-white/[.06] bg-white/[.06] px-3 py-2 text-[11px] font-semibold text-text-secondary transition-all duration-150 hover:border-accent/30 hover:bg-accent/20 hover:text-accent-light"
              >
                <span className="text-base">{a.emoji}</span>
                {a.label}
              </button>
            ))}

            {/* 구분선 */}
            <div className="mx-1 h-px bg-white/[.08]" />

            {/* 이모지 바 */}
            <div className="flex flex-wrap gap-1 px-0.5">
              {REACTION_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => addEmojiFloat(emoji)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[.06] bg-white/[.06] text-sm transition-all duration-150 hover:border-accent/30 hover:bg-accent/20 active:scale-[.92]"
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* 이동 힌트 */}
            <div className="flex flex-col gap-0.5 px-1 text-[9px] text-text-muted">
              <span><kbd className="rounded bg-white/[.08] px-1 py-0.5 font-mono text-[8px] font-bold text-text-secondary">↑↓←→</kbd> 이동</span>
              <span><kbd className="rounded bg-white/[.08] px-1 py-0.5 font-mono text-[8px] font-bold text-text-secondary">Space</kbd> 입장</span>
            </div>
          </>
        )}
      </div>

      {/* 접기/펼치기 토글 */}
      <button
        onClick={() => setCollapsed((v) => !v)}
        className="mt-2 flex h-8 w-5 items-center justify-center rounded-r-md border border-l-0 border-white/[.1] text-text-muted transition-colors hover:bg-white/[.1] hover:text-text-secondary"
        style={{ background: 'rgba(30,30,48,.85)' }}
        title={collapsed ? '메뉴 열기' : '메뉴 접기'}
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>
    </div>
  );
}
