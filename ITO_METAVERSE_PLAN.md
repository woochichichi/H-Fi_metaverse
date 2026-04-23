# 금융ITO 메타버스 — 마스터 프로젝트 계획

> **관리**: 웹 Claude (기획/프롬프트 생성)  
> **구현**: Claude Code (Anthropic 공식 CLI, 터미널에서 직접 개발)  
> **최종 수정**: 2026-03-30 v4 (시급성 3단계 / 익명 쪽지함 / 수집함 / 양방향 대화 / 평가 대시보드 추가)

---

## 1. 프로젝트 개요

### 한 줄 요약
금융ITO 4개 팀의 조직문화 활동·KPI·공지·VOC·아이디어를 **게더타운 스타일 메타버스 UI**로 통합 관리하는 웹앱.

### 해결하려는 문제
| 현재 | 목표 |
|------|------|
| 활동 정보가 메일·메모·카톡에 산개 | 한 곳에서 한눈에 확인 |
| 해야할 일·단순공지·긴급사항이 뒤섞여 전송 → 피곤·누락·망각 | 시급성 3단계(🔴긴급/🟡할일/🔵참고) 자동 분류 + 차등 알림 |
| 팀장이 유닛 활동 내역을 모름 | 실시간 공유 + 활동 자동 축적 → 관리자 평가 대시보드 |
| VOC가 구두·DM으로 유실 | 구조화된 접수·추적·통계 + 양방향 익명 대화 |
| 건의 사항을 올리기 어려움 (수직적) | 익명 쪽지함으로 수평적 전달 + 로그인 시 수집함 확인 |
| 평가 시즌에 증적 몰아서 정리 | 일상 활동이 자연스럽게 기록 → 평가 시 자동 조회 |
| 팀 간 교류 부족 | 메타버스 공간에서 자연스러운 인터랙션 |

### 프로젝트 성격
- **비공식 프로젝트** — 팀장/담당님은 모름. 완성 후 결과물로 보여줄 예정
- 마감 압박 없음 — 품질 우선, 스프린트 여유 있게
- 비용 0원 목표 — Supabase 무료 티어 + Cloudflare Pages 무료

### 대상 사용자
| 역할 | 인원 | 접속 기기 | 주 사용 기능 |
|------|------|----------|-------------|
| 관리자 (우형) | 1명 | PC + 모바일 | 전체 관리, 초대 코드, VOC 처리, 평가 대시보드 |
| 유닛 리더 | 4명 | PC 위주 | 활동 등록, VOC 관리, 공지 작성, KPI 입력, 익명 쪽지 답변 |
| 일반 팀원 | ~60명 | **PC + 모바일 반반** | VOC 제출, 아이디어 투표, 공지 확인, 익명 쪽지 발송, 수집함 확인 |
| 팀장 | 1명 | PC | KPI 대시보드, 활동 내역 조회, 팀원별 참여 현황 (향후) |

### 확장 로드맵
```
Phase 1 (MVP) — 조직 유닛 중심
  └── 초대 코드 가입 · 메타버스 UI · VOC(양방향 익명 대화) · 아이디어 · 공지(시급성 3단계) · KPI
  └── 익명 쪽지함 + 개인 수집함(로그인 시 부재 중 알림/쪽지 모아보기)
  └── 활동 자동 축적 → 관리자 평가 대시보드

Phase 2 — 전체 유닛 + 텔레그램
  └── 품질·전략·AX 유닛 Zone 추가
  └── 텔레그램 봇 알림 (새 VOC/공지 → 텔레그램 채널)
  └── 유닛별 KPI 커스터마이징 + 팀원 평가 연동

Phase 3 — 금융ITO 전체
  └── 4개 팀 전용 공간
  └── 인사이트 공유 세션, 조직문화 진단(익명 설문)
  └── 대시보드 리포트 자동 생성
```

---

## 2. 기술 스택

### 아키텍처
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

**별도 백엔드 서버 없음.** 프론트엔드만 개발.

### 선택 근거
| 영역 | 선택 | 근거 |
|------|------|------|
| 언어 | TypeScript | 타입 안전 → AI 코딩 오류 감소 |
| 프론트 | React 18 + Vite + Tailwind CSS | 메타버스 캔버스 + 대시보드에 최적 |
| 상태 | Zustand | 가볍고 보일러플레이트 최소 |
| 라우팅 | React Router v6 | SPA 표준 |
| 차트 | Recharts | React 네이티브, VOC/KPI 통계용 |
| DB | Supabase PostgreSQL | 무료 500MB, RLS |
| 인증 | Supabase Auth | 이메일/비번 + 도메인 제한 |
| 실시간 | Supabase Realtime | Postgres Changes 구독 |
| 파일 | Supabase Storage | 3개 버킷 (VOC/공지/프로필) |
| 호스팅 | Cloudflare Pages | 무료, CDN, Git 자동 배포 |
| Git | GitHub (개인 계정) | CF Pages 연동 |
| 개발도구 | Claude Code (Anthropic CLI) | 터미널에서 직접 개발, CLAUDE.md 자동 참조 |

### 배포
- **프론트**: `https://hwiki.site` (Cloudflare Pages 커스텀 도메인)
- **백엔드**: `https://{ref}.supabase.co`
- **접근 제어**: 초대 코드 + @hanwha 이메일만 가입 가능

### 무료 티어 확인
| 서비스 | 한도 | 예상 | 판정 |
|--------|------|------|------|
| Supabase DB | 500MB | ~60명, 월 수백 건 | ✅ |
| Supabase Auth | 50K MAU | ~70명 | ✅ |
| Supabase Realtime | 200 동시 | ~30명 | ✅ |
| Supabase Storage | 1GB | 프로필+VOC+공지 첨부 | ✅ |
| CF Pages | 무제한 대역폭 | SPA 1개 | ✅ |

---

## 3. 입장 관리 (초대 코드 + 이메일 도메인)

### 가입 플로우 (사용자 관점)

```
1. URL 접속 → 로그인 화면
2. "가입하기" 클릭
3. [Step 1] 초대 코드 입력
   → 검증: 존재 + active + 횟수 미초과 + 미만료
   → 실패: "유효하지 않은 초대 코드입니다"
   → 성공: 다음 단계로
4. [Step 2] 이메일 입력 (@hanwha 계열만)
   → "hanwha.com, hanwhasystems.com" 등 허용 도메인 목록
   → 비허용 도메인: "회사 이메일(@hanwha)로만 가입 가능합니다"
5. [Step 3] 비밀번호 설정 (8자 이상)
6. [Step 4] 이름 + 팀 선택
   → 초대 코드에 팀 지정 시 자동 배정 + 선택 비활성화
   → 팀 선택지: 증권ITO / 생명ITO / 손보ITO / 한금서
7. [Step 5] Supabase 이메일 인증 (선택적 — 초기에는 비활성화 가능)
8. 가입 완료 → 자동 로그인 → 메타버스 입장
```

### 초대 코드 관리 (관리자 관점)

```
관리자 패널 → "초대 코드" 탭
  ├── [코드 생성] 버튼
  │   ├── 코드 형식: "FITO-XXXX-XXXX" (자동 생성)
  │   ├── 대상 팀: 전체 / 특정 팀
  │   ├── 역할: member (기본) / leader
  │   ├── 최대 사용 횟수: 1~100 (기본 10)
  │   └── 만료일: 설정 / 무제한
  │
  ├── [코드 목록]
  │   ├── 코드 | 팀 | 사용 현황 (3/10) | 만료일 | 상태
  │   └── 비활성화 토글
  │
  └── [코드 복사] 버튼 → 카톡으로 공유
```

---

## 4. 모바일 적응형 UX 설계

### 핵심 원칙
> **PC에서는 메타버스가 재미**, **모바일에서는 빠른 접근이 재미**.
> 같은 데이터, 다른 인터페이스.

### PC (1024px 이상) — 메타버스 모드
```
┌─────────────────────────────────────────────────────┐
│ TopBar: 로고 | 피플 | 접속자 | 📬수집함 | 🔔알림 | 프로필      │
├──────────────────────────────────────┬──────────────┤
│                                      │              │
│   [메타버스 캔버스]                    │  Sidebar     │
│   캐릭터 WASD/방향키 이동             │  - 피플 목록  │
│   Zone 진입 → 풀 패널 열림            │  - 최근 알림  │
│                                      │              │
│   ┌──────┐  ┌──────┐  ┌──────┐      │              │
│   │📞VOC│  │📊KPI│  │☕라운지│      │              │
│   └──────┘  └──────┘  └──────┘      │              │
│   ┌──────┐  ┌──────┐  ┌──────┐      │              │
│   │💡아이│  │📋공지│  │✉️쪽지│      │              │
│   │디어  │  │게시판│  │  함  │      │              │
│   └──────┘  └──────┘  └──────┘      │              │
│                                      │              │
├──────────────────────────────────────┴──────────────┤
│ BottomBar: 이동 힌트 | 이모지 | 퀵 액션 버튼         │
└─────────────────────────────────────────────────────┘
```

