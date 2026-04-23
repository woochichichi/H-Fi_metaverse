import { create } from 'zustand';

/**
 * v2 워크스페이스 내부 네비게이션.
 *
 * v1 대비 걷어낸 것:
 * - 오목/반응속도/줄넘기/가위바위보/운세 (게임)
 * - 메타버스 맵/캐릭터/펫/채팅/이모지/기분
 * - 따뜻한 한마디 / 고민 나누기 / 활동 반응
 * - 팀 포스트 / 보드 포스트 / FAQ / Lab (가설/실험)
 * - 설문(slug 기반 단발성 폼 → 외부 링크로 공유)
 *
 * 조직활동(unit-activities)은 임시로 유지, 운영 여부 확정 후 제거 가능.
 */
export type V2Page =
  | 'dashboard'
  | 'notice'
  | 'voc'
  | 'idea'
  | 'kpi'
  | 'anon-note'
  | 'gathering'
  | 'directory'
  | 'unit-activities'
  | 'corp-card'
  | 'site-report'
  | 'admin-users'
  | 'admin-eval-items'
  | 'admin-eval'
  | 'admin-invites'
  | 'admin-mod-logs';

interface V2NavState {
  page: V2Page;
  setPage: (p: V2Page) => void;
}

export const useV2Nav = create<V2NavState>((set) => ({
  page: 'dashboard',
  setPage: (p) => set({ page: p }),
}));
