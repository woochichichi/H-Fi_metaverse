import { useState, useEffect } from 'react';
import type { PetType } from '../../lib/constants';

/** 날아다니는 펫 목록 */
const FLYING_PETS: Set<string> = new Set(['bird', 'butterfly', 'fish', 'dragon', 'owl']);

/** 펫별 크기 설정 (px) */
const PET_SIZE: Record<Exclude<PetType, 'none'>, { w: number; h: number; vw: number; vh: number }> = {
  // 12간지
  rat:       { w: 10, h: 10, vw: 8, vh: 8 },
  ox:        { w: 14, h: 14, vw: 10, vh: 10 },
  tiger:     { w: 14, h: 14, vw: 10, vh: 10 },
  rabbit:    { w: 12, h: 14, vw: 8, vh: 8 },
  dragon:    { w: 16, h: 16, vw: 10, vh: 10 },
  snake:     { w: 16, h: 8, vw: 12, vh: 6 },
  horse:     { w: 14, h: 16, vw: 10, vh: 12 },
  sheep:     { w: 14, h: 12, vw: 10, vh: 8 },
  monkey:    { w: 12, h: 14, vw: 8, vh: 10 },
  rooster:   { w: 12, h: 14, vw: 8, vh: 10 },
  dog:       { w: 12, h: 12, vw: 8, vh: 8 },
  pig:       { w: 12, h: 12, vw: 8, vh: 8 },
  // 기타
  cat:       { w: 12, h: 12, vw: 8, vh: 8 },
  bird:      { w: 10, h: 10, vw: 8, vh: 8 },
  hamster:   { w: 10, h: 10, vw: 8, vh: 8 },
  turtle:    { w: 14, h: 10, vw: 10, vh: 8 },
  frog:      { w: 11, h: 10, vw: 8, vh: 8 },
  penguin:   { w: 12, h: 14, vw: 8, vh: 10 },
  fox:       { w: 13, h: 12, vw: 8, vh: 8 },
  hedgehog:  { w: 12, h: 10, vw: 10, vh: 8 },
  fish:      { w: 10, h: 8, vw: 8, vh: 6 },
  owl:       { w: 12, h: 14, vw: 8, vh: 10 },
  unicorn:   { w: 16, h: 16, vw: 10, vh: 10 },
  panda:     { w: 14, h: 14, vw: 8, vh: 8 },
  duck:      { w: 11, h: 11, vw: 8, vh: 8 },
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
  const isFlying = FLYING_PETS.has(type);

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: offsetX,
        bottom: isFlying ? 10 : -2,
        transition: 'left 0.3s ease',
        animation: isFlying ? 'petFloat 1.2s ease-in-out infinite' : undefined,
      }}
    >
      {/* 날아다니는 펫용 CSS 애니메이션 */}
      {isFlying && (
        <style>{`
          @keyframes petFloat {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-4px); }
          }
        `}</style>
      )}
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
    case 'panda': return <PandaSprite frame={frame} />;
    case 'duck': return <DuckSprite frame={frame} />;
    case 'crab': return <CrabSprite frame={frame} />;
    case 'butterfly': return <ButterflySprite frame={frame} />;
    case 'tiger': return <TigerSprite frame={frame} />;
    case 'rat': return <RatSprite frame={frame} />;
    case 'ox': return <OxSprite frame={frame} />;
    case 'horse': return <HorseSprite frame={frame} />;
    case 'sheep': return <SheepSprite frame={frame} />;
    case 'monkey': return <MonkeySprite frame={frame} />;
    case 'rooster': return <RoosterSprite frame={frame} />;
    case 'pig': return <PigSprite frame={frame} />;
  }
}

