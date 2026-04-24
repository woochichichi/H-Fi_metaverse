import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * UI 버전 선택 스토어
 *
 * - warm:    Warm Minimal — 크림톤 + 코랄 (기본값)
 * - dark:    Modern Dark — 블랙 + 청록(teal)
 * - classic: 기존 메타버스 맵 + 노을 테마 (선택 가능)
 *
 * 모두 실제 작동. 정적 미리보기용(clean/hanwha)은 폐기.
 *
 * v3 마이그레이션 (2026-04-24): 디폴트를 'classic' → 'warm'으로 전환.
 * 기존 'classic' 사용자도 'warm'으로 정규화 (의식적으로 'dark' 선택한 사용자만 유지).
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
    id: 'warm',
    name: 'Warm Minimal',
    tagline: '크림톤 · 기존 코랄 브랜드 유지 · 기본값',
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
  {
    id: 'classic',
    name: '기본 (메타버스 맵)',
    tagline: '기존 캐릭터/맵 기반의 원본 UI',
    preview: '',
    mode: 'app',
  },
];

interface ThemeState {
  version: UiVersion;
  hasChosen: boolean;
  setVersion: (v: UiVersion) => void;
  markChosen: () => void;
  resetToDefault: () => void;
}

/** 레거시 값(clean/hanwha)을 warm으로 정규화 */
function normalizeVersion(v: unknown): UiVersion {
  if (v === 'classic' || v === 'warm' || v === 'dark') return v;
  return 'warm';
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      version: 'warm',
      hasChosen: false,
      setVersion: (v) => set({ version: normalizeVersion(v), hasChosen: true }),
      markChosen: () => set({ hasChosen: true }),
      resetToDefault: () => set({ version: 'warm', hasChosen: false }),
    }),
    {
      name: 'hanultari-ui-version',
      version: 3,
      migrate: (persisted: unknown, fromVersion) => {
        const p = (persisted || {}) as Partial<ThemeState>;
        // v2 이하: 'classic'/'warm'/'dark' 외에 레거시(clean/hanwha) 가능
        // v3 전환: 의식적으로 'dark' 선택한 사용자만 유지, 나머지는 모두 'warm' 디폴트
        let nextVersion: UiVersion;
        if (fromVersion >= 3) {
          nextVersion = normalizeVersion(p.version);
        } else {
          nextVersion = p.version === 'dark' ? 'dark' : 'warm';
        }
        return {
          version: nextVersion,
          hasChosen: !!p.hasChosen,
        } as ThemeState;
      },
    }
  )
);
