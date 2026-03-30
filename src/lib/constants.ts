// 허용 이메일 도메인
export const ALLOWED_EMAIL_DOMAINS = [
  'hanwha.com',
  'hanwhasystems.com',
  'hanwhalife.com',
  'hanwhagis.com',
  'hanwhageneral.com',
] as const;

// 팀 목록
export const TEAMS = ['증권ITO', '생명ITO', '손보ITO', '한금서'] as const;
export type Team = (typeof TEAMS)[number];

// 유닛 목록
export const UNITS = ['조직', '품질', '전략', 'AX'] as const;
export type Unit = (typeof UNITS)[number];

// 역할
export const ROLES = ['admin', 'leader', 'member'] as const;
export type Role = (typeof ROLES)[number];

// VOC 카테고리
export const VOC_CATEGORIES = ['불편', '요청', '칭찬', '개선', '기타'] as const;
export type VocCategory = (typeof VOC_CATEGORIES)[number];

// VOC 대상 영역
export const VOC_TARGET_AREAS = ['업무환경', '성장', '관계', '기타'] as const;
export type VocTargetArea = (typeof VOC_TARGET_AREAS)[number];

// VOC 상태
export const VOC_STATUSES = ['접수', '검토중', '처리중', '완료', '보류'] as const;
export type VocStatus = (typeof VOC_STATUSES)[number];

// 아이디어 카테고리
export const IDEA_CATEGORIES = ['이벤트', '인적교류', '업무개선', '기타'] as const;
export type IdeaCategory = (typeof IDEA_CATEGORIES)[number];

// 아이디어 상태
export const IDEA_STATUSES = ['제안', '검토', '채택', '진행중', '완료', '반려'] as const;
export type IdeaStatus = (typeof IDEA_STATUSES)[number];

// 공지 시급성
export const URGENCY_LEVELS = ['긴급', '할일', '참고'] as const;
export type UrgencyLevel = (typeof URGENCY_LEVELS)[number];

// 공지 카테고리
export const NOTICE_CATEGORIES = ['일반', '이벤트', '활동보고'] as const;
export type NoticeCategory = (typeof NOTICE_CATEGORIES)[number];

// 쪽지 카테고리
export const NOTE_CATEGORIES = ['건의', '질문', '감사', '불편', '기타'] as const;
export type NoteCategory = (typeof NOTE_CATEGORIES)[number];

// 쪽지 수신 대상
export const NOTE_RECIPIENTS = ['leader', 'admin', 'team_leaders'] as const;
export type NoteRecipient = (typeof NOTE_RECIPIENTS)[number];

// 쪽지 상태
export const NOTE_STATUSES = ['미읽음', '읽음', '답변완료'] as const;
export type NoteStatus = (typeof NOTE_STATUSES)[number];

// 활동 타입
export const ACTIVITY_TYPES = [
  'voc_submit',
  'idea_submit',
  'idea_vote',
  'notice_read',
  'event_join',
  'note_send',
  'exchange_join',
] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number];

// 활동 포인트
export const ACTIVITY_POINTS: Record<ActivityType, number> = {
  voc_submit: 1,
  idea_submit: 1,
  idea_vote: 0.5,
  notice_read: 0.5,
  event_join: 2,
  note_send: 0.5,
  exchange_join: 2,
};

// 프로필 상태
export const PROFILE_STATUSES = ['online', 'offline', '재택'] as const;
export type ProfileStatus = (typeof PROFILE_STATUSES)[number];

// 기분 이모지
export const MOOD_EMOJIS = ['😆', '😊', '😐', '😰', '🤯', '😴', '🔥', '☕'] as const;

// 메타버스 Zone 정의
export const ZONES = [
  { id: 'voc', label: 'VOC', emoji: '📞', x: 100, y: 150, width: 160, height: 120 },
  { id: 'kpi', label: 'KPI', emoji: '📊', x: 320, y: 150, width: 160, height: 120 },
  { id: 'lounge', label: '라운지', emoji: '☕', x: 540, y: 150, width: 160, height: 120 },
  { id: 'idea', label: '아이디어', emoji: '💡', x: 100, y: 330, width: 160, height: 120 },
  { id: 'notice', label: '공지게시판', emoji: '📋', x: 320, y: 330, width: 160, height: 120 },
  { id: 'note', label: '쪽지함', emoji: '✉️', x: 540, y: 330, width: 160, height: 120 },
] as const;
export type ZoneId = (typeof ZONES)[number]['id'];

// 초대 코드 접두사
export const INVITE_CODE_PREFIX = 'FITO';

// 모바일 브레이크포인트
export const MOBILE_BREAKPOINT = 1024;

// 파일 업로드 제한
export const FILE_LIMITS = {
  voc: { maxSize: 5 * 1024 * 1024, maxFiles: 3, accept: ['image/*', 'application/pdf'] },
  notice: { maxSize: 10 * 1024 * 1024, maxFiles: 5, accept: ['image/*', 'application/pdf'] },
  avatar: { maxSize: 2 * 1024 * 1024, maxFiles: 1, accept: ['image/*'] },
} as const;