/* ════════════════════════════════════════════════════════════
   기존 펫 스프라이트
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

function HamsterSprite({ frame }: { frame: number }) {
  return (
    <g>
      <rect x="1" y="0" width="1" height="1" fill="#E8B87A" />
      <rect x="5" y="0" width="1" height="1" fill="#E8B87A" />
      <rect x="1" y="1" width="5" height="2" fill="#F5CC8A" />
      <rect x="1" y="2" width="1" height="1" fill="#FFB3B3" opacity="0.6" />
      <rect x="5" y="2" width="1" height="1" fill="#FFB3B3" opacity="0.6" />
      <rect x="2" y="1" width="1" height="1" fill="#222" />
      <rect x="4" y="1" width="1" height="1" fill="#222" />
      <rect x="1" y="3" width="5" height="2" fill="#E8B87A" />
      <rect x="2" y="3" width="3" height="2" fill="#FFF5E0" />
      <rect x="1" y="5" width="1" height="1" fill="#D4A06A" />
      <rect x="5" y="5" width="1" height="1" fill="#D4A06A" />
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
      <rect x="1" y="2" width="2" height="2" fill="#6ABF69" />
      <rect x="1" y="2" width="1" height="1" fill="#222" />
      <rect x="3" y="1" width="5" height="4" fill="#3E8E41" />
      <rect x="4" y="2" width="3" height="2" fill="#2E7D32" />
      <rect x="5" y="2" width="1" height="1" fill="#4CAF50" />
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
      <rect x="8" y="3" width="1" height="1" fill="#6ABF69" />
    </g>
  );
}

function FrogSprite({ frame }: { frame: number }) {
  return (
    <g>
      <rect x="1" y="0" width="2" height="1" fill="#4CAF50" />
      <rect x="4" y="0" width="2" height="1" fill="#4CAF50" />
      <rect x="1" y="0" width="1" height="1" fill="#fff" />
      <rect x="5" y="0" width="1" height="1" fill="#fff" />
      <rect x="1" y="1" width="5" height="2" fill="#4CAF50" />
      <rect x="2" y="2" width="3" height="1" fill="#388E3C" />
      <rect x="1" y="3" width="5" height="2" fill="#66BB6A" />
      <rect x="2" y="3" width="3" height="2" fill="#C8E6C9" />
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
      <rect x="2" y="0" width="4" height="3" fill="#2C3E50" />
      <rect x="3" y="1" width="2" height="2" fill="#F5F5F5" />
      <rect x="3" y="1" width="1" height="1" fill="#222" />
      <rect x="4" y="1" width="1" height="1" fill="#222" />
      <rect x="3" y="3" width="2" height="1" fill="#F39C12" />
      <rect x="2" y="4" width="4" height="3" fill="#2C3E50" />
      <rect x="3" y="4" width="2" height="3" fill="#F5F5F5" />
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
      <rect x="2" y="7" width="2" height="1" fill="#F39C12" />
      <rect x="4" y="7" width="2" height="1" fill="#F39C12" />
    </g>
  );
}

function FoxSprite({ frame }: { frame: number }) {
  return (
    <g>
      <rect x="0" y="0" width="2" height="2" fill="#E65100" />
      <rect x="5" y="0" width="2" height="2" fill="#E65100" />
      <rect x="1" y="0" width="1" height="1" fill="#FFE0BD" />
      <rect x="5" y="0" width="1" height="1" fill="#FFE0BD" />
      <rect x="1" y="1" width="5" height="3" fill="#FF8F00" />
      <rect x="2" y="2" width="1" height="1" fill="#222" />
      <rect x="5" y="2" width="1" height="1" fill="#222" />
      <rect x="3" y="3" width="1" height="1" fill="#222" />
      <rect x="1" y="4" width="5" height="2" fill="#E65100" />
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
      <rect x="1" y="6" width="1" height="1" fill="#BF360C" />
      <rect x="5" y="6" width="1" height="1" fill="#BF360C" />
    </g>
  );
}

function HedgehogSprite({ frame }: { frame: number }) {
  return (
    <g>
      <rect x="3" y="0" width="1" height="1" fill="#795548" />
      <rect x="5" y="0" width="1" height="1" fill="#795548" />
      <rect x="7" y="0" width="1" height="1" fill="#795548" />
      <rect x="2" y="1" width="7" height="1" fill="#8D6E63" />
      <rect x="2" y="2" width="7" height="3" fill="#A1887F" />
      <rect x="0" y="2" width="3" height="3" fill="#FFCC80" />
      <rect x="1" y="2" width="1" height="1" fill="#222" />
      <rect x="0" y="3" width="1" height="1" fill="#222" />
      {frame === 0 ? (
        <rect x="4" y="1" width="1" height="1" fill="#6D4C41" />
      ) : (
        <rect x="6" y="1" width="1" height="1" fill="#6D4C41" />
      )}
      <rect x="2" y="5" width="1" height="1" fill="#D4A06A" />
      <rect x="7" y="5" width="1" height="1" fill="#D4A06A" />
    </g>
  );
}

function SnakeSprite({ frame }: { frame: number }) {
  return (
    <g>
      <rect x="0" y="1" width="2" height="2" fill="#4CAF50" />
      <rect x="0" y="1" width="1" height="1" fill="#C62828" />
      {frame === 1 && (
        <>
          <rect x="-1" y="2" width="1" height="1" fill="#E53935" />
          <rect x="-2" y="1" width="1" height="1" fill="#E53935" />
        </>
      )}
      <rect x="2" y="2" width="2" height="1" fill="#66BB6A" />
      <rect x="3" y="3" width="2" height="1" fill="#4CAF50" />
      <rect x="5" y="2" width="2" height="1" fill="#66BB6A" />
      <rect x="6" y="3" width="2" height="1" fill="#4CAF50" />
      <rect x="8" y="2" width="2" height="1" fill="#66BB6A" />
      <rect x="10" y="1" width="1" height="1" fill="#81C784" />
      <rect x="3" y="2" width="1" height="1" fill="#388E3C" />
      <rect x="7" y="2" width="1" height="1" fill="#388E3C" />
    </g>
  );
}

function FishSprite({ frame }: { frame: number }) {
  return (
    <g>
      <rect x="2" y="1" width="4" height="3" fill="#FF7043" />
      <rect x="4" y="1" width="1" height="1" fill="#fff" />
      <rect x="5" y="1" width="1" height="1" fill="#222" />
      <rect x="3" y="0" width="2" height="1" fill="#FF5722" />
      <rect x="3" y="4" width="1" height="1" fill="#FF5722" />
      {frame === 0 ? (
        <>
          <rect x="0" y="1" width="2" height="1" fill="#FF8A65" />
          <rect x="0" y="3" width="2" height="1" fill="#FF8A65" />
        </>
      ) : (
        <rect x="0" y="2" width="2" height="1" fill="#FF8A65" />
      )}
      <rect x="3" y="2" width="1" height="1" fill="#FFAB91" />
    </g>
  );
}

function OwlSprite({ frame }: { frame: number }) {
  return (
    <g>
      <rect x="1" y="0" width="1" height="1" fill="#795548" />
      <rect x="6" y="0" width="1" height="1" fill="#795548" />
      <rect x="1" y="1" width="6" height="3" fill="#8D6E63" />
      <rect x="2" y="1" width="2" height="2" fill="#FFF9C4" />
      <rect x="4" y="1" width="2" height="2" fill="#FFF9C4" />
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
      <rect x="3" y="3" width="2" height="1" fill="#FF8F00" />
      <rect x="1" y="4" width="6" height="3" fill="#A1887F" />
      <rect x="2" y="5" width="4" height="2" fill="#D7CCC8" />
      <rect x="0" y="4" width="1" height="2" fill="#795548" />
      <rect x="7" y="4" width="1" height="2" fill="#795548" />
      <rect x="2" y="7" width="1" height="1" fill="#FF8F00" />
      <rect x="5" y="7" width="1" height="1" fill="#FF8F00" />
    </g>
  );
}

function DragonSprite({ frame }: { frame: number }) {
  return (
    <g>
      <rect x="2" y="0" width="1" height="1" fill="#FDD835" />
      <rect x="5" y="0" width="1" height="1" fill="#FDD835" />
      <rect x="1" y="1" width="6" height="3" fill="#7B1FA2" />
      <rect x="2" y="2" width="1" height="1" fill="#FF5722" />
      <rect x="5" y="2" width="1" height="1" fill="#FF5722" />
      <rect x="3" y="3" width="1" height="1" fill="#4A148C" />
      <rect x="4" y="3" width="1" height="1" fill="#4A148C" />
      {frame === 1 && (
        <>
          <rect x="3" y="4" width="2" height="1" fill="#FF9800" />
          <rect x="2" y="5" width="1" height="1" fill="#FF5722" />
        </>
      )}
      <rect x="1" y="4" width="6" height="3" fill="#9C27B0" />
      <rect x="2" y="5" width="4" height="2" fill="#E1BEE7" />
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
      <rect x="7" y="6" width="1" height="1" fill="#7B1FA2" />
      <rect x="8" y="5" width="1" height="1" fill="#7B1FA2" />
      <rect x="2" y="7" width="1" height="1" fill="#6A1B9A" />
      <rect x="5" y="7" width="1" height="1" fill="#6A1B9A" />
    </g>
  );
}

function UnicornSprite({ frame }: { frame: number }) {
  return (
    <g>
      <rect x="3" y="0" width="1" height="1" fill="#FFD700" />
      <rect x="4" y="-1" width="1" height="1" fill="#FF69B4" />
      <rect x="2" y="1" width="4" height="3" fill="#F5F5F5" />
      <rect x="3" y="2" width="1" height="1" fill="#9C27B0" />
      <rect x="5" y="2" width="1" height="1" fill="#9C27B0" />
      <rect x="2" y="3" width="1" height="1" fill="#FFB3B3" opacity="0.5" />
      <rect x="1" y="1" width="1" height="1" fill="#FF6B6B" />
      <rect x="1" y="2" width="1" height="1" fill="#FFD93D" />
      <rect x="1" y="3" width="1" height="1" fill="#6BCB77" />
      <rect x="2" y="4" width="4" height="3" fill="#F5F5F5" />
      <rect x="2" y="7" width="1" height="1" fill="#E0E0E0" />
      <rect x="5" y="7" width="1" height="1" fill="#E0E0E0" />
      {frame === 0 ? (
        <rect x="3" y="7" width="1" height="1" fill="#E0E0E0" />
      ) : (
        <rect x="4" y="7" width="1" height="1" fill="#E0E0E0" />
      )}
      <rect x="6" y="4" width="1" height="1" fill="#FF6B6B" />
      <rect x="6" y="5" width="1" height="1" fill="#4ECDC4" />
      <rect x="7" y="5" width="1" height="1" fill="#FFD93D" />
      {frame === 1 && (
        <>
          <rect x="0" y="0" width="1" height="1" fill="#FFD700" opacity="0.6" />
          <rect x="7" y="1" width="1" height="1" fill="#FFD700" opacity="0.6" />
        </>
      )}
    </g>
  );
}

function PandaSprite({ frame }: { frame: number }) {
  return (
    <g>
      <rect x="0" y="0" width="2" height="2" fill="#222" />
      <rect x="6" y="0" width="2" height="2" fill="#222" />
      <rect x="1" y="1" width="6" height="3" fill="#F5F5F5" />
      <rect x="1" y="2" width="2" height="2" fill="#222" />
      <rect x="5" y="2" width="2" height="2" fill="#222" />
      <rect x="2" y="2" width="1" height="1" fill="#fff" />
      <rect x="5" y="2" width="1" height="1" fill="#fff" />
      <rect x="3" y="3" width="2" height="1" fill="#444" />
      <rect x="1" y="4" width="6" height="2" fill="#F5F5F5" />
      <rect x="0" y="4" width="1" height="2" fill="#222" />
      <rect x="7" y="4" width="1" height="2" fill="#222" />
      <rect x="2" y="6" width="1" height="1" fill="#222" />
      <rect x="5" y="6" width="1" height="1" fill="#222" />
      {frame === 1 && (
        <rect x="7" y="3" width="1" height="1" fill="#222" />
      )}
    </g>
  );
}

function DuckSprite({ frame }: { frame: number }) {
  return (
    <g>
      <rect x="2" y="0" width="3" height="3" fill="#FFD54F" />
      <rect x="4" y="1" width="1" height="1" fill="#222" />
      <rect x="5" y="2" width="2" height="1" fill="#FF8F00" />
      <rect x="1" y="3" width="5" height="3" fill="#FFEB3B" />
      {frame === 0 ? (
        <rect x="0" y="3" width="1" height="2" fill="#FFC107" />
      ) : (
        <rect x="0" y="2" width="1" height="2" fill="#FFC107" />
      )}
      <rect x="5" y="4" width="1" height="1" fill="#FFC107" />
      <rect x="1" y="6" width="2" height="1" fill="#FF8F00" />
      <rect x="4" y="6" width="2" height="1" fill="#FF8F00" />
    </g>
  );
}

function CrabSprite({ frame }: { frame: number }) {
  return (
    <g>
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
      <rect x="2" y="2" width="1" height="1" fill="#EF5350" />
      <rect x="7" y="2" width="1" height="1" fill="#EF5350" />
      <rect x="3" y="1" width="4" height="3" fill="#EF5350" />
      <rect x="4" y="1" width="1" height="1" fill="#222" />
      <rect x="6" y="1" width="1" height="1" fill="#222" />
      <rect x="5" y="3" width="1" height="1" fill="#C62828" />
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
      <rect x="4" y="0" width="1" height="1" fill="#333" />
      <rect x="6" y="0" width="1" height="1" fill="#333" />
      <rect x="4" y="1" width="2" height="1" fill="#333" />
      <rect x="4" y="2" width="2" height="4" fill="#5D4037" />
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

/* ════════════════════════════════════════════════════════════
   12간지 신규 스프라이트
   ════════════════════════════════════════════════════════════ */

