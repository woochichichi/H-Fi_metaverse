# ARCHITECTURE.md — 기술 아키텍처

## 아키텍처
```
[사용자 브라우저 — PC/모바일]
      │
      ▼
[Cloudflare Pages]  ← React SPA (Vite 빌드)
      │
      ▼
[Supabase Cloud]
  ├── Auth           ← 이메일(@hanwha) + 비밀번호 + 초대 코드
  ├── PostgreSQL     ← 데이터 (RLS 권한 제어)
  ├── Realtime       ← 실시간 알림 (Postgres Changes)
  ├── Storage        ← 파일 첨부 (VOC/공지/프로필)
  └── Edge Functions ← 초대 코드 검증, 향후 텔레그램 웹훅
```
별도 백엔드 서버 없음. 프론트엔드만 개발.

## 기술 선택 근거
| 영역 | 선택 | 근거 |
|------|------|------|
| 언어 | TypeScript | 타입 안전 → AI 코딩 오류 감소 |
| 프론트 | React 18 + Vite + Tailwind | 메타버스 캔버스 + 대시보드에 최적 |
| 상태 | Zustand | 가볍고 보일러플레이트 최소 |
| 라우팅 | React Router v6 | SPA 표준 |
| 차트 | Recharts | React 네이티브, VOC/KPI 통계용 |
| DB | Supabase PostgreSQL | 무료 500MB, RLS |
| 인증 | Supabase Auth | 이메일/비번 + 도메인 제한 |
| 실시간 | Supabase Realtime | Postgres Changes 구독 |
| 파일 | Supabase Storage | 3개 버킷 |
| 호스팅 | Cloudflare Pages | 무료, CDN, Git 자동 배포 |
| 아이콘 | Lucide React | 이모지 아이콘 금지 (Zone 라벨 등 장식 예외) |

## 무료 티어 확인
| 서비스 | 한도 | 예상 | 판정 |
|--------|------|------|------|
| Supabase DB | 500MB | ~60명, 월 수백 건 | ✅ |
| Supabase Auth | 50K MAU | ~70명 | ✅ |
| Supabase Realtime | 200 동시 | ~30명 | ✅ |
| Supabase Storage | 1GB | 프로필+VOC+공지 첨부 | ✅ |
| CF Pages | 무제한 대역폭 | SPA 1개 | ✅ |

## 디렉토리 구조 상세
```
ito-metaverse/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.ts
├── .env.local                 ← VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
├── .env.example
├── .gitignore
│
├── CLAUDE.md                  ← Claude Code 자동 참조 (진입점)
├── docs/                      ← 상세 문서
│   ├── ARCHITECTURE.md
│   ├── DESIGN.md
│   ├── FEATURES.md
│   └── ROADMAP.md
│
├── .claude/
│   ├── settings.json
│   ├── commands/
│   │   ├── sprint.md
│   │   └── check.md
│   └── templates/
│       └── sprint-prompt.md
│
├── supabase/
│   ├── config.toml
│   └── migrations/
│       ├── 001_init.sql
│       ├── 002_rls.sql
│       └── 003_triggers.sql
│
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   │
│   ├── routes/
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   └── MainPage.tsx       ← PC: MetaverseLayout / 모바일: MobileLayout
│   │
│   ├── components/
│   │   ├── metaverse/         ← PC 전용: MapCanvas, PlayerCharacter, NPCCharacter, Zone, CharacterSVG, ChatBubble
│   │   ├── mobile/            ← 모바일 전용: MobileLayout, MobileHome, BottomTabBar
│   │   ├── voc/               ← VocPanel, VocForm, VocList, VocDetail, VocStats, VocCard
│   │   ├── idea/              ← IdeaPanel, IdeaCard, IdeaForm
│   │   ├── notice/            ← NoticePanel, NoticeList, NoticeDetail, NoticeForm
│   │   ├── note/              ← NotePanel, NoteForm, NoteList, NoteDetail, NoteCard (익명 쪽지함)
│   │   ├── thread/            ← ThreadPanel, ThreadMessage (양방향 익명 대화)
│   │   ├── inbox/             ← InboxPanel, InboxCard, InboxBadge (개인 수집함)
│   │   ├── dashboard/         ← EvalDashboard, TeamHeatmap, UserActivityCard, ExportCsv
│   │   ├── kpi/               ← KpiPanel, KpiCard, KpiChart, KpiForm
│   │   ├── admin/             ← InviteManager, UserManager
│   │   ├── layout/            ← TopBar, Sidebar, BottomBar, NotificationBell
│   │   └── common/            ← Modal, Toast, Button, Badge, UrgencyBadge, FileUpload, EmptyState, Skeleton, StatusBadge
│   │
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useDeviceMode.ts   ← PC/모바일 분기 (1024px)
│   │   ├── useRealtime.ts
│   │   ├── useVocs.ts
│   │   ├── useIdeas.ts
│   │   ├── useNotices.ts
│   │   ├── useKpi.ts
│   │   ├── useNotifications.ts
│   │   ├── useNotes.ts
│   │   ├── useThreads.ts
│   │   ├── useInbox.ts
│   │   ├── useUserActivities.ts
│   │   └── useFileUpload.ts
│   │
│   ├── stores/
│   │   ├── authStore.ts
│   │   ├── metaverseStore.ts
│   │   └── uiStore.ts
│   │
│   ├── lib/
│   │   ├── supabase.ts        ← 클라이언트 초기화
│   │   ├── constants.ts       ← 맵 데이터, Zone 정의, 허용 이메일 도메인, 팀 목록, 시급성 레벨
│   │   └── utils.ts           ← 날짜 포맷, 파일 크기 포맷 등
│   │
│   ├── types/
│   │   ├── database.ts        ← supabase gen types
│   │   ├── metaverse.ts
│   │   └── index.ts
│   │
│   └── assets/
│
└── public/
    └── _redirects              ← CF Pages SPA 라우팅: /* /index.html 200
```

