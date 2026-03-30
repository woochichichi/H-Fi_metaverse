# ROADMAP.md — 로드맵 & Sprint 계획

## Phase 로드맵

### Phase 1 (MVP) — 조직 유닛 중심
- 초대 코드 가입 · 메타버스 UI · VOC(양방향 익명 대화) · 아이디어 · 공지(시급성 3단계) · KPI
- 익명 쪽지함 + 개인 수집함(로그인 시 부재 중 알림/쪽지 모아보기)
- 활동 자동 축적 → 관리자 평가 대시보드

### Phase 2 — 전체 유닛 + 텔레그램
- 품질·전략·AX 유닛 Zone 추가
- 텔레그램 봇 알림 (새 VOC/공지 → 텔레그램 채널)
- 유닛별 KPI 커스터마이징 + 팀원 평가 연동

### Phase 3 — 금융ITO 전체
- 4개 팀 전용 공간
- 인사이트 공유 세션, 조직문화 진단(익명 설문)
- 대시보드 리포트 자동 생성

---

## Sprint 체크리스트

### Sprint 0: 프로젝트 초기 세팅
```
[ ] Vite + React + TypeScript + Tailwind + React Router 초기화
[ ] Supabase 프로젝트 생성
[ ] .env.local 설정 (URL + anon key)
[ ] supabase CLI로 migrations 적용 (001 + 002 + 003)
[ ] supabase gen types typescript → src/types/database.ts
[ ] src/lib/supabase.ts 클라이언트 초기화
[ ] src/lib/constants.ts (허용 이메일 도메인, 팀 목록 등)
[ ] GitHub repo 생성 + 첫 커밋
```

### Sprint 1: 인증 + 초대 코드 + 레이아웃
```
[ ] 로그인 페이지 UI (이메일 + 비밀번호)
[ ] 가입 페이지 UI (Step 1~4: 코드→이메일→비번→이름/팀)
[ ] 초대 코드 검증 로직
[ ] 이메일 도메인 검증 (@hanwha 계열만)
[ ] Supabase Auth signUp (메타데이터: name, team, role)
[ ] auth.users → profiles 트리거 동작 확인
[ ] Zustand authStore + useAuth 훅
[ ] TopBar + Sidebar (PC) / TopBar + BottomTabBar (모바일)
[ ] useDeviceMode 훅 (1024px 기준 분기)
[ ] 라우트 가드 (미로그인 → 로그인 페이지)
[ ] 시드: 관리자 계정 1개 + 초대 코드 1개
```

### Sprint 2: 메타버스 캔버스 (PC)
```
[ ] MapCanvas — 방, 복도, 가구 (기존 HTML → React)
[ ] CharacterSVG — 도트 캐릭터 SVG 컴포넌트
[ ] PlayerCharacter — WASD/방향키 이동
[ ] 카메라 팔로우 (뷰포트 중앙 추적)
[ ] Zone 컴포넌트 — 영역 감지 + Space 입장 힌트
[ ] NPCCharacter — 다른 접속자 (Realtime Presence)
[ ] ChatBubble — 랜덤 말풍선
[ ] 모바일: MobileHome (미니 메타버스 배너 + 접속자 수)
```

### Sprint 3: VOC + 양방향 익명 대화
```
[ ] VocPanel (PC Zone 패널 / 모바일 탭 콘텐츠)
[ ] VocForm (익명 토글 + 카테고리 + 제목/내용 + 첨부)
[ ] FileUpload 공통 컴포넌트 (Supabase Storage)
[ ] VocList (필터: 카테고리/상태/팀, 정렬)
[ ] VocCard (상태 뱃지, 익명 표시, 첨부 아이콘)
[ ] VocDetail (리더: 상태 변경, 담당 배정, 처리 결과)
[ ] VocStats (도넛 + 바 + 라인 차트)
[ ] ThreadPanel + ThreadMessage (양방향 익명 대화)
[ ] Realtime: 새 VOC INSERT 알림
[ ] 완전 익명: author_id NULL 테스트
```

### Sprint 4: 아이디어
```
[ ] IdeaPanel
[ ] IdeaCard (투표 수, 상태 라벨)
[ ] IdeaForm
[ ] 투표 토글 (낙관적 업데이트)
[ ] 정렬 (최신/투표순)
[ ] 상태 관리 (리더 드롭다운)
```

### Sprint 5: 공지 + 시급성 3단계
```
[ ] NoticePanel (고정 공지 상단 + 카테고리 탭)
[ ] NoticeList
[ ] NoticeDetail (읽음 자동 처리 + 첨부파일)
[ ] NoticeForm (리더: 제목/내용/카테고리/시급성/대상/고정/첨부)
[ ] 읽음 현황 (리더: 45/60명 읽음)
[ ] NotificationBell (TopBar 안읽은 공지 뱃지)
[ ] UrgencyBadge 컴포넌트 (🔴긴급/🟡할일/🔵참고)
```

### Sprint 6: KPI
```
[ ] KpiPanel (유닛별 필터)
[ ] KpiCard (진행률 바 + 전월 대비)
[ ] KpiChart (월별 추이 라인 차트)
[ ] KpiForm (리더: 월별 실적 입력)
```

### Sprint 7: 익명 쪽지함 + 개인 수집함
```
[ ] NotePanel, NoteForm, NoteList, NoteDetail, NoteCard
[ ] 익명 원칙: sender_id = NULL
[ ] ThreadPanel 재활용 (VOC+쪽지 공용 양방향 대화)
[ ] InboxPanel, InboxCard, InboxBadge
[ ] 시급성별 자동 정렬
[ ] 로그인 시 부재 중 알림/쪽지 모아보기
```

### Sprint 8: 관리자 + 라운지 + 평가 대시보드
```
[ ] InviteManager (코드 생성/목록/비활성화/복사)
[ ] UserManager (목록/역할 변경/비활성화)
[ ] 마음의소리 (기분 이모지 선택 → profiles 업데이트)
[ ] 활동 타임라인 (최근 활동 피드)
[ ] EvalDashboard, TeamHeatmap, UserActivityCard, ExportCsv
[ ] user_activities 자동 기록 트리거
```

### Sprint 9: 디자인 폴리시 + 배포
```
[ ] 메타버스 맵 비주얼 개선 (기존 HTML 수준)
[ ] 모바일 전체 화면 QA (375px, 414px)
[ ] PC QA (1024px, 1440px)
[ ] Cloudflare Pages 배포 (GitHub 연동)
[ ] _redirects 파일 (SPA 라우팅)
```

---

## 향후 확장 설계 (Phase 2)

### 텔레그램 봇 연동
```
[Supabase DB] → (INSERT 트리거) → [Supabase Edge Function] → [Telegram Bot API]
```
- 새 VOC INSERT → notifications에 레코드 추가 → Edge Function이 감지
- Edge Function이 channel='telegram'인 알림을 Telegram Bot API로 전송
- 회사 폐쇄망에서는 안 되지만, 개인 폰으로 텔레그램 알림 수신 가능
- 사전 준비 (이미 설계에 포함): `notifications` 테이블에 `channel` 컬럼 ('web' | 'telegram')
- 나중에 Edge Function + Bot Token만 추가하면 연동 완료
