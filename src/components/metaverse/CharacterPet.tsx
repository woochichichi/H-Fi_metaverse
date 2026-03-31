import { useState, useEffect } from 'react';
import type { PetType } from '../../lib/constants';

/** 펫별 크기 설정 (px) — 다양한 크기로 재미 */
const PET_SIZE: Record<Exclude<PetType, 'none'>, { w: number; h: number; vw: number; vh: number }> = {
  cat:       { w: 12, h: 12, vw: 8, vh: 8 },
  dog:       { w: 12, h: 12, vw: 8, vh: 8 },
  bird:      { w: 10, h: 10, vw: 8, vh: 8 },
  rabbit:    { w: 12, h: 14, vw: 8, vh: 8 },
  hamster:   { w: 10, h: 10, vw: 8, vh: 8 },
  turtle:    { w: 14, h: 10, vw: 10, vh: 8 },
  frog:      { w: 11, h: 10, vw: 8, vh: 8 },
  penguin:   { w: 12, h: 14, vw: 8, vh: 10 },
  fox:       { w: 13, h: 12, vw: 8, vh: 8 },
  hedgehog:  { w: 12, h: 10, vw: 10, vh: 8 },
  snake:     { w: 16, h: 8, vw: 12, vh: 6 },
  fish:      { w: 10, h: 8, vw: 8, vh: 6 },
  owl:       { w: 12, h: 14, vw: 8, vh: 10 },
  dragon:    { w: 16, h: 16, vw: 10, vh: 10 },
  unicorn:   { w: 16, h: 16, vw: 10, vh: 10 },
  slime:     { w: 8, h: 8, vw: 6, vh: 6 },
  bat:       { w: 14, h: 10, vw: 10, vh: 8 },
  panda:     { w: 14, h: 14, vw: 8, vh: 8 },
  duck:      { w: 11, h: 11, vw: 8, vh: 8 },
  mushroom:  { w: 9, h: 10, vw: 7, vh: 8 },
  alien:     { w: 12, h: 14, vw: 8, vh: 10 },
  ghost:     { w: 11, h: 13, vw: 8, vh: 10 },
  crab:      { w: 14, h: 10, vw: 10, vh: 7 },
  butterfly: { w: 12, h: 10, vw: 10, vh: 8 },
};

interface Props {
  type: PetType;
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

  const sz = PET_SIZE[type];
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
        width={sz.w}
        height={sz.h}
        viewBox={`0 0 ${sz.vw} ${sz.vh}`}
        style={{
          imageRendering: 'pixelated',
          transform: ownerDirection === 'left' ? 'scaleX(-1)' : undefined,
        }}
      >
        <PetSprite type={type} frame={frame} />
      </svg>
    </div>
  );
}

function PetSprite({ type, frame }: { type: Exclude<PetType, 'none'>; frame: number }) {
  switch (type) {
    case 'cat': return <CatSprite frame={frame} />;
    case 'dog': return <DogSprite frame={frame} />;
    case 'bird': return <BirdSprite frame={frame} />;
    case 'rabbit': return <RabbitSprite frame={frame} />;
    case 'hamster': return <HamsterSprite frame={frame} />;
    case 'turtle': return <TurtleSprite frame={frame} />;
    case 'frog': return <FrogSprite frame={frame} />;
    case 'penguin': return <PenguinSprite frame={frame} />;
    case 'fox': return <FoxSprite frame={frame} />;
    case 'hedgehog': return <HedgehogSprite frame={frame} />;
    case 'snake': return <SnakeSprite frame={frame} />;
    case 'fish': return <FishSprite frame={frame} />;
    case 'owl': return <OwlSprite frame={frame} />;
    case 'dragon': return <DragonSprite frame={frame} />;
    case 'unicorn': return <UnicornSprite frame={frame} />;
    case 'slime': return <SlimeSprite frame={frame} />;
    case 'bat': return <BatSprite frame={frame} />;
    case 'panda': return <PandaSprite frame={frame} />;
    case 'duck': return <DuckSprite frame={frame} />;
    case 'mushroom': return <MushroomSprite frame={frame} />;
    case 'alien': return <AlienSprite frame={frame} />;
    case 'ghost': return <GhostSprite frame={frame} />;
    case 'crab': return <CrabSprite frame={frame} />;
    case 'butterfly': return <ButterflySprite frame={frame} />;
  }
}

/* ════════════════════════════════════════════════════════════
   기존 4종
   ════════════════════════════════════════════════════════════ */