## DB 테이블
profiles, invite_codes, vocs, ideas, idea_votes (+ idea_with_votes VIEW),
notices, notice_reads, kpi_items, kpi_records, activities,
notifications, anonymous_notes, message_threads, user_activities

- 권한: RLS 기반 (admin / leader / member)
- 트리거: auth.users INSERT → profiles 자동 생성, updated_at 자동 갱신, 활동 자동 기록 (user_activities)
- DB 스키마 상세(CREATE TABLE)는 `docs/FEATURES.md` 참조

## Storage 버킷
| 버킷 | 용도 | 크기제한 | 허용 타입 | 접근 |
|------|------|---------|----------|------|
| voc-attachments | VOC 첨부 | 5MB | image/*, application/pdf | 로그인 사용자 읽기, 작성자 쓰기 |
| notice-attachments | 공지 첨부 | 10MB | image/*, application/pdf | 로그인 사용자 읽기, 리더 쓰기 |
| avatars | 프로필 사진 | 2MB | image/* | 전체 읽기, 본인만 쓰기 |

## 인증 플로우
1. URL 접속 → 로그인 화면
2. "가입하기" 클릭
3. [Step 1] 초대 코드 입력 → 존재 + active + 횟수 미초과 + 미만료 검증
4. [Step 2] 이메일 입력 (@hanwha 계열만: hanwha.com, hanwhasystems.com 등)
5. [Step 3] 비밀번호 설정 (8자 이상)
6. [Step 4] 이름 + 팀 선택 (증권ITO/생명ITO/손보ITO/한금서)
7. Supabase Auth signUp → 트리거 → profiles 자동 생성

- 초대 코드: "FITO-XXXX-XXXX" 형식, 팀/역할/횟수/만료일 설정 가능
- 역할: admin | leader | member

## 적응형 UX
- **PC (>=1024px)**: 메타버스 맵 + WASD 캐릭터 이동 + Zone 입장 + 사이드바
- **모바일 (<1024px)**: 하단 탭바(VOC/아이디어/공지/쪽지/더보기) + 카드 대시보드
- `useDeviceMode` 훅으로 분기, 기능 컴포넌트(VOC/아이디어 등)는 공유

```typescript
// src/hooks/useDeviceMode.ts
const useDeviceMode = () => {
  const isPC = useMediaQuery('(min-width: 1024px)')
  return isPC ? 'metaverse' : 'mobile'
}
```

## 배포
- 프론트: Cloudflare Pages (`https://ito-metaverse.pages.dev`)
- 백엔드: Supabase Cloud (`https://{ref}.supabase.co`)
- 접근 제어: 초대 코드 + @hanwha 이메일만 가입 가능
- SPA 라우팅: `public/_redirects` → `/* /index.html 200`

## 트러블슈팅 & 시행착오

### Supabase 쿼리 무한 대기 (2026-03-30)
**증상:** 모든 패널(VOC/공지/쪽지 등)에서 "로딩에 실패했습니다" 표시 — loading이 영원히 true로 남음
**원인:** 커밋 `7e270d1`에서 빌드 호환성 문제로 `abortSignal`을 전체 hooks에서 제거 → 네트워크 지연 시 쿼리가 무한 대기
**추가 원인:** Panel 컴포넌트에서 List 컴포넌트로 `error`/`onRetry` props를 전달하지 않아 에러 메시지와 재시도 버튼이 노출되지 않음
**해결:**
1. `src/lib/utils.ts`에 `withTimeout()` 유틸 추가 (Promise.race 기반 8초 타임아웃)
2. 8개 fetch hooks에 `withTimeout(query)` 래퍼 적용
3. VocPanel, NoticePanel, NotePanel에서 `error`/`onRetry` props 연결
**교훈:** fetch 쿼리에는 반드시 타임아웃 설정. Panel→List 간 error props 전달 누락 주의