### 모바일 (1023px 이하) — 카드 모드
```
┌───────────────────────┐
│ TopBar: 로고 | 🔔 | 📬 | 👤│  ← 📬 수집함 아이콘 (안읽은 수 뱃지)
├───────────────────────┤
│                       │
│ [미니 메타버스 배너]     │  ← 캐릭터 + 접속자 수 + 기분 이모지
│ "7명 접속중 🏢"        │     탭하면 PC에서 보세요 안내 or 간소화 맵
│                       │
│ ┌─────────────────┐   │
│ │ 📬 수집함 3건     │   │  ← 부재 중 쪽지/알림 모아보기 (로그인 시 우선 표시)
│ └─────────────────┘   │
│                       │
│ ┌─────────────────┐   │
│ │ 🔴 긴급 공지 1건  │   │  ← 시급성 긴급 (빨간 강조)
│ └─────────────────┘   │
│                       │
│ ┌─────────────────┐   │
│ │ 📢 새 공지 2건    │   │  ← 일반 알림 카드 (안읽은 것)
│ └─────────────────┘   │
│                       │
│ ┌─────────────────┐   │
│ │ 💡 인기 아이디어   │   │  ← 투표 수 TOP 3
│ │  AI 음성봇 ❤️ 9  │   │
│ └─────────────────┘   │
│                       │
│ ┌─────────────────┐   │
│ │ 📊 KPI 요약      │   │  ← 진행률 바 미니 버전
│ └─────────────────┘   │
│                       │
├───────────────────────┤
│ 📞  💡  📋  ✉️  ☕    │  ← 하단 탭바 (5개)
│ VOC 아이디어 공지 쪽지 더보기│
└───────────────────────┘
```

### 기기 분기 로직
```typescript
// src/hooks/useDeviceMode.ts
const useDeviceMode = () => {
  const isPC = useMediaQuery('(min-width: 1024px)')
  // PC: MetaverseLayout (맵 + 사이드바)
  // 모바일: MobileLayout (카드 + 탭바)
  return isPC ? 'metaverse' : 'mobile'
}
```

### 공통 규칙 (양쪽 모두)
- 터치 타겟 최소 44x44px
- 모든 인터랙티브 요소에 `cursor-pointer`
- 트랜지션 150~300ms
- 로딩 시 스켈레톤 스크린
- 에러 메시지는 문제 발생 위치 근처에 표시

---

## 5. 기능별 상세 설계 (사용자 플로우)

### 5.1 VOC (Voice of Customer)

#### 5.1.1 VOC 접수 (일반 팀원)

**진입**: PC — VOC Zone 입장 → "VOC 접수" 버튼 / 모바일 — 하단 탭 "VOC" → "+" FAB 버튼

**폼 필드**:
| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| 익명 여부 | 토글 스위치 | ✅ | 기본값 ON (익명). OFF 시 이름 표시 |
| 카테고리 | 칩 선택 | ✅ | 불편 / 요청 / 칭찬 / 개선 / 기타 |
| 대상 영역 | 칩 선택 | | 업무환경 / 성장 / 관계 / 기타 |
| 제목 | 텍스트 (100자) | ✅ | |
| 내용 | 텍스트에어리어 (1000자) | ✅ | |
| 첨부파일 | 파일 선택 | | 이미지/PDF, 최대 5MB, 3개까지 |

**제출 시 동작**:
```
1. 프론트: 폼 유효성 검증
2. 첨부파일 있으면 → Supabase Storage 'voc-attachments' 버킷 업로드
3. VOC 레코드 INSERT
   - 익명 ON → author_id = NULL (완전 익명, DB에도 흔적 없음)
   - 익명 OFF → author_id = 현재 유저 ID
   - team = 현재 유저의 팀 (익명이어도 팀은 기록 — 팀별 통계용)
   - attachment_urls = Storage 경로 배열
4. 성공 → 토스트 "📞 VOC가 접수되었습니다"
5. Realtime → 리더들에게 알림
```

**완전 익명 구현 상세**:
- `author_id`가 NULL이면 UI에서 "익명" 표시
- RLS 정책: 익명 VOC는 INSERT 시 author_id = NULL 허용
- **관리자(우형)도 DB에서 작성자 확인 불가** — author_id 자체가 없음
- 팀 필드는 기록 (팀별 통계는 필요하므로)
- Storage 파일명: UUID 기반 (사용자 정보 노출 없음)

#### 5.1.2 VOC 목록 조회 (모든 로그인 사용자)

**진입**: PC — VOC Zone / 모바일 — VOC 탭

**UI 구성**:
```
[필터 바]
  카테고리: 전체 | 불편 | 요청 | 칭찬 | 개선
  상태: 전체 | 접수 | 검토중 | 처리중 | 완료
  팀: 전체 | 증권ITO | 생명ITO | 손보ITO | 한금서
  정렬: 최신순 | 오래된순

[VOC 카드 리스트]
  ┌───────────────────────────────┐
  │ [불편] 🔴 ARS 메뉴 3번 인식 안됨   │
  │ 익명 · 증권ITO · 2시간 전          │
  │ 상태: 처리중 · 담당: 우형프로        │
  │ 📎 2개                           │
  └───────────────────────────────┘
```

**상태 뱃지 색상**:
| 상태 | 색상 | 의미 |
|------|------|------|
| 접수 | 회색 | 아직 확인 안 함 |
| 검토중 | 파랑 | 리더가 확인 중 |
| 처리중 | 주황 | 담당자 배정, 진행 중 |
| 완료 | 초록 | 처리 완료 |
| 보류 | 빨강 | 사유와 함께 보류 |

#### 5.1.3 VOC 처리 (리더/관리자만)

**VOC 카드 클릭 → 상세 패널 열림**

**리더 액션**:
```
[상태 변경] 드롭다운 → 접수/검토중/처리중/완료/보류
[담당자 배정] 유저 검색 → 선택
[처리 결과] 텍스트에어리어 (완료/보류 시 필수)
[저장] 버튼
```

**저장 시 동작**:
```
1. vocs 테이블 UPDATE (status, assignee_id, resolution, updated_at)
2. 성공 → 토스트
3. Realtime → VOC 작성자(실명인 경우)에게 상태 변경 알림
```

#### 5.1.5 양방향 익명 대화 (Suggestion Ox 참고)

> 익명 VOC에 대해 리더가 후속 질문/안내를 하고, 작성자가 익명 상태로 답변할 수 있는 구조.
> **핵심 원칙**: 양쪽 모두의 익명성 보장. 리더는 "관리자"로만 표시, 작성자는 "익명"으로만 표시.

**구현 방식**:
```
voc_threads 테이블 활용
  ├── voc_id (원본 VOC 참조)
  ├── sender_role ('author' | 'manager')  ← 실제 유저 ID는 저장하지 않음
  ├── message TEXT
  ├── created_at
  └── 접근 방식:
      - 익명 VOC: author_id가 NULL이므로 세션 기반 토큰으로 작성자 식별
      - 토큰은 VOC 제출 시 1회 발급 → localStorage에 저장
      - 해당 토큰 보유자만 '작성자' 입장에서 대화 가능
```

**사용자 플로우**:
```
[리더가 VOC 상세에서]
  → "질문하기" 버튼 → 메시지 입력 → 전송
  → 작성자에게 알림: "관리자가 VOC #123에 메시지를 남겼습니다"

[작성자가 VOC 상세에서]
  → 기존 대화 스레드 확인 → 답변 입력 → 전송
  → 리더에게 알림: "익명 작성자가 VOC #123에 답변했습니다"
```

**익명 토큰 방식의 한계와 대안**:
- 브라우저 변경/캐시 삭제 시 토큰 유실 → 대화 접근 불가
- 대안: 실명 VOC는 일반 user_id 기반, 익명 VOC만 토큰 방식
- MVP에서는 익명 VOC의 양방향 대화를 "선택 기능"으로 제공 (토큰 발급 동의 시)

#### 5.1.4 VOC 통계 (리더/관리자)

