// 허용 이메일 도메인
export const ALLOWED_EMAIL_DOMAINS = [
  'hanwha.com',
  'hanwhasystems.com',
  'hanwhalife.com',
  'hanwhagis.com',
  'hanwhageneral.com',
] as const;

// 팀 목록
export const TEAMS = ['증권ITO', '생명ITO', '손보ITO', '한금서', '금융ITO'] as const;
export type Team = (typeof TEAMS)[number];

// 유닛 목록
export const UNITS = ['조직', '품질', '전략', 'AX'] as const;
export type Unit = (typeof UNITS)[number];

// 역할
export const ROLES = ['admin', 'director', 'leader', 'member'] as const;
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

// VOC 심각도 (1~5)
export const VOC_SEVERITY_LEVELS = [1, 2, 3, 4, 5] as const;
export type VocSeverity = (typeof VOC_SEVERITY_LEVELS)[number];
export const VOC_SEVERITY_LABELS: Record<number, string> = {
  1: '매우 낮음',
  2: '낮음',
  3: '보통',
  4: '높음',
  5: '매우 높음',
};

// VOC 카테고리별 세부항목
export const VOC_SUB_CATEGORIES: Record<string, string[]> = {
  '불편': ['시스템 장애', '속도 저하', '사용성 불편', 'UI 오류', '기타'],
  '요청': ['신규 기능', '기능 개선', '권한 요청', '환경 변경', '기타'],
  '칭찬': ['동료 칭찬', '리더 칭찬', '프로세스 칭찬', '기타'],
  '개선': ['프로세스 개선', '커뮤니케이션', '업무 환경', '교육/성장', '기타'],
  '기타': ['기타'],
};

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

// 모임 카테고리
export const GATHERING_CATEGORIES = ['운동', '맛집', '스터디', '취미', '기타'] as const;
export type GatheringCategory = (typeof GATHERING_CATEGORIES)[number];

// 모임 상태
export const GATHERING_STATUSES = ['recruiting', 'closed', 'completed'] as const;
export type GatheringStatus = (typeof GATHERING_STATUSES)[number];

// 모임 상태 한글 라벨
export const GATHERING_STATUS_LABELS: Record<GatheringStatus, string> = {
  recruiting: '모집중',
  closed: '마감',
  completed: '완료',
};

// 활동 타입
export const ACTIVITY_TYPES = [
  'voc_submit',
  'idea_submit',
  'idea_vote',
  'notice_read',
  'event_join',
  'note_send',
  'exchange_join',
  'kudos_send',
  'kudos_receive',
  'team_post',
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
  kudos_send: 0.5,
  kudos_receive: 0.5,
  team_post: 0.5,
};

// 팀 게시판 카테고리
export const TEAM_POST_CATEGORIES = ['자유', '질문', '정보', '잡담'] as const;
export type TeamPostCategory = (typeof TEAM_POST_CATEGORIES)[number];

// 팀별 캐릭터 색상 (메타버스 멀티플레이어)
export const TEAM_COLORS: Record<string, { body: string; hair: string }> = {
  '증권ITO': { body: '#00D68F', hair: '#2d5a3e' },
  '생명ITO': { body: '#6C5CE7', hair: '#3a2870' },
  '손보ITO': { body: '#0984E3', hair: '#1a3a5c' },
  '한금서':  { body: '#F8B500', hair: '#5a4210' },
  '금융ITO': { body: '#FF6348', hair: '#5a2a1e' },
};

// ═══ 캐릭터 커스터마이징 옵션 ═══

export const SKIN_COLORS = [
  { id: 'light',  hex: '#FFE0BD', label: '밝은 피부' },
  { id: 'fair',   hex: '#FFDBB4', label: '살구색' },
  { id: 'medium', hex: '#E8B88A', label: '중간 피부' },
  { id: 'tan',    hex: '#C68642', label: '황갈색' },
  { id: 'dark',   hex: '#8D5524', label: '어두운 피부' },
] as const;

