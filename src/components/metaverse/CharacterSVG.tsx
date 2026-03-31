import CharacterHair from './CharacterHair';
import CharacterAccessory from './CharacterAccessory';
import type { HairStyle, Accessory } from '../../lib/constants';

interface CharacterSVGProps {
  color: string;
  skinColor?: string;
  hairColor?: string;
  hairStyle?: HairStyle;
  accessory?: Accessory;
  size?: number;
}

/**
 * v5: 8bit 픽셀 캐릭터 (16x20 grid)
 * 헤어스타일·액세서리 커스터마이징 지원
 */
export default function CharacterSVG({
  color,
  skinColor = '#FFE0BD',
  hairColor = '#5a3e28',
  hairStyle = 'default',
  accessory = 'none',
  size = 32,
}: CharacterSVGProps) {
  const height = Math.round(size * 1.25);
  const legColor = '#444';

  return (
    <svg
      width={size}
      height={height}
      viewBox="0 -3 16 23"
      style={{ imageRendering: 'pixelated' }}
    >
      {/* 그림자 */}
      <rect x="4" y="19" width="8" height="1" fill="rgba(0,0,0,.2)" />

      {/* ── 머리카락 ── */}
      <CharacterHair style={hairStyle} color={hairColor} />

      {/* ── 얼굴 (row 3-7) ── */}
      <rect x="5" y="3" width="6" height="1" fill={skinColor} />
      <rect x="5" y="4" width="6" height="1" fill={skinColor} />
      {/* row 5 — 눈 */}
      <rect x="5" y="5" width="1" height="1" fill={skinColor} />
      <rect x="6" y="5" width="1" height="1" fill="#222" />
      <rect x="7" y="5" width="2" height="1" fill={skinColor} />
      <rect x="9" y="5" width="1" height="1" fill="#222" />
      <rect x="10" y="5" width="1" height="1" fill={skinColor} />
      {/* row 6 — 볼 */}
      <rect x="5" y="6" width="1" height="1" fill="#FFB3B3" opacity="0.6" />
      <rect x="6" y="6" width="4" height="1" fill={skinColor} />
      <rect x="10" y="6" width="1" height="1" fill="#FFB3B3" opacity="0.6" />
      {/* row 7 — 입 */}
      <rect x="5" y="7" width="2" height="1" fill={skinColor} />
      <rect x="7" y="7" width="2" height="1" fill="#c47070" />
      <rect x="9" y="7" width="2" height="1" fill={skinColor} />

      {/* ── 목 (row 8) ── */}
      <rect x="7" y="8" width="2" height="1" fill={skinColor} />

      {/* ── 몸통 (row 9-14) ── */}
      <rect x="4" y="9" width="8" height="1" fill={color} />
      <rect x="3" y="10" width="10" height="1" fill={color} />
      <rect x="3" y="11" width="10" height="1" fill={color} />
      {/* row 12 — 손 */}
      <rect x="3" y="12" width="1" height="1" fill={skinColor} />
      <rect x="4" y="12" width="8" height="1" fill={color} />
      <rect x="12" y="12" width="1" height="1" fill={skinColor} />
      <rect x="5" y="13" width="6" height="1" fill={color} />
      <rect x="5" y="14" width="6" height="1" fill={color} />

      {/* ── 다리 (row 15-16) ── */}
      <rect x="5" y="15" width="2" height="1" fill={legColor} />
      <rect x="9" y="15" width="2" height="1" fill={legColor} />
      <rect x="5" y="16" width="2" height="1" fill={legColor} />
      <rect x="9" y="16" width="2" height="1" fill={legColor} />

      {/* ── 신발 (row 17) ── */}
      <rect x="4" y="17" width="3" height="1" fill={color} />
      <rect x="9" y="17" width="3" height="1" fill={color} />

      {/* ── 액세서리 (최상위 레이어) ── */}
      <CharacterAccessory type={accessory} />
    </svg>
  );
}
