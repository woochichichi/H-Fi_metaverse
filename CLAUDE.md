# CLAUDE.md — 한울타리

## 프로젝트
금융ITO 4개 팀(증권ITO/생명ITO/손보ITO/한금서)이 하나로 모이는 조직문화 플랫폼 **한울타리**. 게더타운 스타일 메타버스 UI로 VOC·아이디어·공지·KPI·활동을 통합 관리하는 웹앱.
비공식 프로젝트 (비용 0원 목표). 대상: 관리자 1명 + 유닛 리더 4명 + 팀원 ~60명 + 팀장 1명.

## 기술 스택
- **프론트**: React 18 + Vite + TypeScript + Tailwind CSS
- **상태관리**: Zustand (auth, metaverse, ui 도메인 분리)
- **라우팅**: React Router v6
- **차트**: Recharts
- **백엔드**: Supabase (PostgreSQL + Auth + Realtime + Storage + Edge Functions)
- **호스팅**: Cloudflare Pages (GitHub 연동 자동 배포)
- **아이콘**: Lucide React (이모지 아이콘 금지 — Zone 라벨 등 장식 목적은 예외)

## 디렉토리 구조
```
src/
├── main.tsx, App.tsx
├── routes/          — LoginPage, RegisterPage, MainPage
├── components/
│   ├── metaverse/   — PC: MapCanvas, PlayerCharacter, NPCCharacter, Zone, CharacterSVG, ChatBubble
│   ├── mobile/      — 모바일: MobileLayout, MobileHome, BottomTabBar
│   ├── voc/         — VocPanel, VocForm, VocList, VocDetail, VocStats, VocCard
│   ├── idea/        — IdeaPanel, IdeaCard, IdeaForm
│   ├── notice/      — NoticePanel, NoticeList, NoticeDetail, NoticeForm
│   ├── note/        — NotePanel, NoteForm, NoteList, NoteDetail, NoteCard (익명 쪽지함)
│   ├── thread/      — ThreadPanel, ThreadMessage (양방향 익명 대화 — VOC+쪽지 공용)
│   ├── inbox/       — InboxPanel, InboxCard, InboxBadge (개인 수집함)
│   ├── dashboard/   — EvalDashboard, TeamHeatmap, UserActivityCard, ExportCsv (평가 대시보드)
│   ├── kpi/         — KpiPanel, KpiCard, KpiChart, KpiForm
│   ├── admin/       — InviteManager, UserManager
│   ├── layout/      — TopBar, Sidebar, BottomBar, NotificationBell
│   └── common/      — Modal, Toast, Button, Badge, UrgencyBadge, FileUpload, EmptyState, Skeleton, StatusBadge
├── hooks/           — Supabase 쿼리 래퍼 (컴포넌트에서 직접 supabase 호출 금지)
│   └── useAuth, useDeviceMode, useRealtime, useVocs, useIdeas, useNotices, useKpi,
│       useNotifications, useNotes, useThreads, useInbox, useUserActivities, useFileUpload
├── stores/          — authStore, metaverseStore, uiStore
├── lib/
│   ├── supabase.ts  — 클라이언트 초기화
│   ├── constants.ts — 맵 데이터, Zone 정의, 허용 이메일 도메인, 팀 목록, 시급성 레벨
│   └── utils.ts     — 날짜 포맷, 파일 크기 포맷 등
├── types/           — database.ts (supabase gen types), metaverse.ts, index.ts
└── assets/
supabase/migrations/ — 001_init.sql, 002_rls.sql, 003_triggers.sql
```

## DB 테이블 (Supabase PostgreSQL)
profiles, invite_codes, vocs, ideas, idea_votes (+ idea_with_votes VIEW),
notices, notice_reads, kpi_items, kpi_records, activities,
notifications, anonymous_notes, message_threads, user_activities

- 권한: RLS 기반 (admin / leader / member)
- 트리거: auth.users INSERT → profiles 자동 생성, updated_at 자동 갱신, 활동 자동 기록 (user_activities)