export const HAIR_COLORS = [
  { id: 'black',    hex: '#222222', label: '검정' },
  { id: 'brown',    hex: '#5a3e28', label: '갈색' },
  { id: 'darkbrown',hex: '#3a2010', label: '짙은 갈색' },
  { id: 'blonde',   hex: '#D4A843', label: '금발' },
  { id: 'red',      hex: '#A0522D', label: '적갈색' },
  { id: 'gray',     hex: '#888888', label: '회색' },
  { id: 'blue',     hex: '#4A6FA5', label: '파랑' },
  { id: 'pink',     hex: '#D4789C', label: '핑크' },
] as const;

export const BODY_COLORS = [
  { id: 'purple',  hex: '#6C5CE7', label: '보라' },
  { id: 'green',   hex: '#00D68F', label: '초록' },
  { id: 'blue',    hex: '#0984E3', label: '파랑' },
  { id: 'gold',    hex: '#F8B500', label: '골드' },
  { id: 'red',     hex: '#FF6B6B', label: '빨강' },
  { id: 'pink',    hex: '#FF6B9D', label: '핑크' },
  { id: 'orange',  hex: '#FF9A6B', label: '오렌지' },
  { id: 'teal',    hex: '#6BFFD4', label: '청록' },
  { id: 'navy',    hex: '#2C3E7B', label: '네이비' },
  { id: 'mint',    hex: '#95E86B', label: '민트' },
] as const;

export type HairStyle = 'default' | 'short' | 'spiky' | 'long' | 'bob';
export const HAIR_STYLES: { id: HairStyle; label: string }[] = [
  { id: 'default', label: '기본' },
  { id: 'short',   label: '짧은 머리' },
  { id: 'spiky',   label: '뾰족 머리' },
  { id: 'long',    label: '긴 머리' },
  { id: 'bob',     label: '단발' },
];

export type Accessory = 'none' | 'glasses' | 'sunglasses' | 'cap' | 'headband' | 'crown';
export const ACCESSORIES: { id: Accessory; label: string; emoji: string }[] = [
  { id: 'none',       label: '없음',     emoji: '❌' },
  { id: 'glasses',    label: '안경',     emoji: '👓' },
  { id: 'sunglasses', label: '선글라스',  emoji: '🕶️' },
  { id: 'cap',        label: '모자',     emoji: '🧢' },
  { id: 'headband',   label: '머리띠',   emoji: '🎀' },
  { id: 'crown',      label: '왕관',     emoji: '👑' },
];

export type PetType =
  | 'none' | 'cat' | 'dog' | 'bird' | 'rabbit'
  | 'hamster' | 'turtle' | 'frog' | 'penguin' | 'fox'
  | 'hedgehog' | 'snake' | 'fish' | 'owl' | 'dragon'
  | 'unicorn' | 'slime' | 'bat' | 'panda' | 'duck'
  | 'mushroom' | 'alien' | 'ghost' | 'crab' | 'butterfly';

export const PETS: { id: PetType; label: string; emoji: string }[] = [
  { id: 'none',      label: '없음',     emoji: '❌' },
  { id: 'cat',       label: '고양이',   emoji: '🐱' },
  { id: 'dog',       label: '강아지',   emoji: '🐶' },
  { id: 'bird',      label: '새',       emoji: '🐦' },
  { id: 'rabbit',    label: '토끼',     emoji: '🐰' },
  { id: 'hamster',   label: '햄스터',   emoji: '🐹' },
  { id: 'turtle',    label: '거북이',   emoji: '🐢' },
  { id: 'frog',      label: '개구리',   emoji: '🐸' },
  { id: 'penguin',   label: '펭귄',     emoji: '🐧' },
  { id: 'fox',       label: '여우',     emoji: '🦊' },
  { id: 'hedgehog',  label: '고슴도치', emoji: '🦔' },
  { id: 'snake',     label: '뱀',       emoji: '🐍' },
  { id: 'fish',      label: '물고기',   emoji: '🐠' },
  { id: 'owl',       label: '부엉이',   emoji: '🦉' },
  { id: 'dragon',    label: '드래곤',   emoji: '🐉' },
  { id: 'unicorn',   label: '유니콘',   emoji: '🦄' },
  { id: 'slime',     label: '슬라임',   emoji: '🟢' },
  { id: 'bat',       label: '박쥐',     emoji: '🦇' },
  { id: 'panda',     label: '판다',     emoji: '🐼' },
  { id: 'duck',      label: '오리',     emoji: '🦆' },
  { id: 'mushroom',  label: '버섯',     emoji: '🍄' },
  { id: 'alien',     label: '외계인',   emoji: '👽' },
  { id: 'ghost',     label: '유령',     emoji: '👻' },
  { id: 'crab',      label: '게',       emoji: '🦀' },
  { id: 'butterfly', label: '나비',     emoji: '🦋' },
];

