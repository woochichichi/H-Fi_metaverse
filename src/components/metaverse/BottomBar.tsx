import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
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
    <div className="flex-shrink-0 border-t border-white/[.06]" style={{ background: 'rgba(30,30,48,.95)', backdropFilter: 'blur(12px)' }}>
      {/* 접힌 상태: 토글 버튼만 */}
      {collapsed ? (
        <div className="flex h-8 items-center px-3">
          <button
            onClick={() => setCollapsed(false)}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-[10px] text-text-muted transition-colors hover:bg-white/[.08] hover:text-text-secondary"
          >
            <ChevronUp size={14} />
            메뉴 열기
          </button>
        </div>
      ) : (
        <div className="flex h-[52px] items-center gap-[14px] px-[18px]">
          {/* 액션 버튼 (좌측) */}
          <div className="flex gap-[6px]">
            {actions.map((a) => (
              <button
                key={a.id}
                onClick={() => openModal(a.id)}
                className="flex items-center gap-[5px] rounded-[10px] border border-white/[.06] bg-white/[.06] px-4 py-[7px] text-[11px] font-semibold text-text-secondary transition-all duration-150 hover:border-accent/30 hover:bg-accent/20 hover:text-accent-light"
              >
                {a.emoji} {a.label}
              </button>
            ))}
          </div>

          {/* 구분선 */}
          <div className="h-6 w-px bg-white/[.08]" />

          {/* 이동 힌트 */}
          <div className="flex items-center gap-[5px] text-[10px] text-text-muted">
            <span className="rounded-[5px] bg-white/[.08] px-[7px] py-[3px] font-mono text-[9px] font-bold text-text-secondary">
              ↑↓←→
            </span>
            이동
            <span className="ml-1 rounded-[5px] bg-white/[.08] px-[7px] py-[3px] font-mono text-[9px] font-bold text-text-secondary">
              Space
            </span>
            입장
          </div>

          {/* 이모지 바 */}
          <div className="flex gap-1">
            {REACTION_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => addEmojiFloat(emoji)}
                className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-white/[.06] bg-white/[.06] text-lg transition-all duration-150 hover:border-accent/30 hover:bg-accent/20 active:scale-[.92]"
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* 접기 버튼 */}
          <button
            onClick={() => setCollapsed(true)}
            className="ml-auto flex h-7 w-7 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-white/[.08] hover:text-text-secondary"
            title="하단바 접기"
          >
            <ChevronDown size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