function CatSprite({ frame }: { frame: number }) {
  return (
    <g>
      <rect x="1" y="0" width="1" height="1" fill="#F4A460" />
      <rect x="4" y="0" width="1" height="1" fill="#F4A460" />
      <rect x="1" y="1" width="4" height="2" fill="#F4A460" />
      <rect x="2" y="1" width="1" height="1" fill="#222" />
      <rect x="4" y="1" width="1" height="1" fill="#222" />
      <rect x="1" y="3" width="4" height="2" fill="#E8944A" />
      {frame === 0 ? (
        <rect x="5" y="3" width="2" height="1" fill="#F4A460" />
      ) : (
        <>
          <rect x="5" y="2" width="1" height="1" fill="#F4A460" />
          <rect x="6" y="1" width="1" height="1" fill="#F4A460" />
        </>
      )}
      <rect x="1" y="5" width="1" height="1" fill="#D4884A" />
      <rect x="4" y="5" width="1" height="1" fill="#D4884A" />
    </g>
  );
}

function DogSprite({ frame }: { frame: number }) {
  return (
    <g>
      <rect x="0" y="1" width="1" height="2" fill="#8B6914" />
      <rect x="5" y="1" width="1" height="2" fill="#8B6914" />
      <rect x="1" y="0" width="4" height="3" fill="#D4A843" />
      <rect x="2" y="1" width="1" height="1" fill="#222" />
      <rect x="4" y="1" width="1" height="1" fill="#222" />
      <rect x="3" y="2" width="1" height="1" fill="#222" />
      <rect x="1" y="3" width="4" height="2" fill="#C49832" />
      {frame === 0 ? (
        <rect x="5" y="3" width="1" height="1" fill="#D4A843" />
      ) : (
        <rect x="5" y="2" width="1" height="1" fill="#D4A843" />
      )}
      <rect x="1" y="5" width="1" height="1" fill="#A08030" />
      <rect x="4" y="5" width="1" height="1" fill="#A08030" />
    </g>
  );
}

function BirdSprite({ frame }: { frame: number }) {
  return (
    <g>
      <rect x="2" y="0" width="3" height="2" fill="#5DADE2" />
      <rect x="3" y="0" width="1" height="1" fill="#222" />
      <rect x="5" y="1" width="1" height="1" fill="#F39C12" />
      <rect x="2" y="2" width="3" height="2" fill="#3498DB" />
      {frame === 0 ? (
        <rect x="1" y="2" width="1" height="2" fill="#85C1E9" />
      ) : (
        <>
          <rect x="1" y="1" width="1" height="1" fill="#85C1E9" />
          <rect x="0" y="0" width="1" height="1" fill="#85C1E9" />
        </>
      )}
      <rect x="2" y="4" width="1" height="1" fill="#F39C12" />
      <rect x="4" y="4" width="1" height="1" fill="#F39C12" />
    </g>
  );
}

function RabbitSprite({ frame }: { frame: number }) {
  return (
    <g>
      <rect x="1" y="-2" width="1" height="2" fill="#F5F5F5" />
      {frame === 0 ? (
        <rect x="4" y="-2" width="1" height="2" fill="#F5F5F5" />
      ) : (
        <rect x="4" y="-1" width="1" height="1" fill="#F5F5F5" />
      )}
      <rect x="1" y="-1" width="1" height="1" fill="#FFB3B3" opacity="0.5" />
      <rect x="1" y="0" width="4" height="2" fill="#F5F5F5" />
      <rect x="2" y="0" width="1" height="1" fill="#E74C3C" />
      <rect x="4" y="0" width="1" height="1" fill="#E74C3C" />
      <rect x="1" y="2" width="4" height="3" fill="#ECECEC" />
      <rect x="5" y="3" width="1" height="1" fill="#fff" />
      <rect x="1" y="5" width="2" height="1" fill="#E0E0E0" />
      <rect x="3" y="5" width="2" height="1" fill="#E0E0E0" />
    </g>
  );
}

/* ════════════════════════════════════════════════════════════
   새 펫 20종
   ════════════════════════════════════════════════════════════ */

