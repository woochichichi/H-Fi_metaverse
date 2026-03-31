import { useMetaverseStore } from '../../stores/metaverseStore';
import { useAuthStore } from '../../stores/authStore';

export default function ChatBubble() {
  const chatBubbles = useMetaverseStore((s) => s.chatBubbles);
  const otherPlayers = useMetaverseStore((s) => s.otherPlayers);
  const playerPosition = useMetaverseStore((s) => s.playerPosition);
  const user = useAuthStore((s) => s.user);

  return (
    <>
      {Array.from(chatBubbles.values()).map((bubble) => {
        const isMe = bubble.userId === user?.id;
        const other = otherPlayers.get(bubble.userId);
        const x = isMe ? playerPosition.x : (other?.x ?? 0);
        const y = isMe ? playerPosition.y : (other?.y ?? 0);

        if (!isMe && !other) return null;

        return (
          <div
            key={bubble.id}
            className="absolute z-[60] pointer-events-none"
            style={{
              left: x + 17,
              top: y - 56,
              transform: 'translateX(-50%)',
            }}
          >
            {/* 구름형 말풍선 */}
            <div
              className="relative max-w-[200px] px-[12px] py-[6px] text-[10px] font-medium text-gray-700"
              style={{
                background: '#fff',
                borderRadius: '18px 18px 18px 4px',
                boxShadow: '0 2px 12px rgba(0,0,0,.12), 0 1px 3px rgba(0,0,0,.08)',
                border: '1px solid rgba(0,0,0,.06)',
                wordBreak: 'break-word',
              }}
            >
              {bubble.message}
            </div>
            {/* 구름 꼬리 — 동그란 원 2개 */}
            <div
              className="absolute"
              style={{
                left: 14,
                bottom: -6,
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#fff',
                boxShadow: '0 1px 3px rgba(0,0,0,.1)',
                border: '1px solid rgba(0,0,0,.06)',
              }}
            />
            <div
              className="absolute"
              style={{
                left: 8,
                bottom: -12,
                width: 5,
                height: 5,
                borderRadius: '50%',
                background: '#fff',
                boxShadow: '0 1px 2px rgba(0,0,0,.08)',
                border: '1px solid rgba(0,0,0,.06)',
              }}
            />
          </div>
        );
      })}
    </>
  );
}
