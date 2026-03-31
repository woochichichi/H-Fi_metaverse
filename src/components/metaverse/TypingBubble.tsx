/**
 * 타이핑 중 말풍선 — 머리 위에 "..." 표시
 */
export default function TypingBubble() {
  return (
    <div
      className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center"
      style={{ top: -40 }}
    >
      <div
        className="relative rounded-lg px-2 py-1"
        style={{
          background: 'rgba(255,255,255,0.95)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        }}
      >
        <div className="flex items-center gap-[3px]">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="inline-block h-1 w-1 rounded-full bg-gray-400"
              style={{
                animation: 'typingBounce 1s ease-in-out infinite',
                animationDelay: `${i * 200}ms`,
              }}
            />
          ))}
        </div>
        {/* 꼬리 */}
        <div
          className="absolute left-1/2 -translate-x-1/2"
          style={{
            bottom: -4,
            width: 0,
            height: 0,
            borderLeft: '4px solid transparent',
            borderRight: '4px solid transparent',
            borderTop: '4px solid rgba(255,255,255,0.95)',
          }}
        />
      </div>
    </div>
  );
}