**차트 구성**:
- 카테고리별 건수 (도넛 차트)
- 팀별 건수 (수평 바 차트)
- 월별 추이 (라인 차트)
- 상태별 비율 (스택 바)
- 평균 처리 시간 (숫자 카드)

---

### 5.2 아이디어 보드

#### 5.2.1 아이디어 등록

**진입**: PC — 아이디어 Zone / 모바일 — 아이디어 탭 → "+" FAB

**폼 필드**:
| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| 제목 | 텍스트 (100자) | ✅ | |
| 설명 | 텍스트에어리어 (500자) | ✅ | |
| 카테고리 | 칩 선택 | | 이벤트 / 인적교류 / 업무개선 / 기타 |

**제출 시**: INSERT + 토스트 "💡 아이디어가 공유되었습니다!" + Realtime 알림

#### 5.2.2 아이디어 목록 + 투표

```
[정렬] 최신순 | 인기순 (투표 수)
[필터] 카테고리 | 상태

[아이디어 카드]
  ┌───────────────────────────────┐
  │ 💡 AI 음성봇 도입                │
  │ STT/TTS 기반 1차 상담 자동화     │
  │                               │
  │ 🏷 업무개선 · 우형 · 3일 전       │
  │                               │
  │ [❤️ 9] [상태: 검토]             │  ← 하트 탭 = 투표 토글
  └───────────────────────────────┘
```

**투표 동작**:
```
1. 좋아요 버튼 탭
2. 낙관적 업데이트 (즉시 +1 표시)
3. idea_votes INSERT or DELETE (토글)
4. 실패 시 롤백
```

#### 5.2.3 아이디어 상태 관리 (리더만)

상태 흐름: `제안 → 검토 → 채택 → 진행중 → 완료` 또는 `반려`

리더가 아이디어 카드에서 상태 드롭다운으로 변경.

---

### 5.3 공지사항

> **정보 시급성 3단계 분류** (SnapComms 참고): 모든 공지에 시급성 레벨을 부여하여 수신자가 "지금 봐야 하는 것 / 이번 주 내 처리 / 나중에 참고"를 즉시 판단할 수 있게 한다.

| 시급성 | 뱃지 | 알림 방식 | 예시 |
|--------|------|----------|------|
| 🔴 긴급 | 빨간 뱃지 + 상단 배너 | 푸시 알림 + 메타버스 팝업 + (향후) 텔레그램 | 일정 변경, 장애 공지 |
| 🟡 할일 | 주황 뱃지 | 알림 벨 + 수집함 | 이벤트 참여 안내, 설문 요청 |
| 🔵 참고 | 파란 뱃지 | 수집함에 조용히 적재 | 활동 보고, FYI 공유 |

#### 5.3.1 공지 작성 (리더/관리자)

**폼 필드**:
| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| 제목 | 텍스트 (200자) | ✅ | |
| 내용 | 리치 텍스트 (마크다운 or 일반) | ✅ | |
| 시급성 | 선택 | ✅ | 🔴긴급 / 🟡할일 / 🔵참고 (기본값: 🔵참고) |
| 카테고리 | 선택 | ✅ | 일반 / 이벤트 / 활동보고 |
| 대상 | 선택 | | 전체 / 특정 유닛 / 특정 팀 |
| 상단 고정 | 토글 | | 기본 OFF (🔴긴급 선택 시 자동 ON 제안) |
| 첨부파일 | 파일 선택 | | 이미지/PDF, 최대 10MB, 5개까지 |

#### 5.3.2 공지 목록

```
[고정 공지] — 상단 고정, 📌 아이콘
  ┌─ 📌 🔴 4월 인적교류 일정 변경 안내 ─────────┐
  │ 조직유닛 · 2시간 전 · 읽음 45/60              │
  └──────────────────────────────────────┘

[시급성 필터] 전체 | 🔴긴급 | 🟡할일 | 🔵참고
[카테고리 탭] 전체 | 일반 | 이벤트 | 활동보고

  ┌─ 🟡 [이벤트] 3월 생일자 이벤트 참여 요청 ───┐
  │ 조직유닛 · 1주 전 · 📎 3개 · 🔵 안읽음    │
  └──────────────────────────────────────┘
  ┌─ 🔵 [활동보고] VOC 3월 처리 현황 ──────────┐
  │ 조직유닛 · 3일 전 · ✅ 읽음                │
  └──────────────────────────────────────┘
```

**안읽음 표시**: TopBar 벨 아이콘에 빨간 뱃지 (안읽은 공지 수)

#### 5.3.3 공지 상세 + 읽음 추적

```
공지 카드 클릭 → 상세 패널

[제목]
[내용]
[첨부파일 목록] — 클릭 → 다운로드/미리보기
[읽음 현황] — "45/60명 읽음" + 읽은 사람 목록 (리더만 볼 수 있음)
```

**읽음 처리**: 상세 패널 열리면 자동으로 notice_reads INSERT (이미 있으면 무시)

---

### 5.4 KPI 대시보드

#### 5.4.1 KPI 현황 조회 (모든 사용자)

```
[유닛 필터] 조직 | 품질 | 전략 | AX | 전체

[KPI 카드 그리드]
  ┌─────────────────────────┐
  │ 📊 VOC 처리율              │
  │ ████████████░░ 87%       │
  │ 현재 87% / 목표 95%       │
  │ 📈 +5% (전월 대비)        │
  └─────────────────────────┘

[월별 추이 차트] — 라인 차트 (recharts)
  X축: 월, Y축: 점수/달성률
```

#### 5.4.2 KPI 실적 입력 (리더/관리자)

```
KPI 카드 클릭 → 실적 입력 패널

[월 선택] 드롭다운 (2026-03 등)
[점수] 숫자 입력 (0~3)
[증적 설명] 텍스트에어리어
[저장]
```

---

### 5.5 라운지 (커뮤니티)

#### 5.5.1 마음의소리 (기분 공유)

```
[기분 선택 그리드] — 8개 이모지
  😆최고  😊좋아요  😐보통  😰힘들어
  🤯바빠  😴졸려   🔥열정  ☕커피중

[오늘의 팀 기분] — 최근 기분 목록
  🔥 우형 09:00
  😊 지연 09:15
```

**동작**: 이모지 클릭 → profiles.mood_emoji UPDATE + 메타버스 캐릭터 위에 표시

#### 5.5.2 활동 타임라인

```
[최근 활동 피드] — 시간순
  📞 새 VOC 접수 — 증권ITO · 10분 전
  💡 아이디어 "AI 음성봇" 채택됨 · 1시간 전
  📋 공지 "4월 일정" 등록 · 3시간 전
  🎉 현우님이 입장했습니다 · 4시간 전
```

---

### 5.6 익명 쪽지함 ✉️ (신규 — Suggestion Ox / FaceUp 참고)

> **핵심 가치**: 팀 내 건의 사항을 수평적으로 전달. "말하기 어려운 것"을 안전하게 전달하는 채널.
> **설계 원칙**: Suggestion Ox의 "익명 우선 + 양방향 대화" + FaceUp의 "관리자 필터링/배정" 결합.

#### 5.6.1 쪽지 발송 (모든 로그인 사용자)

**진입**: PC — 쪽지함 Zone 입장 / 모바일 — 하단 탭 "쪽지"

**폼 필드**:
| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| 익명 여부 | 토글 | ✅ | 기본값 ON (익명). 완전 익명 = sender_id NULL |
| 수신 대상 | 선택 | ✅ | 유닛 리더 / 관리자(우형) / 팀 전체 리더 |
| 카테고리 | 칩 선택 | | 건의 / 질문 / 감사 / 불편 / 기타 |
| 제목 | 텍스트 (100자) | ✅ | |
| 내용 | 텍스트에어리어 (1000자) | ✅ | |

**제출 시 동작**:
```
1. anonymous_notes INSERT
   - 익명 ON → sender_id = NULL, 세션 토큰 발급 (양방향 대화용)
   - 익명 OFF → sender_id = 현재 유저 ID
   - team = 현재 유저의 팀 (익명이어도 팀은 기록)
2. 수신 대상 리더에게 Realtime 알림 + 수집함 적재
3. 토스트 "✉️ 쪽지가 전달되었습니다"
```

#### 5.6.2 쪽지 수신 및 답변 (리더/관리자)

