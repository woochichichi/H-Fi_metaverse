/**
 * 보드 라벨 단일 소스.
 * 내부 식별자(V2Page 타입, hash 경로, DB 테이블명)는 영문 그대로 유지하되,
 * UI 표면에 노출되는 한글 라벨만 여기서 일원화한다.
 *
 * 260425 리네임: 팀장 피드백("VOC 타이틀 직관적으로 바꿔주세요")을 반영해
 * 약어/관념어 대신 사용자가 바로 이해하는 한글로 교체.
 *   VOC → 바라는점, 제안 → 아이디어
 */
export const BOARD_LABELS = {
  dashboard: '대시보드',
  notice: '공지',
  voc: '바라는점',
  idea: '아이디어',
  kpi: '팀 KPI',
  note: '쪽지',
  budget: '팀 예산',
  gathering: '소모임',
} as const;

export type BoardKey = keyof typeof BOARD_LABELS;
