import { type ReactNode, type JSX, useMemo } from 'react';
import { ROOMS_DATA } from '../../lib/constants';
import type { RoomDef } from '../../lib/constants';
import { getMapTimeTheme, type MapTimeTheme } from '../../lib/utils';
import { useMetaverseStore } from '../../stores/metaverseStore';

// ═══════════════════════════════════════════════════════
// 90년대 사무실 아이소메트릭 픽셀 가구 (게더타운 스타일)
// ═══════════════════════════════════════════════════════

// 90년대 사무 책상 (아이소메트릭 탑다운, 서랍 2개, 베이지 상판)
function PixelDesk90s({ x, y }: { x: number; y: number }) {
  return (
    <div className="absolute z-[4]" style={{ left: x, top: y }}>
      <svg width="120" height="72" viewBox="0 0 30 18" style={{ imageRendering: 'pixelated' }}>
        {/* 그림자 */}
        <ellipse cx="15" cy="17" rx="13" ry="2" fill="rgba(0,0,0,0.12)" />
        {/* 다리 */}
        <rect x="2" y="12" width="2" height="5" fill="#8B7355" />
        <rect x="26" y="12" width="2" height="5" fill="#8B7355" />
        {/* 서랍함 본체 (우측) */}
        <rect x="20" y="7" width="8" height="10" fill="#A8895A" />
        <rect x="21" y="8" width="6" height="3" fill="#BFA87A" />
        <rect x="23" y="9" width="2" height="1" fill="#8B7355" />
        <rect x="21" y="12" width="6" height="3" fill="#BFA87A" />
        <rect x="23" y="13" width="2" height="1" fill="#8B7355" />
        {/* 상판 */}
        <rect x="0" y="5" width="30" height="3" rx="1" fill="#C4A36E" />
        <rect x="1" y="5" width="28" height="1" fill="#D4B87E" />
        {/* 상판 위 키보드 */}
        <rect x="4" y="3" width="10" height="3" rx="1" fill="#D4D0C8" />
        <rect x="5" y="4" width="8" height="1" fill="#C0BCB0" />
      </svg>
    </div>
  );
}

// CRT 모니터 (볼록 화면, 두꺼운 몸체)
function PixelCRT({ x, y, screen = '#2C3E50' }: { x: number; y: number; screen?: string }) {
  return (
    <div className="absolute z-[5]" style={{ left: x, top: y }}>
      <svg width="48" height="52" viewBox="0 0 12 13" style={{ imageRendering: 'pixelated' }}>
        {/* 몸체 (두꺼움) */}
        <rect x="1" y="1" width="10" height="8" rx="1" fill="#D4D0C8" />
        <rect x="1" y="8" width="10" height="1" fill="#B8B4A8" />
        {/* 화면 */}
        <rect x="2" y="2" width="8" height="5" fill={screen} />
        <rect x="3" y="3" width="2" height="1" fill="#4CAF50" opacity="0.8" />
        <rect x="3" y="4" width="4" height="1" fill="#4CAF50" opacity="0.5" />
        <rect x="3" y="5" width="3" height="1" fill="#4CAF50" opacity="0.3" />
        {/* 화면 반사 */}
        <rect x="7" y="2" width="2" height="1" fill="rgba(255,255,255,0.15)" />
        {/* 버튼 */}
        <rect x="8" y="7" width="1" height="1" fill="#4CAF50" />
        <rect x="9" y="7" width="1" height="1" fill="#F44336" />
        {/* 받침대 */}
        <rect x="4" y="9" width="4" height="2" fill="#B8B4A8" />
        <rect x="3" y="11" width="6" height="1" fill="#A09C90" />
      </svg>
    </div>
  );
}

// 바퀴 의자 (검정 가죽, 5발)
function PixelChair90s({ x, y }: { x: number; y: number }) {
  return (
    <div className="absolute z-[4]" style={{ left: x, top: y }}>
      <svg width="36" height="40" viewBox="0 0 9 10" style={{ imageRendering: 'pixelated' }}>
        {/* 바퀴 (5방향) */}
        <rect x="0" y="9" width="2" height="1" fill="#555" />
        <rect x="7" y="9" width="2" height="1" fill="#555" />
        <rect x="2" y="8" width="1" height="1" fill="#555" />
        <rect x="6" y="8" width="1" height="1" fill="#555" />
        {/* 기둥 */}
        <rect x="4" y="6" width="1" height="3" fill="#666" />
        {/* 좌판 */}
        <rect x="1" y="4" width="7" height="3" rx="1" fill="#2C2C2C" />
        <rect x="2" y="5" width="5" height="1" fill="#3A3A3A" />
        {/* 등받이 */}
        <rect x="2" y="1" width="5" height="4" rx="1" fill="#2C2C2C" />
        <rect x="3" y="2" width="3" height="2" fill="#3A3A3A" />
        {/* 팔걸이 */}
        <rect x="0" y="3" width="2" height="1" fill="#4A4A4A" />
        <rect x="7" y="3" width="2" height="1" fill="#4A4A4A" />
      </svg>
    </div>
  );
}