function HamsterSprite({ frame }: { frame: number }) {
  return (
    <g>
      {/* 귀 */}
      <rect x="1" y="0" width="1" height="1" fill="#E8B87A" />
      <rect x="5" y="0" width="1" height="1" fill="#E8B87A" />
      {/* 머리 */}
      <rect x="1" y="1" width="5" height="2" fill="#F5CC8A" />
      {/* 볼 */}
      <rect x="1" y="2" width="1" height="1" fill="#FFB3B3" opacity="0.6" />
      <rect x="5" y="2" width="1" height="1" fill="#FFB3B3" opacity="0.6" />
      {/* 눈 */}
      <rect x="2" y="1" width="1" height="1" fill="#222" />
      <rect x="4" y="1" width="1" height="1" fill="#222" />
      {/* 몸 — 통통 */}
      <rect x="1" y="3" width="5" height="2" fill="#E8B87A" />
      {/* 배 하얀색 */}
      <rect x="2" y="3" width="3" height="2" fill="#FFF5E0" />
      {/* 발 */}
      <rect x="1" y="5" width="1" height="1" fill="#D4A06A" />
      <rect x="5" y="5" width="1" height="1" fill="#D4A06A" />
      {/* 볼떡 애니 */}
      {frame === 1 && (
        <>
          <rect x="0" y="2" width="1" height="1" fill="#FFB3B3" opacity="0.4" />
          <rect x="6" y="2" width="1" height="1" fill="#FFB3B3" opacity="0.4" />
        </>
      )}
    </g>
  );
}

function TurtleSprite({ frame }: { frame: number }) {
  return (
    <g>
      {/* 머리 */}
      <rect x="1" y="2" width="2" height="2" fill="#6ABF69" />
      <rect x="1" y="2" width="1" height="1" fill="#222" />
      {/* 등딱지 */}
      <rect x="3" y="1" width="5" height="4" fill="#3E8E41" />
      <rect x="4" y="2" width="3" height="2" fill="#2E7D32" />
      {/* 무늬 */}
      <rect x="5" y="2" width="1" height="1" fill="#4CAF50" />
      {/* 다리 */}
      {frame === 0 ? (
        <>
          <rect x="3" y="5" width="1" height="1" fill="#6ABF69" />
          <rect x="7" y="5" width="1" height="1" fill="#6ABF69" />
        </>
      ) : (
        <>
          <rect x="4" y="5" width="1" height="1" fill="#6ABF69" />
          <rect x="6" y="5" width="1" height="1" fill="#6ABF69" />
        </>
      )}
      {/* 꼬리 */}
      <rect x="8" y="3" width="1" height="1" fill="#6ABF69" />
    </g>
  );
}

function FrogSprite({ frame }: { frame: number }) {
  return (
    <g>
      {/* 눈 (위로 튀어나옴) */}
      <rect x="1" y="0" width="2" height="1" fill="#4CAF50" />
      <rect x="4" y="0" width="2" height="1" fill="#4CAF50" />
      <rect x="1" y="0" width="1" height="1" fill="#fff" />
      <rect x="5" y="0" width="1" height="1" fill="#fff" />
      {/* 머리 */}
      <rect x="1" y="1" width="5" height="2" fill="#4CAF50" />
      {/* 입 */}
      <rect x="2" y="2" width="3" height="1" fill="#388E3C" />
      {/* 몸 */}
      <rect x="1" y="3" width="5" height="2" fill="#66BB6A" />
      {/* 배 */}
      <rect x="2" y="3" width="3" height="2" fill="#C8E6C9" />
      {/* 다리 (점프 애니) */}
      {frame === 0 ? (
        <>
          <rect x="0" y="5" width="2" height="1" fill="#4CAF50" />
          <rect x="5" y="5" width="2" height="1" fill="#4CAF50" />
        </>
      ) : (
        <>
          <rect x="0" y="4" width="1" height="1" fill="#4CAF50" />
          <rect x="6" y="4" width="1" height="1" fill="#4CAF50" />
        </>
      )}
    </g>
  );
}

function PenguinSprite({ frame }: { frame: number }) {
  return (
    <g>
      {/* 머리 */}
      <rect x="2" y="0" width="4" height="3" fill="#2C3E50" />
      {/* 얼굴 */}
      <rect x="3" y="1" width="2" height="2" fill="#F5F5F5" />
      {/* 눈 */}
      <rect x="3" y="1" width="1" height="1" fill="#222" />
      <rect x="4" y="1" width="1" height="1" fill="#222" />
      {/* 부리 */}
      <rect x="3" y="3" width="2" height="1" fill="#F39C12" />
      {/* 몸 */}
      <rect x="2" y="4" width="4" height="3" fill="#2C3E50" />
      {/* 배 */}
      <rect x="3" y="4" width="2" height="3" fill="#F5F5F5" />
      {/* 날개 */}
      {frame === 0 ? (
        <>
          <rect x="1" y="4" width="1" height="2" fill="#34495E" />
          <rect x="6" y="4" width="1" height="2" fill="#34495E" />
        </>
      ) : (
        <>
          <rect x="1" y="3" width="1" height="2" fill="#34495E" />
          <rect x="6" y="3" width="1" height="2" fill="#34495E" />
        </>
      )}
      {/* 발 */}
      <rect x="2" y="7" width="2" height="1" fill="#F39C12" />
      <rect x="4" y="7" width="2" height="1" fill="#F39C12" />
    </g>
  );
}