function TigerSprite({ frame }: { frame: number }) {
  return (
    <g>
      {/* 귀 */}
      <rect x="1" y="0" width="2" height="1" fill="#FF8F00" />
      <rect x="7" y="0" width="2" height="1" fill="#FF8F00" />
      <rect x="2" y="0" width="1" height="1" fill="#FFE0BD" />
      <rect x="7" y="0" width="1" height="1" fill="#FFE0BD" />
      {/* 머리 */}
      <rect x="1" y="1" width="8" height="3" fill="#FF8F00" />
      {/* 줄무늬 */}
      <rect x="2" y="1" width="1" height="1" fill="#E65100" />
      <rect x="5" y="1" width="1" height="1" fill="#E65100" />
      <rect x="7" y="1" width="1" height="1" fill="#E65100" />
      {/* 눈 */}
      <rect x="3" y="2" width="1" height="1" fill="#222" />
      <rect x="6" y="2" width="1" height="1" fill="#222" />
      {/* 코+입 */}
      <rect x="4" y="3" width="2" height="1" fill="#FFE0BD" />
      <rect x="5" y="3" width="1" height="1" fill="#FF6B6B" />
      {/* 왕(王) 무늬 */}
      <rect x="4" y="1" width="2" height="1" fill="#222" />
      {/* 몸 */}
      <rect x="2" y="4" width="6" height="3" fill="#FF8F00" />
      {/* 줄무늬 몸 */}
      <rect x="3" y="5" width="1" height="1" fill="#E65100" />
      <rect x="5" y="5" width="1" height="1" fill="#E65100" />
      <rect x="7" y="4" width="1" height="2" fill="#E65100" />
      {/* 배 */}
      <rect x="3" y="6" width="4" height="1" fill="#FFE0BD" />
      {/* 꼬리 */}
      {frame === 0 ? (
        <rect x="8" y="4" width="1" height="2" fill="#FF8F00" />
      ) : (
        <>
          <rect x="8" y="3" width="1" height="2" fill="#FF8F00" />
          <rect x="9" y="3" width="1" height="1" fill="#E65100" />
        </>
      )}
      {/* 발 */}
      <rect x="2" y="7" width="2" height="1" fill="#E65100" />
      <rect x="6" y="7" width="2" height="1" fill="#E65100" />
    </g>
  );
}

