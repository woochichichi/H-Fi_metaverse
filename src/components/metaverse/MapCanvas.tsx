import { type ReactNode, type JSX } from 'react';
import { TEAM_CONFIGS, CENTRAL_PLAZA } from '../../lib/constants';

// ═══ SVG Plants (픽셀 스타일 — Sprint B에서 더 개선) ═══
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
    // 증권: 캔들스틱 차트
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
    // 생명: 하트
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
    // 손보: 자동차
    car: (
      <svg width="40" height="32" viewBox="0 0 10 8" style={{ imageRendering: 'pixelated' }}>
        {/* 차체 상단 (캐빈) */}
        <rect x="3" y="0" width="4" height="1" fill="#3498db" />
        <rect x="2" y="1" width="6" height="1" fill="#3498db" />
        {/* 유리 */}
        <rect x="3" y="1" width="2" height="1" fill="#85C1E9" />
        <rect x="6" y="1" width="1" height="1" fill="#85C1E9" />
        {/* 차체 하단 */}
        <rect x="1" y="2" width="8" height="1" fill="#0984E3" />
        <rect x="0" y="3" width="10" height="1" fill="#0984E3" />
        <rect x="0" y="4" width="10" height="1" fill="#0984E3" />
        {/* 헤드라이트 */}
        <rect x="0" y="3" width="1" height="1" fill="#FFC312" />
        <rect x="9" y="3" width="1" height="1" fill="#FD7272" />
        {/* 바퀴 */}
        <rect x="1" y="5" width="2" height="2" fill="#333" />
        <rect x="7" y="5" width="2" height="2" fill="#333" />
        {/* 휠캡 */}
        <rect x="1.5" y="5.5" width="1" height="1" fill="#888" />
        <rect x="7.5" y="5.5" width="1" height="1" fill="#888" />
      </svg>
    ),
    // 아이디어: 전구
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
    // VOC: 전화기
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
        className="absolute z-[15] -translate-x-1/2 whitespace-nowrap rounded-xl px-5 py-[5px] text-sm font-bold text-white pointer-events-none"
        style={{
          left: x + w / 2, top: y - 28,
          background: `linear-gradient(135deg, ${wallColor}dd, ${wallColor}aa)`,
          backdropFilter: 'blur(6px)',
          boxShadow: `0 3px 12px ${wallColor}44, 0 1px 0 rgba(255,255,255,.15) inset`,
          letterSpacing: '0.5px',
        }}
      >
        {label}
      </div>
      <div
        className="absolute z-[15] whitespace-nowrap rounded-lg px-3 py-[3px] text-[11px] font-semibold pointer-events-none"
        style={{
          left: x + 12, top: y + 12,
          color: `${wallColor}`,
          background: 'rgba(0,0,0,.5)',
          border: `1px solid ${wallColor}44`,
        }}
      >
        {teamLabel}
      </div>
      <div className="absolute overflow-hidden rounded-sm" style={{ left: x, top: y, width: w, height: h, boxShadow: `6px 6px 0px rgba(0,0,0,.35), 0 0 30px ${wallColor}15`, border: `3px solid ${wallColor}` }}>
        <div className="absolute inset-0" style={{ background: floor }} />
        {/* 코너 글로우 */}
        <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at 10% 10%, ${wallColor}18, transparent 50%)` }} />
        {/* 격자 패턴 오버레이 */}
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

// ═══ 팀 타운 가구 배치 (3개 Zone씩) ═══
function TeamTownFurniture({ ox, oy, teamColor, theme }: { ox: number; oy: number; teamColor: string; theme: string }) {
  const decoType = theme === 'stock' ? 'chart' : theme === 'life' ? 'heart' : 'car';
  return (
    <>
      {/* 라운지 (좌측 Zone) — 소파 + 테이블 */}
      <SofaH x={ox + 60} y={oy + 80} color={teamColor} />
      <SofaH x={ox + 200} y={oy + 80} color={teamColor} />
      <RoundTable x={ox + 130} y={oy + 130} size={50} />
      <RoundTable x={ox + 260} y={oy + 130} size={50} />
      <PlantLarge x={ox + 10} y={oy + 10} />
      <PlantSmall x={ox + 310} y={oy + 10} />

      {/* KPI실 (우측 Zone) — 책상 + 모니터 */}
      {[0, 1, 2].map((i) => (
        <span key={`kpi-${i}`}>
          <Desk x={ox + 410 + i * 105} y={oy + 60} />
          <Monitor x={ox + 430 + i * 105} y={oy + 50} />
          <Chair x={ox + 430 + i * 105} y={oy + 112} />
        </span>
      ))}
      {[0, 1, 2].map((i) => (
        <span key={`kpi2-${i}`}>
          <Desk x={ox + 410 + i * 105} y={oy + 160} />
          <Monitor x={ox + 430 + i * 105} y={oy + 150} />
          <Chair x={ox + 430 + i * 105} y={oy + 212} />
        </span>
      ))}
      <Whiteboard x={ox + 450} y={oy + 20} />

      {/* 공지게시판 (하단 Zone) — 화이트보드 + 의자 */}
      <Whiteboard x={ox + 200} y={oy + 310} w={120} />
      <Whiteboard x={ox + 360} y={oy + 310} w={100} />
      <Bookshelf x={ox + 170} y={oy + 340} />
      <Bookshelf x={ox + 170} y={oy + 390} />
      <Chair x={ox + 280} y={oy + 380} />
      <Chair x={ox + 340} y={oy + 380} />
      <Chair x={ox + 400} y={oy + 380} />
      <Desk x={ox + 260} y={oy + 420} w={120} />
      <PlantSmall x={ox + 170} y={oy + 450} />
      <PlantSmall x={ox + 500} y={oy + 310} />

      {/* 팀별 장식 */}
      <PixelDecoration x={ox + 340} y={oy + 30} type={decoType} />
      <PixelDecoration x={ox + 730} y={oy + 30} type={decoType} />
      <PixelDecoration x={ox + 540} y={oy + 500} type={decoType} />
    </>
  );
}

// ═══ 중앙 광장 가구 ═══
function PlazaFurniture() {
  const px = CENTRAL_PLAZA.x;
  const py = CENTRAL_PLAZA.y;
  return (
    <>
      {/* VoC 센터 (좌측) — 핑크 콜센터 느낌 */}
      <Desk x={px + 60} y={py + 80} />
      <Monitor x={px + 80} y={py + 70} />
      <Chair x={px + 80} y={py + 132} />
      <Desk x={px + 190} y={py + 80} />
      <Monitor x={px + 210} y={py + 70} />
      <Chair x={px + 210} y={py + 132} />
      <Desk x={px + 60} y={py + 170} />
      <Monitor x={px + 80} y={py + 160} />
      <Chair x={px + 80} y={py + 222} />
      <Desk x={px + 190} y={py + 170} />
      <Monitor x={px + 210} y={py + 160} />
      <Chair x={px + 210} y={py + 222} />
      <Whiteboard x={px + 80} y={py + 40} />
      <PlantLarge x={px + 10} y={py + 30} />
      <PlantSmall x={px + 300} y={py + 30} />
      <PixelDecoration x={px + 310} y={py + 200} type="phone" />

      {/* 아이디어 보드 (우측) — 창의적 브레인스토밍 공간 */}
      <RoundTable x={px + 460} y={py + 80} size={56} />
      <RoundTable x={px + 600} y={py + 80} size={56} />
      <RoundTable x={px + 460} y={py + 180} size={56} />
      <RoundTable x={px + 600} y={py + 180} size={56} />
      <SofaH x={px + 440} y={py + 50} color="#FDCB6E" />
      <SofaH x={px + 580} y={py + 50} color="#FDCB6E" />
      <SofaH x={px + 440} y={py + 140} color="#FDCB6E" />
      <SofaH x={px + 580} y={py + 140} color="#FDCB6E" />
      <Whiteboard x={px + 470} y={py + 24} w={140} />
      <Bookshelf x={px + 700} y={py + 60} />
      <Bookshelf x={px + 700} y={py + 120} />
      <PlantLarge x={px + 420} y={py + 30} />
      <PlantSmall x={px + 740} y={py + 30} />
      <PixelDecoration x={px + 730} y={py + 200} type="bulb" />

      {/* 광장 장식 — 분수대(원) + 이정표 */}
      <div
        className="absolute z-[6] rounded-full"
        style={{
          left: px + 350, top: py + 320,
          width: 80, height: 80,
          background: 'radial-gradient(circle, #6bc5ff44, #6bc5ff22, transparent)',
          border: '3px solid #6bc5ff66',
          boxShadow: '0 0 20px rgba(107,197,255,.2)',
        }}
      />
      {/* 이정표 */}
      <div className="absolute z-[7]" style={{ left: px + 375, top: py + 250 }}>
        <div style={{ width: 6, height: 50, background: 'linear-gradient(180deg,#a07030,#8B6914)', margin: '0 auto', borderRadius: 2 }} />
        <div className="absolute text-[11px] font-bold whitespace-nowrap" style={{ top: -2, left: 14, background: '#00D68Fcc', color: '#fff', padding: '2px 8px', borderRadius: 4, boxShadow: '0 2px 6px rgba(0,0,0,.3)' }}>
          ↑ 증권ITO
        </div>
        <div className="absolute text-[11px] font-bold whitespace-nowrap" style={{ top: 16, right: 14, background: '#6C5CE7cc', color: '#fff', padding: '2px 8px', borderRadius: 4, boxShadow: '0 2px 6px rgba(0,0,0,.3)' }}>
          ↙ 생명ITO
        </div>
        <div className="absolute text-[11px] font-bold whitespace-nowrap" style={{ top: 34, left: 14, background: '#0984E3cc', color: '#fff', padding: '2px 8px', borderRadius: 4, boxShadow: '0 2px 6px rgba(0,0,0,.3)' }}>
          ↘ 손보ITO
        </div>
      </div>

      <VendingMachine x={px + 730} y={py + 380} />
      <VendingMachine x={px + 760} y={py + 380} />

      {/* 광장 장식 아이콘 */}
      <PixelDecoration x={px + 20} y={py + 240} type="phone" />
      <PixelDecoration x={px + 340} y={py + 20} type="phone" />
      <PixelDecoration x={px + 420} y={py + 240} type="bulb" />
      <PixelDecoration x={px + 740} y={py + 20} type="bulb" />
    </>
  );
}

// ═══ Ground SVG (2400x2000) ═══
function Ground() {
  const stock = TEAM_CONFIGS.증권ITO.town;
  const life = TEAM_CONFIGS.생명ITO.town;
  const shield = TEAM_CONFIGS.손보ITO.town;
  const plaza = CENTRAL_PLAZA;

  return (
    <svg width="2400" height="2000" className="absolute left-0 top-0">
      <defs>
        <pattern id="grass" width="16" height="16" patternUnits="userSpaceOnUse">
          <rect width="16" height="16" fill="#5a7a5a" />
          <circle cx="4" cy="4" r="1" fill="#4d6d4d" opacity="0.5" />
          <circle cx="12" cy="12" r="1" fill="#6b8a6b" opacity="0.4" />
        </pattern>
        <pattern id="path-tile" width="32" height="32" patternUnits="userSpaceOnUse">
          <rect width="32" height="32" fill="#c8c0b0" />
          <rect x="0" y="0" width="16" height="16" fill="#ccc4b4" opacity="0.5" />
          <rect x="16" y="16" width="16" height="16" fill="#ccc4b4" opacity="0.5" />
        </pattern>
      </defs>

      {/* 전체 잔디 */}
      <rect width="2400" height="2000" fill="url(#grass)" />

      {/* 도로: 증권↔중앙광장 (세로) */}
      <rect x={stock.x + stock.w / 2 - 30} y={stock.y + stock.h} width="60" height={plaza.y - stock.y - stock.h} fill="url(#path-tile)" />

      {/* 도로: 생명↔중앙광장 (대각선 근사 — 꺾인 도로) */}
      <rect x={life.x + life.w - 50} y={plaza.y + plaza.h / 2 - 30} width={plaza.x - life.x - life.w + 100} height="60" fill="url(#path-tile)" />
      <rect x={life.x + life.w / 2 - 30} y={life.y - 60} width="60" height={plaza.y + plaza.h / 2 - life.y + 90} fill="url(#path-tile)" />

      {/* 도로: 손보↔중앙광장 */}
      <rect x={plaza.x + plaza.w - 50} y={plaza.y + plaza.h / 2 - 30} width={shield.x - plaza.x - plaza.w + 100} height="60" fill="url(#path-tile)" />
      <rect x={shield.x + shield.w / 2 - 30} y={shield.y - 60} width="60" height={plaza.y + plaza.h / 2 - shield.y + 90} fill="url(#path-tile)" />

      {/* 도로: 중앙광장↔모임방 (세로) */}
      <rect x={plaza.x + plaza.w / 2 - 30} y={plaza.y + plaza.h} width="60" height={1530 - plaza.y - plaza.h} fill="url(#path-tile)" />

      {/* 도로: 모임방↔오목 게임방 (가로) */}
      <rect x={940} y={1640} width={100} height="60" fill="url(#path-tile)" />
    </svg>
  );
}

// ═══ ROOMS 정의 (v4 삼각형 배치) ═══
const ROOMS: Array<{ x: number; y: number; w: number; h: number; floor: string; label: string; team: string; borderColor?: string }> = [];

// 팀 타운 방 생성
for (const [teamName, cfg] of Object.entries(TEAM_CONFIGS)) {
  const t = cfg.town;
  // 라운지
  ROOMS.push({ x: t.x + 20, y: t.y + 20, w: 360, h: 260, floor: cfg.floor, label: `🏠 ${teamName} 라운지`, team: teamName, borderColor: cfg.color });
  // KPI실
  ROOMS.push({ x: t.x + 400, y: t.y + 20, w: 360, h: 260, floor: cfg.floor, label: `📊 ${teamName} KPI`, team: teamName, borderColor: cfg.color });
  // 공지게시판
  ROOMS.push({ x: t.x + 210, y: t.y + 300, w: 360, h: 260, floor: cfg.floor, label: `📢 ${teamName} 공지`, team: teamName, borderColor: cfg.color });
}

// 중앙 광장 방
ROOMS.push(
  { x: CENTRAL_PLAZA.x + 20, y: CENTRAL_PLAZA.y + 20, w: 360, h: 260, floor: '#2a1a1a', label: '📞 VOC 센터', team: '공용', borderColor: '#E84393' },
  { x: CENTRAL_PLAZA.x + 400, y: CENTRAL_PLAZA.y + 20, w: 360, h: 260, floor: '#2a2a1a', label: '💡 아이디어 보드', team: '공용', borderColor: '#FDCB6E' },
);

// 모임방 (하단 중앙)
ROOMS.push(
  { x: 1010, y: 1530, w: 380, h: 280, floor: '#1a2a1a', label: '🎉 모임방', team: '공용', borderColor: '#FF9800' },
);

// 오목 게임방 (모임방 왼쪽)
ROOMS.push(
  { x: 540, y: 1530, w: 380, h: 280, floor: '#1a1a1a', label: '⚫ 오목 게임방', team: '공용', borderColor: '#8B6914' },
);

interface MapCanvasProps {
  children?: ReactNode;
}

export default function MapCanvas({ children }: MapCanvasProps) {
  return (
    <div className="absolute w-[2400px] h-[2000px]" style={{ imageRendering: 'pixelated' }}>
      <Ground />
      {ROOMS.map((r, i) => (
        <Room key={i} x={r.x} y={r.y} w={r.w} h={r.h} floor={r.floor} label={r.label} teamLabel={r.team} borderColor={r.borderColor} />
      ))}

      {/* 타운 배경 외곽 (팀 컬러 테두리) */}
      {Object.entries(TEAM_CONFIGS).map(([name, cfg]) => (
        <div
          key={name}
          className="absolute z-[1] rounded-xl pointer-events-none"
          style={{
            left: cfg.town.x, top: cfg.town.y, width: cfg.town.w, height: cfg.town.h,
            border: `3px dashed ${cfg.color}55`,
            background: `${cfg.color}0a`,
            boxShadow: `inset 0 0 60px ${cfg.color}08`,
          }}
        >
          <div
            className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-xl px-6 py-[6px] text-base font-extrabold text-white tracking-wide"
            style={{
              background: `linear-gradient(135deg, ${cfg.color}ee, ${cfg.color}bb)`,
              boxShadow: `0 4px 16px ${cfg.color}55`,
              letterSpacing: '1px',
            }}
          >
            {name}
          </div>
        </div>
      ))}

      {/* 중앙 광장 외곽 */}
      <div
        className="absolute z-[1] rounded-xl pointer-events-none"
        style={{
          left: CENTRAL_PLAZA.x, top: CENTRAL_PLAZA.y, width: CENTRAL_PLAZA.w, height: CENTRAL_PLAZA.h,
          border: '3px dashed rgba(248,181,0,.4)',
          background: 'rgba(248,181,0,.06)',
          boxShadow: 'inset 0 0 60px rgba(248,181,0,.06)',
        }}
      >
        <div
          className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-xl px-6 py-[6px] text-base font-extrabold text-white tracking-wide"
          style={{
            background: 'linear-gradient(135deg, rgba(248,181,0,.9), rgba(248,150,0,.75))',
            boxShadow: '0 4px 16px rgba(248,181,0,.4)',
            letterSpacing: '1px',
          }}
        >
          중앙 광장
        </div>
      </div>

      {/* 팀 타운 가구 */}
      {Object.values(TEAM_CONFIGS).map((cfg, i) => (
        <TeamTownFurniture key={i} ox={cfg.town.x} oy={cfg.town.y} teamColor={cfg.color} theme={cfg.theme} />
      ))}

      {/* 중앙 광장 가구 */}
      <PlazaFurniture />

      {/* 모임방 가구 */}
      <RoundTable x={1060} y={1590} size={56} />
      <RoundTable x={1200} y={1590} size={56} />
      <RoundTable x={1060} y={1690} size={56} />
      <RoundTable x={1200} y={1690} size={56} />
      <SofaH x={1040} y={1560} color="#FF9800" />
      <SofaH x={1180} y={1560} color="#FF9800" />
      <SofaH x={1040} y={1740} color="#FF9800" />
      <SofaH x={1180} y={1740} color="#FF9800" />
      <PlantLarge x={1020} y={1540} />
      <PlantSmall x={1340} y={1540} />
      <PlantSmall x={1340} y={1740} />

      {/* 오목 게임방 가구 */}
      {/* 오목판 테이블 */}
      <div
        className="absolute z-[4] rounded"
        style={{
          left: 680, top: 1620, width: 100, height: 100,
          background: 'linear-gradient(180deg,#DEB887,#C4A06E)',
          border: '3px solid #8B6914',
          boxShadow: '0 4px 0 rgba(0,0,0,.15), inset 0 1px 0 rgba(255,255,255,.2)',
        }}
      >
        {/* 바둑판 격자 */}
        <div className="absolute" style={{ top: 8, left: 8, right: 8, bottom: 8 }}>
          {[0, 1, 2, 3, 4, 5, 6].map(i => (
            <div key={`h${i}`} className="absolute" style={{ top: i * 12, left: 0, right: 0, height: 1, background: '#333' }} />
          ))}
          {[0, 1, 2, 3, 4, 5, 6].map(i => (
            <div key={`v${i}`} className="absolute" style={{ left: i * 12, top: 0, bottom: 0, width: 1, background: '#333' }} />
          ))}
          {/* 돌 몇 개 */}
          <div className="absolute rounded-full" style={{ left: 10, top: 10, width: 8, height: 8, background: '#111' }} />
          <div className="absolute rounded-full" style={{ left: 34, top: 22, width: 8, height: 8, background: '#fff', border: '1px solid #ccc' }} />
          <div className="absolute rounded-full" style={{ left: 22, top: 34, width: 8, height: 8, background: '#111' }} />
          <div className="absolute rounded-full" style={{ left: 46, top: 46, width: 8, height: 8, background: '#fff', border: '1px solid #ccc' }} />
        </div>
      </div>
      <Chair x={700} y={1590} />
      <Chair x={760} y={1590} />
      <Chair x={700} y={1726} />
      <Chair x={760} y={1726} />
      <PlantSmall x={560} y={1540} />
      <PlantSmall x={880} y={1540} />
      <PlantSmall x={560} y={1760} />

      {children}
    </div>
  );
}