function FoxSprite({ frame }: { frame: number }) {
  return (
    <g>
      {/* 귀 */}
      <rect x="0" y="0" width="2" height="2" fill="#E65100" />
      <rect x="5" y="0" width="2" height="2" fill="#E65100" />
      <rect x="1" y="0" width="1" height="1" fill="#FFE0BD" />
      <rect x="5" y="0" width="1" height="1" fill="#FFE0BD" />
      {/* 머리 */}
      <rect x="1" y="1" width="5" height="3" fill="#FF8F00" />
      {/* 눈 */}
      <rect x="2" y="2" width="1" height="1" fill="#222" />
      <rect x="5" y="2" width="1" height="1" fill="#222" />
      {/* 코 */}
      <rect x="3" y="3" width="1" height="1" fill="#222" />
      {/* 몸 */}
      <rect x="1" y="4" width="5" height="2" fill="#E65100" />
      {/* 꼬리 — 크고 풍성 */}
      {frame === 0 ? (
        <>
          <rect x="6" y="3" width="1" height="2" fill="#FF8F00" />
          <rect x="7" y="3" width="1" height="1" fill="#FFF5E0" />
        </>
      ) : (
        <>
          <rect x="6" y="2" width="1" height="2" fill="#FF8F00" />
          <rect x="7" y="2" width="1" height="1" fill="#FFF5E0" />
        </>
      )}
      {/* 발 */}
      <rect x="1" y="6" width="1" height="1" fill="#BF360C" />
      <rect x="5" y="6" width="1" height="1" fill="#BF360C" />
    </g>
  );
}

function HedgehogSprite({ frame }: { frame: number }) {
  return (
    <g>
      {/* 가시 */}
      <rect x="3" y="0" width="1" height="1" fill="#795548" />
      <rect x="5" y="0" width="1" height="1" fill="#795548" />
      <rect x="7" y="0" width="1" height="1" fill="#795548" />
      <rect x="2" y="1" width="7" height="1" fill="#8D6E63" />
      {/* 몸 */}
      <rect x="2" y="2" width="7" height="3" fill="#A1887F" />
      {/* 얼굴 */}
      <rect x="0" y="2" width="3" height="3" fill="#FFCC80" />
      {/* 눈 */}
      <rect x="1" y="2" width="1" height="1" fill="#222" />
      {/* 코 */}
      <rect x="0" y="3" width="1" height="1" fill="#222" />
      {/* 가시 디테일 */}
      {frame === 0 ? (
        <rect x="4" y="1" width="1" height="1" fill="#6D4C41" />
      ) : (
        <rect x="6" y="1" width="1" height="1" fill="#6D4C41" />
      )}
      {/* 발 */}
      <rect x="2" y="5" width="1" height="1" fill="#D4A06A" />
      <rect x="7" y="5" width="1" height="1" fill="#D4A06A" />
    </g>
  );
}

function SnakeSprite({ frame }: { frame: number }) {
  return (
    <g>
      {/* 머리 */}
      <rect x="0" y="1" width="2" height="2" fill="#4CAF50" />
      <rect x="0" y="1" width="1" height="1" fill="#C62828" />
      {/* 혀 */}
      {frame === 1 && (
        <>
          <rect x="-1" y="2" width="1" height="1" fill="#E53935" />
          <rect x="-2" y="1" width="1" height="1" fill="#E53935" />
        </>
      )}
      {/* 몸통 — 구불구불 */}
      <rect x="2" y="2" width="2" height="1" fill="#66BB6A" />
      <rect x="3" y="3" width="2" height="1" fill="#4CAF50" />
      <rect x="5" y="2" width="2" height="1" fill="#66BB6A" />
      <rect x="6" y="3" width="2" height="1" fill="#4CAF50" />
      <rect x="8" y="2" width="2" height="1" fill="#66BB6A" />
      {/* 꼬리 */}
      <rect x="10" y="1" width="1" height="1" fill="#81C784" />
      {/* 무늬 */}
      <rect x="3" y="2" width="1" height="1" fill="#388E3C" />
      <rect x="7" y="2" width="1" height="1" fill="#388E3C" />
    </g>
  );
}

