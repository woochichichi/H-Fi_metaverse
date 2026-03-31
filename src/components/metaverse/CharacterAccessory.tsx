import type { Accessory } from '../../lib/constants';

interface Props {
  type: Accessory;
}

/** 액세서리 픽셀 오버레이 (16x20 grid 기준) */
export default function CharacterAccessory({ type }: Props) {
  switch (type) {
    case 'glasses':
      return (
        <g>
          <rect x="5" y="5" width="2" height="1" fill="#333" opacity="0.8" />
          <rect x="8" y="5" width="2" height="1" fill="#333" opacity="0.8" />
          <rect x="7" y="5" width="1" height="1" fill="#555" opacity="0.6" />
        </g>
      );
    case 'sunglasses':
      return (
        <g>
          <rect x="5" y="5" width="2" height="1" fill="#111" />
          <rect x="8" y="5" width="2" height="1" fill="#111" />
          <rect x="7" y="5" width="1" height="1" fill="#333" />
        </g>
      );
    case 'cap':
      return (
        <g>
          <rect x="3" y="0" width="10" height="1" fill="#E74C3C" />
          <rect x="4" y="-1" width="8" height="1" fill="#E74C3C" />
          <rect x="5" y="-2" width="6" height="1" fill="#C0392B" />
        </g>
      );
    case 'headband':
      return (
        <g>
          <rect x="4" y="2" width="8" height="1" fill="#FF69B4" />
          <rect x="11" y="1" width="2" height="1" fill="#FF69B4" />
          <rect x="12" y="0" width="1" height="1" fill="#FF69B4" />
        </g>
      );
    case 'crown':
      return (
        <g>
          <rect x="4" y="-1" width="8" height="1" fill="#FFD700" />
          <rect x="5" y="-2" width="1" height="1" fill="#FFD700" />
          <rect x="7" y="-2" width="2" height="1" fill="#FFD700" />
          <rect x="10" y="-2" width="1" height="1" fill="#FFD700" />
          <rect x="7" y="-3" width="2" height="1" fill="#FFD700" />
          {/* 보석 */}
          <rect x="6" y="-1" width="1" height="1" fill="#E74C3C" />
          <rect x="9" y="-1" width="1" height="1" fill="#3498DB" />
        </g>
      );
    default:
      return null;
  }
}