```
[쪽지함 패널]
  필터: 카테고리 | 상태(미읽음/읽음/답변완료) | 팀

  ┌───────────────────────────────┐
  │ [건의] 야근 시 석식 지원 요청      │
  │ 익명 · 증권ITO · 1시간 전         │
  │ 상태: 미읽음                     │
  │ [답변하기] [읽음 처리]             │
  └───────────────────────────────┘

[답변하기 클릭 → 스레드 패널]
  - 리더 답변은 "관리자" 이름으로 표시 (리더 실명 노출 선택 가능)
  - 익명 작성자는 "익명" 으로만 표시
  - 양방향 대화 가능 (VOC 양방향 대화와 동일 토큰 메커니즘)
```

#### 5.6.3 쪽지 vs VOC 차이

| | VOC | 익명 쪽지 |
|---|---|---|
| 목적 | 공식 불편/개선 접수 → 처리 추적 | 비공식 건의/질문 → 수평적 소통 |
| 공개 범위 | 전체 로그인 사용자가 목록 열람 가능 | 발신자 ↔ 수신 리더만 열람 |
| 처리 워크플로우 | 접수→검토→처리→완료 (공식) | 읽음→답변(선택) (비공식) |
| 통계 | VOC 통계에 집계 | 건수만 집계 (내용 비공개) |

---

### 5.7 개인 수집함 📬 (신규 — Workvivo 활동 피드 참고)

> **핵심 가치**: 로그인할 때마다 "부재 중에 뭐가 있었지?"를 한눈에 확인.
> 메일함처럼 쌓이지만, 중요도별로 자동 정렬되어 피곤하지 않음.

#### 5.7.1 수집함 구조

**진입**: TopBar 📬 아이콘 / 모바일 — 홈 카드 상단

```
[수집함 패널]
  ┌─ 안읽은 항목: 5건 ──────────────────┐
  │                                     │
  │ 🔴 [긴급 공지] 4월 일정 변경 · 2시간 전 │  ← 시급성 긴급은 항상 최상단
  │ 🟡 [할일] 설문 참여 요청 · 어제         │
  │ ✉️ [쪽지 답변] 관리자가 답변함 · 어제    │
  │ 📞 [VOC] #45 상태 변경: 완료 · 2일 전  │
  │ 🔵 [참고] 3월 활동 보고 · 3일 전       │
  │                                     │
  │ ── 읽은 항목 ──                       │
  │ (접힌 상태, 펼치기 가능)               │
  └─────────────────────────────────────┘
```

**정렬 규칙**:
1. 시급성 🔴 → 🟡 → ✉️ → 📞 → 🔵 순서
2. 같은 시급성 내에서는 시간 역순

**수집함에 적재되는 항목**:
| 트리거 | 수집함 항목 |
|--------|-----------|
| 새 공지 등록 | 시급성 레벨에 따라 적재 |
| 익명 쪽지 답변 도착 | ✉️ 태그 |
| VOC 상태 변경 (내 VOC) | 📞 태그 |
| 아이디어 채택/반려 (내 아이디어) | 💡 태그 |
| 월간 이벤트 리마인더 | 🟡 태그 |

**notifications 테이블과의 관계**: 수집함 = notifications 테이블의 UX 레이어. 기존 notifications 테이블에 `urgency` 컬럼 추가로 구현.

---

### 5.8 관리자 평가 대시보드 📊 (신규 — Workvivo 애널리틱스 참고)

> **핵심 가치**: 유닛장/팀장이 "이 팀원이 뭘 했는지" 평가 시즌에 몰아서 챙기지 않아도, 플랫폼에서 자동 축적된 데이터로 한눈에 파악.

#### 5.8.1 활동 자동 축적 규칙

다음 행동이 발생하면 `user_activities` 테이블에 자동 기록:

| 행동 | activity_type | 포인트 | 비고 |
|------|--------------|--------|------|
| VOC 제출 | voc_submit | 1 | 익명 VOC는 팀 단위로만 집계 |
| 아이디어 제출 | idea_submit | 1 | |
| 아이디어 투표 | idea_vote | 0.5 | |
| 공지 읽음 | notice_read | 0.5 | |
| 이벤트 참여 확인 | event_join | 2 | 리더가 수동 확인 |
| 쪽지 발송 | note_send | 0.5 | 건수만 집계, 내용 비공개 |
| 인적교류 참여 | exchange_join | 2 | 리더가 수동 확인 |

**포인트는 평가 점수가 아님** — 참여 활발도를 시각화하는 보조 지표. KPI 평가와는 별도.

#### 5.8.2 관리자 뷰 (admin/leader 전용)

```
[평가 대시보드]
  ┌─ 팀별 참여율 히트맵 ──────────────┐
  │         VOC  아이디어  공지읽음  이벤트 │
  │ 증권ITO  ██    ██     ███     █    │  ← 색상 농도 = 참여율
  │ 생명ITO  ███   █      ██      ██   │
  │ 손보ITO  █     ███    ████    ███  │
  │ 한금서    ██    ██     ██      █    │
  └────────────────────────────────┘

  ┌─ 개인별 활동 요약 카드 ─────────────┐
  │ 김철수 (증권ITO)                    │
  │ VOC 3건 · 아이디어 2건 · 투표 5건    │
  │ 공지 읽음률 92% · 이벤트 참여 2/3    │
  │ 총 참여 포인트: 14.5                │
  │ [상세 보기]                        │
  └────────────────────────────────┘
```

**기간 필터**: 월별 / 분기별 / 반기별
**내보내기**: CSV 다운로드 (엑셀 호환)

---

### 5.9 관리자 패널

**접근**: TopBar 프로필 → "관리자" (admin role만 표시)

#### 5.9.1 초대 코드 관리
- 코드 생성 (팀/역할/횟수/만료일)
- 코드 목록 (사용 현황, 활성/비활성 토글)
- 코드 복사 버튼

#### 5.9.2 사용자 관리
- 사용자 목록 (이름, 팀, 역할, 가입일, 최근 접속)
- 역할 변경 (member → leader, leader → admin)
- 사용자 비활성화 (삭제는 안 함 — 데이터 보존)

---

## 6. 디자인 시스템

### 스타일 방향
- **프로덕트 타입**: 대시보드 + 게이밍 하이브리드
- **스타일**: 다크 모드 + 플레이풀 (게더타운 감성)
- **톤**: 딱딱한 사내 시스템이 아닌, 들어오고 싶은 공간

### 색상
```css
:root {
  /* 배경 */
  --bg-primary: #1a1a2e;
  --bg-secondary: #2d2d44;
  --bg-tertiary: #3d3d5c;
  --bg-hover: #4d4d6c;

  /* 액센트 */
  --accent: #6C5CE7;
  --accent-light: #a29bfe;
  --accent-hover: #7d6df7;

  /* 텍스트 — 다크모드 대비 규칙 준수 */
  --text-primary: #E2E8F0;    /* slate-200 (순백 아님) */
  --text-secondary: #CBD5E1;  /* slate-300 */
  --text-muted: #94A3B8;      /* slate-400 — 서브텍스트 최저선 */

  /* 시맨틱 */
  --success: #5DC878;
  --warning: #FF9800;
  --danger: #E91E63;
  --info: #6BC5FF;
}
```

### 타이포그래피
| 용도 | 폰트 | 근거 |
|------|------|------|
| 헤딩 | **Space Grotesk** | 테크/SaaS 느낌, 미래적 |
| 본문 | **Noto Sans KR** | 한국어 지원 최적, 가독성 |
| 코드/숫자 | **JetBrains Mono** | KPI 숫자 정렬 |

```
text-xs:   12px  — 타임스탬프, 메타
text-sm:   14px  — 라벨, 보조
text-base: 16px  — 본문 (모바일 최소)
text-lg:   18px  — 카드 제목
text-xl:   20px  — 섹션 제목
text-2xl:  24px  — 페이지 제목
```

### 컴포넌트 규칙
| 규칙 | 적용 |
|------|------|
| 터치 타겟 | 모든 인터랙티브 요소 최소 44x44px |
| 호버 피드백 | 색상/그림자 변경, scale 사용 금지 |
| 트랜지션 | 150~300ms (`transition-colors duration-200`) |
| 포커스 링 | `focus-visible:ring-2 ring-accent` |
| 스켈레톤 | 데이터 로딩 시 스켈레톤 스크린 |
| 에러 표시 | 입력 필드 아래 빨간 텍스트 |
| 빈 상태 | 이모지 + 안내 텍스트 (예: "아직 VOC가 없어요 📭") |

### 아이콘
- **Lucide React** 사용 (이모지 아이콘 금지 — Zone 라벨 등 장식 목적은 예외)
- 일관된 크기: `w-5 h-5` (기본), `w-4 h-4` (소형)

---