function FishSprite({ frame }: { frame: number }) {
  return (
    <g>
      {/* 몸 */}
      <rect x="2" y="1" width="4" height="3" fill="#FF7043" />
      {/* 눈 */}
      <rect x="4" y="1" width="1" height="1" fill="#fff" />
      <rect x="5" y="1" width="1" height="1" fill="#222" />
      {/* 지느러미 위 */}
      <rect x="3" y="0" width="2" height="1" fill="#FF5722" />
      {/* 지느러미 아래 */}
      <rect x="3" y="4" width="1" height="1" fill="#FF5722" />
      {/* 꼬리 */}
      {frame === 0 ? (
        <>
          <rect x="0" y="1" width="2" height="1" fill="#FF8A65" />
          <rect x="0" y="3" width="2" height="1" fill="#FF8A65" />
        </>
      ) : (
        <rect x="0" y="2" width="2" height="1" fill="#FF8A65" />
      )}
      {/* 비늘 무늬 */}
      <rect x="3" y="2" width="1" height="1" fill="#FFAB91" />
    </g>
  );
}

function OwlSprite({ frame }: { frame: number }) {
  return (
    <g>
      {/* 귀 깃 */}
      <rect x="1" y="0" width="1" height="1" fill="#795548" />
      <rect x="6" y="0" width="1" height="1" fill="#795548" />
      {/* 머리 */}
      <rect x="1" y="1" width="6" height="3" fill="#8D6E63" />
      {/* 눈 — 크게 */}
      <rect x="2" y="1" width="2" height="2" fill="#FFF9C4" />
      <rect x="4" y="1" width="2" height="2" fill="#FFF9C4" />
      {/* 동공 */}
      {frame === 0 ? (
        <>
          <rect x="2" y="2" width="1" height="1" fill="#222" />
          <rect x="5" y="2" width="1" height="1" fill="#222" />
        </>
      ) : (
        <>
          <rect x="3" y="2" width="1" height="1" fill="#222" />
          <rect x="4" y="2" width="1" height="1" fill="#222" />
        </>
      )}
      {/* 부리 */}
      <rect x="3" y="3" width="2" height="1" fill="#FF8F00" />
      {/* 몸 */}
      <rect x="1" y="4" width="6" height="3" fill="#A1887F" />
      {/* 배 무늬 */}
      <rect x="2" y="5" width="4" height="2" fill="#D7CCC8" />
      {/* 날개 */}
      <rect x="0" y="4" width="1" height="2" fill="#795548" />
      <rect x="7" y="4" width="1" height="2" fill="#795548" />
      {/* 발 */}
      <rect x="2" y="7" width="1" height="1" fill="#FF8F00" />
      <rect x="5" y="7" width="1" height="1" fill="#FF8F00" />
    </g>
  );
}

function DragonSprite({ frame }: { frame: number }) {
  return (
    <g>
      {/* 뿔 */}
      <rect x="2" y="0" width="1" height="1" fill="#FDD835" />
      <rect x="5" y="0" width="1" height="1" fill="#FDD835" />
      {/* 머리 */}
      <rect x="1" y="1" width="6" height="3" fill="#7B1FA2" />
      {/* 눈 */}
      <rect x="2" y="2" width="1" height="1" fill="#FF5722" />
      <rect x="5" y="2" width="1" height="1" fill="#FF5722" />
      {/* 콧구멍 */}
      <rect x="3" y="3" width="1" height="1" fill="#4A148C" />
      <rect x="4" y="3" width="1" height="1" fill="#4A148C" />
      {/* 불꽃 */}
      {frame === 1 && (
        <>
          <rect x="3" y="4" width="2" height="1" fill="#FF9800" />
          <rect x="2" y="5" width="1" height="1" fill="#FF5722" />
        </>
      )}
      {/* 몸 */}
      <rect x="1" y="4" width="6" height="3" fill="#9C27B0" />
      {/* 배 */}
      <rect x="2" y="5" width="4" height="2" fill="#E1BEE7" />
      {/* 날개 */}
      {frame === 0 ? (
        <>
          <rect x="0" y="3" width="1" height="3" fill="#AB47BC" />
          <rect x="7" y="3" width="1" height="3" fill="#AB47BC" />
        </>
      ) : (
        <>
          <rect x="0" y="2" width="1" height="3" fill="#AB47BC" />
          <rect x="7" y="2" width="1" height="3" fill="#AB47BC" />
          <rect x="-1" y="2" width="1" height="2" fill="#CE93D8" />
          <rect x="8" y="2" width="1" height="2" fill="#CE93D8" />
        </>
      )}
      {/* 꼬리 */}
      <rect x="7" y="6" width="1" height="1" fill="#7B1FA2" />
      <rect x="8" y="5" width="1" height="1" fill="#7B1FA2" />
      {/* 발 */}
      <rect x="2" y="7" width="1" height="1" fill="#6A1B9A" />
      <rect x="5" y="7" width="1" height="1" fill="#6A1B9A" />
    </g>
  );
}

