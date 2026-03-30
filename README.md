# ITO 메타버스

금융ITO 4개 팀(증권ITO/생명ITO/손보ITO/한금서)의 조직문화 활동·KPI·공지·VOC·아이디어를 **게더타운 스타일 메타버스 UI**로 통합 관리하는 웹앱.

## 주요 기능

| 기능 | 설명 |
|------|------|
| **메타버스 맵** | PC에서 WASD/방향키로 캐릭터 이동, Zone 입장으로 기능 접근 |
| **VOC** | 익명/실명 접수 → 카테고리/상태 관리 → 양방향 익명 대화 → 통계 |
| **아이디어 보드** | 제안 등록 → 좋아요 투표 → 상태 관리(제안→검토→채택→완료) |
| **공지사항** | 시급성 3단계(긴급/할일/참고) → 차등 알림 → 읽음 추적 |
| **KPI 대시보드** | 유닛별 KPI 카드 + 월별 추이 차트 + 실적 입력 |
| **익명 쪽지함** | 건의/질문을 수평적으로 전달 → 양방향 익명 대화 |
| **개인 수집함** | 부재 중 알림/쪽지 모아보기 (시급성별 자동 정렬) |
| **평가 대시보드** | 활동 자동 축적 → 팀별 히트맵 + 개인별 요약 + CSV 내보내기 |
| **관리자 패널** | 초대 코드 관리 + 사용자 역할 관리 |

## 기술 스택

- **프론트엔드**: React 19 + Vite + TypeScript + Tailwind CSS v4
- **상태관리**: Zustand + React Router v7
- **차트**: Recharts
- **아이콘**: Lucide React
- **백엔드**: Supabase (Auth + PostgreSQL + Realtime + Storage)
- **호스팅**: Cloudflare Pages

## 로컬 개발

```bash
# 1. 의존성 설치
npm install

# 2. 환경 변수 설정
cp .env.example .env.local
# .env.local 파일에 Supabase URL과 anon key 입력

# 3. 개발 서버 실행
npm run dev
```

## 환경 변수

`.env.local` 파일에 아래 정보를 설정하세요:

```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...
```

## 빌드 및 배포

```bash
# 프로덕션 빌드
npm run build

# dist/ 폴더가 생성됩니다
```

**Cloudflare Pages 설정:**
- 프레임워크: Vite
- 빌드 명령: `npm run build`
- 출력 디렉토리: `dist`
- 환경 변수: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

배포 URL: `https://ito-metaverse.pages.dev`

## 적응형 UX

- **PC (≥1024px)**: 메타버스 맵 + WASD 캐릭터 이동 + Zone 입장 + Sidebar
- **모바일 (<1024px)**: 하단 탭바(VOC/아이디어/공지/쪽지/더보기) + 카드 대시보드

## 프로젝트 구조

```
src/
├── routes/          — LoginPage, RegisterPage, MainPage
├── components/
│   ├── metaverse/   — MapCanvas, PlayerCharacter, NPCCharacter, Zone
│   ├── mobile/      — MobileLayout, MobileHome, BottomTabBar
│   ├── voc/         — VocPanel, VocForm, VocList, VocDetail, VocStats
│   ├── idea/        — IdeaPanel, IdeaCard, IdeaForm
│   ├── notice/      — NoticePanel, NoticeList, NoticeDetail, NoticeForm
│   ├── note/        — NotePanel, NoteForm, NoteList, NoteDetail
│   ├── kpi/         — KpiPanel, KpiCard, KpiChart, KpiForm
│   ├── layout/      — TopBar, Sidebar
│   └── common/      — StatusBadge, UrgencyBadge, FileUpload, Toast
├── hooks/           — Supabase 쿼리 래퍼
├── stores/          — Zustand (authStore, metaverseStore, uiStore)
├── lib/             — supabase 클라이언트, 상수, 유틸
└── types/           — TypeScript 타입 정의
```
