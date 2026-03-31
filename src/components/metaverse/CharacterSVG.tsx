import CharacterHair from './CharacterHair';
import CharacterAccessory from './CharacterAccessory';
import CharacterSeason from './CharacterSeason';
import type { HairStyle, Accessory } from '../../lib/constants';

export type Direction = 'left' | 'right';
export type IdleAnim = 'none' | 'tilt' | 'sleep' | 'stretch' | 'dance';

interface CharacterSVGProps {
  color: string;
  skinColor?: string;
  hairColor?: string;
  hairStyle?: HairStyle;
  accessory?: Accessory;
  size?: number;
  direction?: Direction;
  animFrame?: number;      // 0=정지, 1/2=걷기 프레임
  idleAnim?: IdleAnim;
}

/**
 * v6: 8bit 픽셀 캐릭터 (16x20 grid)
 * 좌우 구분 + 걷기 모션 + idle 애니메이션 + 계절 코스튬
 */
export default function CharacterSVG({
  color,
  skinColor = '#FFE0BD',
  hairColor = '#5a3e28',
  hairStyle = 'default',
  accessory = 'none',
  size = 32,
  direction = 'right',
  animFrame = 0,
  idleAnim = 'none',
}: CharacterSVGProps) {
  const height = Math.round(size * 1.25);
  const legColor = '#444';
  const flip = direction === 'left';

  // idle 애니메이션별 변환
  let idleTransform = '';
  let eyeOverride: React.ReactNode = null;
  let armOverride: React.ReactNode = null;

  switch (idleAnim) {
    case 'tilt':
      idleTransform = 'rotate(-8 8 10)';
      break;
    case 'sleep':
      // 눈 감기 (눈을 가로줄로)
      eyeOverride = (
        <>
          <rect x="6" y="5" width="1" height="1" fill={skinColor} />
          <rect x="9" y="5" width="1" height="1" fill={skinColor} />
          <rect x="5.5" y="5.5" width="2" height="0.3" fill="#222" />
          <rect x="8.5" y="5.5" width="2" height="0.3" fill="#222" />
        </>
      );
      break;
    case 'stretch':
      // 양팔 위로
      armOverride = (
        <>
          <rect x="2" y="8" width="1" height="1" fill={skinColor} />
          <rect x="3" y="9" width="1" height="1" fill={skinColor} />
          <rect x="12" y="9" width="1" height="1" fill={skinColor} />
          <rect x="13" y="8" width="1" height="1" fill={skinColor} />
        </>
      );
      break;
    case 'dance':
      // 댄스: 한 팔 위 한 팔 옆 (프레임으로 교대는 PlayerCharacter에서)
      armOverride = (
        <>
          <rect x="2" y="8" width="1" height="1" fill={skinColor} />
          <rect x="3" y="9" width="1" height="1" fill={skinColor} />
          <rect x="12" y="12" width="1" height="1" fill={skinColor} />
          <rect x="13" y="11" width="1" height="1" fill={skinColor} />
        </>
      );
      break;
  }

  // 걷기 프레임별 다리/손 위치
  const legs = (() => {
    if (animFrame === 1) {
      return (
        <>
          {/* 왼발 앞, 오른발 뒤 */}
          <rect x="4" y="15" width="2" height="1" fill={legColor} />
          <rect x="4" y="16" width="2" height="1" fill={legColor} />
          <rect x="4" y="17" width="3" height="1" fill={color} />
          <rect x="10" y="15" width="2" height="1" fill={legColor} />
          <rect x="10" y="16" width="2" height="1" fill={legColor} />
          <rect x="9" y="17" width="3" height="1" fill={color} />
        </>
      );
    }
    if (animFrame === 2) {
      return (
        <>
          {/* 오른발 앞, 왼발 뒤 */}
          <rect x="6" y="15" width="2" height="1" fill={legColor} />
          <rect x="6" y="16" width="2" height="1" fill={legColor} />
          <rect x="5" y="17" width="3" height="1" fill={color} />
          <rect x="8" y="15" width="2" height="1" fill={legColor} />
          <rect x="8" y="16" width="2" height="1" fill={legColor} />
          <rect x="8" y="17" width="3" height="1" fill={color} />
        </>
      );
    }
    // 정지 (기본)
    return (
      <>
        <rect x="5" y="15" width="2" height="1" fill={legColor} />
        <rect x="9" y="15" width="2" height="1" fill={legColor} />
        <rect x="5" y="16" width="2" height="1" fill={legColor} />
        <rect x="9" y="16" width="2" height="1" fill={legColor} />
        <rect x="4" y="17" width="3" height="1" fill={color} />
        <rect x="9" y="17" width="3" height="1" fill={color} />
      </>
    );
  })();

  // 걷기 시 손 흔들기
  const hands = (() => {
    if (idleAnim === 'stretch' || idleAnim === 'dance') return armOverride;
    if (animFrame === 1) {
      return (
        <>
          <rect x="2" y="13" width="1" height="1" fill={skinColor} />
          <rect x="13" y="11" width="1" height="1" fill={skinColor} />
        </>
      );
    }
    if (animFrame === 2) {
      return (
        <>
          <rect x="2" y="11" width="1" height="1" fill={skinColor} />
          <rect x="13" y="13" width="1" height="1" fill={skinColor} />
        </>
      );
    }
    // 정지
    return (
      <>
        <rect x="3" y="12" width="1" height="1" fill={skinColor} />
        <rect x="12" y="12" width="1" height="1" fill={skinColor} />
      </>
    );
  })();

  return (
    <svg
      width={size}
      height={height}
      viewBox="0 -3 16 23"
      style={{
        imageRendering: 'pixelated',
        transform: flip ? 'scaleX(-1)' : undefined,
      }}
    >
      <g transform={idleTransform}>
        {/* 그림자 */}
        <rect x="4" y="19" width="8" height="1" fill="rgba(0,0,0,.2)" />

        {/* ── 머리카락 ── */}
        <CharacterHair style={hairStyle} color={hairColor} />

        {/* ── 얼굴 (row 3-7) ── */}
        <rect x="5" y="3" width="6" height="1" fill={skinColor} />
        <rect x="5" y="4" width="6" height="1" fill={skinColor} />

        {/* row 5 — 눈 */}
        {idleAnim === 'sleep' ? eyeOverride : (
          <>
            <rect x="5" y="5" width="1" height="1" fill={skinColor} />
            <rect x="6" y="5" width="1" height="1" fill="#222" />
            <rect x="7" y="5" width="2" height="1" fill={skinColor} />
            <rect x="9" y="5" width="1" height="1" fill="#222" />
            <rect x="10" y="5" width="1" height="1" fill={skinColor} />
          </>
        )}

        {/* row 6 — 볼 */}
        <rect x="5" y="6" width="1" height="1" fill="#FFB3B3" opacity="0.6" />
        <rect x="6" y="6" width="4" height="1" fill={skinColor} />
        <rect x="10" y="6" width="1" height="1" fill="#FFB3B3" opacity="0.6" />

        {/* row 7 — 입 */}
        {idleAnim === 'sleep' ? (
          // 졸 때 입 — 작은 o
          <>
            <rect x="5" y="7" width="2" height="1" fill={skinColor} />
            <rect x="7" y="7" width="1" height="1" fill="#c47070" />
            <rect x="8" y="7" width="3" height="1" fill={skinColor} />
          </>
        ) : (
          <>
            <rect x="5" y="7" width="2" height="1" fill={skinColor} />
            <rect x="7" y="7" width="2" height="1" fill="#c47070" />
            <rect x="9" y="7" width="2" height="1" fill={skinColor} />
          </>
        )}

        {/* ── 목 (row 8) ── */}
        <rect x="7" y="8" width="2" height="1" fill={skinColor} />

        {/* ── 몸통 (row 9-14) ── */}
        <rect x="4" y="9" width="8" height="1" fill={color} />
        <rect x="3" y="10" width="10" height="1" fill={color} />
        <rect x="3" y="11" width="10" height="1" fill={color} />
        <rect x="4" y="12" width="8" height="1" fill={color} />
        <rect x="5" y="13" width="6" height="1" fill={color} />
        <rect x="5" y="14" width="6" height="1" fill={color} />

        {/* ── 손 ── */}
        {hands}

        {/* ── 다리 + 신발 ── */}
        {legs}

        {/* ── 계절 코스튬 (최상위) ── */}
        <CharacterSeason accessory={accessory} />

        {/* ── 액세서리 (최상위 레이어) ── */}
        <CharacterAccessory type={accessory} />

        {/* ── idle: 졸기 Zzz ── */}
        {idleAnim === 'sleep' && (
          <g opacity="0.7">
            <text x="13" y="1" fontSize="2.5" fill="#aaa" fontFamily="monospace">z</text>
            <text x="14.5" y="-1" fontSize="2" fill="#888" fontFamily="monospace">z</text>
          </g>
        )}
      </g>
    </svg>
  );
}