function UnicornSprite({ frame }: { frame: number }) {
  return (
    <g>
      {/* 뿔 (무지개) */}
      <rect x="3" y="0" width="1" height="1" fill="#FFD700" />
      <rect x="4" y="-1" width="1" height="1" fill="#FF69B4" />
      {/* 머리 */}
      <rect x="2" y="1" width="4" height="3" fill="#F5F5F5" />
      {/* 눈 */}
      <rect x="3" y="2" width="1" height="1" fill="#9C27B0" />
      <rect x="5" y="2" width="1" height="1" fill="#9C27B0" />
      {/* 볼 */}
      <rect x="2" y="3" width="1" height="1" fill="#FFB3B3" opacity="0.5" />
      {/* 갈기 (무지개) */}
      <rect x="1" y="1" width="1" height="1" fill="#FF6B6B" />
      <rect x="1" y="2" width="1" height="1" fill="#FFD93D" />
      <rect x="1" y="3" width="1" height="1" fill="#6BCB77" />
      {/* 몸 */}
      <rect x="2" y="4" width="4" height="3" fill="#F5F5F5" />
      {/* 다리 */}
      <rect x="2" y="7" width="1" height="1" fill="#E0E0E0" />
      <rect x="5" y="7" width="1" height="1" fill="#E0E0E0" />
      {frame === 0 ? (
        <rect x="3" y="7" width="1" height="1" fill="#E0E0E0" />
      ) : (
        <rect x="4" y="7" width="1" height="1" fill="#E0E0E0" />
      )}
      {/* 꼬리 (무지개) */}
      <rect x="6" y="4" width="1" height="1" fill="#FF6B6B" />
      <rect x="6" y="5" width="1" height="1" fill="#4ECDC4" />
      <rect x="7" y="5" width="1" height="1" fill="#FFD93D" />
      {/* 반짝 */}
      {frame === 1 && (
        <>
          <rect x="0" y="0" width="1" height="1" fill="#FFD700" opacity="0.6" />
          <rect x="7" y="1" width="1" height="1" fill="#FFD700" opacity="0.6" />
        </>
      )}
    </g>
  );
}

function SlimeSprite({ frame }: { frame: number }) {
  const h = frame === 0 ? 4 : 3;
  const y = frame === 0 ? 1 : 2;
  return (
    <g>
      {/* 몸 — 찌그러지는 애니 */}
      <rect x="1" y={y} width="4" height={h} fill="#69F0AE" rx={1} />
      <rect x="0" y={y + 1} width="6" height={h - 1} fill="#00E676" rx={1} />
      {/* 눈 */}
      <rect x="2" y={y + 1} width="1" height="1" fill="#222" />
      <rect x="4" y={y + 1} width="1" height="1" fill="#222" />
      {/* 하이라이트 */}
      <rect x="1" y={y} width="1" height="1" fill="#B9F6CA" opacity="0.7" />
    </g>
  );
}

function BatSprite({ frame }: { frame: number }) {
  return (
    <g>
      {/* 귀 */}
      <rect x="3" y="0" width="1" height="1" fill="#4A4A4A" />
      <rect x="6" y="0" width="1" height="1" fill="#4A4A4A" />
      {/* 머리 */}
      <rect x="3" y="1" width="4" height="2" fill="#555" />
      {/* 눈 */}
      <rect x="4" y="1" width="1" height="1" fill="#FF5722" />
      <rect x="6" y="1" width="1" height="1" fill="#FF5722" />
      {/* 몸 */}
      <rect x="4" y="3" width="2" height="2" fill="#666" />
      {/* 날개 */}
      {frame === 0 ? (
        <>
          <rect x="0" y="2" width="3" height="2" fill="#555" />
          <rect x="7" y="2" width="3" height="2" fill="#555" />
        </>
      ) : (
        <>
          <rect x="1" y="1" width="2" height="2" fill="#555" />
          <rect x="7" y="1" width="2" height="2" fill="#555" />
          <rect x="0" y="0" width="1" height="2" fill="#444" />
          <rect x="9" y="0" width="1" height="2" fill="#444" />
        </>
      )}
      {/* 발 */}
      <rect x="4" y="5" width="1" height="1" fill="#444" />
      <rect x="5" y="5" width="1" height="1" fill="#444" />
    </g>
  );
}