// 갈색 가죽 소파 (쿠션 3개)
function PixelSofa90s({ x, y, color = '#8B6914' }: { x: number; y: number; color?: string }) {
  return (
    <div className="absolute z-[4]" style={{ left: x, top: y }}>
      <svg width="120" height="56" viewBox="0 0 30 14" style={{ imageRendering: 'pixelated' }}>
        <ellipse cx="15" cy="13" rx="13" ry="2" fill="rgba(0,0,0,0.1)" />
        {/* 뒷면 */}
        <rect x="1" y="1" width="28" height="4" rx="1" fill={color} />
        <rect x="2" y="2" width="26" height="2" fill={`${color}dd`} />
        {/* 좌판 */}
        <rect x="0" y="5" width="30" height="6" rx="1" fill={color} />
        {/* 쿠션 구분 */}
        <rect x="1" y="6" width="8" height="4" rx="1" fill={`${color}ee`} />
        <rect x="11" y="6" width="8" height="4" rx="1" fill={`${color}ee`} />
        <rect x="21" y="6" width="8" height="4" rx="1" fill={`${color}ee`} />
        {/* 하이라이트 */}
        <rect x="2" y="6" width="6" height="1" fill="rgba(255,255,255,0.1)" />
        <rect x="12" y="6" width="6" height="1" fill="rgba(255,255,255,0.1)" />
        <rect x="22" y="6" width="6" height="1" fill="rgba(255,255,255,0.1)" />
        {/* 팔걸이 */}
        <rect x="0" y="3" width="3" height="9" rx="1" fill={color} />
        <rect x="27" y="3" width="3" height="9" rx="1" fill={color} />
      </svg>
    </div>
  );
}

// 화이트보드 (마커 자국 + 지우개)
function PixelWhiteboard({ x, y, w = 120 }: { x: number; y: number; w?: number }) {
  const vw = w / 4; // viewBox 비율
  return (
    <div className="absolute z-[5]" style={{ left: x, top: y }}>
      <svg width={w} height="80" viewBox={`0 0 ${vw} 20`} style={{ imageRendering: 'pixelated' }}>
        {/* 프레임 */}
        <rect x="0" y="0" width={vw} height="18" rx="1" fill="#E8E8E8" stroke="#AAAAAA" strokeWidth="0.5" />
        {/* 보드 */}
        <rect x="1" y="1" width={vw - 2} height="14" fill="#F5F5F0" />
        {/* 마커 자국 */}
        <rect x="3" y="3" width={vw * 0.5} height="1" fill="#E74C3C" opacity="0.6" />
        <rect x="3" y="5" width={vw * 0.4} height="1" fill="#3498DB" opacity="0.5" />
        <rect x="3" y="7" width={vw * 0.6} height="1" fill="#2ECC71" opacity="0.4" />
        <rect x="3" y="9" width={vw * 0.3} height="1" fill="#E74C3C" opacity="0.3" />
        {/* 트레이 */}
        <rect x="2" y="16" width={vw - 4} height="2" fill="#CCCCCC" />
        {/* 마커 */}
        <rect x="4" y="16" width="2" height="1.5" fill="#E74C3C" />
        <rect x="7" y="16" width="2" height="1.5" fill="#3498DB" />
        {/* 지우개 */}
        <rect x={vw - 8} y="16" width="4" height="1.5" fill="#888" />
      </svg>
    </div>
  );
}

// 파일 캐비넷 (금속 3단 서랍)
function PixelFileCabinet({ x, y }: { x: number; y: number }) {
  return (
    <div className="absolute z-[5]" style={{ left: x, top: y }}>
      <svg width="48" height="72" viewBox="0 0 12 18" style={{ imageRendering: 'pixelated' }}>
        <ellipse cx="6" cy="17" rx="5" ry="1.5" fill="rgba(0,0,0,0.1)" />
        {/* 본체 */}
        <rect x="0" y="0" width="12" height="16" fill="#8C8C8C" />
        <rect x="1" y="0" width="10" height="1" fill="#9C9C9C" />
        {/* 서랍 1 */}
        <rect x="1" y="1" width="10" height="4" fill="#A0A0A0" />
        <rect x="4" y="2.5" width="4" height="1" fill="#6C6C6C" />
        {/* 서랍 2 */}
        <rect x="1" y="6" width="10" height="4" fill="#A0A0A0" />
        <rect x="4" y="7.5" width="4" height="1" fill="#6C6C6C" />
        {/* 서랍 3 */}
        <rect x="1" y="11" width="10" height="4" fill="#A0A0A0" />
        <rect x="4" y="12.5" width="4" height="1" fill="#6C6C6C" />
        {/* 엣지 하이라이트 */}
        <rect x="0" y="0" width="1" height="16" fill="rgba(255,255,255,0.1)" />
      </svg>
    </div>
  );
}

// 종이컵 커피 자판기
function PixelVending90s({ x, y }: { x: number; y: number }) {
  return (
    <div className="absolute z-[5]" style={{ left: x, top: y }}>
      <svg width="52" height="80" viewBox="0 0 13 20" style={{ imageRendering: 'pixelated' }}>
        <ellipse cx="6.5" cy="19" rx="5.5" ry="1.5" fill="rgba(0,0,0,0.1)" />
        {/* 본체 */}
        <rect x="0" y="0" width="13" height="18" rx="1" fill="#C0392B" />
        <rect x="1" y="1" width="11" height="16" fill="#E74C3C" />
        {/* 상단 로고 */}
        <rect x="3" y="2" width="7" height="2" fill="#FFFFFF" opacity="0.3" />
        {/* 디스플레이 */}
        <rect x="2" y="5" width="9" height="5" fill="#1a1a2e" />
        <rect x="3" y="6" width="3" height="1" fill="#4CAF50" opacity="0.7" />
        <rect x="3" y="8" width="5" height="1" fill="#FFC107" opacity="0.5" />
        {/* 버튼 */}
        <rect x="3" y="11" width="2" height="2" rx="0.5" fill="#FFA726" />
        <rect x="6" y="11" width="2" height="2" rx="0.5" fill="#66BB6A" />
        <rect x="9" y="11" width="2" height="2" rx="0.5" fill="#42A5F5" />
        {/* 투출구 */}
        <rect x="4" y="14" width="5" height="3" fill="#333" />
        <rect x="5" y="15" width="3" height="1" fill="#555" />
      </svg>
    </div>
  );
}