function RatSprite({ frame }: { frame: number }) {
  return (
    <g>
      {/* 귀 — 크고 둥근 */}
      <rect x="0" y="0" width="2" height="2" fill="#BDBDBD" />
      <rect x="1" y="0" width="1" height="1" fill="#FFB3B3" />
      <rect x="5" y="0" width="2" height="2" fill="#BDBDBD" />
      <rect x="5" y="0" width="1" height="1" fill="#FFB3B3" />
      {/* 머리 */}
      <rect x="1" y="1" width="5" height="3" fill="#9E9E9E" />
      {/* 눈 */}
      <rect x="2" y="2" width="1" height="1" fill="#222" />
      <rect x="4" y="2" width="1" height="1" fill="#222" />
      {/* 코 */}
      <rect x="3" y="3" width="1" height="1" fill="#FF6B6B" />
      {/* 수염 */}
      <rect x="0" y="3" width="1" height="1" fill="#ccc" opacity="0.5" />
      <rect x="6" y="3" width="1" height="1" fill="#ccc" opacity="0.5" />
      {/* 몸 */}
      <rect x="1" y="4" width="5" height="2" fill="#BDBDBD" />
      {/* 꼬리 — 길고 가늘 */}
      {frame === 0 ? (
        <>
          <rect x="6" y="4" width="1" height="1" fill="#E0E0E0" />
          <rect x="7" y="5" width="1" height="1" fill="#E0E0E0" />
        </>
      ) : (
        <>
          <rect x="6" y="5" width="1" height="1" fill="#E0E0E0" />
          <rect x="7" y="4" width="1" height="1" fill="#E0E0E0" />
        </>
      )}
      {/* 발 */}
      <rect x="1" y="6" width="1" height="1" fill="#888" />
      <rect x="5" y="6" width="1" height="1" fill="#888" />
    </g>
  );
}

