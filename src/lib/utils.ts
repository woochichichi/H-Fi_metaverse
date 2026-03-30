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

/** 초대 코드 생성 (8자리 숫자) */
export function generateInviteCode(): string {
  return String(Math.floor(10000000 + Math.random() * 90000000));
}