// 큰 잎 화분 (테라코타 화분, 넓은 잎)
function PixelPlant90s({ x, y, size = 'large' }: { x: number; y: number; size?: 'large' | 'small' }) {
  if (size === 'small') {
    return (
      <div className="absolute z-[6]" style={{ left: x, top: y }}>
        <svg width="32" height="44" viewBox="0 0 8 11" style={{ imageRendering: 'pixelated' }}>
          <ellipse cx="4" cy="10" rx="3.5" ry="1" fill="rgba(0,0,0,0.1)" />
          <rect x="2" y="7" width="4" height="3" fill="#C2703E" />
          <rect x="1" y="7" width="6" height="1" fill="#D4834E" />
          <ellipse cx="4" cy="5" rx="3" ry="4" fill="#4CAF50" />
          <ellipse cx="2.5" cy="4" rx="2" ry="3" fill="#66BB6A" />
          <ellipse cx="5.5" cy="4.5" rx="2" ry="2.5" fill="#388E3C" />
        </svg>
      </div>
    );
  }
  return (
    <div className="absolute z-[6]" style={{ left: x, top: y }}>
      <svg width="56" height="76" viewBox="0 0 14 19" style={{ imageRendering: 'pixelated' }}>
        <ellipse cx="7" cy="18" rx="5" ry="1.5" fill="rgba(0,0,0,0.12)" />
        {/* 화분 */}
        <rect x="3" y="13" width="8" height="5" fill="#C2703E" />
        <rect x="2" y="13" width="10" height="2" fill="#D4834E" />
        <rect x="4" y="16" width="6" height="1" fill="#B8632E" />
        {/* 넓은 잎 */}
        <ellipse cx="7" cy="8" rx="5" ry="7" fill="#43A047" />
        <ellipse cx="4" cy="6" rx="3" ry="5" fill="#66BB6A" />
        <ellipse cx="10" cy="7" rx="3" ry="4" fill="#388E3C" />
        <ellipse cx="7" cy="4" rx="3" ry="4" fill="#4CAF50" />
        {/* 잎 디테일 */}
        <rect x="6" y="3" width="2" height="6" fill="rgba(255,255,255,0.08)" />
      </svg>
    </div>
  );
}

// 사무실 파티션 (회색 패브릭, H자형)
function PixelPartition({ x, y, w = 120 }: { x: number; y: number; w?: number }) {
  const vw = w / 4;
  return (
    <div className="absolute z-[5]" style={{ left: x, top: y }}>
      <svg width={w} height="60" viewBox={`0 0 ${vw} 15`} style={{ imageRendering: 'pixelated' }}>
        {/* 프레임 */}
        <rect x="0" y="0" width="1" height="15" fill="#C0C0C0" />
        <rect x={vw - 1} y="0" width="1" height="15" fill="#C0C0C0" />
        {/* 패브릭 */}
        <rect x="1" y="0" width={vw - 2} height="13" fill="#A0A0A0" />
        <rect x="1" y="0" width={vw - 2} height="1" fill="#B0B0B0" />
        {/* 텍스처 */}
        <rect x="2" y="2" width={vw - 4} height="1" fill="rgba(255,255,255,0.05)" />
        <rect x="2" y="5" width={vw - 4} height="1" fill="rgba(255,255,255,0.05)" />
        <rect x="2" y="8" width={vw - 4} height="1" fill="rgba(255,255,255,0.05)" />
        {/* 발 */}
        <rect x="1" y="13" width="2" height="2" fill="#888" />
        <rect x={vw - 3} y="13" width="2" height="2" fill="#888" />
      </svg>
    </div>
  );
}

// 복사기
function PixelCopier({ x, y }: { x: number; y: number }) {
  return (
    <div className="absolute z-[5]" style={{ left: x, top: y }}>
      <svg width="64" height="72" viewBox="0 0 16 18" style={{ imageRendering: 'pixelated' }}>
        <ellipse cx="8" cy="17" rx="7" ry="1.5" fill="rgba(0,0,0,0.1)" />
        {/* 본체 */}
        <rect x="1" y="4" width="14" height="12" fill="#E0E0E0" />
        <rect x="1" y="4" width="14" height="1" fill="#EEEEEE" />
        {/* 상판 (스캐너) */}
        <rect x="0" y="1" width="16" height="4" fill="#CCCCCC" />
        <rect x="1" y="2" width="14" height="2" fill="#DDDDDD" />
        {/* 디스플레이 */}
        <rect x="10" y="6" width="4" height="3" fill="#1a1a2e" />
        <rect x="11" y="7" width="2" height="1" fill="#4CAF50" opacity="0.7" />
        {/* 용지함 */}
        <rect x="3" y="12" width="10" height="3" fill="#D0D0D0" />
        <rect x="4" y="13" width="8" height="1" fill="#F5F5F0" />
        {/* 버튼 */}
        <rect x="3" y="7" width="2" height="1" fill="#4CAF50" />
        <rect x="3" y="9" width="2" height="1" fill="#F44336" />
      </svg>
    </div>
  );
}

