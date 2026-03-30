import { type ReactNode, type JSX, useMemo } from 'react';
import { ROOMS_DATA } from '../../lib/constants';
import type { RoomDef } from '../../lib/constants';
import { getMapTimeTheme, type MapTimeTheme } from '../../lib/utils';
import { useMetaverseStore } from '../../stores/metaverseStore';

// ═══ SVG Plants (픽셀 스타일) ═══
function PlantSmall({ x, y }: { x: number; y: number }) {
  return (
    <div className="absolute z-[6]" style={{ left: x, top: y }}>
      <svg width="22" height="30" viewBox="0 0 22 30">
        <rect x="7" y="22" width="8" height="8" rx="2" fill="#c49a5a" />
        <ellipse cx="11" cy="18" rx="8" ry="10" fill="#4CAF50" />
        <ellipse cx="7" cy="14" rx="5" ry="8" fill="#66BB6A" />
        <ellipse cx="15" cy="15" rx="4" ry="7" fill="#388E3C" />
      </svg>
    </div>
  );
}

function PlantLarge({ x, y }: { x: number; y: number }) {
  return (
    <div className="absolute z-[6]" style={{ left: x, top: y }}>
      <svg width="40" height="56" viewBox="0 0 40 56">
        <rect x="14" y="40" width="12" height="16" rx="3" fill="#b8904e" />
        <rect x="16" y="42" width="8" height="12" rx="2" fill="#c49a5a" />
        <ellipse cx="20" cy="30" rx="16" ry="20" fill="#43A047" />
        <ellipse cx="12" cy="24" rx="8" ry="14" fill="#66BB6A" />
        <ellipse cx="28" cy="26" rx="7" ry="12" fill="#388E3C" />
        <ellipse cx="20" cy="18" rx="6" ry="10" fill="#4CAF50" />
      </svg>
    </div>
  );
}

// ═══ Furniture Components ═══
function Desk({ x, y, w = 84, h = 46 }: { x: number; y: number; w?: number; h?: number }) {
  return (
    <div className="absolute z-[4]" style={{ left: x, top: y }}>
      <div
        className="rounded"
        style={{
          width: w, height: h,
          background: 'linear-gradient(180deg,#dbb88a,#c4a06e)',
          border: '2px solid #b8904e',
          boxShadow: '0 3px 0 #a07844, inset 0 1px 0 rgba(255,255,255,.2)',
        }}
      />
    </div>
  );
}

function Monitor({ x, y }: { x: number; y: number }) {
  return (
    <div className="absolute z-[5]" style={{ left: x, top: y }}>
      <div
        className="rounded-sm"
        style={{
          width: 28, height: 22,
          background: 'linear-gradient(180deg,#2a2a3e,#1e1e30)',
          border: '2px solid #444',
          boxShadow: '0 2px 0 #222',
        }}
      >
        <div
          className="absolute rounded-sm animate-[screenGlow_3s_infinite_alternate]"
          style={{ top: 2, left: 2, right: 2, bottom: 4 }}
        />
      </div>
    </div>
  );
}

function Chair({ x, y }: { x: number; y: number }) {
  return (
    <div className="absolute z-[4]" style={{ left: x, top: y }}>
      <div
        className="rounded-full"
        style={{
          width: 24, height: 24,
          background: 'radial-gradient(circle,#666,#555)',
          border: '2px solid #444',
          boxShadow: '0 2px 0 #333',
        }}
      />
    </div>
  );
}

function RoundTable({ x, y, size = 60 }: { x: number; y: number; size?: number }) {
  return (
    <div
      className="absolute z-[4] rounded-full"
      style={{
        left: x, top: y, width: size, height: size,
        background: 'radial-gradient(circle,#f0f0f0,#ddd)',
        border: '3px solid #bbb',
        boxShadow: '0 4px 0 rgba(0,0,0,.1), inset 0 1px 0 rgba(255,255,255,.5)',
      }}
    />
  );
}

