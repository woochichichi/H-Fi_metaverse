import { useEffect, useState } from 'react';

/**
 * 스폰 이펙트 — 접속/방 이동 시 반짝이며 나타나는 효과
 * 1초 후 자동 소멸
 */
export default function SpawnEffect() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div
      className="absolute inset-0 pointer-events-none z-10"
      style={{ animation: 'spawnFade 1s ease-out forwards' }}
    >
      {SPARKLES.map((s, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            width: s.size,
            height: s.size,
            left: s.x,
            top: s.y,
            background: s.color,
            animation: `sparkleFloat ${s.duration}s ease-out ${s.delay}s forwards`,
            opacity: 0,
          }}
        />
      ))}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          width: 6,
          height: 6,
          border: '2px solid rgba(255,215,0,0.6)',
          animation: 'spawnRing 0.6s ease-out forwards',
        }}
      />
    </div>
  );
}

const SPARKLES = [
  { x: '20%', y: '10%', size: 4, color: '#FFD700', delay: 0, duration: 0.8 },
  { x: '70%', y: '15%', size: 3, color: '#FFF', delay: 0.1, duration: 0.7 },
  { x: '10%', y: '50%', size: 3, color: '#FFD700', delay: 0.15, duration: 0.9 },
  { x: '80%', y: '45%', size: 4, color: '#FFF', delay: 0.05, duration: 0.8 },
  { x: '40%', y: '5%', size: 3, color: '#87CEEB', delay: 0.2, duration: 0.7 },
  { x: '60%', y: '60%', size: 3, color: '#FFD700', delay: 0.1, duration: 0.9 },
  { x: '30%', y: '70%', size: 2, color: '#FFF', delay: 0.25, duration: 0.6 },
  { x: '85%', y: '70%', size: 3, color: '#87CEEB', delay: 0.15, duration: 0.8 },
];