// 프로필 상태
export const PROFILE_STATUSES = ['online', 'offline', '재택', '퇴사'] as const;
export type ProfileStatus = (typeof PROFILE_STATUSES)[number];

// 기분 이모지
export const MOOD_EMOJIS = ['😆', '😊', '😐', '😰', '🤯', '😴', '🔥', '☕'] as const;

// ═══ 팀별 설정 (v4) ═══
/* DEPRECATED: v4 single-map — ROOMS_DATA 사용 권장 */
export const TEAM_CONFIGS = {
  증권ITO: {
    theme: 'stock',
    color: '#00D68F',
    subColor: '#FF4757',
    floor: '#0d2818',
    town: { x: 800, y: 50, w: 800, h: 600 },
    spawn: { x: 1200, y: 300 },
  },
  생명ITO: {
    theme: 'life',
    color: '#6C5CE7',
    subColor: '#FFC312',
    floor: '#1a0d2e',
    town: { x: 50, y: 900, w: 800, h: 600 },
    spawn: { x: 450, y: 1200 },
  },
  손보ITO: {
    theme: 'shield',
    color: '#0984E3',
    subColor: '#FD7272',
    floor: '#0d1a2e',
    town: { x: 1550, y: 900, w: 800, h: 600 },
    spawn: { x: 1950, y: 1200 },
  },
} as const;
export type TeamConfigKey = keyof typeof TEAM_CONFIGS;

/* DEPRECATED: v4 single-map */
export const CENTRAL_PLAZA = { x: 800, y: 650, w: 800, h: 500 } as const;

// ═══ v5 멀티룸 구조 ═══

export type RoomId = 'stock' | 'life' | 'shield' | 'plaza';

export interface PortalDef {
  id: string;
  x: number; y: number; w: number; h: number;
  targetRoom: RoomId;
  spawnPoint: { x: number; y: number };
  label: string;
}

export interface ZoneDef {
  id: string;
  team: string | null;
  label: string;
  emoji: string;
  x: number; y: number;
  width: number; height: number;
}

export interface RoomDef {
  id: RoomId;
  label: string;
  team?: string;
  theme: { main: string; sub: string; floor: string; border: string };
  mapSize: { w: number; h: number };
  spawnPoint: { x: number; y: number };
  zones: ZoneDef[];
  portals: PortalDef[];
  npcTeams: string[];
}