function PandaSprite({ frame }: { frame: number }) {
  return (
    <g>
      {/* 귀 */}
      <rect x="0" y="0" width="2" height="2" fill="#222" />
      <rect x="6" y="0" width="2" height="2" fill="#222" />
      {/* 머리 */}
      <rect x="1" y="1" width="6" height="3" fill="#F5F5F5" />
      {/* 눈 패치 (검정) */}
      <rect x="1" y="2" width="2" height="2" fill="#222" />
      <rect x="5" y="2" width="2" height="2" fill="#222" />
      {/* 눈 */}
      <rect x="2" y="2" width="1" height="1" fill="#fff" />
      <rect x="5" y="2" width="1" height="1" fill="#fff" />
      {/* 코 */}
      <rect x="3" y="3" width="2" height="1" fill="#444" />
      {/* 몸 */}
      <rect x="1" y="4" width="6" height="2" fill="#F5F5F5" />
      {/* 팔 (검정) */}
      <rect x="0" y="4" width="1" height="2" fill="#222" />
      <rect x="7" y="4" width="1" height="2" fill="#222" />
      {/* 발 */}
      <rect x="2" y="6" width="1" height="1" fill="#222" />
      <rect x="5" y="6" width="1" height="1" fill="#222" />
      {/* 웨이브 */}
      {frame === 1 && (
        <rect x="7" y="3" width="1" height="1" fill="#222" />
      )}
    </g>
  );
}

function DuckSprite({ frame }: { frame: number }) {
  return (
    <g>
      {/* 머리 */}
      <rect x="2" y="0" width="3" height="3" fill="#FFD54F" />
      {/* 눈 */}
      <rect x="4" y="1" width="1" height="1" fill="#222" />
      {/* 부리 */}
      <rect x="5" y="2" width="2" height="1" fill="#FF8F00" />
      {/* 몸 */}
      <rect x="1" y="3" width="5" height="3" fill="#FFEB3B" />
      {/* 날개 */}
      {frame === 0 ? (
        <rect x="0" y="3" width="1" height="2" fill="#FFC107" />
      ) : (
        <rect x="0" y="2" width="1" height="2" fill="#FFC107" />
      )}
      {/* 꼬리 */}
      <rect x="5" y="4" width="1" height="1" fill="#FFC107" />
      {/* 발 */}
      <rect x="1" y="6" width="2" height="1" fill="#FF8F00" />
      <rect x="4" y="6" width="2" height="1" fill="#FF8F00" />
    </g>
  );
}

function MushroomSprite({ frame }: { frame: number }) {
  return (
    <g>
      {/* 갓 */}
      <rect x="1" y="0" width="5" height="3" fill="#E53935" />
      {/* 점 무늬 */}
      <rect x="2" y="0" width="1" height="1" fill="#FFCDD2" />
      <rect x="4" y="1" width="1" height="1" fill="#FFCDD2" />
      {frame === 1 && <rect x="1" y="1" width="1" height="1" fill="#FFCDD2" />}
      {/* 갓 아래 */}
      <rect x="0" y="3" width="7" height="1" fill="#C62828" />
      {/* 줄기 */}
      <rect x="2" y="4" width="3" height="3" fill="#FFF9C4" />
      {/* 얼굴 */}
      <rect x="2" y="5" width="1" height="1" fill="#222" />
      <rect x="4" y="5" width="1" height="1" fill="#222" />
      {/* 볼 */}
      <rect x="2" y="6" width="1" height="1" fill="#FFB3B3" opacity="0.5" />
      <rect x="4" y="6" width="1" height="1" fill="#FFB3B3" opacity="0.5" />
      {/* 발 */}
      <rect x="1" y="7" width="2" height="1" fill="#FFF176" />
      <rect x="4" y="7" width="2" height="1" fill="#FFF176" />
    </g>
  );
}

function AlienSprite({ frame }: { frame: number }) {
  return (
    <g>
      {/* 안테나 */}
      <rect x="3" y="0" width="1" height="1" fill="#76FF03" />
      <rect x="4" y="0" width="1" height="1" fill="#76FF03" />
      {frame === 0 ? (
        <rect x="3" y="-1" width="1" height="1" fill="#CCFF90" />
      ) : (
        <rect x="4" y="-1" width="1" height="1" fill="#CCFF90" />
      )}
      {/* 머리 — 크게 */}
      <rect x="1" y="1" width="6" height="4" fill="#69F0AE" />
      {/* 눈 — 큼 */}
      <rect x="2" y="2" width="2" height="2" fill="#111" />
      <rect x="4" y="2" width="2" height="2" fill="#111" />
      {/* 눈 하이라이트 */}
      <rect x="2" y="2" width="1" height="1" fill="#444" />
      <rect x="5" y="2" width="1" height="1" fill="#444" />
      {/* 입 */}
      <rect x="3" y="4" width="2" height="1" fill="#00C853" />
      {/* 몸 — 작음 */}
      <rect x="2" y="5" width="4" height="3" fill="#66BB6A" />
      {/* 발 */}
      <rect x="2" y="8" width="1" height="1" fill="#4CAF50" />
      <rect x="5" y="8" width="1" height="1" fill="#4CAF50" />
    </g>
  );
}

