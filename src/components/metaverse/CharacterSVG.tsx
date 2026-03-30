interface CharacterSVGProps {
  color: string;
  skinColor?: string;
  hairColor?: string;
  size?: number;
}

export default function CharacterSVG({
  color,
  skinColor = '#FFE0BD',
  hairColor = '#5a3e28',
  size = 32,
}: CharacterSVGProps) {
  const height = Math.round(size * 1.35);

  return (
    <svg width={size} height={height} viewBox="0 0 32 43">
      {/* 그림자 */}
      <ellipse cx="16" cy="40" rx="10" ry="3" fill="rgba(0,0,0,.15)" />
      {/* 몸통 */}
      <rect x="7" y="22" width="18" height="15" rx="5" fill={color} />
      {/* 다리 */}
      <rect x="11" y="35" width="4" height="6" rx="2" fill="#555" />
      <rect x="17" y="35" width="4" height="6" rx="2" fill="#555" />
      {/* 신발 */}
      <rect x="10" y="39" width="5" height="3" rx="1.5" fill={color} />
      <rect x="17" y="39" width="5" height="3" rx="1.5" fill={color} />
      {/* 머리 */}
      <circle cx="16" cy="14" r="10" fill={skinColor} />
      {/* 머리카락 */}
      <ellipse cx="16" cy="7" rx="10" ry="6" fill={hairColor} />
      <ellipse cx="6.5" cy="10" rx="3" ry="5" fill={hairColor} />
      <ellipse cx="25.5" cy="10" rx="3" ry="5" fill={hairColor} />
      {/* 눈 */}
      <circle cx="12" cy="14" r="2" fill="#333" />
      <circle cx="20" cy="14" r="2" fill="#333" />
      {/* 눈 하이라이트 */}
      <circle cx="12.7" cy="13.4" r="0.8" fill="#fff" />
      <circle cx="20.7" cy="13.4" r="0.8" fill="#fff" />
      {/* 입 */}
      <path d="M13,18 Q16,20.5 19,18" stroke="#333" strokeWidth="1.2" fill="none" />
      {/* 볼터치 */}
      <ellipse cx="8" cy="16" rx="2.5" ry="1.5" fill="#FFB3B3" opacity="0.35" />
      <ellipse cx="24" cy="16" rx="2.5" ry="1.5" fill="#FFB3B3" opacity="0.35" />
    </svg>
  );
}
