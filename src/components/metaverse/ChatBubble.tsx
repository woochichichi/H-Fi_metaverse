import { useState, useEffect } from 'react';
import { NPC_TEAM, CHAT_MESSAGES } from '../../lib/constants';

interface Bubble {
  id: string;
  npcIndex: number;
  message: string;
}

export default function ChatBubble() {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);

  useEffect(() => {
    const timer = setInterval(() => {
      const npcIndex = Math.floor(Math.random() * NPC_TEAM.length);
      const message = CHAT_MESSAGES[Math.floor(Math.random() * CHAT_MESSAGES.length)];
      const id = crypto.randomUUID();

      setBubbles((prev) => {
        // 같은 NPC의 기존 말풍선 제거
        const filtered = prev.filter((b) => b.npcIndex !== npcIndex);
        return [...filtered, { id, npcIndex, message }];
      });

      // 4초 후 제거
      setTimeout(() => {
        setBubbles((prev) => prev.filter((b) => b.id !== id));
      }, 4000);
    }, 4000);

    return () => clearInterval(timer);
  }, []);

  return (
    <>
      {bubbles.map((b) => {
        const npcEl = document.getElementById(`npc-${b.npcIndex}`);
        if (!npcEl) return null;
        const left = parseFloat(npcEl.style.left || '0');
        const top = parseFloat(npcEl.style.top || '0');

        return (
          <div
            key={b.id}
            className="absolute z-[60] pointer-events-none whitespace-nowrap rounded-xl px-[10px] py-[5px] text-[10px] font-medium text-gray-700"
            style={{
              left: left + 14,
              top: top - 48,
              background: '#fff',
              boxShadow: '0 4px 16px rgba(0,0,0,.15)',
              animation: 'bubbleAnim 4s ease forwards',
              transform: 'translateX(-50%)',
            }}
          >
            {b.message}
            {/* 삼각형 꼬리 */}
            <div
              className="absolute left-1/2 -translate-x-1/2"
              style={{
                bottom: -5,
                borderLeft: '5px solid transparent',
                borderRight: '5px solid transparent',
                borderTop: '6px solid #fff',
              }}
            />
          </div>
        );
      })}
    </>
  );
}