// 코르크 게시판 (포스트잇 붙어있음)
function PixelCorkboard({ x, y }: { x: number; y: number }) {
  return (
    <div className="absolute z-[5]" style={{ left: x, top: y }}>
      <svg width="96" height="72" viewBox="0 0 24 18" style={{ imageRendering: 'pixelated' }}>
        {/* 프레임 */}
        <rect x="0" y="0" width="24" height="18" fill="#8B6914" />
        {/* 코르크 */}
        <rect x="1" y="1" width="22" height="16" fill="#D4A06E" />
        <rect x="2" y="2" width="20" height="14" fill="#C4966A" />
        {/* 포스트잇 */}
        <rect x="3" y="3" width="5" height="5" fill="#FDCB6E" />
        <rect x="3" y="3" width="5" height="1" fill="#F0B830" />
        <rect x="10" y="2" width="5" height="5" fill="#FF6B9D" />
        <rect x="10" y="2" width="5" height="1" fill="#E05580" />
        <rect x="17" y="4" width="4" height="4" fill="#74B9FF" />
        <rect x="17" y="4" width="4" height="1" fill="#5AA0E8" />
        <rect x="5" y="10" width="5" height="4" fill="#55EFC4" />
        <rect x="5" y="10" width="5" height="1" fill="#3DD8A8" />
        <rect x="13" y="9" width="6" height="5" fill="#FFF3B0" />
        <rect x="13" y="9" width="6" height="1" fill="#E8DC98" />
        {/* 핀 */}
        <circle cx="5" cy="3" r="0.7" fill="#E74C3C" />
        <circle cx="12" cy="2" r="0.7" fill="#3498DB" />
        <circle cx="19" cy="4" r="0.7" fill="#2ECC71" />
      </svg>
    </div>
  );
}

// 정수기
function PixelWaterCooler({ x, y }: { x: number; y: number }) {
  return (
    <div className="absolute z-[5]" style={{ left: x, top: y }}>
      <svg width="32" height="68" viewBox="0 0 8 17" style={{ imageRendering: 'pixelated' }}>
        <ellipse cx="4" cy="16" rx="3.5" ry="1" fill="rgba(0,0,0,0.1)" />
        {/* 물통 */}
        <rect x="2" y="0" width="4" height="5" rx="1" fill="#74B9FF" />
        <rect x="2.5" y="1" width="3" height="3" fill="#A8D8FF" opacity="0.5" />
        {/* 본체 */}
        <rect x="1" y="5" width="6" height="10" fill="#E0E0E0" />
        <rect x="1" y="5" width="6" height="1" fill="#F0F0F0" />
        {/* 수도꼭지 */}
        <rect x="0" y="8" width="2" height="1" fill="#E74C3C" />
        <rect x="6" y="8" width="2" height="1" fill="#3498DB" />
        {/* 종이컵 홀더 */}
        <rect x="0" y="10" width="2" height="3" fill="#DDD" />
        <rect x="0" y="10" width="2" height="1" fill="#CCC" />
      </svg>
    </div>
  );
}

// 라운드 테이블 (탑다운)
function PixelRoundTable({ x, y, size = 72 }: { x: number; y: number; size?: number }) {
  const s = size / 4;
  return (
    <div className="absolute z-[4]" style={{ left: x, top: y }}>
      <svg width={size} height={size} viewBox={`0 0 ${s} ${s}`} style={{ imageRendering: 'pixelated' }}>
        <ellipse cx={s / 2} cy={s - 1} rx={s / 2 - 1} ry={2} fill="rgba(0,0,0,0.1)" />
        <ellipse cx={s / 2} cy={s / 2} rx={s / 2 - 1} ry={s / 2 - 2} fill="#C4A36E" />
        <ellipse cx={s / 2} cy={s / 2 - 0.5} rx={s / 2 - 2} ry={s / 2 - 3} fill="#D4B87E" />
        <ellipse cx={s / 2 - 1} cy={s / 2 - 1} rx={2} ry={1.5} fill="rgba(255,255,255,0.1)" />
      </svg>
    </div>
  );
}

// 벽시계
function PixelWallClock({ x, y }: { x: number; y: number }) {
  return (
    <div className="absolute z-[6]" style={{ left: x, top: y }}>
      <svg width="28" height="28" viewBox="0 0 7 7" style={{ imageRendering: 'pixelated' }}>
        <circle cx="3.5" cy="3.5" r="3" fill="#F5F5F0" stroke="#666" strokeWidth="0.5" />
        <circle cx="3.5" cy="3.5" r="0.5" fill="#333" />
        {/* 시침 */}
        <rect x="3.25" y="1.5" width="0.5" height="2" fill="#333" />
        {/* 분침 */}
        <rect x="3.5" y="2" width="2" height="0.4" fill="#333" />
      </svg>
    </div>
  );
}

// 오목판 테이블
function PixelOmokTable({ x, y }: { x: number; y: number }) {
  return (
    <div className="absolute z-[4]" style={{ left: x, top: y }}>
      <svg width="140" height="140" viewBox="0 0 35 35" style={{ imageRendering: 'pixelated' }}>
        <ellipse cx="17.5" cy="34" rx="15" ry="2" fill="rgba(0,0,0,0.12)" />
        {/* 테이블 */}
        <rect x="2" y="2" width="31" height="31" rx="1" fill="#DEB887" />
        <rect x="3" y="3" width="29" height="29" fill="#C4A06E" />
        <rect x="2" y="2" width="31" height="1" fill="#E8CCA0" />
        {/* 격자 */}
        {[0,1,2,3,4,5,6,7,8].map(i => (
          <rect key={`gh${i}`} x="5" y={5 + i * 3} width="25" height="0.5" fill="#8B7355" opacity="0.6" />
        ))}
        {[0,1,2,3,4,5,6,7,8].map(i => (
          <rect key={`gv${i}`} x={5 + i * 3} y="5" width="0.5" height="25" fill="#8B7355" opacity="0.6" />
        ))}
        {/* 돌 */}
        <circle cx="11" cy="11" r="1.5" fill="#111" />
        <circle cx="20" cy="14" r="1.5" fill="#FFF" stroke="#CCC" strokeWidth="0.3" />
        <circle cx="14" cy="20" r="1.5" fill="#111" />
        <circle cx="23" cy="23" r="1.5" fill="#FFF" stroke="#CCC" strokeWidth="0.3" />
        <circle cx="17" cy="17" r="1.5" fill="#111" />
      </svg>
    </div>
  );
}

