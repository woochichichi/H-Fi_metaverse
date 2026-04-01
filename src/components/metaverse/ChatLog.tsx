import { useEffect, useRef, useState, useCallback } from 'react';
import { ChevronDown } from 'lucide-react';
import { useMetaverseStore } from '../../stores/metaverseStore';

const TEAM_NAME_COLORS: Record<string, string> = {
  '증권ITO': '#00D68F',
  '생명ITO': '#a78bfa',
  '손보ITO': '#60a5fa',
  '한금서':  '#F8B500',
  '금융ITO': '#FF6348',
};

const AT_BOTTOM_THRESHOLD = 32; // px

export default function ChatLog() {
  const chatLog = useMetaverseStore((s) => s.chatLog);
  const containerRef = useRef<HTMLDivElement>(null);
  const atBottomRef = useRef(true); // ref로 stale closure 방지
  const [atBottom, setAtBottom] = useState(true);
  const [unread, setUnread] = useState(0);

  const scrollToBottom = useCallback((smooth = true) => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'instant' });
  }, []);

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const bottom = el.scrollHeight - el.scrollTop - el.clientHeight < AT_BOTTOM_THRESHOLD;
    atBottomRef.current = bottom;
    setAtBottom(bottom);
    if (bottom) setUnread(0);
  }, []);

  // 새 메시지 도착 — ref로 읽어 항상 최신 scroll 상태 반영
  useEffect(() => {
    if (chatLog.length === 0) return;
    if (atBottomRef.current) {
      scrollToBottom(false);
      setUnread(0);
    } else {
      setUnread((n) => n + 1);
    }
  }, [chatLog.length, scrollToBottom]);

  if (chatLog.length === 0) return null;

  return (
    <div className="absolute bottom-14 left-3 z-[70] flex flex-col items-start gap-1" style={{ maxWidth: 320 }}>
      {/* 최신 메시지로 이동 버튼 — 로그 위에 표시 */}
      {!atBottom && (
        <button
          onClick={() => { scrollToBottom(); setUnread(0); }}
          className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium text-white shadow pointer-events-auto"
          style={{ background: 'rgba(0,0,0,.55)', backdropFilter: 'blur(6px)' }}
        >
          <ChevronDown size={11} />
          {unread > 0 ? `새 메시지 ${unread}건` : '최신으로'}
        </button>
      )}

      {/* 스크롤 가능한 로그 */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        onKeyDown={(e) => e.stopPropagation()}
        className="flex flex-col gap-[2px] overflow-y-auto no-scrollbar select-none pointer-events-auto"
        style={{ maxHeight: 160, overflowX: 'hidden' }}
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
    </div>
  );
}
