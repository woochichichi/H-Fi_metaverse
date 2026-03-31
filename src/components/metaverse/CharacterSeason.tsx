import type { Accessory } from '../../lib/constants';

interface Props {
  accessory?: Accessory;
}

/**
 * 계절 코스튬 오버레이 (16x20 grid 기준)
 * 현재 월 기반 자동 적용 — 봄(벚꽃), 여름(태양), 가을(단풍), 겨울(산타모자)
 */
function getSeason(): 'spring' | 'summer' | 'autumn' | 'winter' {
  const m = new Date().getMonth() + 1;
  if (m >= 3 && m <= 5) return 'spring';
  if (m >= 6 && m <= 8) return 'summer';
  if (m >= 9 && m <= 11) return 'autumn';
  return 'winter';
}

export default function CharacterSeason({ accessory = 'none' }: Props) {
  const season = getSeason();

  switch (season) {
    case 'spring':
      return (
        <g opacity="0.85">
          <rect x="12" y="-1" width="1" height="1" fill="#FFB7C5" />
          <rect x="13" y="0" width="1" height="1" fill="#FFD1DC" />
          <rect x="11" y="-2" width="1" height="1" fill="#FFD1DC" opacity="0.6" />
        </g>
      );
    case 'summer':
      return (
        <g opacity="0.8">
          <rect x="12" y="-2" width="2" height="2" fill="#FFD700" rx="1" />
          <rect x="13" y="-3" width="1" height="1" fill="#FFD700" opacity="0.5" />
          <rect x="14" y="-1" width="1" height="1" fill="#FFD700" opacity="0.5" />
          <rect x="11" y="-1" width="1" height="1" fill="#FFD700" opacity="0.5" />
        </g>
      );
    case 'autumn':
      return (
        <g opacity="0.85">
          <rect x="12" y="-1" width="1" height="1" fill="#E67E22" />
          <rect x="13" y="0" width="1" height="1" fill="#D35400" />
          <rect x="11" y="0" width="1" height="1" fill="#F39C12" opacity="0.6" />
        </g>
      );
    case 'winter':
      // cap/crown 착용 시 산타모자 생략 (시각 충돌 방지)
      if (accessory === 'cap' || accessory === 'crown') return null;
      // viewBox y최소=-3에 맞춘 산타모자 (4행)
      return (
        <g>
          {/* 폼폼 */}
          <rect x="9" y="-3" width="2" height="1" fill="#fff" />
          {/* 모자 꼭대기 */}
          <rect x="6" y="-2" width="5" height="1" fill="#C0392B" />
          {/* 모자 본체 */}
          <rect x="4" y="-1" width="8" height="1" fill="#E74C3C" />
          {/* 모자 챙 */}
          <rect x="3" y="0" width="10" height="1" fill="#fff" opacity="0.9" />
        </g>
      );
  }
}