function GhostSprite({ frame }: { frame: number }) {
  const y = frame === 0 ? 0 : 1;
  return (
    <g>
      {/* 둥근 머리 + 몸 */}
      <rect x="2" y={y} width="4" height="2" fill="#E0E0E0" />
      <rect x="1" y={y + 2} width="6" height="4" fill="#E0E0E0" />
      {/* 눈 */}
      <rect x="2" y={y + 2} width="1" height="2" fill="#222" />
      <rect x="5" y={y + 2} width="1" height="2" fill="#222" />
      {/* 입 */}
      <rect x="3" y={y + 4} width="2" height="1" fill="#999" />
      {/* 하단 물결 */}
      <rect x="1" y={y + 6} width="1" height="1" fill="#E0E0E0" />
      <rect x="3" y={y + 6} width="1" height="1" fill="#E0E0E0" />
      <rect x="5" y={y + 6} width="1" height="1" fill="#E0E0E0" />
      {/* 투명도 */}
      <rect x="1" y={y + 2} width="6" height="5" fill="#fff" opacity="0.15" />
    </g>
  );
}

function CrabSprite({ frame }: { frame: number }) {
  return (
    <g>
      {/* 집게 */}
      {frame === 0 ? (
        <>
          <rect x="0" y="0" width="2" height="2" fill="#E53935" />
          <rect x="8" y="0" width="2" height="2" fill="#E53935" />
        </>
      ) : (
        <>
          <rect x="0" y="1" width="2" height="2" fill="#E53935" />
          <rect x="8" y="1" width="2" height="2" fill="#E53935" />
        </>
      )}
      {/* 팔 */}
      <rect x="2" y="2" width="1" height="1" fill="#EF5350" />
      <rect x="7" y="2" width="1" height="1" fill="#EF5350" />
      {/* 몸 */}
      <rect x="3" y="1" width="4" height="3" fill="#EF5350" />
      {/* 눈 */}
      <rect x="4" y="1" width="1" height="1" fill="#222" />
      <rect x="6" y="1" width="1" height="1" fill="#222" />
      {/* 입 */}
      <rect x="5" y="3" width="1" height="1" fill="#C62828" />
      {/* 다리 */}
      <rect x="3" y="4" width="1" height="1" fill="#D32F2F" />
      <rect x="5" y="4" width="1" height="1" fill="#D32F2F" />
      <rect x="4" y="4" width="1" height="1" fill="#D32F2F" />
      <rect x="6" y="4" width="1" height="1" fill="#D32F2F" />
    </g>
  );
}

function ButterflySprite({ frame }: { frame: number }) {
  return (
    <g>
      {/* 안테나 */}
      <rect x="4" y="0" width="1" height="1" fill="#333" />
      <rect x="6" y="0" width="1" height="1" fill="#333" />
      {/* 머리 */}
      <rect x="4" y="1" width="2" height="1" fill="#333" />
      {/* 몸 */}
      <rect x="4" y="2" width="2" height="4" fill="#5D4037" />
      {/* 왼쪽 날개 */}
      {frame === 0 ? (
        <>
          <rect x="1" y="1" width="3" height="3" fill="#CE93D8" />
          <rect x="0" y="2" width="1" height="2" fill="#AB47BC" />
          <rect x="2" y="2" width="1" height="1" fill="#F48FB1" />
        </>
      ) : (
        <>
          <rect x="2" y="1" width="2" height="3" fill="#CE93D8" />
          <rect x="1" y="2" width="1" height="1" fill="#AB47BC" />
          <rect x="3" y="2" width="1" height="1" fill="#F48FB1" />
        </>
      )}
      {/* 오른쪽 날개 */}
      {frame === 0 ? (
        <>
          <rect x="6" y="1" width="3" height="3" fill="#81D4FA" />
          <rect x="9" y="2" width="1" height="2" fill="#29B6F6" />
          <rect x="7" y="2" width="1" height="1" fill="#4FC3F7" />
        </>
      ) : (
        <>
          <rect x="6" y="1" width="2" height="3" fill="#81D4FA" />
          <rect x="8" y="2" width="1" height="1" fill="#29B6F6" />
          <rect x="6" y="2" width="1" height="1" fill="#4FC3F7" />
        </>
      )}
    </g>
  );
}
