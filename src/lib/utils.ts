import { ALLOWED_EMAIL_DOMAINS } from './constants';

/** 날짜를 'YYYY-MM-DD' 형식으로 변환 */
export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

/** 상대 시간 표시 (예: '3시간 전') */
export function formatRelativeTime(date: string | Date): string {
  const now = Date.now();
  const target = new Date(date).getTime();
  const diff = now - target;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}일 전`;
  return formatDate(date);
}

/** 파일 크기 포맷 (예: '2.5MB') */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

/** 이메일 도메인 검증 */
export function isAllowedEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase();
  return ALLOWED_EMAIL_DOMAINS.some((d) => domain === d);
}

/** 별명 기반 표시명 반환 — 관리자는 "별명(실명)" 형식 */
export function getDisplayName(
  profile: { nickname?: string | null; name: string },
  viewerIsAdmin = false,
): string {
  const nick = profile.nickname || profile.name;
  if (viewerIsAdmin && profile.nickname) {
    return `${profile.nickname}(${profile.name})`;
  }
  return nick;
}

/** Supabase 쿼리 타임아웃 래퍼 (기본 8초) */
export function withTimeout<T>(promise: PromiseLike<T>, ms = 8000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('요청 시간이 초과되었습니다. 다시 시도해주세요')), ms)
    ),
  ]);
}

/** 초대 코드 생성 (8자리 숫자) */
export function generateInviteCode(): string {
  return String(Math.floor(10000000 + Math.random() * 90000000));
}

/** 시간대별 맵 테마 — 아침/낮/저녁/밤 */
export type TimeOfDay = 'morning' | 'day' | 'evening' | 'night';

export interface MapTimeTheme {
  timeOfDay: TimeOfDay;
  /** 맵 외곽 배경색 (MetaverseLayout) */
  outerBg: string;
  /** 잔디 주 색상 */
  grass: string;
  /** 잔디 어두운 점 */
  grassDark: string;
  /** 잔디 밝은 점 */
  grassLight: string;
  /** 하늘 그라디언트 오버레이 (SVG) */
  skyGradient: [string, string, string];
  /** 오버레이 투명도 */
  skyOpacity: number;
  /** 도로 색상 */
  pathTile: string;
  pathTileAlt: string;
}

export function getMapTimeTheme(): MapTimeTheme {
  const hour = new Date().getHours();

  // 06~10 아침: 화사한 골드빛
  if (hour >= 6 && hour < 10) {
    return {
      timeOfDay: 'morning',
      outerBg: '#7a9a6a',
      grass: '#6a8f5a',
      grassDark: '#5a7f4a',
      grassLight: '#7da06d',
      skyGradient: ['#FFD89B', '#FFECD2', '#fff8e8'],
      skyOpacity: 0.18,
      pathTile: '#d4c8a8',
      pathTileAlt: '#ddd0b0',
    };
  }
  // 10~16 낮: 밝고 맑은 하늘
  if (hour >= 10 && hour < 16) {
    return {
      timeOfDay: 'day',
      outerBg: '#6b8f71',
      grass: '#5a7a5a',
      grassDark: '#4d6d4d',
      grassLight: '#6b8a6b',
      skyGradient: ['#87CEEB', '#B0E2FF', '#e8f4fd'],
      skyOpacity: 0.12,
      pathTile: '#c8c0b0',
      pathTileAlt: '#ccc4b4',
    };
  }
  // 16~20 저녁: 노을
  if (hour >= 16 && hour < 20) {
    return {
      timeOfDay: 'evening',
      outerBg: '#6a6050',
      grass: '#5a6a4a',
      grassDark: '#4d5d3d',
      grassLight: '#6a7a5a',
      skyGradient: ['#E8725C', '#F4A58A', '#FFD4A0'],
      skyOpacity: 0.22,
      pathTile: '#c4b8a0',
      pathTileAlt: '#ccbca6',
    };
  }
  // 20~06 밤: 깊은 어둠 + 별빛
  return {
    timeOfDay: 'night',
    outerBg: '#2a3a2e',
    grass: '#3a4a3a',
    grassDark: '#2d3d2d',
    grassLight: '#445544',
    skyGradient: ['#1a1a3e', '#2a2a4e', '#1e2d4a'],
    skyOpacity: 0.25,
    pathTile: '#8a8478',
    pathTileAlt: '#8e887c',
  };
}