export const ROOMS_DATA: Record<RoomId, RoomDef> = {
  stock: {
    id: 'stock',
    label: '증권ITO',
    team: '증권ITO',
    theme: { main: '#00D68F', sub: '#FF4757', floor: '#0d2818', border: '#00D68F' },
    mapSize: { w: 1200, h: 900 },
    spawnPoint: { x: 600, y: 150 },
    zones: [
      { id: 'stock-lobby', team: '증권ITO', label: '🏠 로비', emoji: '💭', x: 60, y: 60, width: 500, height: 340 },
      { id: 'stock-kpi', team: '증권ITO', label: '📊 KPI', emoji: '📊', x: 640, y: 60, width: 500, height: 340 },
      { id: 'stock-notice', team: '증권ITO', label: '📋 공지', emoji: '📢', x: 350, y: 460, width: 500, height: 300 },
    ],
    portals: [
      {
        id: 'portal-stock-plaza',
        x: 540, y: 830, w: 120, h: 50,
        targetRoom: 'plaza',
        spawnPoint: { x: 100, y: 100 },
        label: '중앙 광장',
      },
    ],
    npcTeams: ['증권ITO'],
  },
  life: {
    id: 'life',
    label: '생명ITO',
    team: '생명ITO',
    theme: { main: '#6C5CE7', sub: '#FFC312', floor: '#1a0d2e', border: '#6C5CE7' },
    mapSize: { w: 1200, h: 900 },
    spawnPoint: { x: 600, y: 150 },
    zones: [
      { id: 'life-lobby', team: '생명ITO', label: '🏠 로비', emoji: '💭', x: 60, y: 60, width: 500, height: 340 },
      { id: 'life-kpi', team: '생명ITO', label: '📊 KPI', emoji: '📊', x: 640, y: 60, width: 500, height: 340 },
      { id: 'life-notice', team: '생명ITO', label: '📋 공지', emoji: '📢', x: 350, y: 460, width: 500, height: 300 },
    ],
    portals: [
      {
        id: 'portal-life-plaza',
        x: 540, y: 830, w: 120, h: 50,
        targetRoom: 'plaza',
        spawnPoint: { x: 100, y: 100 },
        label: '중앙 광장',
      },
    ],
    npcTeams: ['생명ITO'],
  },
  shield: {
    id: 'shield',
    label: '손보ITO',
    team: '손보ITO',
    theme: { main: '#0984E3', sub: '#FD7272', floor: '#0d1a2e', border: '#0984E3' },
    mapSize: { w: 1200, h: 900 },
    spawnPoint: { x: 600, y: 150 },
    zones: [
      { id: 'shield-lobby', team: '손보ITO', label: '🏠 로비', emoji: '💭', x: 60, y: 60, width: 500, height: 340 },
      { id: 'shield-kpi', team: '손보ITO', label: '📊 KPI', emoji: '📊', x: 640, y: 60, width: 500, height: 340 },
      { id: 'shield-notice', team: '손보ITO', label: '📋 공지', emoji: '📢', x: 350, y: 460, width: 500, height: 300 },
    ],
    portals: [
      {
        id: 'portal-shield-plaza',
        x: 540, y: 830, w: 120, h: 50,
        targetRoom: 'plaza',
        spawnPoint: { x: 100, y: 100 },
        label: '중앙 광장',
      },
    ],
    npcTeams: ['손보ITO'],
  },
  plaza: {
    id: 'plaza',
    label: '중앙 광장',
    theme: { main: '#F8B500', sub: '#FFF8E1', floor: '#2a2a1a', border: '#F8B500' },
    mapSize: { w: 1520, h: 1080 },
    spawnPoint: { x: 760, y: 460 },
    zones: [
      { id: 'voc', team: null, label: '📞 VOC 센터', emoji: '📞', x: 60, y: 60, width: 630, height: 360 },
      { id: 'idea', team: null, label: '💡 아이디어 보드', emoji: '💡', x: 820, y: 60, width: 630, height: 360 },
      { id: 'gathering', team: null, label: '🏕 모임방', emoji: '🎉', x: 60, y: 490, width: 420, height: 280 },
      { id: 'reaction', team: null, label: '⚡ 반응속도', emoji: '⚡', x: 520, y: 490, width: 270, height: 280 },
      { id: 'omok', team: null, label: '⚫ 오목', emoji: '⚫', x: 810, y: 490, width: 270, height: 280 },
      { id: 'jumprope', team: null, label: '🪢 줄넘기', emoji: '🪢', x: 1100, y: 490, width: 270, height: 280 },
    ],
    portals: [
      {
        id: 'portal-plaza-stock',
        x: 100, y: 880, w: 110, h: 48,
        targetRoom: 'stock',
        spawnPoint: { x: 100, y: 100 },
        label: '증권ITO',
      },
      {
        id: 'portal-plaza-life',
        x: 680, y: 880, w: 110, h: 48,
        targetRoom: 'life',
        spawnPoint: { x: 100, y: 100 },
        label: '생명ITO',
      },
      {
        id: 'portal-plaza-shield',
        x: 1270, y: 880, w: 110, h: 48,
        targetRoom: 'shield',
        spawnPoint: { x: 100, y: 100 },
        label: '손보ITO',
      },
    ],
    npcTeams: ['한금서'],
  },
};

