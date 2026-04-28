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
  ├── Realtime       ← 실시간 동기화 (Presence + Broadcast + Postgres Changes)
  ├── Storage        ← 파일 첨부 (VOC/공지/프로필)
  └── Edge Functions ← 초대 코드 검증, 향후 텔레그램 웹훅
```
별도 백엔드 서버 없음. 프론트엔드만 개발.

## 기술 선택 근거
| 영역 | 선택 | 근거 |
|------|------|------|
| 언어 | TypeScript | 타입 안전 → AI 코딩 오류 감소 |
| 프론트 | React 19 + Vite + Tailwind | 메타버스 캔버스 + 대시보드에 최적 |
| 상태 | Zustand | 가볍고 보일러플레이트 최소 |
| 라우팅 | React Router v7 | SPA 표준 |
| 차트 | Recharts | React 네이티브, VOC/KPI 통계용 |
| DB | Supabase PostgreSQL | 무료 500MB, RLS |
| 인증 | Supabase Auth | 이메일/비번 + 도메인 제한 |
| 실시간 | Supabase Realtime | Presence(위치 동기화) + Broadcast(게임/채팅) + Postgres Changes(알림) |
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
│   │   ├── metaverse/         ← PC 전용: MetaverseLayout, MapCanvas, PlayerCharacter,
│   │   │                        OtherPlayers, Zone, CharacterSVG, ChatBubble, EmojiFloat,
│   │   │                        BottomBar, TouchDpad, ChatInput, LobbyPanel,
│   │   │                        MoodPicker, NicknameEditor
│   │   ├── mobile/            ← 모바일 전용: MobileLayout, MobileHome, BottomTabBar
│   │   ├── game/              ← 미니게임: JumpRopePanel, OmokPanel, ReactionPanel
│   │   ├── voc/               ← VocPanel, VocForm, VocList, VocDetail, VocStats, VocCard
│   │   ├── idea/              ← IdeaPanel, IdeaCard, IdeaForm
│   │   ├── notice/            ← NoticePanel, NoticeList, NoticeDetail, NoticeForm
│   │   ├── note/              ← NotePanel, NoteForm, NoteList, NoteDetail, NoteCard
│   │   ├── gathering/         ← GatheringPanel, GatheringForm, GatheringList, GatheringDetail
│   │   ├── thread/            ← ThreadPanel, ThreadMessage (양방향 익명 대화)
│   │   ├── inbox/             ← InboxPanel, InboxCard, InboxBadge (개인 수집함)
│   │   ├── dashboard/         ← EvalDashboard, TeamHeatmap, UserActivityCard, ExportCsv
│   │   ├── kpi/               ← KpiPanel, KpiCard, KpiChart, KpiForm
│   │   ├── admin/             ← InviteManager, UserManager, EvalItemManager, EvalDashboard
│   │   ├── layout/            ← TopBar, Sidebar, BottomBar, NotificationBell
│   │   └── common/            ← Modal, Toast, ConfirmDialog, Button, Badge,
│   │                            UrgencyBadge, StatusBadge, FileUpload, EmptyState,
│   │                            Skeleton, LoadMore, ErrorBoundary
│   │
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useDeviceMode.ts   ← PC/모바일 분기 (700px)
│   │   ├── usePlayerSync.ts   ← 실시간 위치 동기화
│   │   ├── useZoneAlerts.ts   ← Zone 접근 알림
│   │   ├── useVocs.ts
│   │   ├── useVocRealtime.ts  ← VOC 실시간 알림
│   │   ├── useIdeas.ts
│   │   ├── useNotices.ts
│   │   ├── useKpi.ts
│   │   ├── useNotes.ts
│   │   ├── useInbox.ts
│   │   ├── useGatherings.ts
│   │   ├── useFileUpload.ts
│   │   ├── useUserActivities.ts
│   │   ├── useUnitActivities.ts
│   │   ├── useCustomEvalItems.ts
│   │   ├── useJumpRopeGame.ts      ← 줄넘기 멀티플레이어 로직
│   │   ├── useJumpRopeRanking.ts
│   │   ├── useOmokGame.ts          ← 오목 대전 로직 + 렌주룰
│   │   ├── useOmokRanking.ts
│   │   ├── useReactionGame.ts      ← 반응속도 게임 로직
│   │   └── useReactionRanking.ts
│   │
│   ├── stores/
│   │   ├── authStore.ts       ← 사용자 세션, 프로필, 로그인/로그아웃
│   │   ├── metaverseStore.ts  ← 위치, 방, Zone, 채팅, 이모지, 다른 플레이어
│   │   └── uiStore.ts         ← 사이드바, 모달, 토스트
│   │
│   ├── lib/
│   │   ├── supabase.ts        ← 클라이언트 초기화
│   │   ├── constants.ts       ← 맵 데이터, Zone 정의, 팀 설정, 캐릭터 커스텀 옵션,
│   │   │                        포탈 정의, 이모지/리액션, 게이미피케이션 포인트
│   │   ├── utils.ts           ← 날짜 포맷, withTimeout, 파일 크기 포맷 등
│   │   ├── renju.ts           ← 오목 렌주룰 판정 (삼삼/사사/장목 금지)
│   │   └── profanityFilter.ts ← 비속어 필터
│   │
│   ├── types/
│   │   ├── database.ts        ← supabase gen types
│   │   ├── metaverse.ts       ← Room, Zone, Portal, Player 타입
│   │   └── index.ts           ← 공용 타입 (Profile, Voc, Idea, Notice, Note, Gathering 등)
│   │
│   └── assets/
│
└── public/
    └── _redirects              ← CF Pages SPA 라우팅: /* /index.html 200
```

