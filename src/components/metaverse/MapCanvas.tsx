import { type ReactNode, type JSX, useMemo, useCallback, memo, type MouseEvent } from 'react';
import { ROOMS_DATA } from '../../lib/constants';
import type { RoomDef, RoomId } from '../../lib/constants';
import { getMapTimeTheme, type MapTimeTheme } from '../../lib/utils';
import { useMetaverseStore } from '../../stores/metaverseStore';
import type { RoomAlertMap } from '../../hooks/useZoneAlerts';
import { useBoardPosts, type BoardPostCounts } from '../../hooks/useBoardPosts';

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
function PixelWhiteboard({ x, y, w = 120, text = '' }: { x: number; y: number; w?: number; text?: string }) {
  const vw = w / 4; // viewBox 비율
  return (
    <div className="absolute z-[5]" style={{ left: x, top: y }}>
      <svg width={w} height="80" viewBox={`0 0 ${vw} 20`} style={{ imageRendering: 'pixelated' }}>
        {/* 프레임 */}
        <rect x="0" y="0" width={vw} height="18" rx="1" fill="#E8E8E8" stroke="#AAAAAA" strokeWidth="0.5" />
        {/* 보드 */}
        <rect x="1" y="1" width={vw - 2} height="14" fill="#F5F5F0" />
        {text ? (
          <text
            x={vw / 2}
            y="9"
            textAnchor="middle"
            dominantBaseline="middle"
            fontFamily="'DungGeunMo', monospace"
            fontSize="5"
            fill="#444"
            style={{ imageRendering: 'auto' }}
          >
            {text}
          </text>
        ) : (
          <>
            {/* 마커 자국 */}
            <rect x="3" y="3" width={vw * 0.5} height="1" fill="#E74C3C" opacity="0.6" />
            <rect x="3" y="5" width={vw * 0.4} height="1" fill="#3498DB" opacity="0.5" />
            <rect x="3" y="7" width={vw * 0.6} height="1" fill="#2ECC71" opacity="0.4" />
            <rect x="3" y="9" width={vw * 0.3} height="1" fill="#E74C3C" opacity="0.3" />
          </>
        )}
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

// 커피 머신 (에스프레소, 개발자 필수템)
function PixelCoffeeMachine({ x, y }: { x: number; y: number }) {
  return (
    <div className="absolute z-[5]" style={{ left: x, top: y }}>
      <svg width="48" height="64" viewBox="0 0 12 16" style={{ imageRendering: 'pixelated' }}>
        <ellipse cx="6" cy="15" rx="5" ry="1.5" fill="rgba(0,0,0,0.1)" />
        {/* 본체 */}
        <rect x="1" y="0" width="10" height="14" rx="1" fill="#2C2C2C" />
        <rect x="2" y="1" width="8" height="12" fill="#3A3A3A" />
        {/* 상단 컵 워머 */}
        <rect x="2" y="1" width="8" height="2" fill="#555" />
        <rect x="4" y="1" width="1" height="1" fill="#888" />
        <rect x="7" y="1" width="1" height="1" fill="#888" />
        {/* 디스플레이 */}
        <rect x="3" y="4" width="6" height="2" fill="#1a1a2e" />
        <rect x="4" y="4.5" width="2" height="1" fill="#4CAF50" opacity="0.8" />
        <rect x="7" y="4.5" width="1" height="1" fill="#FF5722" opacity="0.6" />
        {/* 버튼들 */}
        <rect x="3" y="7" width="2" height="1" rx="0.3" fill="#795548" />
        <rect x="6" y="7" width="2" height="1" rx="0.3" fill="#5D4037" />
        {/* 추출구 */}
        <rect x="4" y="9" width="4" height="1" fill="#222" />
        {/* 커피 방울 */}
        <rect x="5.5" y="10" width="1" height="1" fill="#6D4C41" opacity="0.7" />
        {/* 컵 */}
        <rect x="4" y="11" width="4" height="2" rx="0.5" fill="#ECEFF1" />
        <rect x="4.5" y="11.5" width="3" height="1" fill="#4E342E" />
        {/* 드립 트레이 */}
        <rect x="2" y="13" width="8" height="1" fill="#444" />
      </svg>
    </div>
  );
}

// 러버덕 (디버깅의 상징)
function PixelRubberDuck({ x, y }: { x: number; y: number }) {
  return (
    <div className="absolute z-[6]" style={{ left: x, top: y }}>
      <svg width="28" height="28" viewBox="0 0 7 7" style={{ imageRendering: 'pixelated' }}>
        <ellipse cx="3.5" cy="6.5" rx="2.5" ry="0.8" fill="rgba(0,0,0,0.08)" />
        {/* 몸통 */}
        <ellipse cx="3.5" cy="4.5" rx="3" ry="2.2" fill="#FFD600" />
        <ellipse cx="3.5" cy="4.8" rx="2.5" ry="1.5" fill="#FFEB3B" />
        {/* 머리 */}
        <circle cx="3.5" cy="2" r="1.8" fill="#FFD600" />
        <circle cx="3.5" cy="2" r="1.5" fill="#FFEB3B" />
        {/* 눈 */}
        <circle cx="2.8" cy="1.7" r="0.4" fill="#222" />
        <circle cx="4.2" cy="1.7" r="0.4" fill="#222" />
        <circle cx="2.9" cy="1.5" r="0.15" fill="#FFF" />
        <circle cx="4.3" cy="1.5" r="0.15" fill="#FFF" />
        {/* 부리 */}
        <ellipse cx="3.5" cy="2.5" rx="0.8" ry="0.4" fill="#FF8F00" />
      </svg>
    </div>
  );
}

// 피자 박스 (야근의 동반자)
function PixelPizzaBox({ x, y }: { x: number; y: number }) {
  return (
    <div className="absolute z-[5]" style={{ left: x, top: y }}>
      <svg width="40" height="32" viewBox="0 0 10 8" style={{ imageRendering: 'pixelated' }}>
        <ellipse cx="5" cy="7.5" rx="4" ry="1" fill="rgba(0,0,0,0.08)" />
        {/* 박스 본체 */}
        <rect x="0" y="2" width="10" height="5" rx="0.5" fill="#D7A86E" />
        <rect x="0.5" y="2.5" width="9" height="4" fill="#C49A5C" />
        {/* 뚜껑 */}
        <rect x="0" y="1" width="10" height="2" rx="0.5" fill="#E0BB80" />
        {/* 로고 */}
        <rect x="3" y="1.5" width="4" height="1" fill="#D32F2F" opacity="0.6" />
        {/* 살짝 열린 틈 — 피자 보임 */}
        <rect x="1" y="3" width="8" height="0.5" fill="#FF8A65" />
        <rect x="2" y="3.5" width="2" height="0.5" fill="#F44336" opacity="0.5" />
        <rect x="5" y="3.5" width="1.5" height="0.5" fill="#4CAF50" opacity="0.5" />
      </svg>
    </div>
  );
}

// 고양이 (개발자의 동반자)
function PixelCatDev({ x, y, color = '#FF8A65' }: { x: number; y: number; color?: string }) {
  return (
    <div className="absolute z-[6]" style={{ left: x, top: y }}>
      <svg width="32" height="32" viewBox="0 0 8 8" style={{ imageRendering: 'pixelated' }}>
        {/* 꼬리 */}
        <rect x="6" y="4" width="1" height="1" fill={color} />
        <rect x="7" y="3" width="1" height="2" fill={color} />
        {/* 몸통 */}
        <ellipse cx="4" cy="5.5" rx="2.5" ry="1.8" fill={color} />
        {/* 머리 */}
        <circle cx="2.5" cy="3.5" r="1.8" fill={color} />
        {/* 귀 */}
        <polygon points="1,1.5 1.5,3 0.5,2.5" fill={color} />
        <polygon points="4,1.5 3.5,3 4.5,2.5" fill={color} />
        <polygon points="1.2,1.8 1.5,2.8 0.8,2.3" fill="#FF7043" opacity="0.5" />
        <polygon points="3.8,1.8 3.5,2.8 4.2,2.3" fill="#FF7043" opacity="0.5" />
        {/* 눈 */}
        <circle cx="2" cy="3.3" r="0.4" fill="#222" />
        <circle cx="3.2" cy="3.3" r="0.4" fill="#222" />
        <circle cx="2.1" cy="3.1" r="0.12" fill="#FFF" />
        <circle cx="3.3" cy="3.1" r="0.12" fill="#FFF" />
        {/* 코 */}
        <rect x="2.4" y="3.8" width="0.5" height="0.3" fill="#E91E63" />
        {/* 발 */}
        <ellipse cx="2" cy="7" rx="0.7" ry="0.4" fill={color} />
        <ellipse cx="5" cy="7" rx="0.7" ry="0.4" fill={color} />
      </svg>
    </div>
  );
}

// 듀얼 모니터 (개발자 셋업)
function PixelDualMonitor({ x, y }: { x: number; y: number }) {
  return (
    <div className="absolute z-[5]" style={{ left: x, top: y }}>
      <svg width="72" height="52" viewBox="0 0 18 13" style={{ imageRendering: 'pixelated' }}>
        {/* 왼쪽 모니터 — 코드 에디터 */}
        <rect x="0" y="0" width="8" height="7" rx="0.5" fill="#333" />
        <rect x="0.5" y="0.5" width="7" height="5.5" fill="#1a1a2e" />
        <rect x="1" y="1" width="2" height="0.5" fill="#C792EA" opacity="0.8" />
        <rect x="1.5" y="2" width="4" height="0.5" fill="#82AAFF" opacity="0.7" />
        <rect x="1.5" y="3" width="3" height="0.5" fill="#C3E88D" opacity="0.7" />
        <rect x="1" y="4" width="5" height="0.5" fill="#FFD54F" opacity="0.6" />
        <rect x="3" y="7" width="2" height="1.5" fill="#444" />
        <rect x="2" y="8.5" width="4" height="0.5" fill="#555" />
        {/* 오른쪽 모니터 — 터미널 */}
        <rect x="10" y="0" width="8" height="7" rx="0.5" fill="#333" />
        <rect x="10.5" y="0.5" width="7" height="5.5" fill="#1E1E1E" />
        <rect x="11" y="1" width="1" height="0.5" fill="#4CAF50" opacity="0.9" />
        <rect x="12.5" y="1" width="3" height="0.5" fill="#ECEFF1" opacity="0.5" />
        <rect x="11" y="2" width="1" height="0.5" fill="#4CAF50" opacity="0.9" />
        <rect x="12.5" y="2" width="4" height="0.5" fill="#ECEFF1" opacity="0.5" />
        <rect x="11" y="3" width="1" height="0.5" fill="#4CAF50" opacity="0.9" />
        <rect x="12.5" y="3" width="2" height="0.5" fill="#FF5722" opacity="0.6" />
        <rect x="13" y="7" width="2" height="1.5" fill="#444" />
        <rect x="12" y="8.5" width="4" height="0.5" fill="#555" />
        {/* 키보드 */}
        <rect x="3" y="10" width="12" height="2" rx="0.5" fill="#444" />
        <rect x="4" y="10.5" width="10" height="1" fill="#555" />
        <rect x="5" y="10.8" width="3" height="0.4" fill="#666" />
        <rect x="9" y="10.8" width="3" height="0.4" fill="#666" />
      </svg>
    </div>
  );
}

// 에너지 드링크 캔
function PixelEnergyDrink({ x, y }: { x: number; y: number }) {
  return (
    <div className="absolute z-[6]" style={{ left: x, top: y }}>
      <svg width="16" height="28" viewBox="0 0 4 7" style={{ imageRendering: 'pixelated' }}>
        <ellipse cx="2" cy="6.5" rx="1.5" ry="0.5" fill="rgba(0,0,0,0.08)" />
        {/* 캔 */}
        <rect x="0.5" y="1" width="3" height="5" rx="0.5" fill="#1B5E20" />
        <rect x="1" y="1.5" width="2" height="4" fill="#2E7D32" />
        {/* 번개 로고 */}
        <polygon points="2.5,2 1.5,3.5 2.2,3.5 1.5,5 2.8,3.2 2.1,3.2" fill="#FFEB3B" />
        {/* 뚜껑 */}
        <rect x="0.8" y="0.5" width="2.4" height="1" rx="0.5" fill="#C0C0C0" />
        <rect x="1.5" y="0" width="1" height="0.7" fill="#A0A0A0" />
      </svg>
    </div>
  );
}

// 기계식 키보드 (RGB 조명)
function PixelMechKeyboard({ x, y }: { x: number; y: number }) {
  return (
    <div className="absolute z-[5]" style={{ left: x, top: y }}>
      <svg width="56" height="24" viewBox="0 0 14 6" style={{ imageRendering: 'pixelated' }}>
        <ellipse cx="7" cy="5.5" rx="6" ry="1" fill="rgba(0,0,0,0.06)" />
        {/* 키보드 본체 */}
        <rect x="0" y="0" width="14" height="5" rx="0.5" fill="#2C2C2C" />
        <rect x="0.5" y="0.5" width="13" height="4" fill="#333" />
        {/* RGB 키캡 줄 1 */}
        <rect x="1" y="1" width="1" height="1" fill="#E91E63" opacity="0.7" />
        <rect x="2.5" y="1" width="1" height="1" fill="#FF5722" opacity="0.7" />
        <rect x="4" y="1" width="1" height="1" fill="#FFC107" opacity="0.7" />
        <rect x="5.5" y="1" width="1" height="1" fill="#4CAF50" opacity="0.7" />
        <rect x="7" y="1" width="1" height="1" fill="#2196F3" opacity="0.7" />
        <rect x="8.5" y="1" width="1" height="1" fill="#9C27B0" opacity="0.7" />
        <rect x="10" y="1" width="1" height="1" fill="#00BCD4" opacity="0.7" />
        <rect x="11.5" y="1" width="1" height="1" fill="#FF9800" opacity="0.7" />
        {/* 키캡 줄 2 */}
        <rect x="1.5" y="2.5" width="1" height="1" fill="#4CAF50" opacity="0.5" />
        <rect x="3" y="2.5" width="1" height="1" fill="#2196F3" opacity="0.5" />
        <rect x="4.5" y="2.5" width="4" height="1" fill="#666" />
        <rect x="9" y="2.5" width="1" height="1" fill="#E91E63" opacity="0.5" />
        <rect x="10.5" y="2.5" width="1" height="1" fill="#FF5722" opacity="0.5" />
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

// 코르크 게시판 (포스트잇 — postCount 연동, 확대 + 포스트잇 축소)
const POSTIT_SLOTS = [
  { x: 4, y: 3, w: 5, h: 4, fill: '#FDCB6E', top: '#F0B830', pin: { cx: 6, cy: 3, fill: '#E74C3C' } },
  { x: 12, y: 4, w: 5, h: 4, fill: '#FF6B9D', top: '#E05580', pin: { cx: 14, cy: 4, fill: '#3498DB' } },
  { x: 21, y: 3, w: 4.5, h: 3.5, fill: '#74B9FF', top: '#5AA0E8', pin: { cx: 23, cy: 3, fill: '#2ECC71' } },
  { x: 6, y: 13, w: 5, h: 3.5, fill: '#55EFC4', top: '#3DD8A8', pin: null },
  { x: 16, y: 12, w: 6, h: 4, fill: '#FFF3B0', top: '#E8DC98', pin: null },
];

function PixelCorkboard({ x, y, frameColor = '#8B6914', postCount = 0 }: { x: number; y: number; frameColor?: string; postCount?: number }) {
  const slots = Math.min(postCount, POSTIT_SLOTS.length);
  return (
    <div className="absolute z-[5]" style={{ left: x, top: y }}>
      <svg width="140" height="100" viewBox="0 0 35 25" style={{ imageRendering: 'pixelated' }}>
        {/* 프레임 */}
        <rect x="0" y="0" width="35" height="25" fill={frameColor} />
        {/* 코르크 */}
        <rect x="1.5" y="1.5" width="32" height="22" fill="#D4A06E" />
        <rect x="2.5" y="2.5" width="30" height="20" fill="#C4966A" />
        {/* 코르크 질감 */}
        <circle cx="8" cy="8" r="0.5" fill="#B8865A" opacity="0.4" />
        <circle cx="20" cy="15" r="0.4" fill="#B8865A" opacity="0.3" />
        <circle cx="28" cy="7" r="0.3" fill="#B8865A" opacity="0.3" />
        {/* 포스트잇 — postCount만큼 표시 */}
        {Array.from({ length: slots }).map((_, i) => {
          const s = POSTIT_SLOTS[i];
          return (
            <g key={i}>
              <rect x={s.x} y={s.y} width={s.w} height={s.h} fill={s.fill} />
              <rect x={s.x} y={s.y} width={s.w} height={0.8} fill={s.top} />
              {s.pin && <circle cx={s.pin.cx} cy={s.pin.cy} r={0.6} fill={s.pin.fill} />}
            </g>
          );
        })}
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

// ═══ 반응속도방 전용 스프라이트 ═══

// 아케이드 캐비넷
function PixelArcade({ x, y, accent = '#FF6B6B' }: { x: number; y: number; accent?: string }) {
  return (
    <div className="absolute z-[5]" style={{ left: x, top: y }}>
      <svg width="64" height="96" viewBox="0 0 16 24" style={{ imageRendering: 'pixelated' }}>
        <ellipse cx="8" cy="23" rx="6" ry="1.5" fill="rgba(0,0,0,0.12)" />
        {/* 캐비넷 본체 */}
        <rect x="2" y="2" width="12" height="20" rx="1" fill="#1a1a2e" />
        <rect x="1" y="0" width="14" height="3" rx="1" fill={accent} />
        <rect x="3" y="0.5" width="10" height="1" fill="rgba(255,255,255,0.3)" />
        {/* 화면 */}
        <rect x="3" y="4" width="10" height="8" fill="#0a0a1a" />
        <rect x="4" y="5" width="8" height="6" fill="#111133" />
        {/* 화면 내 ⚡ 번개 그래픽 */}
        <rect x="7" y="5" width="2" height="2" fill="#FFD93D" />
        <rect x="6" y="7" width="2" height="1" fill="#FFD93D" />
        <rect x="7" y="8" width="2" height="2" fill="#FFD93D" />
        {/* 화면 스캔라인 */}
        <rect x="4" y="6" width="8" height="0.5" fill="rgba(255,255,255,0.05)" />
        <rect x="4" y="9" width="8" height="0.5" fill="rgba(255,255,255,0.05)" />
        {/* 조이스틱 */}
        <rect x="7" y="13" width="2" height="3" fill="#333" />
        <circle cx="8" cy="13" r="1.2" fill="#E74C3C" />
        {/* 버튼 */}
        <circle cx="5" cy="17" r="1" fill="#FF6B6B" />
        <circle cx="8" cy="17" r="1" fill="#4ECDC4" />
        <circle cx="11" cy="17" r="1" fill="#FFE66D" />
        {/* 코인 슬롯 */}
        <rect x="6" y="19" width="4" height="1" fill="#555" />
        <rect x="7" y="19.2" width="2" height="0.6" fill="#888" />
        {/* 네온 글로우 */}
        <rect x="2" y="2" width="12" height="0.5" fill={accent} opacity="0.4" />
      </svg>
    </div>
  );
}

// 픽셀아트 우체통 (VOC센터용, 48×72 — viewBox 12×18, 4배 스케일)
function PixelMailbox({ x, y }: { x: number; y: number }) {
  return (
    <div className="absolute z-[5]" style={{ left: x, top: y }}>
      <svg width="48" height="72" viewBox="0 0 12 18" style={{ imageRendering: 'pixelated' }}>
        <ellipse cx="6" cy="17.5" rx="3.5" ry="0.8" fill="rgba(0,0,0,0.12)" />
        {/* 기둥/받침대 */}
        <rect x="5" y="10" width="2" height="7" fill="#888" />
        <rect x="4" y="16" width="4" height="1.5" fill="#777" />
        {/* 본체 */}
        <rect x="2" y="3" width="8" height="7" rx="0.5" fill="#E74C3C" />
        <rect x="3" y="4" width="6" height="5" fill="#C0392B" />
        {/* 상단 반원 뚜껑 */}
        <ellipse cx="6" cy="3" rx="4" ry="2" fill="#E74C3C" />
        <ellipse cx="6" cy="3" rx="3.5" ry="1.5" fill="#D63031" />
        {/* 우편 슬롯 */}
        <rect x="3.5" y="6" width="5" height="1" fill="#1a1a2e" />
        <rect x="4" y="6.2" width="4" height="0.6" fill="#333" />
        {/* 전면 장식 라인 */}
        <rect x="3" y="8" width="6" height="0.5" fill="#D63031" />
        {/* 측면 깃발 (오른쪽) */}
        <rect x="10" y="4.5" width="0.8" height="3" fill="#888" />
        <rect x="10" y="4" width="1.5" height="1.5" fill="#E74C3C" />
        <rect x="10.2" y="4.2" width="1" height="1" fill="#FF6B6B" />
        {/* 하이라이트 */}
        <rect x="3" y="4" width="1" height="2" fill="rgba(255,255,255,0.1)" />
      </svg>
    </div>
  );
}

// 픽셀아트 전구 오브젝트 (아이디어보드용, 40×72 — viewBox 10×18, 4배 스케일)
function PixelLightbulb({ x, y }: { x: number; y: number }) {
  return (
    <div className="absolute z-[5]" style={{ left: x, top: y }}>
      <svg width="40" height="72" viewBox="0 0 10 18" style={{ imageRendering: 'pixelated' }}>
        <ellipse cx="5" cy="17.5" rx="2.5" ry="0.8" fill="rgba(0,0,0,0.1)" />
        {/* 받침대/기둥 */}
        <rect x="4.2" y="12.5" width="1.6" height="4.5" fill="#888" />
        <rect x="3.2" y="16.5" width="3.6" height="1" fill="#777" />
        {/* 소켓 */}
        <rect x="3.5" y="11" width="3" height="2" rx="0.3" fill="#A0A0A0" />
        <rect x="3.5" y="11.5" width="3" height="0.5" fill="#888" />
        <rect x="3.5" y="12.5" width="3" height="0.5" fill="#888" />
        {/* 전구 (원형) */}
        <ellipse cx="5" cy="7" rx="3.5" ry="4" fill="#F8B500" />
        <ellipse cx="5" cy="7" rx="3" ry="3.5" fill="#FFD93D" />
        {/* 전구 내부 밝은 영역 */}
        <ellipse cx="5" cy="6.5" rx="2" ry="2.5" fill="#FFEB8A" />
        {/* 필라멘트 */}
        <rect x="4.2" y="5.5" width="0.5" height="2.5" fill="#E6A800" />
        <rect x="5.3" y="5.5" width="0.5" height="2.5" fill="#E6A800" />
        <rect x="4.2" y="6.5" width="1.6" height="0.5" fill="#E6A800" />
        {/* 빛 이펙트 — 주변 작은 선/점 */}
        <rect x="0.5" y="6.5" width="1" height="0.5" fill="#FFD93D" opacity="0.5" />
        <rect x="8.5" y="6.5" width="1" height="0.5" fill="#FFD93D" opacity="0.5" />
        <rect x="4.5" y="1.5" width="1" height="0.8" fill="#FFD93D" opacity="0.5" />
        <rect x="1.5" y="3.5" width="0.8" height="0.5" fill="#FFD93D" opacity="0.4" />
        <rect x="7.7" y="3.5" width="0.8" height="0.5" fill="#FFD93D" opacity="0.4" />
        {/* 하이라이트 */}
        <ellipse cx="4" cy="5.5" rx="0.8" ry="1" fill="rgba(255,255,255,0.15)" />
      </svg>
    </div>
  );
}

// 타이머/스코어보드 전광판
function PixelScoreboard({ x, y }: { x: number; y: number }) {
  return (
    <div className="absolute z-[5]" style={{ left: x, top: y }}>
      <svg width="120" height="56" viewBox="0 0 30 14" style={{ imageRendering: 'pixelated' }}>
        {/* 프레임 */}
        <rect x="0" y="0" width="30" height="12" rx="1" fill="#111" />
        <rect x="0" y="0" width="30" height="1" fill="#333" />
        {/* LED 디스플레이 배경 */}
        <rect x="1" y="1" width="28" height="10" fill="#0a0a0a" />
        {/* 숫자 세그먼트 (00:00) */}
        <rect x="3" y="3" width="4" height="1" fill="#FF3333" opacity="0.9" />
        <rect x="3" y="3" width="1" height="3" fill="#FF3333" opacity="0.9" />
        <rect x="6" y="3" width="1" height="3" fill="#FF3333" opacity="0.9" />
        <rect x="3" y="5.5" width="4" height="1" fill="#FF3333" opacity="0.9" />
        <rect x="3" y="6.5" width="1" height="3" fill="#FF3333" opacity="0.9" />
        <rect x="6" y="6.5" width="1" height="3" fill="#FF3333" opacity="0.9" />
        <rect x="3" y="9" width="4" height="1" fill="#FF3333" opacity="0.9" />
        {/* 콜론 */}
        <circle cx="11" cy="5" r="0.7" fill="#FF3333" />
        <circle cx="11" cy="8" r="0.7" fill="#FF3333" />
        {/* 두번째 숫자 */}
        <rect x="14" y="3" width="4" height="1" fill="#FF3333" opacity="0.9" />
        <rect x="17" y="3" width="1" height="3" fill="#FF3333" opacity="0.9" />
        <rect x="14" y="5.5" width="4" height="1" fill="#FF3333" opacity="0.9" />
        <rect x="14" y="6.5" width="1" height="3" fill="#FF3333" opacity="0.9" />
        <rect x="14" y="9" width="4" height="1" fill="#FF3333" opacity="0.9" />
        {/* BEST 텍스트 영역 */}
        <rect x="21" y="3" width="7" height="3" fill="#111" />
        <rect x="22" y="4" width="2" height="1" fill="#4ECDC4" opacity="0.8" />
        <rect x="25" y="4" width="2" height="1" fill="#4ECDC4" opacity="0.8" />
        <rect x="21" y="7" width="7" height="3" fill="#111" />
        <rect x="22" y="8" width="5" height="1" fill="#FFD93D" opacity="0.8" />
        {/* 마운트 */}
        <rect x="4" y="12" width="3" height="2" fill="#333" />
        <rect x="23" y="12" width="3" height="2" fill="#333" />
      </svg>
    </div>
  );
}

// 반응속도 버저 버튼 (크고 둥근)
function PixelBuzzer({ x, y, color = '#E74C3C' }: { x: number; y: number; color?: string }) {
  return (
    <div className="absolute z-[5]" style={{ left: x, top: y }}>
      <svg width="48" height="40" viewBox="0 0 12 10" style={{ imageRendering: 'pixelated' }}>
        <ellipse cx="6" cy="9" rx="5" ry="1.5" fill="rgba(0,0,0,0.12)" />
        {/* 받침대 */}
        <rect x="2" y="6" width="8" height="3" rx="1" fill="#333" />
        <rect x="2" y="6" width="8" height="1" fill="#444" />
        {/* 버튼 돔 */}
        <ellipse cx="6" cy="5" rx="4" ry="3" fill={color} />
        <ellipse cx="6" cy="4.5" rx="3" ry="2" fill={`${color}dd`} />
        {/* 하이라이트 */}
        <ellipse cx="5" cy="3.5" rx="1.5" ry="1" fill="rgba(255,255,255,0.25)" />
      </svg>
    </div>
  );
}

// 네온 사인 (텍스트)
function PixelNeonSign({ x, y, text, color = '#FF6B6B' }: { x: number; y: number; text: string; color?: string }) {
  return (
    <div className="absolute z-[6] pointer-events-none" style={{ left: x, top: y }}>
      <div style={{
        padding: '3px 8px',
        fontSize: 11,
        fontFamily: "'DungGeunMo', monospace",
        fontWeight: 'bold',
        color,
        textShadow: `0 0 6px ${color}88, 0 0 12px ${color}44`,
        letterSpacing: 1,
        whiteSpace: 'nowrap',
      }}>
        {text}
      </div>
    </div>
  );
}

// ═══ 모임방 전용 스프라이트 ═══

// 바베큐 그릴
function PixelBBQ({ x, y }: { x: number; y: number }) {
  return (
    <div className="absolute z-[5]" style={{ left: x, top: y }}>
      <svg width="64" height="64" viewBox="0 0 16 16" style={{ imageRendering: 'pixelated' }}>
        <ellipse cx="8" cy="15" rx="6" ry="1.5" fill="rgba(0,0,0,0.12)" />
        {/* 다리 */}
        <rect x="3" y="10" width="1" height="5" fill="#555" />
        <rect x="12" y="10" width="1" height="5" fill="#555" />
        {/* 그릴 본체 (둥근 통) */}
        <ellipse cx="8" cy="8" rx="6" ry="3" fill="#2C2C2C" />
        <ellipse cx="8" cy="7" rx="6" ry="3" fill="#3A3A3A" />
        {/* 석쇠 */}
        <rect x="3" y="6" width="10" height="0.5" fill="#888" />
        <rect x="3" y="7.5" width="10" height="0.5" fill="#888" />
        {/* 고기/소시지 */}
        <rect x="4" y="5.5" width="3" height="1.5" rx="0.5" fill="#8B4513" />
        <rect x="8" y="6" width="3" height="1" rx="0.5" fill="#A0522D" />
        {/* 연기 */}
        <circle cx="6" cy="3" r="1" fill="rgba(200,200,200,0.3)" />
        <circle cx="8" cy="2" r="1.2" fill="rgba(200,200,200,0.2)" />
        <circle cx="10" cy="3.5" r="0.8" fill="rgba(200,200,200,0.15)" />
        {/* 손잡이 */}
        <rect x="14" y="7" width="2" height="1" fill="#555" />
      </svg>
    </div>
  );
}

// 덤벨
function PixelDumbbell({ x, y }: { x: number; y: number }) {
  return (
    <div className="absolute z-[5]" style={{ left: x, top: y }}>
      <svg width="56" height="28" viewBox="0 0 14 7" style={{ imageRendering: 'pixelated' }}>
        <ellipse cx="7" cy="6.5" rx="6" ry="1" fill="rgba(0,0,0,0.1)" />
        {/* 왼쪽 원판 */}
        <rect x="0" y="1" width="3" height="5" rx="0.5" fill="#555" />
        <rect x="0" y="1" width="3" height="1" fill="#666" />
        {/* 바 */}
        <rect x="3" y="2.5" width="8" height="2" fill="#999" />
        <rect x="3" y="2.5" width="8" height="0.5" fill="#AAA" />
        {/* 오른쪽 원판 */}
        <rect x="11" y="1" width="3" height="5" rx="0.5" fill="#555" />
        <rect x="11" y="1" width="3" height="1" fill="#666" />
      </svg>
    </div>
  );
}

// 기타
function PixelGuitar({ x, y }: { x: number; y: number }) {
  return (
    <div className="absolute z-[5]" style={{ left: x, top: y }}>
      <svg width="32" height="72" viewBox="0 0 8 18" style={{ imageRendering: 'pixelated' }}>
        {/* 넥 */}
        <rect x="3" y="0" width="2" height="10" fill="#8B6914" />
        <rect x="3.5" y="0" width="1" height="10" fill="#A0792A" />
        {/* 프렛 */}
        <rect x="3" y="2" width="2" height="0.5" fill="#CCC" />
        <rect x="3" y="4" width="2" height="0.5" fill="#CCC" />
        <rect x="3" y="6" width="2" height="0.5" fill="#CCC" />
        {/* 헤드 */}
        <rect x="2" y="0" width="4" height="1.5" rx="0.5" fill="#4A3010" />
        <circle cx="2.5" cy="0.5" r="0.4" fill="#FFD700" />
        <circle cx="5.5" cy="0.5" r="0.4" fill="#FFD700" />
        {/* 바디 */}
        <ellipse cx="4" cy="13" rx="3.5" ry="4" fill="#C0571F" />
        <ellipse cx="4" cy="12.5" rx="3" ry="3.5" fill="#D4702E" />
        {/* 사운드홀 */}
        <ellipse cx="4" cy="13" rx="1.5" ry="1.5" fill="#3A1A0A" />
        {/* 브릿지 */}
        <rect x="3" y="15" width="2" height="0.5" fill="#8B6914" />
        {/* 줄 */}
        <rect x="3.8" y="1" width="0.4" height="15" fill="rgba(200,200,200,0.4)" />
      </svg>
    </div>
  );
}

// 라운드 피크닉 테이블 (야외 느낌)
function PixelPicnicTable({ x, y }: { x: number; y: number }) {
  return (
    <div className="absolute z-[4]" style={{ left: x, top: y }}>
      <svg width="100" height="72" viewBox="0 0 25 18" style={{ imageRendering: 'pixelated' }}>
        <ellipse cx="12.5" cy="17" rx="11" ry="2" fill="rgba(0,0,0,0.1)" />
        {/* 벤치 (양쪽) */}
        <rect x="0" y="11" width="25" height="2" fill="#8B6914" />
        <rect x="0" y="11" width="25" height="0.5" fill="#A07A20" />
        {/* 테이블 상판 */}
        <rect x="3" y="6" width="19" height="3" rx="0.5" fill="#C4A36E" />
        <rect x="3" y="6" width="19" height="1" fill="#D4B87E" />
        {/* 다리 */}
        <rect x="5" y="9" width="2" height="7" fill="#8B7355" />
        <rect x="18" y="9" width="2" height="7" fill="#8B7355" />
        {/* 테이블 위 음식 */}
        <circle cx="9" cy="5.5" r="1.5" fill="#E74C3C" opacity="0.7" />
        <circle cx="16" cy="5.5" r="1.5" fill="#FF9800" opacity="0.7" />
      </svg>
    </div>
  );
}

// 농구공
function PixelBasketball({ x, y }: { x: number; y: number }) {
  return (
    <div className="absolute z-[6]" style={{ left: x, top: y }}>
      <svg width="28" height="28" viewBox="0 0 7 7" style={{ imageRendering: 'pixelated' }}>
        <ellipse cx="3.5" cy="6.5" rx="2.5" ry="0.5" fill="rgba(0,0,0,0.1)" />
        <circle cx="3.5" cy="3.5" r="3" fill="#E87D2E" />
        <circle cx="3.5" cy="3.5" r="2.8" fill="#F4943A" />
        {/* 라인 */}
        <rect x="3.2" y="0.5" width="0.6" height="6" fill="#D06820" />
        <rect x="0.5" y="3.2" width="6" height="0.6" fill="#D06820" />
        {/* 하이라이트 */}
        <circle cx="2.5" cy="2.5" r="1" fill="rgba(255,255,255,0.15)" />
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

// 줄넘기 스프라이트 (두 사람이 줄을 돌리고 가운데서 뛰는 모습)
function PixelJumpRope({ x, y }: { x: number; y: number }) {
  return (
    <div className="absolute z-[4]" style={{ left: x, top: y }}>
      <svg width="140" height="120" viewBox="0 0 35 30" style={{ imageRendering: 'pixelated' }}>
        {/* 바닥 그림자 */}
        <ellipse cx="17.5" cy="28" rx="14" ry="2" fill="rgba(0,0,0,0.12)" />
        {/* 왼쪽 사람 (줄 돌리는) */}
        <circle cx="5" cy="16" r="2.5" fill="#FFE0BD" />
        <rect x="3" y="18" width="4" height="7" rx="1" fill="#E74C3C" />
        <rect x="3" y="25" width="2" height="3" fill="#444" />
        <rect x="5" y="25" width="2" height="3" fill="#444" />
        {/* 오른쪽 사람 (줄 돌리는) */}
        <circle cx="30" cy="16" r="2.5" fill="#FFE0BD" />
        <rect x="28" y="18" width="4" height="7" rx="1" fill="#3498DB" />
        <rect x="28" y="25" width="2" height="3" fill="#444" />
        <rect x="30" y="25" width="2" height="3" fill="#444" />
        {/* 줄 (곡선) */}
        <path d="M 5 17 Q 17.5 4 30 17" stroke="#F8B500" strokeWidth="1" fill="none" strokeLinecap="round" />
        {/* 가운데 점프하는 사람 */}
        <circle cx="17.5" cy="12" r="2.5" fill="#FFE0BD" />
        <rect x="15.5" y="14" width="4" height="6" rx="1" fill="#6C5CE7" />
        <rect x="15.5" y="20" width="2" height="2" fill="#444" />
        <rect x="17.5" y="20" width="2" height="2" fill="#444" />
        {/* 점프 이펙트 */}
        <line x1="14" y1="23" x2="12" y2="25" stroke="#fff" strokeWidth="0.5" opacity="0.5" />
        <line x1="17.5" y1="23" x2="17.5" y2="26" stroke="#fff" strokeWidth="0.5" opacity="0.5" />
        <line x1="21" y1="23" x2="23" y2="25" stroke="#fff" strokeWidth="0.5" opacity="0.5" />
      </svg>
    </div>
  );
}

// ═══ 한화/금융 테마 픽셀 장식 ═══

// 금괴
function PixelGoldBar({ x, y }: { x: number; y: number }) {
  return (
    <div className="absolute z-[6]" style={{ left: x, top: y }}>
      <svg width="48" height="36" viewBox="0 0 12 9" style={{ imageRendering: 'pixelated' }}>
        <ellipse cx="6" cy="8" rx="5" ry="1" fill="rgba(0,0,0,0.1)" />
        <polygon points="2,7 10,7 9,3 3,3" fill="#D4A017" />
        <polygon points="3,3 9,3 8,1 4,1" fill="#F0D060" />
        <rect x="4" y="4" width="4" height="0.5" fill="#F8E878" opacity="0.5" />
        <rect x="5" y="5.5" width="2" height="0.8" fill="#C89A15" opacity="0.4" />
      </svg>
    </div>
  );
}

// 동전 스택
function PixelCoinStack({ x, y }: { x: number; y: number }) {
  return (
    <div className="absolute z-[6]" style={{ left: x, top: y }}>
      <svg width="36" height="48" viewBox="0 0 9 12" style={{ imageRendering: 'pixelated' }}>
        <ellipse cx="4.5" cy="11" rx="4" ry="1" fill="rgba(0,0,0,0.1)" />
        <ellipse cx="4.5" cy="9" rx="3.5" ry="1.5" fill="#C8960F" />
        <ellipse cx="4.5" cy="8.5" rx="3.5" ry="1.5" fill="#E8B830" />
        <ellipse cx="4.5" cy="6.5" rx="3.5" ry="1.5" fill="#C8960F" />
        <ellipse cx="4.5" cy="6" rx="3.5" ry="1.5" fill="#E8B830" />
        <ellipse cx="4.5" cy="4" rx="3.5" ry="1.5" fill="#C8960F" />
        <ellipse cx="4.5" cy="3.5" rx="3.5" ry="1.5" fill="#F0D060" />
        <text x="4.5" y="4.5" textAnchor="middle" fontSize="2.5" fill="#C8960F" fontWeight="bold">₩</text>
      </svg>
    </div>
  );
}

// 한화 태양 심볼
function PixelHanwhaSun({ x, y, size = 44 }: { x: number; y: number; size?: number }) {
  return (
    <div className="absolute z-[6]" style={{ left: x, top: y }}>
      <svg width={size} height={size} viewBox="0 0 11 11" style={{ imageRendering: 'pixelated' }}>
        <rect x="5" y="0" width="1" height="2" fill="#FF8C00" opacity="0.5" />
        <rect x="5" y="9" width="1" height="2" fill="#FF8C00" opacity="0.5" />
        <rect x="0" y="5" width="2" height="1" fill="#FF8C00" opacity="0.5" />
        <rect x="9" y="5" width="2" height="1" fill="#FF8C00" opacity="0.5" />
        <rect x="1.5" y="1.5" width="1.5" height="0.8" fill="#FF8C00" opacity="0.3" />
        <rect x="8" y="1.5" width="1.5" height="0.8" fill="#FF8C00" opacity="0.3" />
        <rect x="1.5" y="8.5" width="1.5" height="0.8" fill="#FF8C00" opacity="0.3" />
        <rect x="8" y="8.5" width="1.5" height="0.8" fill="#FF8C00" opacity="0.3" />
        <circle cx="5.5" cy="5.5" r="3" fill="#FF8C00" />
        <circle cx="5.5" cy="5.5" r="2.5" fill="#FFA500" />
        <circle cx="5.5" cy="5.5" r="1.8" fill="#FFB830" />
        <circle cx="4.5" cy="4.5" r="0.8" fill="rgba(255,255,255,0.2)" />
      </svg>
    </div>
  );
}

// 금고
function PixelSafe({ x, y }: { x: number; y: number }) {
  return (
    <div className="absolute z-[5]" style={{ left: x, top: y }}>
      <svg width="48" height="56" viewBox="0 0 12 14" style={{ imageRendering: 'pixelated' }}>
        <ellipse cx="6" cy="13" rx="5" ry="1.5" fill="rgba(0,0,0,0.1)" />
        <rect x="1" y="1" width="10" height="11" rx="1" fill="#4A4A4A" />
        <rect x="2" y="2" width="8" height="9" fill="#5A5A5A" />
        <rect x="2.5" y="2.5" width="7" height="8" fill="#555" />
        <circle cx="6" cy="6" r="2" fill="#444" />
        <circle cx="6" cy="6" r="1.5" fill="#666" />
        <circle cx="6" cy="6" r="0.5" fill="#888" />
        <rect x="6" y="4.5" width="0.3" height="1.5" fill="#AAA" />
        <rect x="8" y="5" width="1.5" height="2" rx="0.3" fill="#888" />
        <rect x="8" y="5" width="1.5" height="0.5" fill="#999" />
        <rect x="2" y="2" width="1" height="9" fill="rgba(255,255,255,0.05)" />
      </svg>
    </div>
  );
}

// 63빌딩 (생명ITO 랜드마크)
function Pixel63Building({ x, y }: { x: number; y: number }) {
  return (
    <div className="absolute z-[6]" style={{ left: x, top: y }}>
      <svg width="48" height="80" viewBox="0 0 12 20" style={{ imageRendering: 'pixelated' }}>
        <ellipse cx="6" cy="19" rx="5" ry="1" fill="rgba(0,0,0,0.12)" />
        <rect x="3" y="2" width="6" height="16" fill="#3A6B8C" />
        <rect x="2" y="4" width="8" height="14" fill="#4A7D9C" />
        <rect x="5" y="0" width="2" height="3" fill="#5A8DAC" />
        <rect x="5.5" y="0" width="1" height="1" fill="#88B8D0" />
        {[0,1,2,3,4,5,6].map(i => (
          <g key={i}>
            <rect x="3" y={4 + i * 2} width="2.5" height="1.2" fill="#6BAED0" opacity="0.6" />
            <rect x="6.5" y={4 + i * 2} width="2.5" height="1.2" fill="#6BAED0" opacity="0.6" />
          </g>
        ))}
        <rect x="3" y="4" width="1" height="14" fill="rgba(255,255,255,0.08)" />
        <text x="6" y="11" textAnchor="middle" fontSize="3" fill="#FFD700" fontWeight="bold" opacity="0.7">63</text>
      </svg>
    </div>
  );
}

// 한화손보빌딩 (손보ITO 랜드마크)
function PixelInsuranceBuilding({ x, y }: { x: number; y: number }) {
  return (
    <div className="absolute z-[6]" style={{ left: x, top: y }}>
      <svg width="52" height="80" viewBox="0 0 13 20" style={{ imageRendering: 'pixelated' }}>
        <ellipse cx="6.5" cy="19" rx="5.5" ry="1" fill="rgba(0,0,0,0.12)" />
        <rect x="2" y="3" width="9" height="15" fill="#4A5568" />
        <rect x="1" y="5" width="11" height="13" fill="#5A6A7E" />
        <rect x="3" y="1" width="7" height="3" fill="#4A5568" />
        <rect x="4" y="0" width="5" height="2" fill="#5A6A7E" />
        {[0,1,2,3,4,5].map(i => (
          <g key={i}>
            <rect x="2" y={5 + i * 2} width="2" height="1.2" fill="#8AA8C0" opacity="0.5" />
            <rect x="5.5" y={5 + i * 2} width="2" height="1.2" fill="#8AA8C0" opacity="0.5" />
            <rect x="9" y={5 + i * 2} width="2" height="1.2" fill="#8AA8C0" opacity="0.5" />
          </g>
        ))}
        <polygon points="6.5,8 5,9.5 5.3,11.5 6.5,12.5 7.7,11.5 8,9.5" fill="#3498DB" opacity="0.4" />
      </svg>
    </div>
  );
}

// 대형 캔들스틱 차트 (증권ITO 강조)
function PixelCandleChart({ x, y }: { x: number; y: number }) {
  return (
    <div className="absolute z-[6]" style={{ left: x, top: y }}>
      <svg width="56" height="72" viewBox="0 0 14 18" style={{ imageRendering: 'pixelated' }}>
        <rect x="1.5" y="4" width="1" height="2" fill="#00D68F" />
        <rect x="1" y="6" width="2" height="6" fill="#00D68F" />
        <rect x="1.5" y="12" width="1" height="2" fill="#00D68F" />
        <rect x="5.5" y="0" width="1" height="1" fill="#FF4757" />
        <rect x="5" y="1" width="2" height="10" fill="#FF4757" />
        <rect x="5.5" y="11" width="1" height="3" fill="#FF4757" />
        <rect x="9.5" y="2" width="1" height="2" fill="#00D68F" />
        <rect x="9" y="4" width="2" height="8" fill="#00D68F" />
        <rect x="9.5" y="12" width="1" height="3" fill="#00D68F" />
        <line x1="0" y1="15" x2="14" y2="3" stroke="#FFD93D" strokeWidth="0.5" opacity="0.5" />
      </svg>
    </div>
  );
}

// ═══ Zone 바닥 색상 매핑 ═══
const ZONE_FLOOR_COLORS: Record<string, string> = {
  // 팀 룸 Zone
  'lobby': '#4a3d28',   // 따뜻한 나무 바닥
  'kpi': '#1a2a3a',     // 푸른 바닥
  'notice': '#3a2020',  // 다크레드 바닥
  // 광장 Zone
  'voc': '#382038',     // 보라/핑크 톤
  'idea': '#38381e',    // 옐로/올리브 톤
  'gathering': '#1e2a18', // 잔디/야외 톤
  'reaction': '#1a0a20', // 진한 보라/네온 톤
  'omok': '#1a2a1a',    // 녹색 톤
  'jumprope': '#1a1a2e', // 짙은 남색 체육관 톤
};

function getZoneFloorColor(zoneId: string): string {
  for (const [key, color] of Object.entries(ZONE_FLOOR_COLORS)) {
    if (zoneId.includes(key)) return color;
  }
  return '#1a1a1a';
}

// ═══ Room Ground (룸별 바닥 — Zone 영역은 바닥색으로만 구분) ═══
const RoomGround = memo(function RoomGround({ room, theme }: { room: RoomDef; theme: MapTimeTheme }) {
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
          {/* Zone 내부 타일 느낌 — 격자 대신 단일 패턴으로 대체 */}
          <rect
            x={z.x} y={z.y} width={z.width} height={z.height}
            fill="none" rx="6"
            stroke="rgba(255,255,255,0.03)" strokeWidth="0.5"
          />
        </g>
      ))}
    </svg>
  );
});

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

// ═══ 포탈 아치형 문 (CSS animation으로 교체 — SVG animate는 매 프레임 repaint) ═══
const PortalArch = memo(function PortalArch({ room, roomAlerts }: { room: RoomDef; roomAlerts?: RoomAlertMap }) {
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
                <stop offset="0%" stopColor={room.theme.border} stopOpacity="0.45" />
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
            {/* 포탈 안쪽 빛 — 정적 glow */}
            <rect x="20" y="20" width="80" height="48" rx="4" fill={`url(#portal-glow-${p.id})`} />
            <rect x="25" y="25" width="70" height="38" rx="3" fill={room.theme.border} opacity="0.1" />
            {/* 빛 파티클 — 정적 */}
            <circle cx="40" cy="32" r="1.5" fill={room.theme.border} opacity="0.25" />
            <circle cx="70" cy="36" r="1" fill={room.theme.border} opacity="0.2" />
            <circle cx="55" cy="46" r="1.2" fill={room.theme.border} opacity="0.22" />
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
            {roomAlerts?.[p.targetRoom as RoomId] && (
              <span
                className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse"
                style={{ boxShadow: '0 0 6px rgba(239,68,68,.7)' }}
              />
            )}
          </div>
        </div>
      ))}
    </>
  );
});

