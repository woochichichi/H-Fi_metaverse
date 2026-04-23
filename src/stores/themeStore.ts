import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * UI 버전 선택 스토어
 *
 * - classic: 기존 메타버스 맵 + 노을 테마 (기본값)
 * - warm:    Warm Minimal — 크림톤 + 코랄
 * - dark:    Modern Dark — 블랙 + 청록(teal)
 *
 * 모두 실제 작동. 정적 미리보기용(clean/hanwha)은 폐기.
 */
export type UiVersion = 'classic' | 'warm' | 'dark';

export const UI_VERSIONS: Array<{
  id: UiVersion;
  name: string;
  tagline: string;
  preview: string; // public/ui-versions/*.html — classic 은 실제 앱이므로 미리보기 없음
  mode: 'app' | 'warm' | 'dark';
}> = [
  {
    id: 'classic',
    name: '기본 (메타버스 맵)',
    tagline: '기존 캐릭터/맵 기반의 원본 UI',
    preview: '',
    mode: 'app',
  },
  {
    id: 'warm',
    name: 'Warm Minimal',
    tagline: '크림톤 · 기존 코랄 브랜드 유지',
    preview: '/ui-versions/warm.html',
    mode: 'warm',
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

/** 레거시 값(clean/hanwha)을 classic으로 정규화 */
function normalizeVersion(v: unknown): UiVersion {
  if (v === 'classic' || v === 'warm' || v === 'dark') return v;
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
      migrate: (persisted: unknown) => {
        const p = (persisted || {}) as Partial<ThemeState>;
        return {
          version: normalizeVersion(p.version),
          hasChosen: !!p.hasChosen,
        } as ThemeState;
      },
    }
  )
);