## DB 테이블
profiles, invite_codes, vocs, ideas, idea_votes (+ idea_with_votes VIEW),
notices, notice_reads, kpi_items, kpi_records, activities,
notifications, anonymous_notes, message_threads, user_activities,
gatherings, gathering_members, gathering_comments, custom_eval_items,
jump_rope_records (+ jump_rope_ranking VIEW),
omok_records (+ omok_ranking VIEW),
reaction_records (+ reaction_ranking VIEW)

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
1. URL 접속 → 로그인 화면 (SSO 미연동 안내 포함)
2. "가입하기" 클릭
3. [Step 1] 초대 코드 입력 → 존재 + active + 횟수 미초과 + 미만료 검증
4. [Step 2] 이메일 입력 (@hanwha 계열만: hanwha.com, hanwhasystems.com 등)
5. [Step 3] 비밀번호 설정 (8자 이상)
6. [Step 4] 이름 + 팀 선택 (증권ITO/생명ITO/손보ITO/한금서)
7. Supabase Auth signUp → 트리거 → profiles 자동 생성

- 초대 코드: "FITO-XXXX-XXXX" 형식, 팀/역할/횟수/만료일 설정 가능
- 역할: admin | leader | member

## 적응형 UX
- **PC (>=700px)**: 메타버스 맵 + WASD/방향키 캐릭터 이동 + Zone 입장 + 사이드바 + 클릭 이동
- **모바일 (<700px)**: 하단 탭바(VOC/아이디어/공지/모임/더보기) + 터치 D-pad + 카드 대시보드
- `useDeviceMode` 훅으로 분기, 기능 컴포넌트(VOC/아이디어 등)는 공유

```typescript
// src/hooks/useDeviceMode.ts
const useDeviceMode = () => {
  const isPC = useMediaQuery('(min-width: 700px)')
  return isPC ? 'metaverse' : 'mobile'
}
```

## Realtime 채널
| 채널 | 용도 | 방식 |
|------|------|------|
| metaverse-presence | 플레이어 위치/상태 동기화 | Presence |
| chat | 채팅 메시지 브로드캐스트 | Broadcast |
| jumprope-game | 줄넘기 멀티플레이어 동기화 | Broadcast |
| omok-game | 오목 수 동기화 | Broadcast |
| sidebar-profiles | 사용자 목록 업데이트 | Postgres Changes |
| voc-realtime | VOC 실시간 알림 | Postgres Changes |

