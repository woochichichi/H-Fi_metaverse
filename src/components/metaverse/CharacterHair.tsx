import type { HairStyle } from '../../lib/constants';

interface Props {
  style: HairStyle;
  color: string;
}

/** 헤어스타일별 픽셀 패턴 (16x20 grid 기준) */
export default function CharacterHair({ style, color }: Props) {
  switch (style) {
    case 'short':
      return (
        <g>
          <rect x="5" y="0" width="6" height="1" fill={color} />
          <rect x="4" y="1" width="8" height="1" fill={color} />
          <rect x="4" y="2" width="1" height="1" fill={color} />
          <rect x="11" y="2" width="1" height="1" fill={color} />
        </g>
      );
    case 'spiky':
      return (
        <g>
          <rect x="5" y="-1" width="1" height="1" fill={color} />
          <rect x="7" y="-2" width="1" height="1" fill={color} />
          <rect x="9" y="-1" width="1" height="1" fill={color} />
          <rect x="5" y="0" width="6" height="1" fill={color} />
          <rect x="4" y="1" width="8" height="1" fill={color} />
          <rect x="4" y="2" width="8" height="1" fill={color} />
          <rect x="4" y="3" width="1" height="2" fill={color} />
          <rect x="11" y="3" width="1" height="2" fill={color} />
        </g>
      );
    case 'long':
      return (
        <g>
          <rect x="5" y="0" width="6" height="1" fill={color} />
          <rect x="4" y="1" width="8" height="1" fill={color} />
          <rect x="4" y="2" width="8" height="1" fill={color} />
          <rect x="4" y="3" width="1" height="2" fill={color} />
          <rect x="11" y="3" width="1" height="2" fill={color} />
          {/* 긴 머리 양 옆 */}
          <rect x="3" y="3" width="1" height="6" fill={color} />
          <rect x="12" y="3" width="1" height="6" fill={color} />
          <rect x="3" y="9" width="1" height="2" fill={color} opacity="0.7" />
          <rect x="12" y="9" width="1" height="2" fill={color} opacity="0.7" />
        </g>
      );
    case 'bob':
      return (
        <g>
          <rect x="5" y="0" width="6" height="1" fill={color} />
          <rect x="4" y="1" width="8" height="1" fill={color} />
          <rect x="4" y="2" width="8" height="1" fill={color} />
          <rect x="4" y="3" width="1" height="2" fill={color} />
          <rect x="11" y="3" width="1" height="2" fill={color} />
          {/* 단발 양 옆 */}
          <rect x="3" y="2" width="1" height="5" fill={color} />
          <rect x="12" y="2" width="1" height="5" fill={color} />
          <rect x="4" y="7" width="1" height="1" fill={color} opacity="0.6" />
          <rect x="11" y="7" width="1" height="1" fill={color} opacity="0.6" />
        </g>
      );
    default: // 'default'
      return (
        <g>
          <rect x="5" y="0" width="6" height="1" fill={color} />
          <rect x="4" y="1" width="8" height="1" fill={color} />
          <rect x="4" y="2" width="8" height="1" fill={color} />
          <rect x="4" y="3" width="1" height="2" fill={color} />
          <rect x="11" y="3" width="1" height="2" fill={color} />
        </g>
      );
  }
}