function SofaH({ x, y, color = '#8b7bc4' }: { x: number; y: number; color?: string }) {
  return (
    <div
      className="absolute z-[4] rounded-lg"
      style={{
        left: x, top: y, width: 76, height: 34,
        background: `linear-gradient(180deg,${color},${color}dd)`,
        border: `2px solid ${color}`,
        boxShadow: '0 3px 0 rgba(0,0,0,.15)',
      }}
    >
      <div className="absolute rounded" style={{ top: 4, left: 4, right: 4, bottom: 4, background: 'rgba(255,255,255,.08)' }} />
    </div>
  );
}

function Whiteboard({ x, y, w = 90 }: { x: number; y: number; w?: number }) {
  return (
    <div
      className="absolute z-[5] rounded-sm"
      style={{
        left: x, top: y, width: w, height: 10,
        background: 'linear-gradient(180deg,#f5f5f5,#e8e8e8)',
        border: '3px solid #bbb',
        boxShadow: '0 2px 0 rgba(0,0,0,.1)',
      }}
    />
  );
}

function Bookshelf({ x, y }: { x: number; y: number }) {
  const bookColors = ['#e74c3c', '#3498db', '#f39c12', '#2ecc71', '#9b59b6', '#e67e22'];
  const bookWidths = [4, 3, 5, 3, 4, 3];
  return (
    <div className="absolute z-[5]" style={{ left: x, top: y }}>
      <div
        className="rounded-sm"
        style={{
          width: 54, height: 40,
          background: 'linear-gradient(180deg,#a07030,#8B6914)',
          border: '2px solid #6d5310',
          boxShadow: '0 2px 0 rgba(0,0,0,.15)',
        }}
      >
        <div className="absolute flex gap-px" style={{ top: 3, left: 3 }}>
          {bookColors.map((c, i) => (
            <div key={i} className="rounded-sm" style={{ width: bookWidths[i], height: 14, background: c }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function VendingMachine({ x, y }: { x: number; y: number }) {
  return (
    <div
      className="absolute z-[5] rounded"
      style={{
        left: x, top: y, width: 30, height: 44,
        background: 'linear-gradient(180deg,#e74c3c,#c0392b)',
        border: '2px solid #a93226',
        boxShadow: '0 3px 0 rgba(0,0,0,.15)',
      }}
    >
      <div className="absolute rounded-sm" style={{ top: 6, left: 4, right: 4, height: 20, background: '#1a1a2e' }} />
    </div>
  );
}

// ═══ 팀별 픽셀 장식 ═══
function PixelDecoration({ x, y, type }: { x: number; y: number; type: 'chart' | 'heart' | 'car' | 'bulb' | 'phone' }) {
  const decos: Record<string, JSX.Element> = {
    chart: (
      <svg width="40" height="32" viewBox="0 0 10 8" style={{ imageRendering: 'pixelated' }}>
        <rect x="1" y="4" width="2" height="4" fill="#00D68F" />
        <rect x="1.5" y="2" width="1" height="2" fill="#00D68F" />
        <rect x="4" y="1" width="2" height="5" fill="#FF4757" />
        <rect x="4.5" y="0" width="1" height="1" fill="#FF4757" />
        <rect x="4.5" y="6" width="1" height="2" fill="#FF4757" />
        <rect x="7" y="3" width="2" height="5" fill="#00D68F" />
        <rect x="7.5" y="1" width="1" height="2" fill="#00D68F" />
      </svg>
    ),
    heart: (
      <svg width="36" height="36" viewBox="0 0 9 9" style={{ imageRendering: 'pixelated' }}>
        <rect x="1" y="0" width="2" height="1" fill="#FFC312" />
        <rect x="6" y="0" width="2" height="1" fill="#FFC312" />
        <rect x="0" y="1" width="4" height="1" fill="#6C5CE7" />
        <rect x="5" y="1" width="4" height="1" fill="#6C5CE7" />
        <rect x="0" y="2" width="9" height="1" fill="#6C5CE7" />
        <rect x="0" y="3" width="9" height="1" fill="#7d6df7" />
        <rect x="1" y="4" width="7" height="1" fill="#7d6df7" />
        <rect x="2" y="5" width="5" height="1" fill="#6C5CE7" />
        <rect x="3" y="6" width="3" height="1" fill="#6C5CE7" />
        <rect x="4" y="7" width="1" height="1" fill="#6C5CE7" />
      </svg>
    ),
    car: (
      <svg width="40" height="32" viewBox="0 0 10 8" style={{ imageRendering: 'pixelated' }}>
        <rect x="3" y="0" width="4" height="1" fill="#3498db" />
        <rect x="2" y="1" width="6" height="1" fill="#3498db" />
        <rect x="3" y="1" width="2" height="1" fill="#85C1E9" />
        <rect x="6" y="1" width="1" height="1" fill="#85C1E9" />
        <rect x="1" y="2" width="8" height="1" fill="#0984E3" />
        <rect x="0" y="3" width="10" height="1" fill="#0984E3" />
        <rect x="0" y="4" width="10" height="1" fill="#0984E3" />
        <rect x="0" y="3" width="1" height="1" fill="#FFC312" />
        <rect x="9" y="3" width="1" height="1" fill="#FD7272" />
        <rect x="1" y="5" width="2" height="2" fill="#333" />
        <rect x="7" y="5" width="2" height="2" fill="#333" />
        <rect x="1.5" y="5.5" width="1" height="1" fill="#888" />
        <rect x="7.5" y="5.5" width="1" height="1" fill="#888" />
      </svg>
    ),
    bulb: (
      <svg width="28" height="36" viewBox="0 0 7 9" style={{ imageRendering: 'pixelated' }}>
        <rect x="2" y="0" width="3" height="1" fill="#FDCB6E" />
        <rect x="1" y="1" width="5" height="1" fill="#FDCB6E" />
        <rect x="1" y="2" width="5" height="1" fill="#FFC312" />
        <rect x="1" y="3" width="5" height="1" fill="#FDCB6E" />
        <rect x="2" y="4" width="3" height="1" fill="#FDCB6E" />
        <rect x="2" y="5" width="3" height="1" fill="#aaa" />
        <rect x="2" y="6" width="3" height="1" fill="#888" />
        <rect x="3" y="7" width="1" height="1" fill="#666" />
      </svg>
    ),
    phone: (
      <svg width="28" height="28" viewBox="0 0 7 7" style={{ imageRendering: 'pixelated' }}>
        <rect x="1" y="0" width="5" height="1" fill="#E84393" />
        <rect x="0" y="1" width="7" height="1" fill="#E84393" />
        <rect x="0" y="2" width="1" height="3" fill="#E84393" />
        <rect x="6" y="2" width="1" height="3" fill="#E84393" />
        <rect x="2" y="2" width="3" height="2" fill="#333" />
        <rect x="1" y="5" width="5" height="1" fill="#E84393" />
        <rect x="2" y="6" width="3" height="1" fill="#c0392b" />
      </svg>
    ),
  };

  return (
    <div className="absolute z-[6] pointer-events-none" style={{ left: x, top: y }}>
      {decos[type]}
    </div>
  );
}

// ═══ Room with walls ═══
function Room({ x, y, w, h, floor, label, teamLabel, borderColor }: {
  x: number; y: number; w: number; h: number; floor: string; label: string; teamLabel: string; borderColor?: string;
}) {
  const wallColor = borderColor || '#5d6d7d';
  return (
    <>
      <div
        className="absolute z-[15] -translate-x-1/2 whitespace-nowrap rounded-lg px-4 py-1 text-[13px] font-semibold text-white pointer-events-none"
        style={{
          left: x + w / 2, top: y - 26,
          background: `${wallColor}cc`,
          backdropFilter: 'blur(6px)',
          boxShadow: `0 2px 8px ${wallColor}33`,
          letterSpacing: '0.3px',
        }}
      >
        {label}
      </div>
      <div
        className="absolute z-[15] whitespace-nowrap rounded px-2 py-[2px] text-[10px] font-medium pointer-events-none"
        style={{
          left: x + 10, top: y + 10,
          color: 'rgba(255,255,255,.5)',
          background: 'rgba(0,0,0,.35)',
        }}
      >
        {teamLabel}
      </div>
      <div className="absolute overflow-hidden" style={{ left: x, top: y, width: w, height: h, boxShadow: `4px 4px 0px rgba(0,0,0,.3)`, border: `2px solid ${wallColor}` }}>
        <div className="absolute inset-0" style={{ background: floor }} />
        <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at 10% 10%, ${wallColor}18, transparent 50%)` }} />
        <div className="absolute inset-0 opacity-[0.06]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.3) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }} />
      </div>
      {/* 벽 */}
      <div className="absolute z-[3] rounded-sm" style={{ left: x, top: y, width: w, height: 8, background: `linear-gradient(180deg,${wallColor},${wallColor}aa)`, boxShadow: '0 2px 0 rgba(0,0,0,.1)' }} />
      <div className="absolute z-[3] rounded-sm" style={{ left: x, top: y + h, width: w, height: 8, background: `linear-gradient(180deg,${wallColor}ee,${wallColor}88)`, boxShadow: '0 2px 0 rgba(0,0,0,.1)' }} />
      <div className="absolute z-[3] rounded-sm" style={{ left: x, top: y, width: 8, height: h, background: `linear-gradient(90deg,${wallColor},${wallColor}aa)`, boxShadow: '2px 0 0 rgba(0,0,0,.1)' }} />
      <div className="absolute z-[3] rounded-sm" style={{ left: x + w, top: y, width: 8, height: h, background: `linear-gradient(90deg,${wallColor}ee,${wallColor}88)`, boxShadow: '2px 0 0 rgba(0,0,0,.1)' }} />
    </>
  );
}

// ═══ 팀 타운 가구 배치 (로컬 좌표 0,0 기준) ═══
function TeamTownFurniture({ teamColor, theme }: { teamColor: string; theme: string }) {
  const decoType = theme === 'stock' ? 'chart' : theme === 'life' ? 'heart' : 'car';
  return (
    <>
      {/* 로비 (좌측 Zone: 40,40 ~ 360,280) */}
      <SofaH x={60} y={80} color={teamColor} />
      <SofaH x={200} y={80} color={teamColor} />
      <RoundTable x={130} y={130} size={50} />
      <RoundTable x={260} y={130} size={50} />
      <PlantLarge x={10} y={10} />
      <PlantSmall x={310} y={10} />

      {/* KPI실 (우측 Zone: 440,40 ~ 760,280) */}
      {[0, 1, 2].map((i) => (
        <span key={`kpi-${i}`}>
          <Desk x={410 + i * 105} y={60} />
          <Monitor x={430 + i * 105} y={50} />
          <Chair x={430 + i * 105} y={112} />
        </span>
      ))}
      {[0, 1, 2].map((i) => (
        <span key={`kpi2-${i}`}>
          <Desk x={410 + i * 105} y={160} />
          <Monitor x={430 + i * 105} y={150} />
          <Chair x={430 + i * 105} y={212} />
        </span>
      ))}
      <Whiteboard x={450} y={20} />

      {/* 공지게시판 (하단 Zone: 230,320 ~ 550,560) */}
      <Whiteboard x={200} y={310} w={120} />
      <Whiteboard x={360} y={310} w={100} />
      <Bookshelf x={170} y={340} />
      <Bookshelf x={170} y={390} />
      <Chair x={280} y={380} />
      <Chair x={340} y={380} />
      <Chair x={400} y={380} />
      <Desk x={260} y={420} w={120} />
      <PlantSmall x={170} y={450} />
      <PlantSmall x={500} y={310} />

      {/* 팀별 장식 */}
      <PixelDecoration x={340} y={30} type={decoType} />
      <PixelDecoration x={730} y={30} type={decoType} />
      <PixelDecoration x={540} y={500} type={decoType} />
    </>
  );
}

// ═══ 중앙 광장 가구 (로컬 좌표 0,0 기준) ═══
function PlazaFurniture() {
  return (
    <>
      {/* VOC 센터 (좌측: 40,40 ~ 420,320) */}
      <Desk x={60} y={80} />
      <Monitor x={80} y={70} />
      <Chair x={80} y={132} />
      <Desk x={190} y={80} />
      <Monitor x={210} y={70} />
      <Chair x={210} y={132} />
      <Desk x={60} y={170} />
      <Monitor x={80} y={160} />
      <Chair x={80} y={222} />
      <Desk x={190} y={170} />
      <Monitor x={210} y={160} />
      <Chair x={210} y={222} />
      <Whiteboard x={80} y={40} />
      <PlantLarge x={10} y={30} />
      <PlantSmall x={300} y={30} />
      <PixelDecoration x={310} y={200} type="phone" />

      {/* 아이디어 보드 (우측: 540,40 ~ 920,320) */}
      <RoundTable x={560} y={80} size={56} />
      <RoundTable x={700} y={80} size={56} />
      <RoundTable x={560} y={180} size={56} />
      <RoundTable x={700} y={180} size={56} />
      <SofaH x={540} y={50} color="#FDCB6E" />
      <SofaH x={680} y={50} color="#FDCB6E" />
      <SofaH x={540} y={140} color="#FDCB6E" />
      <SofaH x={680} y={140} color="#FDCB6E" />
      <Whiteboard x={570} y={24} w={140} />
      <Bookshelf x={800} y={60} />
      <Bookshelf x={800} y={120} />
      <PlantLarge x={520} y={30} />
      <PlantSmall x={840} y={30} />
      <PixelDecoration x={830} y={200} type="bulb" />

      {/* 분수대 (중앙 장식) */}
      <div
        className="absolute z-[6] rounded-full"
        style={{
          left: 440, top: 310,
          width: 100, height: 100,
          background: 'radial-gradient(circle, #6bc5ff55, #6bc5ff33, #6bc5ff11, transparent)',
          border: '4px solid #6bc5ff88',
          boxShadow: '0 0 30px rgba(107,197,255,.3), inset 0 0 20px rgba(107,197,255,.2)',
        }}
      >
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ width: 30, height: 30, background: 'radial-gradient(circle, #6bc5ffaa, transparent)', animation: 'pulse 2s infinite' }} />
      </div>
      {/* 이정표 */}
      <div className="absolute z-[7]" style={{ left: 475, top: 255 }}>
        <div style={{ width: 6, height: 46, background: 'linear-gradient(180deg,#a07030,#8B6914)', margin: '0 auto', borderRadius: 1 }} />
        <div className="absolute text-[10px] font-semibold whitespace-nowrap" style={{ top: -2, left: 14, background: '#00D68Fbb', color: '#fff', padding: '2px 6px', borderRadius: 3 }}>
          ↑ 증권
        </div>
        <div className="absolute text-[10px] font-semibold whitespace-nowrap" style={{ top: 14, right: 14, background: '#6C5CE7bb', color: '#fff', padding: '2px 6px', borderRadius: 3 }}>
          ↙ 생명
        </div>
        <div className="absolute text-[10px] font-semibold whitespace-nowrap" style={{ top: 30, left: 14, background: '#0984E3bb', color: '#fff', padding: '2px 6px', borderRadius: 3 }}>
          ↘ 손보
        </div>
      </div>

      <VendingMachine x={930} y={380} />
      <VendingMachine x={960} y={380} />

      {/* 모임방 가구 (40,370 ~ 340,550) */}
      <RoundTable x={80} y={400} size={50} />
      <RoundTable x={190} y={400} size={50} />
      <RoundTable x={80} y={470} size={50} />
      <RoundTable x={190} y={470} size={50} />
      <SofaH x={60} y={380} color="#FF9800" />
      <SofaH x={170} y={380} color="#FF9800" />
      <PlantSmall x={50} y={360} />
      <PlantSmall x={280} y={360} />

      {/* 오목 게임방 가구 (400,370 ~ 700,550) */}
      <div
        className="absolute z-[4] rounded"
        style={{
          left: 480, top: 400, width: 100, height: 100,
          background: 'linear-gradient(180deg,#DEB887,#C4A06E)',
          border: '3px solid #8B6914',
          boxShadow: '0 4px 0 rgba(0,0,0,.15), inset 0 1px 0 rgba(255,255,255,.2)',
        }}
      >
        <div className="absolute" style={{ top: 8, left: 8, right: 8, bottom: 8 }}>
          {[0, 1, 2, 3, 4, 5, 6].map(i => (
            <div key={`h${i}`} className="absolute" style={{ top: i * 12, left: 0, right: 0, height: 1, background: '#333' }} />
          ))}
          {[0, 1, 2, 3, 4, 5, 6].map(i => (
            <div key={`v${i}`} className="absolute" style={{ left: i * 12, top: 0, bottom: 0, width: 1, background: '#333' }} />
          ))}
          <div className="absolute rounded-full" style={{ left: 10, top: 10, width: 8, height: 8, background: '#111' }} />
          <div className="absolute rounded-full" style={{ left: 34, top: 22, width: 8, height: 8, background: '#fff', border: '1px solid #ccc' }} />
          <div className="absolute rounded-full" style={{ left: 22, top: 34, width: 8, height: 8, background: '#111' }} />
          <div className="absolute rounded-full" style={{ left: 46, top: 46, width: 8, height: 8, background: '#fff', border: '1px solid #ccc' }} />
        </div>
      </div>
      <Chair x={500} y={380} />
      <Chair x={560} y={380} />
      <Chair x={500} y={506} />
      <Chair x={560} y={506} />
      <Bookshelf x={420} y={380} />
      <VendingMachine x={660} y={400} />
      <PlantSmall x={410} y={360} />
      <PlantSmall x={670} y={360} />

      {/* 광장 장식 아이콘 */}
      <PixelDecoration x={20} y={240} type="phone" />
      <PixelDecoration x={440} y={20} type="phone" />
      <PixelDecoration x={520} y={240} type="bulb" />
      <PixelDecoration x={840} y={20} type="bulb" />
    </>
  );
}

// ═══ Room Ground (룸별 바닥) ═══
function RoomGround({ room, theme }: { room: RoomDef; theme: MapTimeTheme }) {
  const { w, h } = room.mapSize;
  const floorColor = room.theme.floor;
  const borderColor = room.theme.border;

  return (
    <svg width={w} height={h} className="absolute left-0 top-0">
      <defs>
        <pattern id={`grass-${room.id}`} width="16" height="16" patternUnits="userSpaceOnUse">
          <rect width="16" height="16" fill={theme.grass} />
          <circle cx="4" cy="4" r="1" fill={theme.grassDark} opacity="0.5" />
          <circle cx="12" cy="12" r="1" fill={theme.grassLight} opacity="0.4" />
        </pattern>
        <linearGradient id={`sky-${room.id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={theme.skyGradient[0]} stopOpacity={theme.skyOpacity} />
          <stop offset="50%" stopColor={theme.skyGradient[1]} stopOpacity={theme.skyOpacity * 0.6} />
          <stop offset="100%" stopColor={theme.skyGradient[2]} stopOpacity={0} />
        </linearGradient>
      </defs>
      {/* 잔디 */}
      <rect width={w} height={h} fill={`url(#grass-${room.id})`} />
      {/* 하늘 */}
      <rect width={w} height={h} fill={`url(#sky-${room.id})`} />
      {/* Zone 바닥 하이라이트 */}
      {room.zones.map((z) => (
        <rect
          key={z.id}
          x={z.x} y={z.y} width={z.width} height={z.height}
          fill={floorColor}
          opacity="0.6"
          rx="4"
        />
      ))}
      {/* 포탈 바닥 하이라이트 */}
      {room.portals.map((p) => (
        <g key={p.id}>
          <rect x={p.x} y={p.y} width={p.w} height={p.h} fill={borderColor} opacity="0.3" rx="4" />
          <rect x={p.x + 2} y={p.y + 2} width={p.w - 4} height={p.h - 4} fill={borderColor} opacity="0.15" rx="3">
            <animate attributeName="opacity" values="0.15;0.35;0.15" dur="2s" repeatCount="indefinite" />
          </rect>
        </g>
      ))}
    </svg>
  );
}

// ═══ Portal 오브젝트 렌더링 ═══
function PortalObjects({ room }: { room: RoomDef }) {
  return (
    <>
      {room.portals.map((p) => (
        <div
          key={p.id}
          className="absolute z-[16] pointer-events-none"
          style={{ left: p.x, top: p.y, width: p.w, height: p.h }}
        >
          {/* 포탈 프레임 */}
          <div
            className="absolute inset-0 rounded-lg"
            style={{
              border: `2px solid ${room.theme.border}`,
              background: `linear-gradient(180deg, ${room.theme.border}44, ${room.theme.border}22)`,
              boxShadow: `0 0 12px ${room.theme.border}44`,
            }}
          />
          {/* 포탈 라벨 */}
          <div
            className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap rounded px-2 py-[2px] text-[10px] font-semibold text-white"
            style={{
              top: -18,
              background: `${room.theme.border}cc`,
              letterSpacing: '0.3px',
            }}
          >
            {p.label}
          </div>
        </div>
      ))}
    </>
  );
}

// ═══ 룸 내부 방(Zone) 렌더링 ═══
function RoomZones({ room }: { room: RoomDef }) {
  const zoneFloors: Record<string, { floor: string; borderColor: string }> = {};
  if (room.team) {
    // 팀 룸: 모든 Zone 같은 테마
    for (const z of room.zones) {
      zoneFloors[z.id] = { floor: room.theme.floor, borderColor: room.theme.border };
    }
  } else {
    // 광장: Zone별 다른 색
    const colors: Record<string, { floor: string; borderColor: string }> = {
      voc: { floor: '#2e1520', borderColor: '#E84393' },
      idea: { floor: '#2a2510', borderColor: '#FDCB6E' },
      gathering: { floor: '#1a2a1a', borderColor: '#FF9800' },
      omok: { floor: '#1a1a1a', borderColor: '#8B6914' },
    };
    for (const z of room.zones) {
      zoneFloors[z.id] = colors[z.id] || { floor: room.theme.floor, borderColor: room.theme.border };
    }
  }

  return (
    <>
      {room.zones.map((z) => {
        const { floor, borderColor } = zoneFloors[z.id] || { floor: room.theme.floor, borderColor: room.theme.border };
        return (
          <Room
            key={z.id}
            x={z.x} y={z.y} w={z.width} h={z.height}
            floor={floor}
            label={z.label}
            teamLabel={room.team || '공용'}
            borderColor={borderColor}
          />
        );
      })}
    </>
  );
}

interface MapCanvasProps {
  children?: ReactNode;
}

export default function MapCanvas({ children }: MapCanvasProps) {
  const theme = useMemo(() => getMapTimeTheme(), []);
  const currentRoom = useMetaverseStore((s) => s.currentRoom);
  const room = ROOMS_DATA[currentRoom];
  const { w: mapW, h: mapH } = room.mapSize;

  const themeKey = room.team
    ? (room.id === 'stock' ? 'stock' : room.id === 'life' ? 'life' : 'shield')
    : '';

  return (
    <div className="absolute" style={{ width: mapW, height: mapH, imageRendering: 'pixelated' }}>
      <RoomGround room={room} theme={theme} />

      {/* Zone 방 렌더링 */}
      <RoomZones room={room} />

      {/* 룸 외곽 테두리 */}
      <div
        className="absolute z-[1] rounded-xl pointer-events-none"
        style={{
          left: 0, top: 0, width: mapW, height: mapH,
          border: `3px dashed ${room.theme.border}55`,
          background: `${room.theme.border}0a`,
          boxShadow: `inset 0 0 60px ${room.theme.border}08`,
        }}
      >
        <div
          className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg px-5 py-1 text-sm font-bold text-white pointer-events-none"
          style={{
            background: `${room.theme.border}cc`,
            boxShadow: `0 2px 10px ${room.theme.border}44`,
            letterSpacing: '0.5px',
            fontFamily: "'Space Grotesk', sans-serif",
          }}
        >
          {room.label}
        </div>
      </div>

      {/* 가구 */}
      {room.team ? (
        <TeamTownFurniture teamColor={room.theme.main} theme={themeKey} />
      ) : (
        <PlazaFurniture />
      )}

      {/* 포탈 오브젝트 */}
      <PortalObjects room={room} />

      {children}
    </div>
  );
}