// ═══ Zone 바닥 색상 매핑 ═══
const ZONE_FLOOR_COLORS: Record<string, string> = {
  // 팀 룸 Zone
  'lobby': '#3a3020',   // 밝은 나무 바닥
  'kpi': '#1a2a3a',     // 푸른 바닥
  'notice': '#2a1a1a',  // 붉은 바닥
  // 광장 Zone
  'voc': '#2a1a2a',     // 분홍 톤
  'idea': '#2a2a1a',    // 노란 톤
  'gathering': '#2a2010', // 주황 톤
  'reaction': '#2a1a2e', // 보라 톤
  'omok': '#1a2a1a',    // 녹색 톤
};

function getZoneFloorColor(zoneId: string): string {
  for (const [key, color] of Object.entries(ZONE_FLOOR_COLORS)) {
    if (zoneId.includes(key)) return color;
  }
  return '#1a1a1a';
}

// ═══ Room Ground (룸별 바닥 — Zone 영역은 바닥색으로만 구분) ═══
function RoomGround({ room, theme }: { room: RoomDef; theme: MapTimeTheme }) {
  const { w, h } = room.mapSize;

  return (
    <svg width={w} height={h} className="absolute left-0 top-0">
      <defs>
        <pattern id={`grass-${room.id}`} width="16" height="16" patternUnits="userSpaceOnUse">
          <rect width="16" height="16" fill={theme.grass} />
          <circle cx="4" cy="4" r="1" fill={theme.grassDark} opacity="0.5" />
          <circle cx="12" cy="12" r="1" fill={theme.grassLight} opacity="0.4" />
          <circle cx="8" cy="10" r="0.5" fill={theme.grassDark} opacity="0.3" />
        </pattern>
        <linearGradient id={`sky-${room.id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={theme.skyGradient[0]} stopOpacity={theme.skyOpacity} />
          <stop offset="50%" stopColor={theme.skyGradient[1]} stopOpacity={theme.skyOpacity * 0.6} />
          <stop offset="100%" stopColor={theme.skyGradient[2]} stopOpacity={0} />
        </linearGradient>
      </defs>
      <rect width={w} height={h} fill={`url(#grass-${room.id})`} />
      <rect width={w} height={h} fill={`url(#sky-${room.id})`} />
      {/* Zone 바닥 (테두리 없이, 색상으로만 영역 구분) */}
      {room.zones.map((z) => (
        <g key={z.id}>
          <rect
            x={z.x} y={z.y} width={z.width} height={z.height}
            fill={getZoneFloorColor(z.id)}
            opacity="0.85"
            rx="6"
          />
          {/* 타일 패턴 */}
          <rect
            x={z.x} y={z.y} width={z.width} height={z.height}
            fill="none" rx="6"
            style={{ filter: 'url(#tile-pattern)' }}
          />
          {/* Zone 내부 격자 (미묘한 타일) */}
          <g opacity="0.04">
            {Array.from({ length: Math.floor(z.width / 32) + 1 }, (_, i) => (
              <line key={`v${z.id}${i}`} x1={z.x + i * 32} y1={z.y} x2={z.x + i * 32} y2={z.y + z.height} stroke="white" strokeWidth="0.5" />
            ))}
            {Array.from({ length: Math.floor(z.height / 32) + 1 }, (_, i) => (
              <line key={`h${z.id}${i}`} x1={z.x} y1={z.y + i * 32} x2={z.x + z.width} y2={z.y + i * 32} stroke="white" strokeWidth="0.5" />
            ))}
          </g>
        </g>
      ))}
    </svg>
  );
}

// ═══ Zone 표지판 (떠있는 텍스트 대신 작은 나무 표지판) ═══
function ZoneSigns({ room }: { room: RoomDef }) {
  return (
    <>
      {room.zones.map((z) => (
        <div
          key={`sign-${z.id}`}
          className="absolute z-[16] pointer-events-none"
          style={{ left: z.x + z.width / 2, top: z.y - 8, transform: 'translateX(-50%)' }}
        >
          {/* 나무 표지판 */}
          <div className="relative">
            <div
              className="whitespace-nowrap rounded-md px-3 py-1 text-[12px] font-bold text-white"
              style={{
                background: 'linear-gradient(180deg, #A07030, #8B6914)',
                border: '1px solid #6d5310',
                boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                letterSpacing: '0.5px',
              }}
            >
              {z.label}
            </div>
            {/* 기둥 */}
            <div
              className="mx-auto"
              style={{ width: 4, height: 10, background: 'linear-gradient(180deg, #8B6914, #6d5310)' }}
            />
          </div>
        </div>
      ))}
    </>
  );
}

// ═══ 포탈 아치형 문 ═══
function PortalArch({ room }: { room: RoomDef }) {
  return (
    <>
      {room.portals.map((p) => (
        <div
          key={p.id}
          className="absolute z-[16] pointer-events-none"
          style={{ left: p.x, top: p.y, width: p.w, height: p.h }}
        >
          <svg width={p.w} height={p.h + 30} viewBox="0 0 120 80" preserveAspectRatio="none">
            <defs>
              <radialGradient id={`portal-glow-${p.id}`} cx="50%" cy="50%">
                <stop offset="0%" stopColor={room.theme.border} stopOpacity="0.5">
                  <animate attributeName="stop-opacity" values="0.3;0.6;0.3" dur="2s" repeatCount="indefinite" />
                </stop>
                <stop offset="100%" stopColor={room.theme.border} stopOpacity="0.05" />
              </radialGradient>
            </defs>
            {/* 발판 */}
            <rect x="5" y="65" width="110" height="8" rx="2" fill="#8B7355" />
            <rect x="10" y="65" width="100" height="3" fill="#A08060" />
            {/* 문 프레임 (아치) */}
            <rect x="10" y="15" width="10" height="55" fill="#8B6914" />
            <rect x="100" y="15" width="10" height="55" fill="#8B6914" />
            <rect x="10" y="10" width="100" height="10" rx="4" fill="#A07030" />
            <rect x="15" y="12" width="90" height="6" fill="#B8843A" />
            {/* 포탈 안쪽 빛 */}
            <rect x="20" y="20" width="80" height="48" rx="4" fill={`url(#portal-glow-${p.id})`} />
            <rect x="25" y="25" width="70" height="38" rx="3" fill={room.theme.border} opacity="0.08">
              <animate attributeName="opacity" values="0.05;0.15;0.05" dur="2s" repeatCount="indefinite" />
            </rect>
            {/* 빛 파티클 */}
            <circle cx="40" cy="35" r="1.5" fill={room.theme.border} opacity="0.4">
              <animate attributeName="cy" values="35;28;35" dur="3s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.4;0.1;0.4" dur="3s" repeatCount="indefinite" />
            </circle>
            <circle cx="70" cy="40" r="1" fill={room.theme.border} opacity="0.3">
              <animate attributeName="cy" values="40;32;40" dur="2.5s" repeatCount="indefinite" />
            </circle>
            <circle cx="55" cy="50" r="1.2" fill={room.theme.border} opacity="0.35">
              <animate attributeName="cy" values="50;42;50" dur="2.8s" repeatCount="indefinite" />
            </circle>
          </svg>
          {/* 행선지 표지판 */}
          <div
            className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md px-3 py-1 text-[11px] font-bold text-white"
            style={{
              top: -20,
              background: 'linear-gradient(180deg, #A07030, #8B6914)',
              border: '1px solid #6d5310',
              boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
            }}
          >
            {p.label} →
          </div>
        </div>
      ))}
    </>
  );
}

// ═══ 팀별 픽셀 장식 (증권-차트, 생명-하트, 손보-자동차) ═══
function PixelTeamDeco({ x, y, type }: { x: number; y: number; type: 'chart' | 'heart' | 'car' }) {
  const decos: Record<string, JSX.Element> = {
    chart: (
      <svg width="56" height="44" viewBox="0 0 14 11" style={{ imageRendering: 'pixelated' }}>
        <rect x="1" y="6" width="3" height="5" fill="#00D68F" />
        <rect x="2" y="3" width="1" height="3" fill="#00D68F" />
        <rect x="5" y="1" width="3" height="8" fill="#FF4757" />
        <rect x="6" y="0" width="1" height="1" fill="#FF4757" />
        <rect x="6" y="9" width="1" height="2" fill="#FF4757" />
        <rect x="9" y="4" width="3" height="7" fill="#00D68F" />
        <rect x="10" y="1" width="1" height="3" fill="#00D68F" />
      </svg>
    ),
    heart: (
      <svg width="52" height="52" viewBox="0 0 13 13" style={{ imageRendering: 'pixelated' }}>
        <rect x="1" y="0" width="4" height="2" fill="#FFC312" />
        <rect x="8" y="0" width="4" height="2" fill="#FFC312" />
        <rect x="0" y="2" width="6" height="2" fill="#6C5CE7" />
        <rect x="7" y="2" width="6" height="2" fill="#6C5CE7" />
        <rect x="0" y="4" width="13" height="2" fill="#6C5CE7" />
        <rect x="0" y="6" width="13" height="2" fill="#7d6df7" />
        <rect x="1" y="8" width="11" height="1" fill="#7d6df7" />
        <rect x="2" y="9" width="9" height="1" fill="#6C5CE7" />
        <rect x="3" y="10" width="7" height="1" fill="#6C5CE7" />
        <rect x="4" y="11" width="5" height="1" fill="#6C5CE7" />
        <rect x="5" y="12" width="3" height="1" fill="#6C5CE7" />
      </svg>
    ),
    car: (
      <svg width="56" height="44" viewBox="0 0 14 11" style={{ imageRendering: 'pixelated' }}>
        <rect x="4" y="0" width="6" height="2" fill="#3498db" />
        <rect x="3" y="2" width="8" height="1" fill="#3498db" />
        <rect x="4" y="2" width="3" height="1" fill="#85C1E9" />
        <rect x="8" y="2" width="2" height="1" fill="#85C1E9" />
        <rect x="1" y="3" width="12" height="2" fill="#0984E3" />
        <rect x="0" y="5" width="14" height="2" fill="#0984E3" />
        <rect x="0" y="5" width="2" height="1" fill="#FFC312" />
        <rect x="12" y="5" width="2" height="1" fill="#FD7272" />
        <rect x="2" y="7" width="3" height="3" fill="#333" />
        <rect x="9" y="7" width="3" height="3" fill="#333" />
        <rect x="3" y="8" width="1" height="1" fill="#888" />
        <rect x="10" y="8" width="1" height="1" fill="#888" />
      </svg>
    ),
  };
  return (
    <div className="absolute z-[6] pointer-events-none" style={{ left: x, top: y }}>
      {decos[type]}
    </div>
  );
}

// ═══ 팀 타운 가구 배치 (1200x900, 로컬좌표) ═══
function TeamTownFurniture({ teamColor, theme }: { teamColor: string; theme: string }) {
  const decoType = theme === 'stock' ? 'chart' : theme === 'life' ? 'heart' : 'car';
  return (
    <>
      {/* ═══ 팀별 픽셀 장식 (곳곳에 배치) ═══ */}
      <PixelTeamDeco x={500} y={70} type={decoType} />
      <PixelTeamDeco x={1100} y={70} type={decoType} />
      <PixelTeamDeco x={800} y={470} type={decoType} />
      <PixelTeamDeco x={280} y={340} type={decoType} />

      {/* ═══ 로비 Zone (60,60 ~ 560,400) — 편안한 휴식 공간 ═══ */}
      <PixelSofa90s x={100} y={120} color={teamColor} />
      <PixelSofa90s x={300} y={120} color={teamColor} />
      <PixelSofa90s x={100} y={240} color={teamColor} />
      <PixelRoundTable x={240} y={180} size={72} />
      <PixelRoundTable x={400} y={180} size={72} />
      <PixelWaterCooler x={80} y={80} />
      <PixelCorkboard x={160} y={72} />
      <PixelPlant90s x={480} y={80} />
      <PixelPlant90s x={70} y={320} size="small" />
      <PixelWallClock x={350} y={70} />

      {/* ═══ KPI Zone (640,60 ~ 1140,400) — 업무 공간 ═══ */}
      <PixelPartition x={660} y={80} w={100} />
      <PixelPartition x={820} y={80} w={100} />
      <PixelPartition x={980} y={80} w={100} />
      {/* 책상 2x3 배치 */}
      {[0, 1, 2].map((i) => (
        <span key={`kd1-${i}`}>
          <PixelDesk90s x={660 + i * 160} y={140} />
          <PixelCRT x={690 + i * 160} y={110} />
          <PixelChair90s x={700 + i * 160} y={220} />
        </span>
      ))}
      {[0, 1, 2].map((i) => (
        <span key={`kd2-${i}`}>
          <PixelDesk90s x={660 + i * 160} y={280} />
          <PixelCRT x={690 + i * 160} y={250} />
          <PixelChair90s x={700 + i * 160} y={360} />
        </span>
      ))}
      <PixelWhiteboard x={700} y={68} w={160} />
      <PixelFileCabinet x={1080} y={100} />
      <PixelFileCabinet x={1080} y={200} />
      <PixelCopier x={1060} y={320} />
      <PixelPlant90s x={640} y={340} size="small" />

      {/* ═══ 공지 Zone (350,460 ~ 850,760) — 열람 공간 ═══ */}
      <PixelCorkboard x={380} y={480} />
      <PixelCorkboard x={560} y={480} />
      <PixelWhiteboard x={400} y={560} w={140} />
      <PixelFileCabinet x={370} y={600} />
      <PixelFileCabinet x={370} y={680} />
      {/* 열람 벤치 */}
      <PixelSofa90s x={540} y={620} color="#666" />
      <PixelSofa90s x={540} y={690} color="#666" />
      <PixelRoundTable x={700} y={600} size={60} />
      <PixelChair90s x={720} y={670} />
      <PixelChair90s x={770} y={620} />
      <PixelPlant90s x={820} y={480} />
      <PixelPlant90s x={360} y={740} size="small" />
    </>
  );
}

// ═══ 중앙 광장 가구 (1600x1000, 로컬좌표) ═══
function PlazaFurniture() {
  return (
    <>
      {/* ═══ VOC Zone (60,60 ~ 720,440) — 접수 공간 ═══ */}
      {/* L자형 접수 데스크 */}
      <PixelDesk90s x={120} y={140} />
      <PixelDesk90s x={240} y={140} />
      <PixelDesk90s x={360} y={140} />
      <PixelCRT x={150} y={110} />
      <PixelCRT x={270} y={110} />
      <PixelCRT x={390} y={110} />
      <PixelChair90s x={160} y={220} />
      <PixelChair90s x={280} y={220} />
      <PixelChair90s x={400} y={220} />
      {/* 하단 열 */}
      <PixelDesk90s x={120} y={290} />
      <PixelDesk90s x={240} y={290} />
      <PixelCRT x={150} y={260} />
      <PixelCRT x={270} y={260} />
      <PixelChair90s x={160} y={370} />
      <PixelChair90s x={280} y={370} />
      <PixelFileCabinet x={530} y={120} />
      <PixelFileCabinet x={530} y={220} />
      <PixelFileCabinet x={530} y={320} />
      <PixelWhiteboard x={100} y={80} w={160} />
      <PixelPartition x={500} y={100} w={80} />
      <PixelCopier x={600} y={140} />
      <PixelPlant90s x={80} y={80} />
      <PixelPlant90s x={620} y={340} size="small" />
      <PixelWaterCooler x={660} y={120} />

      {/* ═══ 아이디어 Zone (860,60 ~ 1520,440) — 브레인스토밍 ═══ */}
      <PixelRoundTable x={920} y={140} size={80} />
      <PixelRoundTable x={1100} y={140} size={80} />
      <PixelRoundTable x={920} y={300} size={80} />
      <PixelRoundTable x={1100} y={300} size={80} />
      <PixelChair90s x={900} y={230} />
      <PixelChair90s x={1000} y={180} />
      <PixelChair90s x={1080} y={230} />
      <PixelChair90s x={1180} y={180} />
      <PixelChair90s x={900} y={380} />
      <PixelChair90s x={1000} y={340} />
      <PixelChair90s x={1080} y={380} />
      <PixelChair90s x={1180} y={340} />
      <PixelWhiteboard x={920} y={80} w={180} />
      <PixelWhiteboard x={1200} y={80} w={140} />
      <PixelCorkboard x={1350} y={140} />
      <PixelCorkboard x={1350} y={260} />
      <PixelPlant90s x={880} y={80} />
      <PixelPlant90s x={1440} y={80} />
      <PixelPlant90s x={1440} y={380} size="small" />

      {/* ═══ 모임방 Zone (60,520 ~ 520,820) ═══ */}
      {/* 긴 테이블 + 의자 */}
      <PixelDesk90s x={120} y={620} />
      <PixelDesk90s x={240} y={620} />
      <PixelDesk90s x={360} y={620} />
      <PixelChair90s x={140} y={580} />
      <PixelChair90s x={200} y={580} />
      <PixelChair90s x={260} y={580} />
      <PixelChair90s x={320} y={580} />
      <PixelChair90s x={380} y={580} />
      <PixelChair90s x={140} y={700} />
      <PixelChair90s x={200} y={700} />
      <PixelChair90s x={260} y={700} />
      <PixelChair90s x={320} y={700} />
      <PixelChair90s x={380} y={700} />
      <PixelSofa90s x={100} y={760} color="#8B6914" />
      <PixelPlant90s x={80} y={540} />
      <PixelPlant90s x={440} y={540} size="small" />
      <PixelVending90s x={460} y={640} />
      <PixelWaterCooler x={460} y={740} />

      {/* ═══ 반응속도 Zone (760,520 ~ 1100,820) ═══ */}
      <PixelDesk90s x={820} y={620} />
      <PixelCRT x={850} y={590} screen="#22C55E" />
      <PixelChair90s x={850} y={700} />
      <PixelDesk90s x={940} y={620} />
      <PixelCRT x={970} y={590} screen="#EF4444" />
      <PixelChair90s x={970} y={700} />
      <PixelSofa90s x={800} y={760} color="#555" />
      <PixelPlant90s x={780} y={540} size="small" />
      <PixelPlant90s x={1060} y={540} size="small" />

      {/* ═══ 오목 Zone (1140,520 ~ 1540,820) ═══ */}
      <PixelOmokTable x={1240} y={580} />
      <PixelChair90s x={1220} y={560} />
      <PixelChair90s x={1370} y={560} />
      <PixelChair90s x={1220} y={720} />
      <PixelChair90s x={1370} y={720} />
      <PixelSofa90s x={1160} y={740} color="#555" />
      <PixelFileCabinet x={1160} y={560} />
      <PixelVending90s x={1480} y={580} />
      <PixelPlant90s x={1150} y={540} size="small" />
      <PixelPlant90s x={1500} y={740} size="small" />

      {/* 광장 추가 가구 */}
      <PixelPlant90s x={1460} y={880} />
      <PixelPlant90s x={100} y={880} />
    </>
  );
}

// ═══ Main MapCanvas ═══
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
    <div className="absolute" style={{ width: mapW, height: mapH }}>
      <RoomGround room={room} theme={theme} />

      {/* Zone 표지판 */}
      <ZoneSigns room={room} />

      {/* 룸 외곽 테두리 */}
      <div
        className="absolute z-[1] rounded-xl pointer-events-none"
        style={{
          left: 0, top: 0, width: mapW, height: mapH,
          border: `3px solid ${room.theme.border}33`,
          background: `${room.theme.border}06`,
        }}
      />

      {/* 레트로 팀명 배너 (팀 룸 전용) */}
      {room.team && (
        <div
          className="absolute z-[20] left-1/2 -translate-x-1/2 pointer-events-none"
          style={{ top: 8 }}
        >
          <div
            className="relative px-8 py-2 text-center"
            style={{
              background: 'linear-gradient(180deg, #2a2018, #1a1208)',
              border: `3px solid ${room.theme.border}`,
              borderRadius: 6,
              boxShadow: `0 4px 16px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.08), 0 0 20px ${room.theme.border}33`,
            }}
          >
            {/* 장식 리벳 */}
            <div className="absolute top-1 left-2 w-2 h-2 rounded-full" style={{ background: room.theme.border, opacity: 0.6 }} />
            <div className="absolute top-1 right-2 w-2 h-2 rounded-full" style={{ background: room.theme.border, opacity: 0.6 }} />
            <div className="absolute bottom-1 left-2 w-2 h-2 rounded-full" style={{ background: room.theme.border, opacity: 0.6 }} />
            <div className="absolute bottom-1 right-2 w-2 h-2 rounded-full" style={{ background: room.theme.border, opacity: 0.6 }} />
            {/* 팀명 */}
            <div
              className="text-[18px] font-black tracking-[3px]"
              style={{
                color: room.theme.border,
                textShadow: `0 0 8px ${room.theme.border}66, 0 2px 4px rgba(0,0,0,.5)`,
                fontFamily: "'Space Grotesk', 'Courier New', monospace",
              }}
            >
              {room.label}
            </div>
            <div
              className="text-[9px] tracking-[2px] mt-0.5 uppercase"
              style={{ color: 'rgba(255,255,255,.35)', fontFamily: "'Courier New', monospace" }}
            >
              {room.team} OFFICE
            </div>
          </div>
        </div>
      )}

      {/* 가구 */}
      {room.team ? (
        <TeamTownFurniture teamColor={room.theme.main} theme={themeKey} />
      ) : (
        <PlazaFurniture />
      )}

      {/* 포탈 아치형 문 */}
      <PortalArch room={room} />

      {/* 미션/비전 바닥 각인 (중앙 광장 전용) */}
      {!room.team && (
        <div
          className="absolute pointer-events-none select-none z-[2]"
          style={{
            left: '50%',
            top: 855,
            transform: 'translateX(-50%)',
            textAlign: 'center',
            opacity: 0.13,
            whiteSpace: 'nowrap',
          }}
        >
          <div style={{
            color: '#8A7A6E',
            fontSize: 15,
            letterSpacing: 3,
            fontFamily: "'DungGeunMo', 'Galmuri11', monospace",
            marginBottom: 10,
          }}>
            초지능 · 초융합 · 초연결 기술로 인류를 더 풍요롭고 안전하게
          </div>
          <div style={{
            color: '#8A7A6E',
            fontSize: 12,
            letterSpacing: 2,
            fontFamily: "'Galmuri11', monospace",
            textTransform: 'uppercase' as const,
          }}>
            고객사 디지털 전환의 핵심 파트너 — 2030 Global Value Creation Partner
          </div>
        </div>
      )}

      {children}
    </div>
  );
}