function OxSprite({ frame }: { frame: number }) {
  return (
    <g>
      {/* 뿔 */}
      <rect x="0" y="0" width="1" height="2" fill="#FFF9C4" />
      <rect x="9" y="0" width="1" height="2" fill="#FFF9C4" />
      {/* 머리 */}
      <rect x="2" y="1" width="6" height="3" fill="#795548" />
      {/* 이마 흰색 */}
      <rect x="4" y="1" width="2" height="1" fill="#F5F5F5" />
      {/* 귀 */}
      <rect x="1" y="1" width="1" height="2" fill="#6D4C41" />
      <rect x="8" y="1" width="1" height="2" fill="#6D4C41" />
      {/* 눈 */}
      <rect x="3" y="2" width="1" height="1" fill="#222" />
      <rect x="6" y="2" width="1" height="1" fill="#222" />
      {/* 코 — 코뚜레 */}
      <rect x="4" y="3" width="2" height="1" fill="#FFE0BD" />
      {/* 몸 — 크고 튼튼 */}
      <rect x="1" y="4" width="8" height="4" fill="#8D6E63" />
      {/* 배 */}
      <rect x="3" y="6" width="4" height="2" fill="#A1887F" />
      {/* 발 */}
      {frame === 0 ? (
        <>
          <rect x="1" y="8" width="2" height="1" fill="#5D4037" />
          <rect x="7" y="8" width="2" height="1" fill="#5D4037" />
        </>
      ) : (
        <>
          <rect x="2" y="8" width="2" height="1" fill="#5D4037" />
          <rect x="6" y="8" width="2" height="1" fill="#5D4037" />
        </>
      )}
      {/* 꼬리 */}
      <rect x="9" y="5" width="1" height="1" fill="#6D4C41" />
    </g>
  );
}

