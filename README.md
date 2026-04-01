# 한울타리

> 본사든 사이트든, 같은 울타리 안에서.
> 금융ITO 4개 팀(증권ITO / 생명ITO / 손보ITO / 한금서)이 하나로 모이는 온라인 공간입니다.

**접속**: https://h-fi-metaverse.pages.dev

---

## 왜 한울타리인가요?

금융ITO는 본사와 여러 사이트에 흩어져 일합니다.
물리적 거리 때문에 생기는 소속감의 차이, "우리 팀"이라는 느낌의 희미해짐 — 한울타리는 이 간극을 줄이기 위해 만들었습니다.

- **조직 정체성**: 흩어져 있어도 금융ITO라는 하나의 팀
- **소속감**: 내 목소리가 닿고, 반응이 돌아오는 경험
- **연결**: 본사-사이트 간 이질감 없이 같은 공간에서 소통

---

## 이런 걸 할 수 있어요

| 기능 | 설명 |
|------|------|
| **메타버스 맵** | PC에서 캐릭터를 움직여 각 방에 들어가면 해당 기능이 열립니다. 포탈을 통해 4개 독립 룸을 자유롭게 이동합니다 |
| **VOC 센터** | 현장의 목소리를 익명/실명으로 전달하고, 양방향 대화로 해결 과정을 함께 추적합니다 |
| **아이디어 보드** | 누구나 아이디어를 올리고 투표할 수 있습니다. 좋은 아이디어는 실제로 채택됩니다 |
| **공지게시판** | 긴급/할일/참고 3단계로 공지를 나눠, 중요한 건 놓치지 않게 합니다 |
| **KPI 관리실** | 유닛별 KPI 현황과 월별 추이를 한눈에 확인하고 실적을 입력합니다 |
| **익명 쪽지함** | 말하기 어려운 건의·질문을 익명으로 보내고, 답변도 익명으로 받습니다 |
| **개인 수집함** | 부재 중 받은 알림과 쪽지를 시급성별로 모아봅니다 |
| **평가 대시보드** | 팀원 활동이 자동으로 쌓이고, 팀별 히트맵·개인 요약·CSV 내보내기를 제공합니다 |
| **모임방** | 소규모 모임을 익명으로 모집하고, 마감 후 참여자가 공개됩니다 |
| **오목** | 동료와 실시간 대전. 랭킹 시스템으로 순위를 확인하세요 |
| **라운지** | 오늘 기분 이모지를 공유하고, 팀의 활동 타임라인을 둘러봅니다 |

## PC와 모바일 모두 지원

- **PC**: 메타버스 맵에서 캐릭터를 이동하며 각 방에 입장 (포탈로 멀티룸 전환)
- **모바일**: 하단 탭으로 VOC / 아이디어 / 공지 / 쪽지 등에 바로 접근

---

## 시작하기

1. https://h-fi-metaverse.pages.dev/ 접속
2. **가입하기** 클릭
3. 관리자에게 받은 **초대 코드** 입력 (증권ITO 전우형 프로에게 문의)
4. 한화 계열사 이메일(@hanwha.com 등)로 가입
5. 이름과 소속 팀을 선택하면 완료!

### 역할

| 역할 | 할 수 있는 것 |
|------|---------------|
| **member** | VOC 접수, 아이디어 등록/투표, 공지 읽기, 쪽지 보내기, 오목, 모임 참여 |
| **leader** | 위 전부 + VOC 처리, 아이디어 상태 변경, 공지 작성, KPI 관리, 쪽지 답변 |
| **admin** | 위 전부 + 초대 코드 발급, 사용자 관리, 평가 대시보드, 커스텀 평가항목 |

---

## 안전하게 운영됩니다

- **초대 코드 필수**: 코드 없이는 가입할 수 없습니다
- **한화 계열사 이메일만**: @hanwha 도메인 외 가입 불가
- **완전한 익명 보장**: 익명 VOC·쪽지는 관리자도 작성자를 알 수 없습니다