## 7. DB 스키마

### 001_init.sql

```sql
-- ==============================
-- 프로필
-- ==============================
CREATE TABLE profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  emp_no        TEXT UNIQUE,
  name          TEXT NOT NULL,
  team          TEXT NOT NULL CHECK (team IN ('증권ITO','생명ITO','손보ITO','한금서')),
  role          TEXT DEFAULT 'member' CHECK (role IN ('admin','leader','member')),
  unit          TEXT CHECK (unit IN ('조직','품질','전략','AX')),
  avatar_color  TEXT DEFAULT '#6C5CE7',
  avatar_emoji  TEXT DEFAULT '😊',
  avatar_url    TEXT,                              -- 프로필 사진 Storage 경로
  status        TEXT DEFAULT 'offline' CHECK (status IN ('online','offline','재택')),
  mood_emoji    TEXT,
  position_x    REAL DEFAULT 430,
  position_y    REAL DEFAULT 380,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- ==============================
-- 초대 코드
-- ==============================
CREATE TABLE invite_codes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code          TEXT UNIQUE NOT NULL,
  created_by    UUID REFERENCES auth.users(id),
  team          TEXT,
  role          TEXT DEFAULT 'member',
  max_uses      INTEGER DEFAULT 10,
  used_count    INTEGER DEFAULT 0,
  expires_at    TIMESTAMPTZ,
  active        BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- ==============================
-- VOC (완전 익명 지원)
-- ==============================
CREATE TABLE vocs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id     UUID REFERENCES auth.users(id),    -- ★ NULL = 완전 익명
  anonymous     BOOLEAN DEFAULT true,
  category      TEXT NOT NULL CHECK (category IN ('불편','요청','칭찬','개선','기타')),
  title         TEXT NOT NULL,
  content       TEXT NOT NULL,
  team          TEXT NOT NULL,                     -- 익명이어도 팀은 기록 (통계용)
  target_area   TEXT CHECK (target_area IN ('업무환경','성장','관계','기타')),
  status        TEXT DEFAULT '접수' CHECK (status IN ('접수','검토중','처리중','완료','보류')),
  assignee_id   UUID REFERENCES auth.users(id),
  resolution    TEXT,
  attachment_urls TEXT[],                           -- Storage 경로 배열
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- ==============================
-- 아이디어
-- ==============================
CREATE TABLE ideas (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id     UUID REFERENCES auth.users(id),
  title         TEXT NOT NULL,
  description   TEXT NOT NULL,
  category      TEXT CHECK (category IN ('이벤트','인적교류','업무개선','기타')),
  status        TEXT DEFAULT '제안' CHECK (status IN ('제안','검토','채택','진행중','완료','반려')),
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE idea_votes (
  idea_id       UUID REFERENCES ideas(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (idea_id, user_id)
);

CREATE VIEW idea_with_votes AS
SELECT i.*, COALESCE(v.vote_count, 0) as vote_count
FROM ideas i
LEFT JOIN (SELECT idea_id, COUNT(*) as vote_count FROM idea_votes GROUP BY idea_id) v
ON i.id = v.idea_id;

-- ==============================
-- 공지사항
-- ==============================
CREATE TABLE notices (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id     UUID REFERENCES auth.users(id),
  title         TEXT NOT NULL,
  content       TEXT NOT NULL,
  urgency       TEXT DEFAULT '참고' CHECK (urgency IN ('긴급','할일','참고')),
  category      TEXT DEFAULT '일반' CHECK (category IN ('일반','이벤트','활동보고')),
  pinned        BOOLEAN DEFAULT false,
  unit          TEXT,
  team          TEXT,
  attachment_urls TEXT[],
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE notice_reads (
  notice_id     UUID REFERENCES notices(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  read_at       TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (notice_id, user_id)
);

-- ==============================
-- KPI
-- ==============================
CREATE TABLE kpi_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit          TEXT NOT NULL,
  title         TEXT NOT NULL,
  description   TEXT,
  max_score     INTEGER DEFAULT 3,
  quarter       TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE kpi_records (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kpi_item_id   UUID REFERENCES kpi_items(id),
  user_id       UUID REFERENCES auth.users(id),
  month         TEXT NOT NULL,
  score         REAL,
  evidence      TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- ==============================
-- 활동 기록
-- ==============================
CREATE TABLE activities (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit          TEXT NOT NULL,
  task          TEXT,
  title         TEXT NOT NULL,
  description   TEXT,
  date          DATE NOT NULL,
  participants  INTEGER DEFAULT 0,
  evidence_url  TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- ==============================
-- 알림 (수집함 + Phase 2 텔레그램 확장 대비)
-- ==============================
CREATE TABLE notifications (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES auth.users(id),    -- NULL = 전체 알림
  type          TEXT NOT NULL,                      -- 'voc_new' | 'notice_new' | 'idea_adopted' | 'note_reply' 등
  urgency       TEXT DEFAULT '참고' CHECK (urgency IN ('긴급','할일','참고')),
  title         TEXT NOT NULL,
  body          TEXT,
  link          TEXT,                               -- 앱 내 이동 경로
  read          BOOLEAN DEFAULT false,
  channel       TEXT DEFAULT 'web',                 -- 'web' | 'telegram' (향후)
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- ==============================
-- 익명 쪽지함
-- ==============================
CREATE TABLE anonymous_notes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id     UUID REFERENCES auth.users(id),    -- NULL = 완전 익명
  anonymous     BOOLEAN DEFAULT true,
  recipient_role TEXT NOT NULL CHECK (recipient_role IN ('leader','admin','team_leaders')),
  recipient_team TEXT,                              -- 특정 팀 리더 대상 시
  category      TEXT CHECK (category IN ('건의','질문','감사','불편','기타')),
  title         TEXT NOT NULL,
  content       TEXT NOT NULL,
  team          TEXT NOT NULL,                      -- 발신자 팀 (익명이어도 기록)
  status        TEXT DEFAULT '미읽음' CHECK (status IN ('미읽음','읽음','답변완료')),
  session_token TEXT,                               -- 익명 양방향 대화용 토큰
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- ==============================
-- 양방향 대화 스레드 (VOC + 쪽지 공용)
-- ==============================
CREATE TABLE message_threads (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ref_type      TEXT NOT NULL CHECK (ref_type IN ('voc','note')),
  ref_id        UUID NOT NULL,                      -- vocs.id 또는 anonymous_notes.id
  sender_role   TEXT NOT NULL CHECK (sender_role IN ('author','manager')),
  message       TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- ==============================
-- 사용자 활동 기록 (평가 대시보드용 — 자동 축적)
-- ==============================
CREATE TABLE user_activities (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES auth.users(id),    -- NULL = 익명 활동 (팀 단위 집계만)
  team          TEXT NOT NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'voc_submit','idea_submit','idea_vote','notice_read',
    'event_join','note_send','exchange_join'
  )),
  points        REAL DEFAULT 1,
  ref_id        UUID,                               -- 관련 VOC/아이디어/공지 ID
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- ==============================
-- 인덱스
-- ==============================
CREATE INDEX idx_vocs_team ON vocs(team);
CREATE INDEX idx_vocs_status ON vocs(status);
CREATE INDEX idx_vocs_created ON vocs(created_at DESC);
CREATE INDEX idx_ideas_created ON ideas(created_at DESC);
CREATE INDEX idx_notices_pinned ON notices(pinned DESC, created_at DESC);
CREATE INDEX idx_kpi_records_month ON kpi_records(month);
CREATE INDEX idx_activities_unit_date ON activities(unit, date DESC);
CREATE INDEX idx_profiles_team ON profiles(team);
CREATE INDEX idx_invite_codes_code ON invite_codes(code);
CREATE INDEX idx_notifications_user ON notifications(user_id, read, created_at DESC);
CREATE INDEX idx_notifications_urgency ON notifications(urgency, created_at DESC);
CREATE INDEX idx_anonymous_notes_team ON anonymous_notes(team);
CREATE INDEX idx_anonymous_notes_status ON anonymous_notes(status);
CREATE INDEX idx_anonymous_notes_token ON anonymous_notes(session_token);
CREATE INDEX idx_message_threads_ref ON message_threads(ref_type, ref_id, created_at);
CREATE INDEX idx_user_activities_user ON user_activities(user_id, created_at DESC);
CREATE INDEX idx_user_activities_team ON user_activities(team, activity_type, created_at DESC);
```

### Supabase Storage 버킷