function HorseSprite({ frame }: { frame: number }) {
  return (
    <g>
      {/* 귀 */}
      <rect x="3" y="0" width="1" height="1" fill="#8D6E63" />
      <rect x="6" y="0" width="1" height="1" fill="#8D6E63" />
      {/* 머리 */}
      <rect x="2" y="1" width="6" height="3" fill="#A1887F" />
      {/* 갈기 */}
      <rect x="1" y="0" width="2" height="3" fill="#5D4037" />
      {/* 눈 */}
      <rect x="4" y="2" width="1" height="1" fill="#222" />
      <rect x="6" y="2" width="1" height="1" fill="#222" />
      {/* 코 */}
      <rect x="5" y="3" width="3" height="1" fill="#BCAAA4" />
      <rect x="6" y="3" width="1" height="1" fill="#222" />
      {/* 몸 */}
      <rect x="2" y="4" width="6" height="4" fill="#A1887F" />
      {/* 배 */}
      <rect x="3" y="6" width="4" height="2" fill="#BCAAA4" />
      {/* 다리 — 길게 */}
      {frame === 0 ? (
        <>
          <rect x="2" y="8" width="1" height="2" fill="#8D6E63" />
          <rect x="4" y="8" width="1" height="2" fill="#8D6E63" />
          <rect x="5" y="8" width="1" height="2" fill="#8D6E63" />
          <rect x="7" y="8" width="1" height="2" fill="#8D6E63" />
        </>
      ) : (
        <>
          <rect x="2" y="8" width="1" height="2" fill="#8D6E63" />
          <rect x="3" y="8" width="1" height="2" fill="#8D6E63" />
          <rect x="6" y="8" width="1" height="2" fill="#8D6E63" />
          <rect x="7" y="8" width="1" height="2" fill="#8D6E63" />
        </>
      )}
      {/* 발굽 */}
      <rect x="2" y="10" width="1" height="1" fill="#5D4037" />
      <rect x="7" y="10" width="1" height="1" fill="#5D4037" />
      {/* 꼬리 */}
      <rect x="1" y="5" width="1" height="2" fill="#5D4037" />
    </g>
  );
}

