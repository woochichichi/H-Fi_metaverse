import { useEffect, useRef } from 'react';
import { useMetaverseStore } from '../../stores/metaverseStore';

const TEAM_NAME_COLORS: Record<string, string> = {
  '증권ITO': '#00D68F',
  '생명ITO': '#a78bfa',
  '손보ITO': '#60a5fa',
  '한금서':  '#F8B500',
};

export default function ChatLog() {
  const chatLog = useMetaverseStore((s) => s.chatLog);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [chatLog.length]);

  if (chatLog.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className="absolute bottom-14 left-3 z-[70] flex flex-col gap-[2px] pointer-events-none select-none no-scrollbar"
      style={{ maxHeight: 160, maxWidth: 320, overflowY: 'auto', overflowX: 'hidden' }}
    >
      {chatLog.map((entry) => {
        const nameColor = TEAM_NAME_COLORS[entry.team || ''] || '#ccc';
        return (
          <div
            key={entry.id}
            className="text-[11px] leading-[1.5] px-1"
            style={{ textShadow: '0 1px 3px rgba(0,0,0,.7)' }}
          >
            <span style={{ color: nameColor, fontWeight: 600 }}>{entry.name}</span>
            <span style={{ color: 'rgba(255,255,255,.4)', margin: '0 4px' }}>:</span>
            <span style={{ color: 'rgba(255,255,255,.85)' }}>{entry.message}</span>
          </div>
        );
      })}
    </div>
  );
}
