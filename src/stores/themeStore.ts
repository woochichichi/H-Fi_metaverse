import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * UI 버전 선택 스토어
 *
 * - classic: 기존 메타버스 맵 + 노을 테마 (기본값, 하위호환)
 * - clean:   라이트 + 슬레이트/블루 (Linear/Notion 스타일)
 * - dark:    다크 + 청록(teal) (Vercel 스타일)
 * - hanwha:  네이비 사이드바 + 한화 오렌지 (정통 BI)
 * - warm:    크림톤 + 코랄 (따뜻+전문성)
 *
 * 현재는 선택 정보만 저장하고, MainPage에서 버전에 따라 다른 레이아웃/미리보기를 렌더한다.
 * 추후 각 버전을 실제 React 컴포넌트로 구현하면서 이 스토어 값을 참조한다.
 */
export type UiVersion = 'classic' | 'clean' | 'dark' | 'hanwha' | 'warm';

export const UI_VERSIONS: Array<{
  id: UiVersion;
  name: string;
  tagline: string;
  preview: string; // public/ui-versions/*.html — classic 은 실제 앱이므로 미리보기 없음
  mode: 'light' | 'dark' | 'warm' | 'enterprise' | 'app';
}> = [
  {
    id: 'classic',
    name: '기본 (메타버스 맵)',
    tagline: '기존 캐릭터/맵 기반의 원본 UI',
    preview: '',
    mode: 'app',
  },
  {
    id: 'clean',
    name: 'Clean Corporate',
    tagline: '깔끔한 라이트 톤 · Linear/Notion 스타일',
    preview: '/ui-versions/clean.html',
    mode: 'light',
  },
  {
    id: 'dark',
    name: 'Modern Dark',
    tagline: '세련된 다크 + 청록 포인트 · Vercel 스타일',
    preview: '/ui-versions/dark.html',
    mode: 'dark',
  },
  {
    id: 'hanwha',
    name: 'Hanwha Enterprise',
    tagline: '정통 BI 대시보드 · 네이비 + 한화 오렌지',
    preview: '/ui-versions/hanwha.html',
    mode: 'enterprise',
  },
  {
    id: 'warm',
    name: 'Warm Minimal',
    tagline: '크림톤 · 기존 코랄 브랜드 유지',
    preview: '/ui-versions/warm.html',
    mode: 'warm',
  },
];

interface ThemeState {
  version: UiVersion;
  hasChosen: boolean;
  setVersion: (v: UiVersion) => void;
  markChosen: () => void;
  resetToDefault: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      version: 'classic',
      hasChosen: false,
      setVersion: (v) => set({ version: v, hasChosen: true }),
      markChosen: () => set({ hasChosen: true }),
      resetToDefault: () => set({ version: 'classic', hasChosen: false }),
    }),
    {
      name: 'hanultari-ui-version',
      version: 1,
    }
  )
);