// ═══ 팀별 픽셀 장식 (증권-캔들차트, 생명-63빌딩, 손보-방패) ═══
function PixelTeamDeco({ x, y, type }: { x: number; y: number; type: 'chart' | 'building63' | 'shield' }) {
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
    building63: (
      <svg width="40" height="56" viewBox="0 0 10 14" style={{ imageRendering: 'pixelated' }}>
        <rect x="3" y="1" width="4" height="12" fill="#4A7D9C" />
        <rect x="2" y="3" width="6" height="10" fill="#5A8DAC" />
        <rect x="4" y="0" width="2" height="2" fill="#6BAED0" />
        {[0,1,2,3,4].map(i => (
          <g key={i}>
            <rect x="3" y={3 + i * 2} width="1.5" height="0.8" fill="#6BAED0" opacity="0.6" />
            <rect x="5.5" y={3 + i * 2} width="1.5" height="0.8" fill="#6BAED0" opacity="0.6" />
          </g>
        ))}
        <text x="5" y="9" textAnchor="middle" fontSize="2.5" fill="#FFD700" fontWeight="bold" opacity="0.6">63</text>
      </svg>
    ),
    shield: (
      <svg width="44" height="52" viewBox="0 0 11 13" style={{ imageRendering: 'pixelated' }}>
        <polygon points="5.5,0 1,2 1,7 5.5,12 10,7 10,2" fill="#2980B9" />
        <polygon points="5.5,1 2,3 2,6.5 5.5,10.5 9,6.5 9,3" fill="#3498DB" />
        <polygon points="5.5,2 3,3.5 3,6 5.5,9 8,6 8,3.5" fill="#5DADE2" />
        <rect x="4" y="4" width="1" height="3" fill="#FFF" opacity="0.7" />
        <rect x="6" y="4" width="1" height="3" fill="#FFF" opacity="0.7" />
        <rect x="4" y="5" width="3" height="1" fill="#FFF" opacity="0.7" />
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
const TeamTownFurniture = memo(function TeamTownFurniture({ teamColor, theme, postCounts }: { teamColor: string; theme: string; postCounts: BoardPostCounts }) {
  const decoType = theme === 'stock' ? 'chart' : theme === 'life' ? 'building63' : 'shield';
  return (
    <>
      {/* ═══ 팀별 픽셀 장식 (곳곳에 배치) ═══ */}
      <PixelTeamDeco x={500} y={70} type={decoType} />
      <PixelTeamDeco x={1100} y={70} type={decoType} />
      <PixelTeamDeco x={600} y={470} type={decoType} />

      {/* ═══ 로비 Zone (60,60 ~ 560,400) — 활기찬 라운지 ═══ */}
      <PixelNeonSign x={200} y={68} text="환영합니다!" color={teamColor} />
      {/* 코르크보드 3장 (공지/VOC/아이디어) */}
      <PixelCorkboard x={80} y={90} frameColor="#E91E63" postCount={Math.min(postCounts.notice ?? 0, 5)} />
      <PixelCorkboard x={240} y={90} frameColor="#FF9800" postCount={Math.min(postCounts.voc ?? 0, 5)} />
      <PixelCorkboard x={400} y={90} frameColor="#6BC5FF" postCount={Math.min(postCounts.idea ?? 0, 5)} />
      {/* 소파 + 라운드 테이블 */}
      <PixelSofa90s x={100} y={210} color={teamColor} />
      <PixelSofa90s x={300} y={210} color={teamColor} />
      <PixelRoundTable x={240} y={280} size={72} />
      {/* 개발자 코너 */}
      <PixelCoffeeMachine x={460} y={220} />
      <PixelRubberDuck x={500} y={310} />
      <PixelPizzaBox x={140} y={350} />
      <PixelEnergyDrink x={100} y={310} />
      <PixelMechKeyboard x={200} y={330} />
      {/* 금융 장식 (나무 대신) */}
      <PixelHanwhaSun x={80} y={370} />
      <PixelGoldBar x={340} y={360} />
      <PixelCoinStack x={480} y={350} />

      {/* ═══ KPI Zone (640,60 ~ 1140,400) — 업무 공간 ═══ */}
      <PixelWhiteboard x={780} y={68} w={180} />
      {/* 책상 2x2 배치 */}
      {[0, 1].map((i) => (
        <span key={`kd1-${i}`}>
          <PixelDesk90s x={690 + i * 200} y={160} />
          <PixelCRT x={720 + i * 200} y={130} />
          <PixelChair90s x={730 + i * 200} y={240} />
        </span>
      ))}
      {[0, 1].map((i) => (
        <span key={`kd2-${i}`}>
          <PixelDesk90s x={690 + i * 200} y={290} />
          <PixelCRT x={720 + i * 200} y={260} />
          <PixelChair90s x={730 + i * 200} y={370} />
        </span>
      ))}
      <PixelFileCabinet x={1060} y={160} />
      <PixelRubberDuck x={660} y={350} />
      {/* KPI 팀별 장식 */}
      {theme === 'stock' && <PixelCandleChart x={1070} y={270} />}
      {theme === 'life' && <Pixel63Building x={1080} y={270} />}
      {theme === 'shield' && <PixelInsuranceBuilding x={1075} y={270} />}
      <PixelCoinStack x={1110} y={170} />

      {/* ═══ 공지 Zone (350,460 ~ 850,760) — 뉴스룸 ═══ */}
      <PixelNeonSign x={530} y={468} text="NEWS!" color="#FFD93D" />
      {/* 컬러풀 게시판 갤러리 */}
      <PixelCorkboard x={380} y={490} frameColor="#E91E63" postCount={Math.min(postCounts.notice ?? 0, 5)} />
      <PixelCorkboard x={540} y={490} frameColor="#FF9800" postCount={Math.min(Math.max((postCounts.notice ?? 0) - 5, 0), 5)} />
      <PixelCorkboard x={700} y={490} frameColor="#6BC5FF" postCount={Math.min(Math.max((postCounts.notice ?? 0) - 10, 0), 5)} />
      {/* 라운드 테이블 + 의자 (소파 대신) */}
      <PixelRoundTable x={430} y={630} size={60} />
      <PixelRoundTable x={620} y={630} size={60} />
      <PixelChair90s x={420} y={700} />
      <PixelChair90s x={530} y={700} />
      <PixelChair90s x={640} y={700} />
      {/* 팀별 랜드마크 (오른쪽) */}
      {theme === 'stock' && <PixelCandleChart x={800} y={580} />}
      {theme === 'life' && <Pixel63Building x={800} y={560} />}
      {theme === 'shield' && <PixelInsuranceBuilding x={800} y={560} />}
      {/* 금융 장식 */}
      <PixelGoldBar x={370} y={730} />
      <PixelHanwhaSun x={760} y={730} size={36} />
      <PixelCatDev x={480} y={730} />
    </>
  );
});

// ═══ 중앙 광장 가구 (1600x1000, 로컬좌표) ═══
const PlazaFurniture = memo(function PlazaFurniture({ postCounts }: { postCounts: BoardPostCounts }) {
  return (
    <>
      {/* ═══ VOC Zone (60,60 ~ 720,440) — 소통 라운지 ═══ */}
      <PixelNeonSign x={300} y={68} text="VOICE!" color="#FF6B9D" />
      {/* 접수 데스크 */}
      <PixelDesk90s x={120} y={140} />
      <PixelDesk90s x={240} y={140} />
      <PixelCRT x={150} y={110} />
      <PixelCRT x={270} y={110} />
      <PixelChair90s x={160} y={220} />
      <PixelChair90s x={280} y={220} />
      {/* 상담 라운지 */}
      <PixelSofa90s x={100} y={300} color="#FF6B9D" />
      <PixelSofa90s x={300} y={300} color="#6C5CE7" />
      <PixelRoundTable x={240} y={370} size={60} />
      {/* 코르크보드 + 편의시설 */}
      <PixelCorkboard x={470} y={100} postCount={Math.min(postCounts.voc ?? 0, 5)} />
      <PixelCoffeeMachine x={630} y={140} />
      <PixelMailbox x={630} y={290} />
      <PixelWaterCooler x={530} y={300} />
      {/* 금융 장식 (나무 대신) */}
      <PixelHanwhaSun x={80} y={80} />
      <PixelCoinStack x={660} y={380} />
      <PixelGoldBar x={500} y={390} />
      <PixelBasketball x={660} y={100} />

      {/* ═══ 아이디어 Zone (860,60 ~ 1520,440) — 크리에이티브 스튜디오 ═══ */}
      <PixelNeonSign x={1050} y={68} text="IDEA!" color="#FFD93D" />
      <PixelNeonSign x={1300} y={68} text="WOW!" color="#4ECDC4" />
      {/* 브레인스토밍 테이블 */}
      <PixelRoundTable x={920} y={160} size={80} />
      <PixelRoundTable x={1100} y={160} size={80} />
      <PixelRoundTable x={1020} y={310} size={80} />
      <PixelChair90s x={900} y={240} />
      <PixelChair90s x={1000} y={200} />
      <PixelChair90s x={1080} y={240} />
      <PixelChair90s x={1180} y={200} />
      <PixelChair90s x={1000} y={380} />
      <PixelChair90s x={1100} y={360} />
      {/* 아이디어 벽 — 코르크보드 */}
      <PixelCorkboard x={1350} y={120} postCount={Math.min(postCounts.idea ?? 0, 5)} />
      <PixelCorkboard x={1350} y={250} postCount={Math.min(Math.max((postCounts.idea ?? 0) - 5, 0), 5)} />
      {/* 영감 코너 */}
      <PixelGuitar x={1400} y={370} />
      <PixelLightbulb x={860} y={300} />
      {/* 편의 + 금융 장식 */}
      <PixelSofa90s x={1200} y={340} color="#F8B500" />
      <PixelDualMonitor x={860} y={140} />
      <PixelHanwhaSun x={1440} y={80} />
      <PixelSafe x={1440} y={370} />
      <PixelGoldBar x={860} y={390} />

      {/* ═══ 모임방 Zone (60,520 ~ 520,820) — 취미/사교 공간 ═══ */}
      {/* 코르크보드 */}
      <PixelCorkboard x={80} y={530} frameColor="#2ECC71" postCount={Math.min(postCounts.gathering ?? 0, 5)} />
      {/* 피크닉 테이블 */}
      <PixelPicnicTable x={100} y={650} />
      <PixelPicnicTable x={280} y={650} />
      {/* 바베큐 */}
      <PixelBBQ x={380} y={540} />
      {/* 운동/취미 소품 */}
      <PixelDumbbell x={80} y={760} />
      <PixelBasketball x={160} y={770} />
      <PixelGuitar x={240} y={740} />
      {/* 소파 + 간식 */}
      <PixelSofa90s x={300} y={760} color="#6B8E23" />
      <PixelPizzaBox x={460} y={650} />
      <PixelCatDev x={460} y={720} color="#8D6E63" />
      {/* 금융 장식 (나무 대신) */}
      <PixelHanwhaSun x={440} y={540} size={36} />
      <PixelCoinStack x={480} y={760} />
      <PixelPlant90s x={80} y={780} size="small" />

      {/* ═══ 반응속도 Zone (520,490 ~ 790,770) — 게임 아케이드 ═══ */}
      <PixelNeonSign x={590} y={495} text="⚡ 반응속도" color="#FFD93D" />
      <PixelScoreboard x={595} y={520} />
      <PixelArcade x={535} y={590} accent="#FF6B6B" />
      <PixelArcade x={710} y={590} accent="#4ECDC4" />
      <PixelBuzzer x={635} y={630} color="#E74C3C" />
      <PixelNeonSign x={640} y={600} text="READY?" color="#FF6B6B" />
      <PixelSofa90s x={580} y={730} color="#6C5CE7" />
      <PixelGoldBar x={730} y={720} />

      {/* ═══ 오목 Zone (810,490 ~ 1080,770) ═══ */}
      <PixelOmokTable x={870} y={570} />
      <PixelChair90s x={850} y={550} />
      <PixelChair90s x={990} y={550} />
      <PixelChair90s x={850} y={710} />
      <PixelChair90s x={990} y={710} />
      <PixelHanwhaSun x={830} y={530} size={36} />
      <PixelCoinStack x={1050} y={730} />

      {/* ═══ 줄넘기 Zone (1100,490 ~ 1370,770) — 체육관 ═══ */}
      <PixelJumpRope x={1160} y={560} />
      <PixelNeonSign x={1160} y={520} text="JUMP!" color="#4ECDC4" />
      <PixelScoreboard x={1120} y={520} />
      <PixelDumbbell x={1320} y={560} />
      <PixelSofa90s x={1120} y={730} color="#2ecc71" />
      <PixelSafe x={1340} y={720} />

      {/* ═══ 바나프레소 Zone (1390,530 ~ 1560,730) — 운세 카페 ═══ */}
      <PixelCoffeeMachine x={1410} y={560} />
      <PixelNeonSign x={1410} y={540} text="CAFE" color="#F59E0B" />
      <PixelRoundTable x={1450} y={640} size={48} />
      <PixelChair90s x={1430} y={680} />
      <PixelPlant90s x={1530} y={680} size="small" />

      {/* 광장 금융 장식 */}
      <PixelHanwhaSun x={1420} y={880} />
      <PixelGoldBar x={100} y={900} />
      <PixelCoinStack x={750} y={880} />
    </>
  );
});

// ═══ Main MapCanvas ═══
interface MapCanvasProps {
  children?: ReactNode;
  roomAlerts?: RoomAlertMap;
}

export default function MapCanvas({ children, roomAlerts }: MapCanvasProps) {
  const theme = useMemo(() => getMapTimeTheme(), []);
  const currentRoom = useMetaverseStore((s) => s.currentRoom);
  const setMoveTarget = useMetaverseStore((s) => s.setMoveTarget);
  const room = ROOMS_DATA[currentRoom];
  const { w: mapW, h: mapH } = room.mapSize;
  const postCounts = useBoardPosts();

  const themeKey = room.team
    ? (room.id === 'stock' ? 'stock' : room.id === 'life' ? 'life' : 'shield')
    : '';

  const handleMapClick = useCallback((e: MouseEvent<HTMLDivElement>) => {
    // 버튼/링크 등 interactive 요소 클릭 시 무시
    const target = e.target as HTMLElement;
    if (target.closest('button, a, [role="button"]')) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMoveTarget({ x: x - 17, y: y - 23 }); // 캐릭터 중심 보정
  }, [setMoveTarget]);

  return (
    <div className="absolute cursor-pointer" style={{ width: mapW, height: mapH }} onClick={handleMapClick}>
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
        <TeamTownFurniture teamColor={room.theme.main} theme={themeKey} postCounts={postCounts} />
      ) : (
        <PlazaFurniture postCounts={postCounts} />
      )}

      {/* 포탈 아치형 문 */}
      <PortalArch room={room} roomAlerts={roomAlerts} />

      {/* 미션/비전 바닥 슬로건 (중앙 광장 전용) */}
      {!room.team && (
        <div
          className="absolute pointer-events-none select-none z-[2]"
          style={{
            left: '50%',
            top: 950,
            transform: 'translateX(-50%)',
            textAlign: 'center',
            whiteSpace: 'nowrap',
          }}
        >
          <div style={{ opacity: 0.35, marginBottom: 6, letterSpacing: 3, fontSize: 10, color: '#C4A36E', fontFamily: "'DungGeunMo', monospace" }}>
            ━━━━━ ◆ ━━━━━
          </div>
          <div style={{
            color: '#E8D5A8',
            fontSize: 15,
            letterSpacing: 3,
            fontFamily: "'DungGeunMo', 'Galmuri11', monospace",
            fontWeight: 'bold',
            opacity: 0.5,
            textShadow: '0 1px 4px rgba(0,0,0,0.6), 0 0 8px rgba(0,0,0,0.3)',
            marginBottom: 5,
          }}>
            초지능 · 초융합 · 초연결 기술로 인류를 더 풍요롭고 안전하게
          </div>
          <div style={{
            color: '#D4C4A0',
            fontSize: 11,
            letterSpacing: 2,
            fontFamily: "'DungGeunMo', 'Galmuri11', monospace",
            opacity: 0.4,
            textShadow: '0 1px 3px rgba(0,0,0,0.5)',
          }}>
            고객사 디지털 전환의 핵심 파트너 — 2030 Global Value Creation Partner
          </div>
          <div style={{ opacity: 0.35, marginTop: 6, letterSpacing: 3, fontSize: 10, color: '#C4A36E', fontFamily: "'DungGeunMo', monospace" }}>
            ━━━━━ ◆ ━━━━━
          </div>
        </div>
      )}

      {children}
    </div>
  );
}