(정말입니다. 그렇다고 욕설,비하는 안됩니다. 비겁합니다!
매우 자세한 설명을 하자면,
- 익명 VOC
author_id: anonymous ? null : user?.id — 익명 선택 시 author_id에 null 저장
및 동일하게 author_id: null로 INSERT
- 익명 쪽지
sender_id: anonymous ? null : user?.id — 익명 선택 시 sender_id에 null 저장
및 동일하게 sender_id: null로 INSERT

DB에 아예 사용자 ID를 저장하지 않기 때문에, 
Supabase 콘솔에서 직접 DB를 조회해도 누가 썼는지 알 수 없습니다. 
anonymous boolean 플래그만 있고, 실제 작성자 정보는 물리적으로 존재하지 않습니다.)

- **역할 기반 접근**: RLS(Row Level Security)로 역할에 따라 데이터 접근이 제한됩니다

---

## 기술 스택

| 분류 | 기술 |
|------|------|
| **프론트엔드** | React 19 · TypeScript 5.9 · Vite 8 · Tailwind CSS 4 |
| **상태 관리** | Zustand 5 |
| **라우팅** | React Router DOM 7 |
| **차트** | Recharts 3 |
| **아이콘** | Lucide React |
| **백엔드** | Supabase (PostgreSQL · Auth · Realtime · Storage) |
| **배포** | Cloudflare Pages (push to main → 자동 배포) |

---

## 개발 환경 설정

```bash
# 1. 의존성 설치
npm install

# 2. 환경 변수 설정 (.env 파일 생성)
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...

# 3. 개발 서버 실행
npm run dev          # http://localhost:5173

# 4. 빌드
npm run build        # tsc -b && vite build

# 5. 린트
npm run lint
```

### DB 마이그레이션

Supabase SQL Editor에서 순서대로 실행:

```
supabase/migrations/001_init.sql     — 테이블 + 인덱스
supabase/migrations/002_rls.sql      — Row Level Security
supabase/migrations/003_triggers.sql — 자동 프로필 생성 + updated_at
```

---

## 프로젝트 구조

```
src/
├── routes/          — LoginPage, RegisterPage, MainPage
├── components/
│   ├── metaverse/   — 맵 캔버스, 캐릭터, 존, 포탈, 채팅 버블
│   ├── mobile/      — 모바일 레이아웃, 홈, 하단 탭
│   ├── voc/         — VOC 패널, 폼, 리스트, 상세, 통계
│   ├── idea/        — 아이디어 패널, 카드, 폼
│   ├── notice/      — 공지 패널, 리스트, 상세, 폼
│   ├── note/        — 쪽지 패널, 폼, 리스트, 상세
│   ├── thread/      — 양방향 대화 스레드
│   ├── inbox/       — 통합 수집함
│   ├── dashboard/   — 평가 히트맵, 활동 카드, CSV 내보내기
│   ├── kpi/         — KPI 패널, 카드, 차트, 폼
│   ├── admin/       — 초대 코드·사용자 관리
│   ├── game/        — 오목 게임
│   ├── gathering/   — 모임방
│   ├── activity/    — 활동 기록
│   ├── layout/      — 상단바, 사이드바, 기분 이모지, 닉네임
│   └── common/      — 모달, 토스트, 버튼, 배지, 파일 업로드
├── hooks/           — Supabase 쿼리 래퍼 (18+)
├── stores/          — authStore, metaverseStore, uiStore
├── lib/             — supabase.ts, constants.ts, utils.ts
└── types/           — database.ts, metaverse.ts, index.ts
```

## 상세 문서

| 문서 | 내용 |
|------|------|
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | 기술 스택, DB 테이블/RLS/트리거, Storage, 인증, 배포 상세 |
| [DESIGN.md](docs/DESIGN.md) | 디자인 시스템 (노을 테마 색상, 폰트, 컴포넌트 규칙) |
| [FEATURES.md](docs/FEATURES.md) | 핵심 기능 상세 스펙, DB 스키마, 사용자 플로우, 평가 포인트 |
| [ROADMAP.md](docs/ROADMAP.md) | Phase 1/2/3, Sprint 체크리스트 |
| [OPERATIONS.md](OPERATIONS.md) | 관리자 운영 매뉴얼 |

---

## 만든 사람들

금융ITO 조직문화 TF에서 비용 0원으로 만들고 있는 비공식 프로젝트입니다.
대상: 관리자 1명 + 리더 4명 + 팀원 ~60명 + 팀장 1명.
문의는 관리자에게 연락해주세요.
