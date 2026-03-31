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
            style={{ left: x + 17, top: y - 52, transform: 'translateX(-50%)' }}
          >
            <div
              className="relative max-w-[180px] rounded-lg px-3 py-1.5 text-[12px] leading-tight"
              style={{
                background: isMe ? 'rgba(108,92,231,.92)' : 'rgba(50,45,55,.92)',
                color: '#fff',
                boxShadow: '0 2px 8px rgba(0,0,0,.3)',
                wordBreak: 'break-word',
              }}
            >
              {bubble.message}
              <div
                className="absolute left-1/2 -translate-x-1/2"
                style={{
                  bottom: -6,
                  width: 0,
                  height: 0,
                  borderLeft: '5px solid transparent',
                  borderRight: '5px solid transparent',
                  borderTop: `6px solid ${isMe ? 'rgba(108,92,231,.92)' : 'rgba(50,45,55,.92)'}`,
                }}
              />
            </div>
          </div>
        );
      })}
    </>
  );
}