## Storage 버킷
| 버킷 | 용도 | 크기제한 |
|------|------|---------|
| voc-attachments | VOC 첨부 | 5MB, image/*/pdf |
| notice-attachments | 공지 첨부 | 10MB, image/*/pdf |
| avatars | 프로필 사진 | 2MB, image/* |

## 인증
- Supabase Auth (이메일/비밀번호) + 초대 코드 검증 + @hanwha 계열 도메인 검증
- 초대 코드: "FITO-XXXX-XXXX" 형식, 팀/역할/횟수/만료일 설정 가능
- 역할: admin | leader | member
- 가입 플로우: 초대 코드 → 이메일(@hanwha) → 비밀번호 → 이름+팀 선택

## 적응형 UX
- **PC (>=1024px)**: 메타버스 맵 + WASD 캐릭터 이동 + Zone 입장 + 사이드바
- **모바일 (<1024px)**: 하단 탭바(VOC/아이디어/공지/쪽지/더보기) + 카드 대시보드
- `useDeviceMode` 훅으로 분기, 기능 컴포넌트(VOC/아이디어 등)는 공유

## 핵심 기능
1. **VOC**: 익명/실명 접수 → 카테고리/상태 관리 → 양방향 익명 대화 → 통계
2. **아이디어 보드**: 등록 → 좋아요 투표(토글) → 상태 관리(제안→검토→채택→완료/반려)
3. **공지사항**: 시급성 3단계(🔴긴급/🟡할일/🔵참고) → 차등 알림 → 읽음 추적
4. **KPI 대시보드**: 유닛별 KPI 카드 + 월별 추이 차트 + 실적 입력
5. **익명 쪽지함**: 건의/질문을 수평적으로 전달 → 양방향 익명 대화
6. **개인 수집함**: 부재 중 알림/쪽지 모아보기 (시급성별 자동 정렬)
7. **평가 대시보드**: 활동 자동 축적 → 팀별 히트맵 + 개인별 요약 + CSV 내보내기
8. **관리자 패널**: 초대 코드 관리 + 사용자 관리
9. **라운지**: 기분 이모지 + 활동 타임라인

## 불변 원칙 (MUST)
1. DB DELETE/DROP/TRUNCATE 금지 (마이그레이션 제외)
2. Supabase 쿼리 후 `{ data, error }` 체크 필수
3. `service_role_key` 프론트 사용 절대 금지 (anon key만)
4. RLS 의존 — 보안은 RLS, 프론트 권한 체크는 UX 목적
5. 익명 VOC: `author_id = NULL` 저장 (유저 추적 불가 — 관리자도 확인 불가)
6. 익명 쪽지: `sender_id = NULL` 저장 (VOC와 동일한 익명 원칙)
7. `message_threads`: `sender_role`만 기록 (실제 user_id 절대 저장 안 함)
8. `user_activities`: 자동 기록 전용 (사용자 직접 수정 불가)
9. 이메일 도메인: @hanwha 계열만 허용
10. 컴포넌트 200줄 이하 (넘으면 분리)

## 코딩 규칙 (SHOULD / PRACTICE)
- Supabase 쿼리는 `hooks/`에 집중 (컴포넌트에서 직접 호출 금지)
- Zustand 스토어 도메인별 분리
- `supabase gen types`로 자동생성된 타입 사용
- 파일 업로드: FileUpload 공통 컴포넌트 재사용
- Tailwind 유틸리티 우선, 커스텀 CSS 최소
- 로딩 → 스켈레톤, 에러 → 인라인 메시지, 빈 상태 → 이모지+안내
- 낙관적 업데이트 (투표, 읽음 처리 등)
- 한국어 UI, 코드 주석 한국어 OK
- 모바일 터치 타겟 44x44px 이상
- `transition-colors duration-200` 기본 적용

## 디자인 시스템
- **스타일**: 다크 모드 + 노을 감성 (따뜻한 게더타운)
- **배경**: `#1a1118` (primary), `#2a1f28` (secondary), `#3d2f38` (tertiary)
- **액센트**: `#E8725C` (코랄), `#F4A58A` (라이트)
- **텍스트**: `#F0E6E0` (primary), `#D4C4BC` (secondary), `#A8948A` (muted)
- **시맨틱**: success `#5DC878`, warning `#F0A830`, danger `#E84360`, info `#5CAED6`
- **폰트**: DungGeunMo(헤딩) + Galmuri11(본문) + Galmuri11(숫자/코드)
- **호버**: 색상/그림자 변경 (scale 사용 금지), 포커스: `focus-visible:ring-2 ring-accent`

## 환경 변수
```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...
```

## 배포
- 프론트: Cloudflare Pages (`https://ito-metaverse.pages.dev`)
- 백엔드: Supabase Cloud (`https://{ref}.supabase.co`)
- SPA 라우팅: `public/_redirects` → `/* /index.html 200`

## 참고 파일
- `ITO_METAVERSE_PLAN.md` — 전체 기획서 (상세 설계, DB 스키마, Sprint 계획)
- `ito-metaverse-v2.html` — UI 원본 (메타버스 맵, 캐릭터, Zone)
- `조닉유닛_마스터관리대장_v3.xlsx` — VOC/KPI/활동 데이터 구조
- `조닉유닛_프로젝트지침.md` — 유닛 목적/Task/보고체계

## Sprint 구현 순서
0. 프로젝트 초기 세팅 (Vite+React+TS+Tailwind, Supabase, migrations)
1. 인증 + 초대 코드 + 레이아웃
2. 메타버스 캔버스 (PC)
3. VOC + 양방향 익명 대화
4. 아이디어
5. 공지 + 시급성 3단계
6. KPI
7. 익명 쪽지함 + 개인 수집함
8. 관리자 패널 + 라운지 + 평가 대시보드
9. 디자인 폴리시 + 배포
