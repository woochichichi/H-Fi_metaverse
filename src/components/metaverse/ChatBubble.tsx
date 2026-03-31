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
            className="absolute z-[60] pointer-events-none whitespace-nowrap"
            style={{
              left: x + 17,
              top: y - 48,
              transform: 'translateX(-50%)',
              animation: 'bubbleFadeIn .2s ease-out',
            }}
          >
            <div
              className="relative rounded-xl px-[10px] py-[5px] text-[10px] font-medium text-gray-700"
              style={{
                background: '#fff',
                boxShadow: '0 4px 16px rgba(0,0,0,.15)',
              }}
            >
              {bubble.message}
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
          </div>
        );
      })}
    </>
  );
}
