import { type ReactNode } from 'react';

// ═══ SVG Plants ═══
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
      >
        <div
          className="absolute rounded-sm"
          style={{
            top: 3, left: 3, right: 3, bottom: 6,
            background: 'linear-gradient(180deg,#e8cca0,#d4b888)',
          }}
        />
      </div>
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
      <div
        className="absolute"
        style={{
          bottom: -4, left: '50%', transform: 'translateX(-50%)',
          width: 8, height: 4, background: '#555', borderRadius: '0 0 2px 2px',
        }}
      />
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

function SofaH({ x, y }: { x: number; y: number }) {
  return (
    <div
      className="absolute z-[4] rounded-lg"
      style={{
        left: x, top: y, width: 76, height: 34,
        background: 'linear-gradient(180deg,#8b7bc4,#7c6bc4)',
        border: '2px solid #6C5CE7',
        boxShadow: '0 3px 0 rgba(0,0,0,.15)',
      }}
    >
      <div className="absolute rounded" style={{ top: 4, left: 4, right: 4, bottom: 4, background: 'rgba(255,255,255,.08)' }} />
    </div>
  );
}

function SofaV({ x, y }: { x: number; y: number }) {
  return (
    <div
      className="absolute z-[4] rounded-lg"
      style={{
        left: x, top: y, width: 34, height: 76,
        background: 'linear-gradient(90deg,#8b7bc4,#7c6bc4)',
        border: '2px solid #6C5CE7',
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
    >
      <div className="absolute rounded-sm" style={{ top: 3, left: 3, right: 3, bottom: 3, border: '1px dashed #ccc' }} />
    </div>
  );
}

function TVScreen({ x, y }: { x: number; y: number }) {
  return (
    <div
      className="absolute z-[5] overflow-hidden rounded-sm"
      style={{
        left: x, top: y, width: 64, height: 8,
        background: '#111', border: '3px solid #333', boxShadow: '0 2px 0 #000',
      }}
    >
      <div className="absolute rounded-sm" style={{ top: 2, left: 2, right: 2, bottom: 2, background: 'linear-gradient(135deg,#1a3a5c,#0a1a2c)' }} />
    </div>
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

// ═══ Room with walls ═══
function Room({ x, y, w, h, floor, label, teamLabel }: {
  x: number; y: number; w: number; h: number; floor: string; label: string; teamLabel: string;
}) {
  return (
    <>
      {/* 방 라벨 — overflow-hidden 밖에 배치 */}
      <div className="absolute z-[15] -translate-x-1/2 whitespace-nowrap rounded-[10px] px-3 py-[3px] text-[11px] font-semibold text-white pointer-events-none" style={{ left: x + w / 2, top: y - 22, background: 'rgba(0,0,0,.55)', backdropFilter: 'blur(4px)' }}>
        {label}
      </div>
      <div className="absolute z-[15] whitespace-nowrap rounded-lg px-[10px] py-[2px] text-[10px] font-medium text-white/60 pointer-events-none" style={{ left: x + 10, top: y + 8, background: 'rgba(0,0,0,.35)' }}>
        {teamLabel}
      </div>
      {/* 방 바닥 */}
      <div className="absolute overflow-hidden rounded-sm" style={{ left: x, top: y, width: w, height: h, boxShadow: '0 2px 0 rgba(0,0,0,.15)' }}>
        <div className="absolute inset-0" style={{ background: floor }} />
      </div>
      {/* 벽 — 상/하/좌/우 */}
      <div className="absolute z-[3] rounded-sm" style={{ left: x, top: y, width: w, height: 8, background: 'linear-gradient(180deg,#7a8a9a,#5d6d7d)', boxShadow: '0 2px 0 rgba(0,0,0,.1)' }} />
      <div className="absolute z-[3] rounded-sm" style={{ left: x, top: y + h, width: w, height: 8, background: 'linear-gradient(180deg,#8899aa,#6b7b8d)', boxShadow: '0 2px 0 rgba(0,0,0,.1)' }} />
      <div className="absolute z-[3] rounded-sm" style={{ left: x, top: y, width: 8, height: h, background: 'linear-gradient(90deg,#7a8a9a,#5d6d7d)', boxShadow: '2px 0 0 rgba(0,0,0,.1)' }} />
      <div className="absolute z-[3] rounded-sm" style={{ left: x + w, top: y, width: 8, height: h, background: 'linear-gradient(90deg,#8899aa,#6b7b8d)', boxShadow: '2px 0 0 rgba(0,0,0,.1)' }} />
    </>
  );
}

// ═══ Ground SVG ═══
function Ground() {
  return (
    <svg width="1800" height="1200" className="absolute left-0 top-0">
      <defs>
        <pattern id="grass" width="16" height="16" patternUnits="userSpaceOnUse">
          <rect width="16" height="16" fill="#7da87d" />
          <circle cx="4" cy="4" r="1" fill="#6b9a6b" opacity="0.5" />
          <circle cx="12" cy="12" r="1" fill="#8ab88a" opacity="0.4" />
          <circle cx="8" cy="2" r="0.8" fill="#6b9a6b" opacity="0.3" />
        </pattern>
        <pattern id="path-tile" width="32" height="32" patternUnits="userSpaceOnUse">
          <rect width="32" height="32" fill="#c8c0b0" />
          <rect x="0" y="0" width="16" height="16" fill="#ccc4b4" opacity="0.5" />
          <rect x="16" y="16" width="16" height="16" fill="#ccc4b4" opacity="0.5" />
        </pattern>
      </defs>
      <rect width="1800" height="1200" fill="url(#grass)" />
      {/* 복도 (돌길) */}
      <rect x="420" y="0" width="60" height="1200" fill="url(#path-tile)" rx="2" />
      <rect x="840" y="0" width="60" height="1200" fill="url(#path-tile)" rx="2" />
      <rect x="0" y="370" width="1800" height="60" fill="url(#path-tile)" rx="2" />
      <rect x="0" y="790" width="1800" height="60" fill="url(#path-tile)" rx="2" />
    </svg>
  );
}

// ═══ All Furniture ═══
function Furniture() {
  return (
    <>
      {/* ── 마음의소리 room ── */}
      <Desk x={120} y={120} />
      <Monitor x={140} y={110} />
      <Chair x={140} y={172} />
      <Desk x={250} y={120} />
      <Monitor x={270} y={110} />
      <Chair x={270} y={172} />
      <RoundTable x={170} y={240} size={54} />
      <SofaH x={110} y={300} />
      <SofaH x={240} y={300} />
      <PlantSmall x={70} y={72} />
      <PlantLarge x={70} y={320} />
      <PlantSmall x={388} y={72} />
      <PlantSmall x={388} y={310} />

      {/* ── KPI room ── */}
      {[0, 1, 2].map((i) => (
        <span key={`kpi-row1-${i}`}>
          <Desk x={530 + i * 105} y={120} />
          <Monitor x={550 + i * 105} y={110} />
          <Chair x={550 + i * 105} y={172} />
        </span>
      ))}
      {[0, 1, 2].map((i) => (
        <span key={`kpi-row2-${i}`}>
          <Desk x={530 + i * 105} y={230} />
          <Monitor x={550 + i * 105} y={220} />
          <Chair x={550 + i * 105} y={282} />
        </span>
      ))}
      <Whiteboard x={570} y={78} />
      <PlantSmall x={478} y={72} />
      <PlantSmall x={478} y={310} />
      <PlantSmall x={808} y={72} />
      <PlantSmall x={808} y={310} />

      {/* ── VOC room ── */}
      <Desk x={120} y={510} />
      <Monitor x={140} y={500} />
      <Chair x={140} y={562} />
      <Desk x={250} y={510} />
      <Monitor x={270} y={500} />
      <Chair x={270} y={562} />
      <Desk x={120} y={620} />
      <Monitor x={140} y={610} />
      <Chair x={140} y={672} />
      <Desk x={250} y={620} />
      <Monitor x={270} y={610} />
      <Chair x={270} y={672} />
      <Whiteboard x={180} y={460} />
      <PlantLarge x={70} y={440} />
      <PlantSmall x={388} y={440} />
      <PlantSmall x={70} y={730} />
      <PlantSmall x={388} y={730} />

      {/* ── Idea Board ── */}
      <RoundTable x={550} y={540} size={56} />
      <RoundTable x={700} y={540} size={56} />
      <RoundTable x={550} y={670} size={56} />
      <RoundTable x={700} y={670} size={56} />
      <SofaH x={510} y={490} />
      <SofaH x={660} y={490} />
      <Whiteboard x={560} y={460} w={120} />
      <PlantSmall x={478} y={440} />
      <PlantSmall x={808} y={440} />
      <PlantSmall x={478} y={730} />
      <PlantSmall x={808} y={730} />

      {/* ── Lounge ── */}
      <SofaV x={920} y={100} />
      <SofaV x={920} y={220} />
      <RoundTable x={970} y={140} size={50} />
      <RoundTable x={970} y={290} size={50} />
      <VendingMachine x={1140} y={80} />
      <VendingMachine x={1180} y={80} />
      <Bookshelf x={1080} y={78} />
      <Bookshelf x={1140} y={78} />
      <PlantLarge x={910} y={380} />
      <PlantLarge x={1180} y={380} />
      <PlantSmall x={1180} y={100} />

      {/* ── 쪽지함 room ── */}
      <Desk x={960} y={550} />
      <Monitor x={980} y={540} />
      <Chair x={980} y={600} />
      <Desk x={1080} y={550} />
      <Monitor x={1100} y={540} />
      <Chair x={1100} y={600} />
      <SofaH x={980} y={700} />
      <PlantSmall x={910} y={490} />
      <PlantSmall x={1190} y={490} />
      <PlantSmall x={910} y={740} />
      <PlantSmall x={1190} y={740} />

      {/* ── 공지게시판 room ── */}
      <Whiteboard x={120} y={848} w={120} />
      <Whiteboard x={280} y={848} w={100} />
      <Bookshelf x={70} y={880} />
      <Bookshelf x={70} y={930} />
      <Chair x={180} y={920} />
      <Chair x={240} y={920} />
      <Chair x={300} y={920} />
      <Desk x={160} y={960} w={120} />
      <Chair x={180} y={1010} />
      <Chair x={240} y={1010} />
      <PlantSmall x={70} y={1020} />
      <PlantSmall x={388} y={840} />
      <PlantSmall x={388} y={1020} />

      {/* ── 회의실 ── */}
      <Desk x={980} y={890} w={140} h={54} />
      {[0, 1, 2, 3].map((i) => <Chair key={`conf-top-${i}`} x={990 + i * 35} y={870} />)}
      {[0, 1, 2, 3].map((i) => <Chair key={`conf-bot-${i}`} x={990 + i * 35} y={950} />)}
      <TVScreen x={1010} y={858} />
      <PlantSmall x={910} y={840} />
      <PlantSmall x={1190} y={840} />
      <PlantSmall x={1190} y={990} />
    </>
  );
}

// ═══ Rooms ═══
const ROOMS = [
  { x: 60, y: 60, w: 360, h: 300, floor: '#f0ebe4', label: '💭 마음의소리', team: '조직유닛' },
  { x: 480, y: 60, w: 360, h: 300, floor: '#e4eef0', label: '📊 KPI 관리실', team: '조직유닛' },
  { x: 60, y: 440, w: 360, h: 340, floor: '#eee4f0', label: '📞 VOC 센터', team: '전체' },
  { x: 480, y: 440, w: 360, h: 340, floor: '#f0eee4', label: '💡 아이디어 보드', team: '전체' },
  { x: 900, y: 60, w: 320, h: 380, floor: '#e8e4f0', label: '☕ 라운지', team: '자유 공간' },
  { x: 900, y: 480, w: 320, h: 300, floor: '#e4f0ec', label: '✉️ 쪽지함', team: '익명' },
  { x: 900, y: 840, w: 320, h: 180, floor: '#e4e8f0', label: '🏢 회의실', team: '조직유닛' },
  { x: 60, y: 840, w: 360, h: 220, floor: '#f0e8e4', label: '📢 공지게시판', team: '전체' },
];

interface MapCanvasProps {
  children?: ReactNode;
}

export default function MapCanvas({ children }: MapCanvasProps) {
  return (
    <div className="absolute w-[1800px] h-[1200px]" style={{ imageRendering: 'pixelated' }}>
      <Ground />
      {ROOMS.map((r, i) => (
        <Room key={i} x={r.x} y={r.y} w={r.w} h={r.h} floor={r.floor} label={r.label} teamLabel={r.team} />
      ))}
      <Furniture />
      {children}
    </div>
  );
}