| 버킷명 | 용도 | 파일 크기 | 허용 타입 | 접근 |
|--------|------|----------|----------|------|
| `voc-attachments` | VOC 첨부파일 | 5MB | image/*, application/pdf | 로그인 사용자 읽기, 작성자 쓰기 |
| `notice-attachments` | 공지 첨부 | 10MB | image/*, application/pdf | 로그인 사용자 읽기, 리더 쓰기 |
| `avatars` | 프로필 사진 | 2MB | image/* | 전체 읽기, 본인만 쓰기 |

### 002_rls.sql

```sql
-- 모든 테이블 RLS 활성화
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE vocs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE idea_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE notice_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- invite_codes (가입 전 검증: anon 읽기 허용)
CREATE POLICY "invite_codes_select" ON invite_codes FOR SELECT USING (true);
CREATE POLICY "invite_codes_insert_admin" ON invite_codes FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "invite_codes_update_admin" ON invite_codes FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- vocs (★ 익명 INSERT 허용: author_id NULL OK)
CREATE POLICY "vocs_select" ON vocs FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "vocs_insert" ON vocs FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "vocs_update_leader" ON vocs FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','leader')));

-- ideas
CREATE POLICY "ideas_select" ON ideas FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "ideas_insert" ON ideas FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "ideas_update_leader" ON ideas FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','leader')));

-- idea_votes
CREATE POLICY "idea_votes_select" ON idea_votes FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "idea_votes_insert" ON idea_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "idea_votes_delete_own" ON idea_votes FOR DELETE USING (auth.uid() = user_id);

-- notices
CREATE POLICY "notices_select" ON notices FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "notices_insert_leader" ON notices FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','leader')));

-- notice_reads
CREATE POLICY "notice_reads_select" ON notice_reads FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "notice_reads_insert_own" ON notice_reads FOR INSERT WITH CHECK (auth.uid() = user_id);

-- kpi
CREATE POLICY "kpi_items_select" ON kpi_items FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "kpi_items_insert_leader" ON kpi_items FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','leader')));
CREATE POLICY "kpi_records_select" ON kpi_records FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "kpi_records_insert_leader" ON kpi_records FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','leader')));

-- activities
CREATE POLICY "activities_select" ON activities FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "activities_insert_leader" ON activities FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','leader')));

-- notifications
CREATE POLICY "notifications_select_own" ON notifications FOR SELECT
  USING (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "notifications_update_own" ON notifications FOR UPDATE
  USING (user_id = auth.uid());

-- anonymous_notes
ALTER TABLE anonymous_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_notes_insert" ON anonymous_notes FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "anon_notes_select_leader" ON anonymous_notes FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','leader')));
CREATE POLICY "anon_notes_update_leader" ON anonymous_notes FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','leader')));

-- message_threads
ALTER TABLE message_threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "threads_select" ON message_threads FOR SELECT
  USING (auth.uid() IS NOT NULL);
CREATE POLICY "threads_insert" ON message_threads FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- user_activities
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "activities_log_select_leader" ON user_activities FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','leader'))
    OR user_id = auth.uid());
CREATE POLICY "activities_log_insert" ON user_activities FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
```

### 003_triggers.sql

```sql
-- 가입 시 profiles 자동 생성
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, name, team, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'team',
    COALESCE(NEW.raw_user_meta_data->>'role', 'member')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- updated_at 자동 갱신
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER vocs_updated_at BEFORE UPDATE ON vocs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER anon_notes_updated_at BEFORE UPDATE ON anonymous_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ==============================
-- 활동 자동 기록 트리거 (user_activities 테이블)
-- ==============================

-- VOC 제출 시 활동 기록
CREATE OR REPLACE FUNCTION log_voc_activity()
RETURNS trigger AS $$
BEGIN
  INSERT INTO user_activities (user_id, team, activity_type, points, ref_id)
  VALUES (NEW.author_id, NEW.team, 'voc_submit', 1, NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_voc_created
  AFTER INSERT ON vocs
  FOR EACH ROW EXECUTE FUNCTION log_voc_activity();

-- 아이디어 제출 시 활동 기록
CREATE OR REPLACE FUNCTION log_idea_activity()
RETURNS trigger AS $$
BEGIN
  INSERT INTO user_activities (user_id, team, activity_type, points, ref_id)
  VALUES (
    NEW.author_id,
    (SELECT team FROM profiles WHERE id = NEW.author_id),
    'idea_submit', 1, NEW.id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_idea_created
  AFTER INSERT ON ideas
  FOR EACH ROW EXECUTE FUNCTION log_idea_activity();

-- 아이디어 투표 시 활동 기록
CREATE OR REPLACE FUNCTION log_vote_activity()
RETURNS trigger AS $$
BEGIN
  INSERT INTO user_activities (user_id, team, activity_type, points, ref_id)
  VALUES (
    NEW.user_id,
    (SELECT team FROM profiles WHERE id = NEW.user_id),
    'idea_vote', 0.5, NEW.idea_id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_idea_voted
  AFTER INSERT ON idea_votes
  FOR EACH ROW EXECUTE FUNCTION log_vote_activity();

-- 공지 읽음 시 활동 기록
CREATE OR REPLACE FUNCTION log_notice_read_activity()
RETURNS trigger AS $$
BEGIN
  INSERT INTO user_activities (user_id, team, activity_type, points, ref_id)
  VALUES (
    NEW.user_id,
    (SELECT team FROM profiles WHERE id = NEW.user_id),
    'notice_read', 0.5, NEW.notice_id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_notice_read
  AFTER INSERT ON notice_reads
  FOR EACH ROW EXECUTE FUNCTION log_notice_read_activity();

-- 쪽지 발송 시 활동 기록
CREATE OR REPLACE FUNCTION log_note_activity()
RETURNS trigger AS $$
BEGIN
  IF NEW.sender_id IS NOT NULL THEN
    INSERT INTO user_activities (user_id, team, activity_type, points, ref_id)
    VALUES (NEW.sender_id, NEW.team, 'note_send', 0.5, NEW.id);
  ELSE
    -- 익명 쪽지: user_id NULL, 팀 단위 집계만
    INSERT INTO user_activities (user_id, team, activity_type, points, ref_id)
    VALUES (NULL, NEW.team, 'note_send', 0.5, NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_note_created
  AFTER INSERT ON anonymous_notes
  FOR EACH ROW EXECUTE FUNCTION log_note_activity();
```

---

## 8. 디렉토리 구조

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
├── CLAUDE.md                  ← Claude Code 자동 참조 (프로젝트 컨텍스트)
├── CODING_RULES.md
│
├── .claude/
│   ├── settings.json          ← 권한, 훅 설정
│   └── commands/              ← 커스텀 슬래시 명령
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
│   │   ├── metaverse/         ← PC 전용: 맵, 캐릭터, Zone
│   │   │   ├── MapCanvas.tsx
│   │   │   ├── PlayerCharacter.tsx
│   │   │   ├── NPCCharacter.tsx
│   │   │   ├── Zone.tsx
│   │   │   ├── CharacterSVG.tsx
│   │   │   └── ChatBubble.tsx
│   │   │
│   │   ├── mobile/            ← 모바일 전용: 탭바, 카드 대시보드
│   │   │   ├── MobileLayout.tsx
│   │   │   ├── MobileHome.tsx     ← 미니배너 + 수집함 카드 + 알림카드 + 요약
│   │   │   └── BottomTabBar.tsx
│   │   │
│   │   ├── voc/
│   │   │   ├── VocPanel.tsx
│   │   │   ├── VocForm.tsx
│   │   │   ├── VocList.tsx
│   │   │   ├── VocDetail.tsx
│   │   │   ├── VocStats.tsx
│   │   │   └── VocCard.tsx
│   │   │
│   │   ├── idea/
│   │   │   ├── IdeaPanel.tsx
│   │   │   ├── IdeaCard.tsx
│   │   │   └── IdeaForm.tsx
│   │   │
│   │   ├── notice/
│   │   │   ├── NoticePanel.tsx
│   │   │   ├── NoticeList.tsx
│   │   │   ├── NoticeDetail.tsx
│   │   │   └── NoticeForm.tsx     ← 시급성 선택 UI 포함
│   │   │
│   │   ├── note/               ← ★ 신규: 익명 쪽지함
│   │   │   ├── NotePanel.tsx
│   │   │   ├── NoteForm.tsx
│   │   │   ├── NoteList.tsx
│   │   │   ├── NoteDetail.tsx
│   │   │   └── NoteCard.tsx
│   │   │
│   │   ├── thread/             ← ★ 신규: 양방향 익명 대화 (VOC + 쪽지 공용)
│   │   │   ├── ThreadPanel.tsx
│   │   │   └── ThreadMessage.tsx
│   │   │
│   │   ├── inbox/              ← ★ 신규: 개인 수집함
│   │   │   ├── InboxPanel.tsx
│   │   │   ├── InboxCard.tsx
│   │   │   └── InboxBadge.tsx     ← TopBar 📬 뱃지
│   │   │
│   │   ├── dashboard/          ← ★ 신규: 관리자 평가 대시보드
│   │   │   ├── EvalDashboard.tsx
│   │   │   ├── TeamHeatmap.tsx
│   │   │   ├── UserActivityCard.tsx
│   │   │   └── ExportCsv.tsx
│   │   │
│   │   ├── kpi/
│   │   │   ├── KpiPanel.tsx
│   │   │   ├── KpiCard.tsx
│   │   │   ├── KpiChart.tsx
│   │   │   └── KpiForm.tsx
│   │   │
│   │   ├── admin/
│   │   │   ├── InviteManager.tsx
│   │   │   └── UserManager.tsx
│   │   │
│   │   ├── layout/
│   │   │   ├── TopBar.tsx         ← 📬수집함 + 🔔알림 아이콘
│   │   │   ├── Sidebar.tsx
│   │   │   ├── BottomBar.tsx     ← PC 전용
│   │   │   └── NotificationBell.tsx
│   │   │
│   │   └── common/
│   │       ├── Modal.tsx
│   │       ├── Toast.tsx
│   │       ├── Button.tsx
│   │       ├── Badge.tsx
│   │       ├── UrgencyBadge.tsx   ← ★ 신규: 🔴🟡🔵 시급성 뱃지 공통 컴포넌트
│   │       ├── FileUpload.tsx     ← 공통 파일 업로드 컴포넌트
│   │       ├── EmptyState.tsx     ← 빈 상태 표시
│   │       ├── Skeleton.tsx       ← 스켈레톤 로딩
│   │       └── StatusBadge.tsx    ← 상태 뱃지 (색상 매핑)
│   │
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useDeviceMode.ts   ← PC/모바일 분기
│   │   ├── useRealtime.ts
│   │   ├── useVocs.ts
│   │   ├── useIdeas.ts
│   │   ├── useNotices.ts
│   │   ├── useKpi.ts
│   │   ├── useNotifications.ts
│   │   ├── useNotes.ts         ← ★ 신규: 익명 쪽지 CRUD
│   │   ├── useThreads.ts       ← ★ 신규: 양방향 대화 스레드
│   │   ├── useInbox.ts         ← ★ 신규: 수집함 조회 (urgency 정렬)
│   │   ├── useUserActivities.ts← ★ 신규: 활동 기록 조회/집계
│   │   └── useFileUpload.ts   ← Storage 업로드 훅
│   │
│   ├── stores/
│   │   ├── authStore.ts
│   │   ├── metaverseStore.ts
│   │   └── uiStore.ts
│   │
│   ├── lib/
│   │   ├── supabase.ts
│   │   ├── constants.ts       ← 맵 데이터, Zone 정의, 허용 이메일 도메인
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

---

## 9. 구현 순서 (Sprint 단위)

### Sprint 0: 프로젝트 초기 세팅
```
[ ] Vite + React + TypeScript + Tailwind + React Router 초기화
[ ] Supabase 프로젝트 생성 (이미 계정 있음)
[ ] .env.local 설정 (URL + anon key)
[ ] supabase CLI로 migrations 적용 (001 + 002 + 003 + 004_new_tables)
[ ] supabase gen types typescript → src/types/database.ts
[ ] src/lib/supabase.ts 클라이언트 초기화
[ ] src/lib/constants.ts (허용 이메일 도메인, 팀 목록, 시급성 레벨 등)
[ ] GitHub repo 생성 + 첫 커밋
```

### Sprint 1: 인증 + 초대 코드 + 레이아웃
```
[ ] 로그인 페이지 UI (이메일 + 비밀번호)
[ ] 가입 페이지 UI (Step 1~4: 코드→이메일→비번→이름/팀)
[ ] 초대 코드 검증 로직 (코드 존재 + active + 횟수 + 만료)
[ ] 이메일 도메인 검증 (@hanwha 계열만)
[ ] Supabase Auth signUp (메타데이터: name, team, role)
[ ] auth.users → profiles 트리거 동작 확인
[ ] Zustand authStore + useAuth 훅
[ ] TopBar (📬수집함 + 🔔알림) + Sidebar (PC) / TopBar + BottomTabBar (모바일)
[ ] useDeviceMode 훅 (1024px 기준 분기)
[ ] 라우트 가드 (미로그인 → 로그인 페이지)
[ ] UrgencyBadge 공통 컴포넌트 (🔴긴급/🟡할일/🔵참고)
[ ] 시드: 관리자 계정 1개 + 초대 코드 1개
```

### Sprint 2: 메타버스 캔버스 (PC)
```
[ ] MapCanvas — 방, 복도, 가구 (기존 HTML → React)
[ ] CharacterSVG — 도트 캐릭터 SVG 컴포넌트
[ ] PlayerCharacter — WASD/방향키 이동
[ ] 카메라 팔로우 (뷰포트 중앙 추적)
[ ] Zone 컴포넌트 — 영역 감지 + Space 입장 힌트 (쪽지함 Zone 포함)
[ ] NPCCharacter — 다른 접속자 (Realtime Presence)
[ ] ChatBubble — 랜덤 말풍선
[ ] 모바일: MobileHome (미니 메타버스 배너 + 수집함 카드 + 접속자 수)
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
[ ] ★ ThreadPanel + ThreadMessage (양방향 익명 대화 — VOC용)
[ ] ★ 익명 세션 토큰 발급/검증 로직
[ ] Realtime: 새 VOC INSERT 알림
[ ] 완전 익명: author_id NULL + 대화 토큰 테스트
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
[ ] NoticePanel (고정 공지 상단 + 시급성 필터 + 카테고리 탭)
[ ] NoticeList (🔴긴급/🟡할일/🔵참고 뱃지 표시)
[ ] NoticeDetail (읽음 자동 처리 + 첨부파일)
[ ] NoticeForm (리더: 시급성 선택 + 제목/내용/카테고리/대상/고정/첨부)
[ ] ★ 시급성별 알림 차등 로직 (긴급=푸시+팝업, 할일=벨, 참고=수집함만)
[ ] 읽음 현황 (리더: 45/60명 읽음)
[ ] NotificationBell (TopBar 안읽은 공지 뱃지)
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
[ ] ★ NotePanel (PC Zone 패널 / 모바일 탭 콘텐츠)
[ ] ★ NoteForm (익명 토글 + 수신 대상 선택 + 카테고리 + 제목/내용)
[ ] ★ NoteList (리더용: 필터 카테고리/상태/팀)
[ ] ★ NoteDetail (답변하기 → ThreadPanel 재사용)
[ ] ★ NoteCard (상태 뱃지, 익명 표시)
[ ] ★ InboxPanel (수집함 — urgency 정렬, 안읽음/읽음 분리)
[ ] ★ InboxCard (시급성 뱃지 + 타입 아이콘 + 시간)
[ ] ★ InboxBadge (TopBar 📬 안읽은 수 뱃지)
[ ] ★ useInbox 훅 (notifications 테이블 urgency 기반 정렬)
```

### Sprint 8: 관리자 패널 + 라운지 + 평가 대시보드
```
[ ] InviteManager (코드 생성/목록/비활성화/복사)
[ ] UserManager (목록/역할 변경/비활성화)
[ ] 마음의소리 (기분 이모지 선택 → profiles 업데이트)
[ ] 활동 타임라인 (최근 VOC/공지/아이디어/쪽지/입장 피드)
[ ] 이모지 플로팅 (메타버스 내 이모지 버튼)
[ ] ★ user_activities 자동 기록 로직 (VOC/아이디어/공지/이벤트 트리거)
[ ] ★ EvalDashboard (관리자 평가 대시보드 메인)
[ ] ★ TeamHeatmap (팀별 참여율 히트맵)
[ ] ★ UserActivityCard (개인별 활동 요약)
[ ] ★ ExportCsv (기간별 CSV 내보내기)
```

### Sprint 9: 디자인 폴리시 + 배포
```
[ ] 메타버스 맵 비주얼 개선 (기존 HTML 수준 + 쪽지함 Zone 추가)
[ ] 모바일 전체 화면 QA (375px, 414px) — 수집함/쪽지 탭 포함
[ ] PC QA (1024px, 1440px)
[ ] Cloudflare Pages 배포 (GitHub 연동)
[ ] _redirects 파일 (SPA 라우팅)
[ ] README.md (프로젝트 소개 + 로컬 개발 + 배포 가이드)
[ ] 운영 가이드 (초대 코드 생성, 역할 관리, 수집함/쪽지함 사용법)
```

---

## 10. 코딩 규칙

### MUST
- DB 데이터 삭제 금지 (DELETE/DROP/TRUNCATE — 마이그레이션에서만)
- Supabase 쿼리 후 반드시 `{ data, error }` 체크
- 프론트에서 service_role_key 절대 사용 금지 (anon key만)
- RLS 의존 — 보안은 RLS, 프론트 권한 체크는 UX 목적
- 익명 VOC: author_id = NULL 저장 (절대 유저 ID 기록 안 함)
- 익명 쪽지: sender_id = NULL 저장 (VOC와 동일한 익명 원칙)
- 양방향 대화: message_threads에 실제 user_id 저장 안 함 (sender_role만 기록)
- user_activities: 자동 기록 전용, 사용자가 직접 수정 불가
- 이메일 도메인 검증: @hanwha 계열만 허용

### SHOULD
- 컴포넌트 200줄 이하, 넘으면 분리
- Supabase 쿼리는 hooks/에 집중 (컴포넌트에서 직접 호출 금지)
- Zustand 스토어 도메인별 분리
- `supabase gen types`로 자동생성된 타입 사용
- 파일 업로드: FileUpload 공통 컴포넌트 재사용
- 모바일 터치 타겟 44x44px 이상

### PRACTICE
- Tailwind 유틸리티 우선, 커스텀 CSS 최소
- 로딩 → 스켈레톤, 에러 → 인라인 메시지, 빈 상태 → 이모지+안내
- 낙관적 업데이트 (투표, 읽음 처리 등)
- 한국어 UI, 코드 주석 한국어 OK
- `transition-colors duration-200` 기본 적용

---

## 11. Claude Code 개발 워크플로우

### 구조
```
웹 Claude (기획/관리)
  └── Sprint별 작업 지시 → .claude/commands/ 에 저장
  └── ITO_METAVERSE_PLAN.md 유지보수

Claude Code (구현)
  └── CLAUDE.md 자동 참조 (프로젝트 컨텍스트)
  └── .claude/commands/ 슬래시 명령으로 Sprint 실행
  └── .claude/settings.json 권한/훅 설정
```

### 핵심 파일 구조
```
ito-metaverse/
├── CLAUDE.md                          ← Claude Code가 매 세션 자동 로드
├── .claude/
│   ├── settings.json                  ← 권한, 훅 설정
│   └── commands/                      ← 커스텀 슬래시 명령
│       ├── sprint.md                  ← /sprint N 으로 실행
│       └── check.md                   ← /check 로 현재 상태 점검
```

### 웹 Claude → Claude Code 워크플로우
```
1. 웹 Claude에서 Sprint N 작업 내용을 확정
2. .claude/commands/sprint.md 또는 직접 프롬프트로 전달
3. Claude Code가 CLAUDE.md 자동 참조 → 코딩 규칙/구조 인지
4. 구현 완료 → git commit → CF Pages 자동 배포
5. 문제 시 웹 Claude에서 수정 방향 기획 → Claude Code에서 수정
```

### .claude/settings.json (초기 설정)
```json
{
  "permissions": {
    "allow": [
      "Read",
      "Edit",
      "Write",
      "Bash(npm:*)",
      "Bash(npx:*)",
      "Bash(pnpm:*)",
      "Bash(git:*)",
      "Bash(supabase:*)"
    ],
    "deny": [
      "Bash(rm -rf:*)",
      "Bash(DROP:*)",
      "Bash(DELETE:*)",
      "Bash(TRUNCATE:*)"
    ]
  }
}
```

### Sprint 프롬프트 템플릿 (Claude Code에 직접 입력)

```
[Sprint N] 작업 제목

목표: (1~2줄)

불변 원칙:
- DB 데이터 삭제 금지 (마이그레이션 제외)
- Supabase anon key만 프론트에서 사용
- 기존 동작하는 코드 깨뜨리지 않기

항목별 작업:

1. [항목명]
   현재: / 변경: / 파일: / 폴백:

2. [항목명]
   현재: / 변경: / 파일: / 폴백:

구현 순서: 1 → 2 → 3

완료 체크리스트 (전부 확인 후 보고):
- [ ] 항목1
- [ ] 항목2
빠진 항목은 사유와 함께 보고. 확신 없으면 스킵하되 스킵 목록 보고 필수.
```

---

## 12. 향후 확장 설계 (Phase 2)

### 텔레그램 봇 연동

**구조**:
```
[Supabase DB] → (INSERT 트리거) → [Supabase Edge Function] → [Telegram Bot API]
```

**notifications 테이블 활용**:
- 새 VOC INSERT → notifications에 레코드 추가 → Edge Function이 감지
- Edge Function이 channel='telegram'인 알림을 Telegram Bot API로 전송
- 회사 폐쇄망에서는 안 되지만, 개인 폰으로 텔레그램 알림 수신 가능

**사전 준비 (이미 설계에 포함)**:
- `notifications` 테이블에 `channel` 컬럼 ('web' | 'telegram')
- 나중에 Edge Function + Bot Token만 추가하면 연동 완료

---

## 13. 참고 파일
| 파일 | 용도 |
|------|------|
| `ito-metaverse-v2.html` | UI 원본 (메타버스 맵, 캐릭터, Zone) |
| `조닉유닛_마스터관리대장_v3.xlsx` | VOC/KPI/활동 데이터 구조 |
| `조닉유닛_프로젝트지침.md` | 유닛 목적/Task/보고체계 |

---

## 부록 A. CLAUDE.md (프로젝트 루트 — Claude Code 자동 참조)

> Claude Code가 매 세션 시작 시 자동으로 읽는 파일. `AI_CONTEXT.md` 불필요.

```markdown
# CLAUDE.md — ITO 메타버스

## 프로젝트
금융ITO 메타버스 웹앱. React+Vite+Tailwind / Supabase(PostgreSQL+Auth+Realtime+Storage) / TypeScript.
배포: Cloudflare Pages + Supabase Cloud. GitHub 연동 자동 배포.

## 구조
- src/components/{metaverse,mobile,voc,idea,notice,kpi,admin,layout,common}
- src/hooks/ — Supabase 쿼리 래퍼 (컴포넌트에서 직접 supabase 호출 금지)
- src/stores/ — Zustand (auth, metaverse, ui)
- src/lib/supabase.ts — 클라이언트
- supabase/migrations/ — DB SQL

## DB (Supabase PostgreSQL)
profiles, invite_codes, vocs, ideas, idea_votes, notices, notice_reads,
kpi_items, kpi_records, activities, notifications,
anonymous_notes, message_threads, user_activities
권한: RLS 기반 (admin/leader/member)

## 불변 원칙
1. DB DELETE/DROP/TRUNCATE 금지 (마이그레이션 제외)
2. Supabase 쿼리 후 error 체크 필수
3. service_role_key 프론트 사용 절대 금지
4. 컴포넌트 200줄 이하
5. Supabase 쿼리는 hooks/에 집중
6. 익명 VOC: author_id = NULL 저장 (유저 추적 불가)
7. 익명 쪽지: sender_id = NULL 저장 (VOC와 동일 원칙)
8. message_threads: sender_role만 기록 (user_id 절대 저장 안 함)
9. user_activities: 자동 기록 전용 (사용자 직접 수정 불가)
10. 이메일 도메인: @hanwha 계열만 허용

## 인증
Supabase Auth (이메일/비번) + 초대 코드 + @hanwha 도메인 검증
역할: admin | leader | member

## 적응형 UX
PC (≥1024px): 메타버스 맵 + Zone + 사이드바
모바일 (<1024px): 하단 탭바 + 카드 대시보드
→ useDeviceMode 훅으로 분기, 기능 컴포넌트(VOC/아이디어 등)는 공유

## 파일 업로드
Supabase Storage 3개 버킷: voc-attachments, notice-attachments, avatars
FileUpload 공통 컴포넌트 사용

## 스타일
다크 테마, Tailwind, 액센트 #6C5CE7
폰트: Space Grotesk(헤딩) + Noto Sans KR(본문)
아이콘: Lucide React
터치 타겟 44px+, 트랜지션 200ms
```

## 부록 B. .env.example

```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...
```
