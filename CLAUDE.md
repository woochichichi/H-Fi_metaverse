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
├── hooks/           — Supabase 쿼리 래퍼 (컴포넌트에서 직접 호출 금지)
├── stores/          — authStore, metaverseStore, uiStore
├── lib/             — supabase.ts, constants.ts, utils.ts, renju.ts, profanityFilter.ts
└── types/           — database.ts, metaverse.ts, index.ts
supabase/migrations/ — 001_init.sql, 002_rls.sql, 003_triggers.sql
```

## 불변 원칙 (MUST)
1. DB DELETE/DROP/TRUNCATE 금지 (마이그레이션 제외)
2. Supabase 쿼리 후 `{ data, error }` 체크 필수
3. `service_role_key` 프론트 사용 절대 금지 (anon key만)
4. RLS 의존 — 보안은 RLS, 프론트 권한 체크는 UX 목적
5. 익명 VOC: `author_id = NULL` (관리자도 확인 불가)
6. 익명 쪽지: `sender_id = NULL` (동일 익명 원칙)
7. `message_threads`: `sender_role`만 기록 (user_id 절대 저장 안 함)
8. `user_activities`: 자동 기록 전용 (사용자 직접 수정 불가)
9. 이메일 도메인: @hanwha 계열만 허용
10. 컴포넌트는 간결하게 유지 (200줄 초과 시 분리 검토, 단 억지 분리 금지 — 응집도 우선)

## 시행착오 기록 (MUST)
작업 중 시행착오·삽질·비자명한 교훈이 발생하면 `docs/ARCHITECTURE.md`의 `## 트러블슈팅 & 시행착오` 섹션에 기록한다.
- 형식: `### 제목 (날짜)` → 증상 / 원인 / 해결 / 교훈
- 사용자가 요청하지 않아도, 기록할 만한 내용이 있으면 **자동으로** 추가

## 수정 후 자체 검증 (MUST)
모든 코드 수정 완료 후, 아래 검증을 반드시 수행한 뒤 최종 결과를 전달한다.
1. **빌드 검증** — `npm run build` 실행하여 TypeScript 컴파일 에러·번들링 에러 0건 확인
2. **관련 파일 영향도 분석** — 수정한 함수/타입/훅을 import하는 모든 파일을 Grep으로 찾아 호환성 확인
3. **타입 안전성** — 변경된 인터페이스·타입이 기존 사용처와 불일치 없는지 검증
4. **RLS/보안 점검** — DB 쿼리 변경 시 RLS 정책과 충돌 없는지, anon key 범위 내인지 확인
5. **런타임 실효성** — 수정 의도대로 동작하는지 로직 흐름을 추적하여 검증 (데드코드·unreachable 경로 없는지)
6. **회귀 방지** — 기존 기능이 깨지지 않았는지 관련 컴포넌트·훅의 호출 흐름 점검
7. **200줄 규칙** — 수정 후 컴포넌트가 200줄을 초과하면 즉시 분리

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
- 프론트: Cloudflare Pages (`https://ito-metaverse.pages.dev`)
- 백엔드: Supabase Cloud
- SPA: `public/_redirects` → `/* /index.html 200`
