# ITO 메타버스

> 금융ITO 4개 팀(증권ITO / 생명ITO / 손보ITO / 한금서)의 조직문화 활동을 **게더타운 스타일 메타버스 UI**로 통합 관리하는 웹 플랫폼입니다.

**배포 URL**: https://ito-metaverse.pages.dev

---

## 이런 걸 할 수 있어요

| 기능 | 설명 |
|------|------|
| **메타버스 맵** | PC에서 WASD/방향키로 캐릭터를 이동하고, 각 방(Zone)에 들어가면 해당 기능이 열립니다 |
| **VOC 센터** | 익명/실명으로 VOC를 접수하고, 관리자와 양방향 익명 대화로 처리 과정을 추적합니다 |
| **아이디어 보드** | 아이디어를 등록하고 투표할 수 있습니다. 채택된 아이디어는 상태가 업데이트됩니다 |
| **공지게시판** | 시급성 3단계(긴급/할일/참고)로 공지를 등록하고, 읽음 현황을 추적합니다 |
| **KPI 관리실** | 유닛별 KPI 카드와 월별 추이 차트를 확인하고 실적을 입력합니다 |
| **익명 쪽지함** | 건의/질문을 익명으로 리더에게 전달하고, 양방향 대화로 소통합니다 |
| **개인 수집함** | 부재 중 받은 알림과 쪽지를 시급성별로 모아봅니다 |
| **평가 대시보드** | 팀원 활동이 자동 축적되고, 팀별 히트맵 + 개인 요약 + CSV 내보내기를 지원합니다 |
| **관리자 패널** | 초대 코드 발급 및 사용자 역할을 관리합니다 |

## 적응형 UX

| 환경 | 화면 |
|------|------|
| **PC** (1024px 이상) | 메타버스 맵 + WASD 캐릭터 이동 + Zone 입장 + 사이드바 |
| **모바일** (1024px 미만) | 하단 탭바(VOC / 아이디어 / 공지 / 쪽지 / 더보기) + 카드 대시보드 |

---

## 시작하기

### 1. 가입 방법

1. https://ito-metaverse.pages.dev 접속
2. **가입하기** 클릭
3. 관리자에게 받은 **초대 코드** 입력
4. 한화 계열사 이메일(@hanwha.com 등)로 가입
5. 이름과 소속 팀을 선택하면 완료!

### 2. 역할별 권한

| 역할 | 할 수 있는 것 |
|------|---------------|
| **member** | VOC 접수, 아이디어 등록/투표, 공지 읽기, 쪽지 보내기 |
| **leader** | 위 전부 + VOC 처리, 아이디어 상태 변경, 공지 작성, KPI 관리, 쪽지 답변 |
| **admin** | 위 전부 + 초대 코드 발급, 사용자 관리 |

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| 프론트엔드 | React 19 + Vite + TypeScript + Tailwind CSS v4 |
| 상태관리 | Zustand + React Router v7 |
| 차트 | Recharts |
| 아이콘 | Lucide React |
| 백엔드 | Supabase (Auth + PostgreSQL + Realtime + Storage) |
| 호스팅 | Cloudflare Pages (GitHub 연동 자동 배포) |

---

## 로컬 개발 (개발자용)

```bash
# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env.local
# .env.local에 Supabase URL과 anon key 입력

# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build
```

### 환경 변수 (.env.local)

```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...
```

### 프로젝트 구조

```
src/
├── routes/          — 페이지 (로그인, 가입, 메인)
├── components/
│   ├── metaverse/   — 맵, 캐릭터, Zone, 라운지
│   ├── mobile/      — 모바일 전용 레이아웃
│   ├── voc/         — VOC 관련 컴포넌트
│   ├── idea/        — 아이디어 보드
│   ├── notice/      — 공지사항
│   ├── note/        — 익명 쪽지함
│   ├── kpi/         — KPI 대시보드
│   ├── dashboard/   — 평가 대시보드 (히트맵, CSV)
│   ├── admin/       — 관리자 패널
│   ├── layout/      — TopBar, Sidebar
│   └── common/      — 공용 컴포넌트 (Badge, Toast 등)
├── hooks/           — Supabase 쿼리 훅
├── stores/          — 전역 상태 (인증, 메타버스, UI)
├── lib/             — Supabase 클라이언트, 상수, 유틸
└── types/           — TypeScript 타입
```

---

## 문의

프로젝트 관련 문의는 관리자에게 연락해주세요.
