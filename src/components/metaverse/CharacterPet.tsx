import { useState, useEffect } from 'react';
import type { PetType } from '../../lib/constants';

interface Props {
  type: PetType;
  /** 캐릭터 방향 — 펫은 반대쪽에 위치 */
  ownerDirection?: 'left' | 'right';
}

/** 8bit 픽셀 펫 (캐릭터 옆에 따라다님) */
export default function CharacterPet({ type, ownerDirection = 'right' }: Props) {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    if (type === 'none') return;
    const timer = setInterval(() => setFrame((f) => (f + 1) % 2), 400);
    return () => clearInterval(timer);
  }, [type]);

  if (type === 'none') return null;

  // 펫은 캐릭터 반대 방향에 위치
  const offsetX = ownerDirection === 'right' ? -14 : 22;

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: offsetX,
        bottom: -2,
        transition: 'left 0.3s ease',
      }}
    >
      <svg
        width={12}
        height={12}
        viewBox="0 0 8 8"
        style={{
          imageRendering: 'pixelated',
          transform: ownerDirection === 'left' ? 'scaleX(-1)' : undefined,
        }}
      >
        {type === 'cat' && <CatSprite frame={frame} />}
        {type === 'dog' && <DogSprite frame={frame} />}
        {type === 'bird' && <BirdSprite frame={frame} />}
        {type === 'rabbit' && <RabbitSprite frame={frame} />}
      </svg>
    </div>
  );
}

function CatSprite({ frame }: { frame: number }) {
  return (
    <g>
      {/* 귀 */}
      <rect x="1" y="0" width="1" height="1" fill="#F4A460" />
      <rect x="4" y="0" width="1" height="1" fill="#F4A460" />
      {/* 머리 */}
      <rect x="1" y="1" width="4" height="2" fill="#F4A460" />
      {/* 눈 */}
      <rect x="2" y="1" width="1" height="1" fill="#222" />
      <rect x="4" y="1" width="1" height="1" fill="#222" />
      {/* 몸 */}
      <rect x="1" y="3" width="4" height="2" fill="#E8944A" />
      {/* 꼬리 (프레임별) */}
      {frame === 0 ? (
        <rect x="5" y="3" width="2" height="1" fill="#F4A460" />
      ) : (
        <>
          <rect x="5" y="2" width="1" height="1" fill="#F4A460" />
          <rect x="6" y="1" width="1" height="1" fill="#F4A460" />
        </>
      )}
      {/* 발 */}
      <rect x="1" y="5" width="1" height="1" fill="#D4884A" />
      <rect x="4" y="5" width="1" height="1" fill="#D4884A" />
    </g>
  );
}

function DogSprite({ frame }: { frame: number }) {
  return (
    <g>
      {/* 귀 */}
      <rect x="0" y="1" width="1" height="2" fill="#8B6914" />
      <rect x="5" y="1" width="1" height="2" fill="#8B6914" />
      {/* 머리 */}
      <rect x="1" y="0" width="4" height="3" fill="#D4A843" />
      {/* 눈 */}
      <rect x="2" y="1" width="1" height="1" fill="#222" />
      <rect x="4" y="1" width="1" height="1" fill="#222" />
      {/* 코 */}
      <rect x="3" y="2" width="1" height="1" fill="#222" />
      {/* 몸 */}
      <rect x="1" y="3" width="4" height="2" fill="#C49832" />
      {/* 꼬리 (프레임별) */}
      {frame === 0 ? (
        <rect x="5" y="3" width="1" height="1" fill="#D4A843" />
      ) : (
        <rect x="5" y="2" width="1" height="1" fill="#D4A843" />
      )}
      {/* 발 */}
      <rect x="1" y="5" width="1" height="1" fill="#A08030" />
      <rect x="4" y="5" width="1" height="1" fill="#A08030" />
    </g>
  );
}

function BirdSprite({ frame }: { frame: number }) {
  return (
    <g>
      {/* 머리 */}
      <rect x="2" y="0" width="3" height="2" fill="#5DADE2" />
      {/* 눈 */}
      <rect x="3" y="0" width="1" height="1" fill="#222" />
      {/* 부리 */}
      <rect x="5" y="1" width="1" height="1" fill="#F39C12" />
      {/* 몸 */}
      <rect x="2" y="2" width="3" height="2" fill="#3498DB" />
      {/* 날개 (프레임별) */}
      {frame === 0 ? (
        <rect x="1" y="2" width="1" height="2" fill="#85C1E9" />
      ) : (
        <>
          <rect x="1" y="1" width="1" height="1" fill="#85C1E9" />
          <rect x="0" y="0" width="1" height="1" fill="#85C1E9" />
        </>
      )}
      {/* 발 */}
      <rect x="2" y="4" width="1" height="1" fill="#F39C12" />
      <rect x="4" y="4" width="1" height="1" fill="#F39C12" />
    </g>
  );
}

function RabbitSprite({ frame }: { frame: number }) {
  return (
    <g>
      {/* 귀 (프레임별 — 한쪽 귀 접힘) */}
      <rect x="1" y="-2" width="1" height="2" fill="#F5F5F5" />
      {frame === 0 ? (
        <rect x="4" y="-2" width="1" height="2" fill="#F5F5F5" />
      ) : (
        <rect x="4" y="-1" width="1" height="1" fill="#F5F5F5" />
      )}
      {/* 귀 안쪽 */}
      <rect x="1" y="-1" width="1" height="1" fill="#FFB3B3" opacity="0.5" />
      {/* 머리 */}
      <rect x="1" y="0" width="4" height="2" fill="#F5F5F5" />
      {/* 눈 */}
      <rect x="2" y="0" width="1" height="1" fill="#E74C3C" />
      <rect x="4" y="0" width="1" height="1" fill="#E74C3C" />
      {/* 몸 */}
      <rect x="1" y="2" width="4" height="3" fill="#ECECEC" />
      {/* 꼬리 */}
      <rect x="5" y="3" width="1" height="1" fill="#fff" />
      {/* 발 */}
      <rect x="1" y="5" width="2" height="1" fill="#E0E0E0" />
      <rect x="3" y="5" width="2" height="1" fill="#E0E0E0" />
    </g>
  );
}