function SheepSprite({ frame }: { frame: number }) {
  return (
    <g>
      {/* 뿔 작은 곱슬 */}
      <rect x="0" y="1" width="1" height="1" fill="#BCAAA4" />
      <rect x="9" y="1" width="1" height="1" fill="#BCAAA4" />
      {/* 머리 */}
      <rect x="3" y="0" width="4" height="3" fill="#222" />
      {/* 눈 */}
      <rect x="4" y="1" width="1" height="1" fill="#FFD700" />
      <rect x="6" y="1" width="1" height="1" fill="#FFD700" />
      {/* 양모 머리 */}
      <rect x="2" y="0" width="1" height="2" fill="#F5F5F5" />
      <rect x="7" y="0" width="1" height="2" fill="#F5F5F5" />
      <rect x="3" y="-1" width="4" height="1" fill="#ECECEC" />
      {/* 몸 — 양모 풍성 */}
      <rect x="1" y="3" width="8" height="3" fill="#F5F5F5" />
      {/* 양모 질감 */}
      <rect x="2" y="3" width="1" height="1" fill="#E0E0E0" />
      <rect x="5" y="4" width="1" height="1" fill="#E0E0E0" />
      <rect x="7" y="3" width="1" height="1" fill="#E0E0E0" />
      {frame === 1 && (
        <rect x="3" y="4" width="1" height="1" fill="#E0E0E0" />
      )}
      {/* 발 — 검고 가늘 */}
      <rect x="2" y="6" width="1" height="1" fill="#333" />
      <rect x="4" y="6" width="1" height="1" fill="#333" />
      <rect x="6" y="6" width="1" height="1" fill="#333" />
      <rect x="8" y="6" width="1" height="1" fill="#333" />
      {/* 꼬리 */}
      <rect x="9" y="3" width="1" height="1" fill="#F5F5F5" />
    </g>
  );
}

function MonkeySprite({ frame }: { frame: number }) {
  return (
    <g>
      {/* 귀 */}
      <rect x="0" y="2" width="1" height="2" fill="#FFCC80" />
      <rect x="7" y="2" width="1" height="2" fill="#FFCC80" />
      {/* 머리 */}
      <rect x="1" y="0" width="6" height="4" fill="#8D6E63" />
      {/* 얼굴 */}
      <rect x="2" y="1" width="4" height="3" fill="#FFCC80" />
      {/* 눈 */}
      <rect x="3" y="2" width="1" height="1" fill="#222" />
      <rect x="5" y="2" width="1" height="1" fill="#222" />
      {/* 코+입 */}
      <rect x="4" y="3" width="1" height="1" fill="#D4A06A" />
      {/* 몸 */}
      <rect x="2" y="4" width="4" height="3" fill="#8D6E63" />
      {/* 배 */}
      <rect x="3" y="5" width="2" height="2" fill="#A1887F" />
      {/* 팔 */}
      <rect x="1" y="4" width="1" height="2" fill="#795548" />
      <rect x="6" y="4" width="1" height="2" fill="#795548" />
      {/* 꼬리 — 말리기 */}
      {frame === 0 ? (
        <>
          <rect x="6" y="6" width="1" height="1" fill="#795548" />
          <rect x="7" y="5" width="1" height="1" fill="#795548" />
          <rect x="7" y="4" width="1" height="1" fill="#795548" />
        </>
      ) : (
        <>
          <rect x="6" y="6" width="1" height="1" fill="#795548" />
          <rect x="7" y="6" width="1" height="1" fill="#795548" />
          <rect x="7" y="5" width="1" height="1" fill="#795548" />
        </>
      )}
      {/* 발 */}
      <rect x="2" y="7" width="1" height="1" fill="#6D4C41" />
      <rect x="5" y="7" width="1" height="1" fill="#6D4C41" />
    </g>
  );
}