// 팀 → 룸 매핑
export const TEAM_TO_ROOM: Record<string, RoomId> = {
  '증권ITO': 'stock',
  '생명ITO': 'life',
  '손보ITO': 'shield',
  '한금서': 'plaza',
  '금융ITO': 'plaza',
};

// ═══ v4 Zone 정의 (하위 호환) — ROOMS_DATA.zones 기반 동적 생성 ═══
export const TEAM_ZONES = Object.values(ROOMS_DATA)
  .filter((r) => r.team)
  .flatMap((r) => r.zones);

export const SHARED_ZONES = Object.values(ROOMS_DATA)
  .filter((r) => !r.team)
  .flatMap((r) => r.zones);

export const ZONES = [...TEAM_ZONES, ...SHARED_ZONES];
export type ZoneId = string;

// NPC 팀원 데이터
export const NPC_TEAM = [
  { name: '우형', color: '#6C5CE7', skin: '#FFE0BD', hair: '#5a3e28', role: '증권ITO', emoji: '😎', status: '재택' as const, team: '증권ITO' },
  { name: '재철', color: '#FF6B9D', skin: '#FFE0BD', hair: '#333', role: '손보1팀', emoji: '🤓', status: '출근' as const, team: '손보ITO' },
  { name: '혜림', color: '#FFD93D', skin: '#FFDBB4', hair: '#5a3218', role: '손보2팀', emoji: '😊', status: '출근' as const, team: '손보ITO' },
  { name: '은지', color: '#95E86B', skin: '#FFE0BD', hair: '#222', role: '생명2팀', emoji: '💪', status: '출근' as const, team: '생명ITO' },
  { name: '한나', color: '#C49AFF', skin: '#FFDBB4', hair: '#4a2810', role: '생명1팀', emoji: '🌟', status: '재택' as const, team: '생명ITO' },
  { name: '민수', color: '#FF9A6B', skin: '#FFE0BD', hair: '#333', role: '대리', emoji: '🔥', status: '출근' as const, team: '증권ITO' },
  { name: '예린', color: '#FF6BCA', skin: '#FFDBB4', hair: '#3a2010', role: '주임', emoji: '🌸', status: '출근' as const, team: '증권ITO' },
  { name: '동현', color: '#6BFFD4', skin: '#FFE0BD', hair: '#222', role: '대리', emoji: '🎮', status: '출근' as const, team: '한금서' },
] as const;

// 말풍선 메시지
export const CHAT_MESSAGES = [
  '오늘도 화이팅!', '커피 한 잔 ☕', '점심 뭐 먹지?', 'ㅋㅋㅋ',
  '코드 짜는 중...', '회의 끝!', '칼퇴!', '배포 완료 🚀',
  '간식 사왔어~', '장애 해결!', '배고파...', 'VOC 처리 중', '아이디어 있어요!',
] as const;

// 이모지 반응 목록 (4x4 희노애락)
export const REACTION_EMOJIS = [
  // 희 (기쁨)
  '😆', '🥳', '😍', '🤩',
  // 노 (분노)
  '😤', '🤬', '💢', '👊',
  // 애 (슬픔)
  '😢', '😭', '🥺', '💔',
  // 락 (즐거움)
  '🎉', '🔥', '👏', '❤️',
] as const;

/* DEPRECATED: v4 single-map — ROOMS_DATA[roomId].mapSize 사용 */
export const MAP_WIDTH = 1920;
export const MAP_HEIGHT = 1080;

// 초대 코드 (숫자만, 관리자 자유 지정)

// 모바일 브레이크포인트
export const MOBILE_BREAKPOINT = 700;

// 파일 업로드 제한
export const FILE_LIMITS = {
  voc: { maxSize: 5 * 1024 * 1024, maxFiles: 3, accept: ['image/*', 'application/pdf'] },
  notice: { maxSize: 10 * 1024 * 1024, maxFiles: 5, accept: ['image/*', 'application/pdf'] },
  avatar: { maxSize: 2 * 1024 * 1024, maxFiles: 1, accept: ['image/*'] },
} as const;
