/**
 * 보드 라벨 단일 소스.
 * 내부 식별자(V2Page 타입, hash 경로, DB 테이블명)는 영문 그대로 유지하되,
 * UI 표면에 노출되는 한글 라벨만 여기서 일원화한다.
 *
 * 팀장 피드백 260424: 녹취에서 자연스럽게 부른 짧은 이름으로 통일 —
 *   "공지 · 현황 · VOC · 제안 · 예산"
 */
export const BOARD_LABELS = {
  dashboard: '대시보드',
  notice: '공지',
  voc: 'VOC',
  idea: '제안',
  kpi: '팀 KPI',
  note: '쪽지',
  budget: '팀 예산',
  gathering: '소모임',
} as const;

export type BoardKey = keyof typeof BOARD_LABELS;
