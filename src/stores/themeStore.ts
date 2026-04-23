import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * UI 버전 선택 스토어
 *
 * - classic: 기존 메타버스 맵 + 노을 테마 (게더타운 스타일)
 * - dark:    Modern Dark 대시보드 (V2Workspace · teal 포인트)
 *
 * 두 가지만 유지. 사용자는 `/style` 에서 전환 가능.
 */
export type UiVersion = 'classic' | 'dark';

export const UI_VERSIONS: Array<{
  id: UiVersion;
  name: string;
  tagline: string;
  preview: string; // public/ui-versions/*.html — classic 은 실제 앱이므로 미리보기 없음
  mode: 'app' | 'dark';
}> = [
  {
    id: 'classic',
    name: '기본 (메타버스 맵)',
    tagline: '기존 캐릭터/맵 기반의 원본 UI',
    preview: '',
    mode: 'app',
  },
  {
    id: 'dark',
    name: 'Modern Dark',
    tagline: '세련된 다크 + 청록 포인트 · 업무용 대시보드',
    preview: '/ui-versions/dark.html',
    mode: 'dark',
  },
];

interface ThemeState {
  version: UiVersion;
  hasChosen: boolean;
  setVersion: (v: UiVersion) => void;
  markChosen: () => void;
  resetToDefault: () => void;
}

/**
 * localStorage 마이그레이션:
 * 이전 버전(v1)에는 clean/hanwha/warm 값이 남아있을 수 있다.
 * 2버전 축소 후에는 classic/dark 이외 값은 classic으로 되돌린다.
 */
function normalizeVersion(v: unknown): UiVersion {
  if (v === 'classic' || v === 'dark') return v;
  return 'classic';
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      version: 'classic',
      hasChosen: false,
      setVersion: (v) => set({ version: normalizeVersion(v), hasChosen: true }),
      markChosen: () => set({ hasChosen: true }),
      resetToDefault: () => set({ version: 'classic', hasChosen: false }),
    }),
    {
      name: 'hanultari-ui-version',
      version: 2,
      migrate: (persisted: unknown, _prevVer) => {
        const p = (persisted || {}) as Partial<ThemeState>;
        return {
          version: normalizeVersion(p.version),
          hasChosen: !!p.hasChosen,
        } as ThemeState;
      },
    }
  )
);