function RoosterSprite({ frame }: { frame: number }) {
  return (
    <g>
      {/* 볏 */}
      <rect x="3" y="0" width="2" height="1" fill="#E53935" />
      <rect x="2" y="1" width="1" height="1" fill="#E53935" />
      {/* 머리 */}
      <rect x="2" y="1" width="4" height="3" fill="#F5F5F5" />
      {/* 눈 */}
      <rect x="3" y="2" width="1" height="1" fill="#222" />
      <rect x="5" y="2" width="1" height="1" fill="#222" />
      {/* 부리 */}
      <rect x="6" y="2" width="1" height="1" fill="#FF8F00" />
      {/* 턱밑 */}
      <rect x="3" y="4" width="2" height="1" fill="#E53935" />
      {/* 몸 */}
      <rect x="1" y="4" width="5" height="3" fill="#F5F5F5" />
      {/* 날개 */}
      <rect x="1" y="5" width="2" height="2" fill="#BDBDBD" />
      {/* 꼬리 — 화려하게 */}
      {frame === 0 ? (
        <>
          <rect x="0" y="3" width="1" height="2" fill="#1565C0" />
          <rect x="-1" y="2" width="1" height="2" fill="#4CAF50" />
        </>
      ) : (
        <>
          <rect x="0" y="2" width="1" height="2" fill="#1565C0" />
          <rect x="-1" y="1" width="1" height="2" fill="#4CAF50" />
        </>
      )}
      {/* 발 */}
      <rect x="2" y="7" width="1" height="1" fill="#FF8F00" />
      <rect x="4" y="7" width="1" height="1" fill="#FF8F00" />
      {/* 며느리발톱 */}
      <rect x="1" y="8" width="1" height="1" fill="#FF8F00" />
      <rect x="5" y="8" width="1" height="1" fill="#FF8F00" />
    </g>
  );
}

function PigSprite({ frame }: { frame: number }) {
  return (
    <g>
      {/* 귀 */}
      <rect x="0" y="0" width="2" height="2" fill="#F48FB1" />
      <rect x="5" y="0" width="2" height="2" fill="#F48FB1" />
      {/* 머리 */}
      <rect x="1" y="1" width="5" height="3" fill="#F8BBD0" />
      {/* 눈 */}
      <rect x="2" y="2" width="1" height="1" fill="#222" />
      <rect x="5" y="2" width="1" height="1" fill="#222" />
      {/* 코 — 돼지코 */}
      <rect x="3" y="3" width="2" height="1" fill="#E91E63" />
      {/* 콧구멍 */}
      <rect x="3" y="3" width="1" height="1" fill="#C2185B" />
      <rect x="4" y="3" width="1" height="1" fill="#C2185B" />
      {/* 몸 */}
      <rect x="1" y="4" width="5" height="2" fill="#F8BBD0" />
      {/* 배 */}
      <rect x="2" y="5" width="3" height="1" fill="#FCE4EC" />
      {/* 꼬리 꼬불 */}
      {frame === 0 ? (
        <>
          <rect x="6" y="4" width="1" height="1" fill="#F48FB1" />
          <rect x="7" y="3" width="1" height="1" fill="#F48FB1" />
        </>
      ) : (
        <>
          <rect x="6" y="3" width="1" height="1" fill="#F48FB1" />
          <rect x="7" y="4" width="1" height="1" fill="#F48FB1" />
        </>
      )}
      {/* 발 */}
      <rect x="1" y="6" width="1" height="1" fill="#EC407A" />
      <rect x="3" y="6" width="1" height="1" fill="#EC407A" />
      <rect x="5" y="6" width="1" height="1" fill="#EC407A" />
    </g>
  );
}
