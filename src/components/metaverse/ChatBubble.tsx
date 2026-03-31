import { useEffect, useState, useRef } from 'react';
import { useMetaverseStore } from '../../stores/metaverseStore';
import { useAuthStore } from '../../stores/authStore';
import { TEAM_COLORS } from '../../lib/constants';

const BUBBLE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  '증권ITO': { bg: '#e6fff5', text: '#1a6b4a', border: 'rgba(0,214,143,.25)' },
  '생명ITO': { bg: '#f0edff', text: '#3d2f8c', border: 'rgba(108,92,231,.25)' },
  '손보ITO': { bg: '#e8f4ff', text: '#1a4b7a', border: 'rgba(9,132,227,.25)' },
  '한금서':  { bg: '#fff8e1', text: '#6b5a10', border: 'rgba(248,181,0,.25)' },
};

const DEFAULT_BUBBLE = { bg: '#fff', text: '#555', border: 'rgba(0,0,0,.08)' };

const FADE_OUT_MS = 800; // fade-out 시작 타이밍 (삭제 전)
const DISPLAY_MS = 8000; // 총 표시 시간 (store의 타이머와 동일)

function BubbleItem({ bubble, x, y, team }: {
  bubble: { id: string; userId: string; message: string; timestamp: number };
  x: number;
  y: number;
  team: string;
}) {
  const [phase, setPhase] = useState<'enter' | 'visible' | 'exit'>('enter');
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const colors = BUBBLE_COLORS[team] || DEFAULT_BUBBLE;
  const teamColor = TEAM_COLORS[team]?.body || '#999';

  useEffect(() => {
    setPhase('enter');
    // enter → visible (다음 프레임에서 트랜지션 트리거)
    const rafId = requestAnimationFrame(() => setPhase('visible'));

    // visible → exit (fade out 시작)
    timerRef.current = setTimeout(() => {
      setPhase('exit');
    }, DISPLAY_MS - FADE_OUT_MS);

    return () => {
      cancelAnimationFrame(rafId);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [bubble.id]);

  const opacity = phase === 'enter' ? 0 : phase === 'exit' ? 0 : 1;
  const translateY = phase === 'enter' ? 8 : phase === 'exit' ? -4 : 0;
  const scale = phase === 'enter' ? 0.92 : 1;

  return (
    <div
      className="absolute z-[60] pointer-events-none"
      style={{
        left: x + 17,
        top: y - 52,
        transform: `translateX(-50%) translateY(${translateY}px) scale(${scale})`,
        opacity,
        transition: phase === 'exit'
          ? 'opacity 0.6s ease-in, transform 0.6s ease-in'
          : 'opacity 0.25s ease-out, transform 0.25s ease-out',
      }}
    >
      {/* 말풍선 본체 */}
      <div
        className="relative max-w-[200px] px-3 py-[7px] text-[10.5px] font-medium leading-[1.45]"
        style={{
          background: colors.bg,
          color: colors.text,
          borderRadius: '14px 14px 14px 4px',
          boxShadow: `0 2px 8px rgba(0,0,0,.08), 0 0 0 1px ${colors.border}`,
          borderLeft: `3px solid ${teamColor}`,
          wordBreak: 'break-word',
        }}
      >
        {bubble.message}
      </div>
      {/* 삼각형 꼬리 */}
      <div
        className="absolute"
        style={{
          left: 10,
          bottom: -6,
          width: 0,
          height: 0,
          borderLeft: '6px solid transparent',
          borderRight: '4px solid transparent',
          borderTop: `7px solid ${colors.bg}`,
          filter: `drop-shadow(0 1px 1px rgba(0,0,0,.06))`,
        }}
      />
    </div>
  );
}

export default function ChatBubble() {
  const chatBubbles = useMetaverseStore((s) => s.chatBubbles);
  const otherPlayers = useMetaverseStore((s) => s.otherPlayers);
  const playerPosition = useMetaverseStore((s) => s.playerPosition);
  const { user, profile } = useAuthStore();

  return (
    <>
      {Array.from(chatBubbles.values()).map((bubble) => {
        const isMe = bubble.userId === user?.id;
        const other = otherPlayers.get(bubble.userId);
        const x = isMe ? playerPosition.x : (other?.x ?? 0);
        const y = isMe ? playerPosition.y : (other?.y ?? 0);
        const team = isMe ? (profile?.team || '') : (bubble.team || other?.team || '');

        if (!isMe && !other) return null;

        return (
          <BubbleItem
            key={bubble.userId + '-' + bubble.id}
            bubble={bubble}
            x={x}
            y={y}
            team={team}
          />
        );
      })}
    </>
  );
}
