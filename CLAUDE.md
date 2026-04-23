# CLAUDE.md — 한울타리

> 이 파일은 Claude Code가 매 세션 자동 로드하는 **진입점**. 상세는 `docs/` 참조.

## 프로젝트
금융ITO 4팀(증권ITO/생명ITO/손보ITO/한금서) 조직문화 플랫폼 **한울타리**.
게더타운 스타일 메타버스 UI · VOC · 아이디어 · 공지 · KPI · 익명 쪽지 · 모임 · 평가 대시보드 · 미니게임 3종(줄넘기/오목/반응속도).
비공식 프로젝트 (비용 0원). 대상: 관리자 1 + 리더 4 + 팀원 ~60 + 팀장 1.

## 기술 스택
React 18 + Vite + TypeScript + Tailwind CSS / Zustand / React Router v6 / Recharts
Supabase (PostgreSQL + Auth + Realtime + Storage) / Cloudflare Pages / Lucide React

## 구조 요약
```
src/
├── routes/          — Login, Register, Main
├── components/      — metaverse/ mobile/ game/ voc/ idea/ notice/ note/
│                      gathering/ thread/ inbox/ dashboard/ kpi/ admin/
│                      layout/ common/
├── hooks/           — Supabase 쿼리 래퍼 (select/insert/update는 훅 경유, Storage·단발성 호출은 컴포넌트 내 허용)
├── stores/          — authStore, metaverseStore, uiStore
├── lib/             — supabase.ts, constants.ts, utils.ts, renju.ts, profanityFilter.ts
└── types/           — database.ts, metaverse.ts, index.ts
supabase/migrations/ — 001_init.sql, 002_rls.sql, 003_triggers.sql
```

## 불변 원칙 (MUST)
1. 테이블/스키마 DROP/TRUNCATE 금지 (마이그레이션 제외) — 행 DELETE는 RLS 보호 하에 허용
2. Supabase 쿼리 후 `{ data, error }` 체크 필수
3. `service_role_key` 프론트 사용 절대 금지 (anon key만)
4. RLS 의존 — 보안은 RLS, 프론트 권한 체크는 UX 목적
5. 익명 VOC: `author_id = NULL` (관리자도 확인 불가)
6. 익명 쪽지: `sender_id = NULL` (동일 익명 원칙)
7. `message_threads`: `sender_role`만 기록 (user_id 절대 저장 안 함)
8. `user_activities`: 자동 기록 전용 (사용자 직접 수정 불가)
9. 이메일 도메인: @hanwha 계열만 허용
10. 컴포넌트 분리는 응집도 기준 — 줄 수가 아니라 역할이 다를 때 분리 (억지 분리 금지)

## 프롬프트 기록 (MUST)
매 세션에서 사용자가 입력한 프롬프트(요청)를 `PROMPTS.md`에 날짜별로 기록한다.
- 형식: `## YYYY-MM-DD` 아래에 `- 프롬프트 내용` 목록
- 새 날짜면 헤딩 추가, 같은 날짜면 기존 목록에 이어서 추가
- 스크린샷 첨부 등 비텍스트는 `(스크린샷 첨부)` 로 표기

## 시행착오 기록 (MUST)
작업 중 시행착오·삽질·비자명한 교훈이 발생하면 `docs/ARCHITECTURE.md`의 `## 트러블슈팅 & 시행착오` 섹션에 기록한다.
- 형식: `### 제목 (날짜)` → 증상 / 원인 / 해결 / 교훈
- 사용자가 요청하지 않아도, 기록할 만한 내용이 있으면 **자동으로** 추가

## 수정 후 자체 검증 (MUST)
모든 코드 수정 완료 후, 아래 **3단계 검증**을 반드시 수행한 뒤 최종 결과를 전달한다.

### Phase 1: 위험성 리뷰 (코드를 읽으며 직접 점검)
수정한 모든 파일을 **처음부터 끝까지 다시 읽고** 아래 체크리스트를 확인한다:
1. **이벤트 충돌** — 새로 추가한 키보드/마우스 이벤트가 기존 핸들러와 겹치지 않는지
2. **상태 누수** — 컴포넌트 언마운트/삭제 후에도 이전 state가 남아있지 않는지
3. **드롭다운/모달 닫기** — 바깥 클릭·ESC로 정상 닫히는지, 중첩 모달 시 올바른 순서로 닫히는지
4. **타입 시그니처** — Props 인터페이스와 실제 전달 값의 타입이 정확히 일치하는지
5. **프로필/참조 데이터** — 새 데이터 생성 후 관련 조회 데이터(프로필 등)가 동기화되는지
6. **기존 피드백 위반** — `memory/` 의 피드백 메모리 (backdrop-filter, withTimeout 등)를 위반하지 않는지

### Phase 2: 실효성 검증 (빌드 + 흐름 추적)
1. **빌드 검증** — `npx tsc -b --noEmit` 실행하여 TypeScript 컴파일 에러 0건 확인
2. **관련 파일 영향도 분석** — 수정한 함수/타입/훅을 import하는 모든 파일을 Grep으로 찾아 호환성 확인
3. **RLS/보안 점검** — DB 쿼리 변경 시 RLS 정책과 충돌 없는지, anon key 범위 내인지 확인
4. **런타임 실효성** — 수정 의도대로 동작하는지 로직 흐름을 추적하여 검증 (데드코드·unreachable 경로 없는지)
5. **회귀 방지** — 기존 기능이 깨지지 않았는지 관련 컴포넌트·훅의 호출 흐름 점검

### Phase 3: 발견 즉시 수정 → 재검증 반복
- Phase 1~2에서 문제를 발견하면 **즉시 수정**하고, 수정 후 다시 Phase 2를 실행한다
- **0건이 될 때까지 반복** — "나중에 고치겠다"는 허용하지 않음

## 상세 문서 (필요 시 참조)
| 문서 | 내용 |
|------|------|
| `docs/ARCHITECTURE.md` | 기술 스택, 디렉토리 구조 상세, DB 테이블/RLS/트리거, Storage, 인증, 배포 |
| `docs/DESIGN.md` | 디자인 시스템(색상/폰트/호버), 적응형 UX, 코딩 규칙(SHOULD/PRACTICE) |
| `docs/FEATURES.md` | 13개 핵심 기능 상세, DB 스키마(CREATE TABLE), 게임/모임/캐릭터 커스텀, 평가 포인트 |
| `docs/ROADMAP.md` | Phase 1(완료)/2/3, Sprint 0~11 체크리스트, 텔레그램 봇 확장 설계 |
| `ITO_METAVERSE_PLAN.md` | 마스터 기획서 (의사결정 히스토리, 전체 맥락) |
| `OPERATIONS.md` | 관리자 운영 매뉴얼 |
| `README.md` | 사용자 안내 |

## 환경 변수
```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_ACCESS_TOKEN=sbp_xxx...
```
- 실제 값은 `.env.local` 참조 (gitignore 대상)
- DB 스키마 변경, 데이터 수정, 트리거/RLS 점검 등이 필요하면 `.env.local`의 `SUPABASE_ACCESS_TOKEN`으로 Management API 사용:
  ```
  curl -s "https://api.supabase.com/v1/projects/{PROJECT_REF}/database/query" \
    -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"query": "SQL문"}'
  ```
  `PROJECT_REF`는 `VITE_SUPABASE_URL`에서 추출 (https://**{ref}**.supabase.co)

## 배포
- 프론트: Cloudflare Pages · 커스텀 도메인 (`https://hwiki.site`)
- 백엔드: Supabase Cloud
- SPA: `public/_redirects` → `/* /index.html 200`