## 배포
- 프론트: Cloudflare Pages · 커스텀 도메인 (`https://hwiki.site`)
- 백엔드: Supabase Cloud (`https://{ref}.supabase.co`)
- 접근 제어: 초대 코드 + @hanwha 이메일만 가입 가능
- SPA 라우팅: `public/_redirects` → `/* /index.html 200`
- Cloudflare 환경변수: `NODE_VERSION=22` 필수

## 트러블슈팅 & 시행착오

### 법인카드 수집시각이 +9시간 어긋남 — naive datetime → UTC 오해석 (2026-04-28)
**증상:** 09:00 KST 에 크롤링 배치를 돌렸는데, 팀 예산 페이지의 `SyncBadge` 가 `04/28 17:57 수집` 으로 표시. 사용자가 "배치 돌린 시간으로 보여지게 해줘 (지금 17:57)" 요청.
**원인 추적:**
1. `corp_card_snapshots.captured_at` 컬럼은 `timestamp with time zone`. 프론트 [formatKST](src/lib/utils.ts#L7) 는 `Asia/Seoul` 강제로 정확함.
2. DB 실제 값 확인 → `2026-04-28 08:57:05.74998+00` 으로 저장돼 있었음. **즉 KST 08:57 을 UTC 08:57 로 기록한 상태.** Postgres가 다시 +9 변환해 화면이 17:57.
3. 업로더 [scrape.py:336](cash/automation/src/scrape.py) / [card_expense.py:176](cash/automation/src/card_expense.py) 의 `datetime.now().isoformat()` 추적 → 출력은 `"2026-04-28T08:57:05.749980"` (오프셋 없음 = naive). PostgREST/Postgres 는 timezone 없는 timestamptz 입력을 **세션 timezone(UTC)** 으로 가정 → 어긋남 확정.
**해결:** 두 파일 모두 `datetime.now(KST).isoformat()` 으로 교체 (KST = `timezone(timedelta(hours=9))`). 결과 ISO 문자열이 `"2026-04-28T09:06:58.849570+09:00"` 로 오프셋 포함 → DB 가 UTC 로 정규화하면서도 KST 의미 보존, 프론트 KST 변환 시 정확히 `09:06`.
**교훈:**
- **`datetime.now().isoformat()` 는 절대 timestamptz 컬럼에 직접 보내지 말 것.** 항상 `datetime.now(tz)` 로 tz-aware 객체를 만들어야 ISO 문자열에 오프셋이 붙음.
- DB 값과 화면 표시값의 시차가 정확히 시간대 오프셋(+9, -5 등)이면 거의 100% 직렬화 단계의 naive 문자열 문제. timezone 변환 로직보다 **입력 직렬화**를 먼저 의심할 것.
- 자동/수동 어느 쪽으로 돌리든, 사용자가 보고 싶은 건 "지금 몇 시에 돌렸는지" 라는 KST wallclock — 서버 timezone 가정에 의존하지 말고 명시적 tz 부여.

### 멀티 chat 동시 작업 시 push 누락 점검 (2026-04-25)
**증상:** 한 chat에서 9개 파일을 수정·"배포"했다고 보고했는데, 사용자 화면(캡처)에는 옛날 UI가 그대로. 같은 시점에 다른 chat이 budget 관련 커밋을 여러 건 push 중이었음.
**원인 추적 과정:**
1. `git status` 단독으로는 신뢰 불가 — 워킹트리에 modified로 살아있다는 사실만 알려줌. "이미 푸시됐는지"는 알려주지 않음.
2. `git log --oneline` 으로 최근 커밋만 봐도 부족 — 다른 chat이 커밋 메시지를 다르게 썼을 수 있어서 키워드 grep이 빗나감.
3. **결정적 점검:** `git log -p --all -S "<신규 도입 문자열>"` — 이번 작업에서 새로 도입한 한글 문자열("바라는점")을 전체 히스토리에서 -S 옵션으로 검색. 0건이면 = 어떤 커밋·어떤 브랜치에도 안 들어간 것 = push 누락 확정.
4. 추가 확인: `git rev-list --left-right --count origin/main...HEAD` 로 로컬·원격 divergence 0/0 인지 → 동기화 자체는 정상이지만 신규 작업이 아예 stage조차 안 됐던 상태였음을 식별.
**해결:** 9개 파일 명시적 `git add`(파일명 나열, `-A`/`.` 금지 — untracked design/cash/docs 폴더가 함께 들어가는 것 방지) → commit → push.
**교훈:**
- **"수정했다"와 "푸시됐다"는 다른 사실** — modified 워킹트리는 push의 증거가 아님.
- **여러 chat이 동시에 작업할 때**는 작업 종료 시점에 신규 도입 고유 문자열로 `git log -S` 검증을 한 번 더 거칠 것.
- `git stash list`에 다른 chat 작업물이 남아있을 수 있음 — 모르는 stash는 절대 pop·drop 하지 말고 컨텍스트 보존.

### Supabase 쿼리 무한 대기 (2026-03-30)
**증상:** 모든 패널(VOC/공지/쪽지 등)에서 "로딩에 실패했습니다" 표시 — loading이 영원히 true로 남음
**원인:** 커밋 `7e270d1`에서 빌드 호환성 문제로 `abortSignal`을 전체 hooks에서 제거 → 네트워크 지연 시 쿼리가 무한 대기
**추가 원인:** Panel 컴포넌트에서 List 컴포넌트로 `error`/`onRetry` props를 전달하지 않아 에러 메시지와 재시도 버튼이 노출되지 않음
**해결:**
1. `src/lib/utils.ts`에 `withTimeout()` 유틸 추가 (Promise.race 기반 8초 타임아웃)
2. 8개 fetch hooks에 `withTimeout(query)` 래퍼 적용
3. VocPanel, NoticePanel, NotePanel에서 `error`/`onRetry` props 연결
**교훈:** fetch 쿼리에는 반드시 타임아웃 설정. Panel→List 간 error props 전달 누락 주의

### 공지사항 멤버 작성 권한 개방 (2026-03-31)
**목표:** 기존 리더(admin/leader)만 가능하던 공지 작성을 모든 멤버에게 개방
**시행착오:**
1. 프론트(`NoticePanel`)의 `isLeader` 가드만 제거하면 끝이라 판단 → 실제로는 RLS `notices_insert_leader` 정책이 DB에서 INSERT를 차단하고 있어 멤버가 등록 시 에러 발생
2. RLS 마이그레이션(`020`)으로 DB 정책 수정 후, `full_setup.sql`에 구 정책이 남아있는 것을 발견 → DB 리셋 시 권한이 원복될 위험
**해결:**
1. RLS: `notices_insert_leader` → `notices_insert_authenticated` (모든 인증 사용자 INSERT 허용)
2. `full_setup.sql` 동기화
3. `NoticeForm`에 멤버 안전 제한 추가: 긴급 시급성 비활성, 상단 고정 숨김, 대상 팀 본인 팀 고정
4. 삭제는 기존 RLS(`019`)가 `author_id` 기준으로 이미 안전 → 추가 변경 불필요
**교훈:** 프론트 권한 변경 시 반드시 RLS 정책 + full_setup.sql 동기화 확인. 보안은 RLS, 프론트는 UX 목적(CLAUDE.md 원칙 #4)

### Supabase Management API 경유 마이그레이션 시 한글/이모지 인코딩 깨짐 (2026-03-31)
**증상:** 게시글 작성 시 `POST /rest/v1/team_posts 400 Bad Request` — Supabase 로그에 `PostgREST; error=23514` (check_violation)
**원인:** `curl`로 Management API를 통해 마이그레이션 SQL 실행 시 JSON 직렬화 과정에서 한글·이모지가 U+FFFD(대체 문자, `efbfbd`)로 저장됨. CHECK 제약조건·컬럼 DEFAULT 값이 깨져서 프론트에서 정상 한글을 INSERT하면 제약조건 불일치로 실패.
**영향 범위 (수정 완료):**
- `team_posts.team_posts_category_check` — `'자유','질문','정보','잡담'` 깨짐 → 재생성
- `team_posts.category` DEFAULT — `'자유'` 깨짐 → 재설정
- `profiles.profiles_status_check` — `'재택','퇴사'` 깨짐 → 재생성
- `kudos_likes.kudos_likes_reaction_check` — 이모지 6개 깨짐 → 재생성
- `kudos_likes.reaction` DEFAULT — `'❤️'` 깨짐 → 재설정
**RLS 정책·트리거·실제 데이터:** 이상 없음 (hex 검사로 확인)
**교훈:** Management API(`/v1/projects/{ref}/database/query`)로 한글·이모지 포함 SQL 실행 시, JSON body를 파일(`--data-binary @file.json`)로 넘겨야 인코딩 안전. 마이그레이션 후 CHECK 제약조건의 hex 값을 반드시 검증할 것 (`encode(pg_get_constraintdef(c.oid)::bytea,'hex') LIKE '%efbfbd%'`).

### backdrop-filter + fixed 스택킹 이슈
**증상:** 오버레이 UI가 부모 기준으로 잡혀 backdrop-filter 깨짐
**해결:** 오버레이 UI는 `createPortal(document.body)` 필수

### 연구실(Lab) 기능 구축 시행착오 모음 (2026-04-08~09)

#### 1. Storage 버킷 미생성 → 첨부파일 400 에러
**증상:** 첨부파일 업로드 시 `POST .../attachments/lab/... 400 Bad Request`
**원인:** 코드에서 `supabase.storage.from('attachments')`를 호출하지만 Supabase에 `attachments` 버킷이 존재하지 않았음
**해결:** Management API로 `attachments` 버킷 생성 (public, 5MB 제한) + SELECT/INSERT/DELETE RLS 정책 추가
**교훈:** 새 Storage 기능 추가 시 버킷 존재 여부를 먼저 확인. 코드만 작성하고 인프라를 빠뜨리기 쉬움

#### 2. curl로 한글 INSERT → 인코딩 깨짐
**증상:** DB에 시드 데이터 삽입 후 연구실 모달 진입 시 런타임 에러 (깨진 UTF-8)
**원인:** Windows bash에서 curl로 Supabase Management API에 한글 SQL을 보내면 code page/locale 문제로 바이트가 손상됨
**해결:** 깨진 데이터 삭제 → Node.js `fetch`로 Management API 호출 (UTF-8 보장)
**교훈:** curl로 한글 SQL 직접 전달 절대 금지. 한글 데이터 INSERT는 반드시 Node.js 스크립트 사용 (memory에 기록 완료)

#### 3. 한글 파일명 → Storage path 길이 초과 400
**증상:** `ITO 상주근무 환경의 자기복원형 조직 활성화 구조 설계.pdf` 업로드 시 400
**원인:** 한글 파일명이 URL 인코딩되면 3배 이상 길어짐 (`%EC%83%81%EC%A3%BC...`). 30자 한글 = URL 인코딩 시 ~90자. Storage path 길이 제한 초과
**시행착오:**
1. `UUID_파일명` → 여전히 한글이 URL에 포함되어 400
2. `UUID8-파일명30자` → 한글 30자도 인코딩하면 길어서 400
3. 최종: `UUID.확장자` (한글 완전 제거)
**해결:** 파일 경로는 `lab/{UUID}.{ext}` 순수 ASCII. 원본 파일명은 URL fragment(`#파일명`)에 저장하여 표시용으로 활용
**교훈:** Storage path에 한글을 절대 넣지 말 것. 파일명 표시가 필요하면 fragment 또는 별도 메타데이터로 분리

#### 4. 첨부파일명 저장 후 "문서.pdf"로 바뀌는 문제
**증상:** 등록 시에는 원본 파일명이 보이다가, 저장 누르면 `문서.pdf`로 변경
**원인:** 편집 모드에서는 `editNames[url]`로 원본 파일명을 보여줬지만, 저장 후 DB에서 다시 로드하면 URL만 남아서 `getFileName(url)`이 UUID 경로를 파싱 → `문서.pdf`
**해결:** URL에 `#encodeURIComponent(원본파일명)` fragment를 붙여서 DB에 저장. `getFileName()`이 fragment를 먼저 확인하여 원본 파일명 표시. 다운로드도 fetch→blob→download 방식으로 원본 파일명 적용
**교훈:** 파일명과 URL은 분리되는 순간이 반드시 온다. 처음부터 파일명을 URL에 포함시키거나 별도 컬럼으로 관리할 것

#### 5. 가설 전환 시 편집/상태 잔존
**증상:** 가설 A에서 수정 모드 진입 → 좌측 목록에서 가설 B 클릭 → 수정 폼이 가설 B 위에 그대로 열려있음
**원인:** `editing`, `showStatusMenu`, `editingId`(Timeline/Comment) 등 상태가 가설 전환 시 초기화되지 않음
**해결:**
- Detail: `hypothesis.id` useEffect로 `editing/showStatusMenu/confirmDelete/uploading` 리셋
- Timeline/Comment: `entries[0].id` / `comments[0].id` 변경 감지로 `editingId/deleteTarget` 리셋
- LabModal: `handleSelect`에서 `setShowEntryForm(false)`
**교훈:** 부모가 props를 바꿔도 자식의 local state는 유지된다. 컨텍스트가 바뀌는 시점에 모든 임시 state를 초기화하는 useEffect가 필요

#### 6. 자체검증 빠뜨림 반복
**증상:** 버그 수정 → 즉시 커밋/배포 → 자체검증(Phase 1→2→3) 생략 → 다음 버그에서 또 상태 잔존 발견
**원인:** "빨리 고쳐야지" 모드에서 검증 단계를 건너뜀. CLAUDE.md에 MUST로 적혀있지만 강제 트리거가 없었음
**해결:** `.claude/settings.json`에 PreToolUse hook 추가 — `git commit` 실행 시 자체검증 리마인더 표시
**교훈:** MUST 규칙은 문서에만 적어두면 안 되고, 자동화된 트리거(hook)로 강제해야 실효성이 있음

### Supabase Realtime `subscribe-after-on` 에러 — 동일 채널 멀티 구독 (2026-04-24)
**증상:** 우측 상단 인박스 아이콘 클릭 시 ErrorBoundary 노출
```
Error: cannot add `postgres_changes` callbacks for
realtime:inbox_<userId> after `subscribe()`.
```
**원인:** `useInbox(userId)` 훅이 `TopBar.tsx`와 `MobileHome.tsx`의 `DashboardHome` 두 곳에서 동시 호출됨. 채널명이 `inbox_${userId}` **고정**이라 Supabase 클라이언트가 내부 레지스트리에서 같은 채널 인스턴스를 재사용 → 두 번째 훅의 `.on('postgres_changes',…)` 가 이미 `.subscribe()` 완료된 채널에 등록되려다 API 제약 위반.
**해결:** 훅 인스턴스마다 `useState(() => Math.random().toString(36).slice(2, 8))` 로 고유 서픽스 생성 → `inbox_${userId}_${suffix}` 로 독립 채널 구독. cleanup deps에도 suffix 추가.
**교훈:** 같은 Realtime 채널명을 여러 컴포넌트에서 공유하면 Supabase가 저지함. 훅 하나가 여러 곳에서 호출될 가능성이 있으면 **채널명은 반드시 인스턴스별로 고유**해야 함. 정적 채널명(`vocs_realtime`, `notes_realtime`)을 쓰는 훅도 같은 리스크 있음 — StrictMode·빠른 재마운트에서 발현 가능.
**근거:** `site_reports#08ea4800` 실제 접수. 수정 커밋 `547c7b3`.

### Tailwind v4 `@theme` 토큰 CSS 스코프 오버라이드로 모바일 테마 전환 (2026-04-25)
**증상:** 모바일에서 warm/dark 테마를 선택해도 UI는 항상 classic 다크 navy 팔레트. `MobileLayout`이 쓰는 `bg-bg-primary` / `text-text-primary` 시맨틱 유틸리티가 테마 스코프 밖에 있었음.
**원인:** 구버전 기준으로 "Tailwind는 빌드 시점 고정값"이라 생각해 모바일은 테마 적용 불가로 단정. 하지만 **Tailwind v4의 `@theme { --color-X }` 는 CSS 변수 기반**이라 하위 스코프에서 재정의 가능.
**해결:** `src/styles/v2-warm.css`의 `.v2-warm` / `.v2-dark` 블록에 `--color-bg-primary` / `--color-text-primary` / `--color-accent` 등 Tailwind @theme 토큰을 각각 해당 팔레트 값으로 재정의. `MainPage.tsx` 모바일 분기에서 `uiVersion`에 따라 `v2-warm` / `v2-dark` 클래스를 루트 div에 부착. CSS 변수는 inherited이므로 하위 Tailwind 유틸리티가 자동 전환됨.
**한계:** `border-white/[.06]`, `bg-white/[.06]` 같은 **arbitrary value는 rgba 고정값으로 컴파일**되어 CSS 변수 오버라이드 불가. warm 배경에선 거의 투명해져 보더가 약해질 수 있음. 필요하면 `[class*="border-white/"]` 속성 선택자로 blanket override.
**교훈:** 신규 테마 추가·레이아웃 통일 시 Tailwind v4 `@theme` 토큰 스코프 재정의 패턴 우선 고려. Tailwind의 시맨틱 유틸만 쓰고 arbitrary value는 최소화하면 완전한 테마 분리 가능.
**커밋:** `c25d22d`

### ERP `corp_card_transactions.store_name` 원본 오염 — 가맹점 집계에 실명 노출 (2026-04-25)
**증상:** 팀 예산 "상위 사용처 TOP 5"에 `전우형-2019`, `김용현-2013` 같은 팀원 **실명·사번**이 가맹점으로 집계됨.
**원인:** ERP 수집 원천(`cash/automation`이 긁어오는 `budgetHistList.do` 응답)의 `store_name` 컬럼에 일부 거래는 가맹점 대신 "사용자명-사번" 문자열이 들어 있음. 수집 로직은 이 값을 그대로 저장하므로 `corp_card_transactions.store_name` 에 오염 데이터가 혼재.
**영향:** Wave 5(팀원별 랭킹 role 필터)는 `CorpCardMemberList` 위젯에만 적용되고, `CorpCardTopMerchants`는 필터 밖이라 **일반 팀원도 다른 팀원의 실명·사용 금액 TOP을 볼 수 있었음**.
**해결:** `CorpCardTopMerchants` 섹션 자체 제거 (컴포넌트 파일 삭제). 용도(classifyTransaction) 기반 도넛·월 추이 2위젯만 유지 — 이들은 카테고리 집계라 개인 식별 없음.
**교훈:** ERP 원천 데이터를 그대로 화면에 노출할 때는 **모든 집계 축에서 개인 식별 위험 재검토 필수**. 한 위젯에 필터를 걸었다고 같은 필드를 쓰는 다른 위젯이 안전하다고 가정하면 안 됨. 이름·사번 패턴은 화면 렌더 직전에 감지·병합하는 유틸을 고려할 것 (`/^[가-힣]{2,4}([\s\-_]?\d{2,6})?$/` 패턴).
**커밋:** `f5941ae`

### 검증용 `git checkout <베이스라인>` 은 파괴적 액션 (2026-04-25)
**증상:** 이번 세션 전체 검증 중 "baseline 빌드가 성공하는지" 비교하려고 `git checkout e72b720` 을 실행. 이후 모든 Edit/Read 도구 호출에서 working tree가 pre-session 상태로 바뀌어 "이 파일이 변경됨" 리마인더가 폭주.
**원인:** `git checkout <commit>`은 working tree 파일을 해당 커밋 내용으로 **덮어쓴다**. 사용자 에디터에 열려있던 파일도 같이 바뀌어 혼란 유발. 다행히 원격에 push된 커밋들은 손상 없음.
**해결:** `git checkout main` 으로 복귀 → stash 복원 → 원상 회복. 소요 30초.
**교훈:** 빌드/린트 비교는 별도 **worktree** (`git worktree add`) 또는 **`git show <commit>:<file>`** 로 하는 게 안전. working tree를 이동시키는 명령은 사용자의 에디터 상태에 영향 주는 파괴적 액션 — 피해야 함. 라이브 작업 중에는 특히.


### 용도별 도넛/트렌드 카테고리 오분류 — memo 기반 분류의 함정 (2026-04-25)
**증상:** "용도별 사용 비중" 도넛이 회의 60%, 기타 28%, 식대 11%, 교통 1% 로 표시. 동일 페이지 위쪽 **계정별 예산** 카드는 식대 78% / 회의 15% / 교통 7% 로 정반대. "어디에 쓰는지 한눈에" 가 페이지의 핵심 가치인데 두 위젯이 서로 모순되는 정보를 던지고 있었음.
**원인:** `classifyTransaction(memo)` 가 거래의 자유 텍스트(`t_text`)를 한글 키워드 regex 로 재분류. 그런데 ERP 메모는 "재해복구훈련 점심", "AX 업무 회의 및 노트북 수령(택시)", "(공용)금융ITO인력간 인적네트워크활성화간담회" 처럼 **목적·수단·동석자가 한 줄에 섞여서** 들어옴. 결과적으로:
- 식대 거래의 "재해복구훈련 점심", "GC Unit 리더간 식사", "야간작업:크립토" 등이 키워드 미스로 → "기타" 또는 "회의" 로 오분류 (식대 20건 중 절반 가까이 오분류).
- 교통 거래의 "AX 업무 회의 및 노트북 수령" 두 건이 "회의" 키워드 매치로 → 회의로 오분류.
- 정작 회계 시스템에는 `acct_code` 가 식대=53001040 / 교통=53401010 / 회의=53405010 으로 **이미 정확하게 분류돼 있었음** — 도넛이 이 authoritative 분류 키를 무시하고 자체 regex 를 돌렸던 게 본질.
**해결:**
1. `CorpTransaction` 타입에 `acctCode: string` 추가, `useCorpCardLive.toTx()` 에서 `r.acct_code` 전파.
2. `classifyByAcctCode(acctCode)` 헬퍼 신설 — `classifyTransaction(memo)` 와 동일한 `{account, icon, label}` 인터페이스.
3. `CorpCardCategoryDonut` / `CorpCardCategoryTrend` 가 `classifyByAcctCode(t.acctCode)` 를 사용하도록 변경.
4. 동시에 두 위젯이 받는 `transactions` 를 `stats.txThisMonth` 로 좁힘 — 일별 바차트와 스코프 통일 (분기 누적이면 도넛이 매월 의미 흐려짐).
**교훈:** authoritative 분류 키(외부 시스템이 이미 정한 코드)가 있으면 **휴리스틱 재분류는 금지**. 자유 텍스트 재분류는 분류 키가 없을 때만 폴백으로 사용. 한 페이지에 같은 축의 정보를 두 번 표시할 때(계정별 예산 ↔ 용도 도넛) 두 위젯이 같은 소스에서 같은 결과를 내는지 반드시 교차 검증.
**관련 파일:** `src/lib/corpCardMockData.ts`, `src/hooks/useCorpCardLive.ts`, `src/components/v2/dashboard/CorpCardCategoryDonut.tsx`, `src/components/v2/dashboard/CorpCardCategoryTrend.tsx`, `src/components/v2/pages/CorpCardPage.tsx`