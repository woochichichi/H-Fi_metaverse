# CLAUDE.md — 한울타리

> 이 파일은 Claude Code가 매 세션 자동 로드하는 **진입점**. 상세는 `docs/` 참조.

## 프로젝트
금융ITO 4팀(증권ITO/생명ITO/손보ITO/한금서) 조직문화 플랫폼 **한울타리**.
게더타운 스타일 메타버스 UI · VOC · 아이디어 · 공지 · KPI · 익명 쪽지 · 평가 대시보드.
비공식 프로젝트 (비용 0원). 대상: 관리자 1 + 리더 4 + 팀원 ~60 + 팀장 1.

## 기술 스택
React 18 + Vite + TypeScript + Tailwind CSS / Zustand / React Router v6 / Recharts
Supabase (PostgreSQL + Auth + Realtime + Storage) / Cloudflare Pages / Lucide React

## 구조 요약
```
src/
├── routes/          — Login, Register, Main
├── components/      — metaverse/ mobile/ voc/ idea/ notice/ note/ thread/
│                      inbox/ dashboard/ kpi/ admin/ layout/ common/
├── hooks/           — Supabase 쿼리 래퍼 (컴포넌트에서 직접 호출 금지)
├── stores/          — authStore, metaverseStore, uiStore
├── lib/             — supabase.ts, constants.ts, utils.ts
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
10. 컴포넌트 200줄 이하 (넘으면 분리)

## 상세 문서 (필요 시 참조)
| 문서 | 내용 |
|------|------|
| `docs/ARCHITECTURE.md` | 기술 스택, 디렉토리 구조 상세, DB 테이블/RLS/트리거, Storage, 인증, 배포 |
| `docs/DESIGN.md` | 디자인 시스템(색상/폰트/호버), 적응형 UX, 코딩 규칙(SHOULD/PRACTICE) |
| `docs/FEATURES.md` | 9개 핵심 기능 상세, DB 스키마(CREATE TABLE), 사용자 플로우, 평가 포인트 |
| `docs/ROADMAP.md` | Phase 1/2/3, Sprint 0~9 체크리스트, 텔레그램 봇 확장 설계 |
| `ITO_METAVERSE_PLAN.md` | 마스터 기획서 (의사결정 히스토리, 전체 맥락) |
| `OPERATIONS.md` | 관리자 운영 매뉴얼 |
| `README.md` | 사용자 안내 |

## 환경 변수
```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...
```

## 배포
- 프론트: Cloudflare Pages (`https://ito-metaverse.pages.dev`)
- 백엔드: Supabase Cloud
- SPA: `public/_redirects` → `/* /index.html 200`
