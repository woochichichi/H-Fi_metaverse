# ITO 메타버스 v4 — 대규모 리팩토링 설계서

> **작성일**: 2026-03-30  
> **목적**: 마스터 플랜(ITO_METAVERSE_PLAN.md) 업데이트 내용 + Claude Code Sprint 프롬프트  
> **변경 규모**: 맵 구조 전면 교체, 디자인 오버홀, 팀별 격리 시스템 추가

---

## Part 1: 마스터 플랜 업데이트 사항

> ITO_METAVERSE_PLAN.md에 반영할 변경 내용. 기존 섹션별로 what changed 정리.

---

### 1.1 프로젝트 개요 변경

**기존**: 금융ITO 4개 팀 → **변경**: 3개 팀 (증권ITO, 생명ITO, 손보ITO). 한금서는 Phase 2에서 추가.

**profiles 테이블 team CHECK 제약**: `'증권ITO','생명ITO','손보ITO'` (한금서 제거하지 말고, Phase 1에서는 가입 시 선택지에서만 숨김. DB 스키마는 그대로 유지)

---

### 1.2 디자인 시스템 전면 교체 (섹션 6 대체)

#### 스타일 방향
- **기존**: 다크모드 + 플레이풀 (게더타운 감성)
- **변경**: **도트/픽셀아트 레트로 (게임보이 감성)** + 다크 배경
- 폰트 변경: **Galmuri11** (메인) + **DungGeunMo** (헤딩/강조) + Noto Sans KR (본문 폴백)
- 전체적으로 8bit/16bit 게임 느낌의 UI 컴포넌트 (각진 border, pixel shadow, scanline 효과 등)

#### 팀별 테마 컬러 + 비주얼 컨셉

| 팀 | 컨셉 키워드 | 메인 컬러 | 보조 컬러 | 맵 비주얼 요소 |
|---|---|---|---|---|
| **증권ITO** | 주식 · 트레이딩 · 차트 | `#00D68F` (상승 초록) | `#FF4757` (하락 빨강) | 주식 차트 모니터, 캔들스틱 장식, 전광판, ₩ 아이콘 |
| **생명ITO** | 생사 · 보장 · 가족 · 미래 | `#6C5CE7` (보라/신뢰) | `#FFC312` (따뜻한 골드) | 우산 아이콘(보장), 가족 실루엣, 하트 모니터(생명선), 연금 금고 |
| **손보ITO** | 사고 · 방패 · 자동차 · 실손 | `#0984E3` (안정 블루) | `#FD7272` (경보 레드) | 방패 아이콘, 자동차 픽셀아트, 안전모, 소화기 |

#### 공용 공간 테마
| 공간 | 컬러 | 비주얼 |
|---|---|---|
| **중앙 광장** | `#F8B500` (황금) | 광장 분수대(픽셀), 삼거리 이정표, 잔디 |
| **VoC 센터** | `#E84393` (핑크) | 전화기 픽셀아트, 우편함, 메가폰 |
| **아이디어 보드** | `#FDCB6E` (노랑) | 전구 아이콘, 포스트잇 벽, 칠판 |

#### CSS 변수 (기존 대체)
```css
:root {
  /* 공통 배경 — 다크 유지 */
  --bg-primary: #0f0f23;      /* 더 깊은 다크 (게임보이 느낌) */
  --bg-secondary: #1a1a3e;
  --bg-tertiary: #2a2a4e;
  --bg-hover: #3a3a5e;
  
  /* 픽셀아트 전용 */
  --pixel-border: 2px solid;
  --pixel-shadow: 4px 4px 0px rgba(0,0,0,0.5);
  --scanline: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px);
  
  /* 텍스트 */
  --text-primary: #E2E8F0;
  --text-secondary: #CBD5E1;
  --text-muted: #94A3B8;
  
  /* 시맨틱 */
  --success: #00D68F;
  --warning: #FFC312;
  --danger: #FF4757;
  --info: #0984E3;
}
```

#### 타이포그래피 변경
| 용도 | 기존 | 변경 |
|---|---|---|
| 헤딩/강조 | Space Grotesk | **DungGeunMo** (둥근모) |
| 본문/UI | Noto Sans KR | **Galmuri11** (우선) → Noto Sans KR (폴백) |
| 숫자/KPI | JetBrains Mono | **Galmuri11** (통일) |

---

### 1.3 맵 구조 전면 교체 (섹션 4, 5 관련)

#### 기존 구조 (deprecated)
```
직사각형 맵 1600x1100
├── 마음의소리 존 (좌상)
├── KPI 관리실 (우상)  
├── VOC 센터 (좌하)
├── 아이디어 라운지 (우하)
├── 라운지 (우측)
└── 회의실 (우하단)
→ 전체가 하나의 공간, 팀 구분 없음
```

#### 신규 구조: 삼각형 맵 + 팀별 격리
```
                    [증권ITO 타운]
                   /      \
                  /  중앙광장  \
                 /  (공용공간)  \
                /              \
    [생명ITO 타운] ———————— [손보ITO 타운]
```

**맵 레이아웃 상세**:
```
전체 맵 크기: 2400 x 2000 (확대)

증권ITO 타운: 중앙 상단
  위치: x:800, y:50, w:800, h:600
  내부 구성:
    ├── 팀 로비 (메인 — 마음의소리 + 캐릭터 모임)
    ├── KPI 관리실 (팀 전용)
    ├── 공지게시판 (팀 전용)
    └── 팀 라운지 (휴식)

생명ITO 타운: 좌측 하단  
  위치: x:50, y:900, w:800, h:600
  (구성 동일, 생명 테마)

손보ITO 타운: 우측 하단
  위치: x:1550, y:900, w:800, h:600
  (구성 동일, 손보 테마)

중앙 광장: 삼각형 중심
  위치: x:800, y:650, w:800, h:500
  내부 구성:
    ├── VoC 센터 (공용 — 모든 팀 접근, 쓰기 가능)
    ├── 아이디어 보드 (공용 — 모든 팀 접근, 쓰기 가능)
    └── 분수대 / 이정표 (장식)

팀 타운 간 연결: 도로/길로 연결
  증권↔중앙광장: 세로 도로
  생명↔중앙광장: 대각선 도로 (좌)
  손보↔중앙광장: 대각선 도로 (우)
```

---

### 1.4 팀별 격리 + 교차 방문 시스템 (신규 섹션)

#### 핵심 원칙
1. **가입 시 팀 고정** — 한번 선택하면 변경 불가 (관리자만 변경 가능)
2. **내 팀 = 홈 스페이스** — 로그인 시 자동으로 내 팀 타운에 스폰
3. **다른 팀 구경 가능** — 걸어서 이동 가능, 단 권한 제한
4. **공용 공간** — 중앙 광장의 VoC/아이디어는 모두 접근 가능

#### 권한 매트릭스

| 공간/기능 | 내 팀 | 타 팀 | 중앙 광장 |
|---|---|---|---|
| 캐릭터 보기 | ✅ 같은 팀만 | ✅ 해당 팀 멤버들 | ✅ 전체 |
| 공지게시판 | ✅ 읽기/쓰기(리더) | ❌ 접근 불가 | — |
| KPI 관리실 | ✅ 전체 기능 | ❌ 접근 불가 | — |
| 마음의소리 | ✅ 전체 기능 | 👁️ 읽기만 | — |
| VoC 센터 | — | — | ✅ 읽기+쓰기 |
| 아이디어 보드 | — | — | ✅ 읽기+쓰기 |
| 타 팀 VoC/아이디어 | — | 👁️ 읽기만 (중앙에서) | — |

> **핵심**: VoC와 아이디어는 모든 팀 데이터가 중앙 광장에서 합쳐져 보이되, 팀별 필터 가능. 타 팀 공지/KPI는 완전 차단.

#### DB 영향
- `vocs`, `ideas` 테이블: 기존 `team` 컬럼으로 필터링 (스키마 변경 불필요)
- `notices` 테이블: `team` 컬럼으로 팀별 공지 분리 (기존 스키마 활용)
- `kpi_items`, `kpi_records`: 기존 `unit` 기준 → 팀별로도 필터 가능하게 확장 필요
  - **004_team_kpi.sql**: `kpi_items`에 `team TEXT` 컬럼 추가, 기존 `unit`과 병행
- RLS 정책 변경:
  - `notices_select` → 팀 매칭 조건 추가: `team = (SELECT team FROM profiles WHERE id = auth.uid())`
  - `kpi_items_select` / `kpi_records_select` → 팀 매칭 조건 추가

#### 공지게시판 상세
- **팀 전용**: 같은 팀 멤버만 읽기 가능
- **작성 권한**: leader + admin 역할만 (팀장/유닛장이 씀)
- **알림**: 새 공지 등록 시 해당 팀 전원에게 알림
- **위치**: 각 팀 타운 내부 (중앙 광장 아님)

---

### 1.5 UX 구조 개선 — 자주 가는 곳 / 가끔 가는 곳 분리

#### 팀 타운 (자주 가는 곳 — 홈)
```
입장 시 자동 스폰 위치
├── 팀 로비 (마음의소리 + 캐릭터들)  ← 첫 화면
├── KPI 관리실                     ← 성과 확인 (관리자: 한눈에, 사용자: 편리하게)
└── 공지게시판                     ← 팀 소식 확인
```

#### 중앙 광장 (가끔 가는 곳 — 탐험)
```
걸어서 이동해야 접근
├── VoC 센터                      ← 의견 제출/확인
├── 아이디어 보드                  ← 아이디어 공유/투표
└── 타 팀 타운 구경 경로            ← 이정표에서 선택
```

#### PC 레이아웃 (업데이트)
```
┌─────────────────────────────────────────────────────┐
│ TopBar: 로고 | [증권ITO▼] 팀고정 | 🔔알림 | 프로필    │
├──────────────────────────────────────┬──────────────┤
│                                      │              │
│   [삼각형 메타버스 맵]                 │  Sidebar     │
│   내 팀 타운에서 시작                  │  - 팀원 목록  │
│   중앙 광장/타 팀으로 이동 가능        │  - 최근 알림  │
│                                      │              │
│   팀 타운 내부:                       │              │
│   ┌──────┐  ┌──────┐  ┌──────┐      │              │
│   │🏠로비│  │📊KPI│  │📋공지│       │              │
│   └──────┘  └──────┘  └──────┘      │              │
│                                      │              │
│   중앙 광장:                          │              │
│   ┌──────┐  ┌──────┐                 │              │
│   │📞VOC│  │💡아이│                  │              │
│   │     │  │디어  │                  │              │
│   └──────┘  └──────┘                 │              │
│                                      │              │
├──────────────────────────────────────┴──────────────┤
│ BottomBar: 이동 힌트 | 이모지 | 퀵 액션              │
└─────────────────────────────────────────────────────┘
```

#### 모바일 레이아웃 (업데이트)
```
┌───────────────────────┐
│ TopBar: 로고 | 🔔 | 👤│
├───────────────────────┤
│ [증권ITO] 팀 배너      │  ← 팀 테마 컬러 적용
│ "5명 접속중 📈"        │
│                       │
│ ── 내 팀 ──           │
│ ┌─────────────────┐   │
│ │ 📢 새 공지 2건    │   │
│ └─────────────────┘   │
│ ┌─────────────────┐   │
│ │ 📊 KPI 요약      │   │
│ └─────────────────┘   │
│                       │
│ ── 전체 ──            │
│ ┌─────────────────┐   │
│ │ 📞 최근 VOC 3건   │   │
│ └─────────────────┘   │
│ ┌─────────────────┐   │
│ │ 💡 인기 아이디어   │   │
│ └─────────────────┘   │
│                       │
├───────────────────────┤
│ 🏠  📊  📞  💡  📋    │  ← 탭: 홈/KPI/VOC/아이디어/공지
└───────────────────────┘
```

---

### 1.6 확장성 설계

#### 공간 추가 패턴 (향후)
```typescript
// src/lib/constants.ts
export const TEAM_CONFIGS = {
  증권ITO: { theme: 'stock', color: '#00D68F', ... },
  생명ITO: { theme: 'life', color: '#6C5CE7', ... },
  손보ITO: { theme: 'shield', color: '#0984E3', ... },
  // Phase 2: 한금서 추가 시 여기에 한 줄만 추가
  // 한금서: { theme: 'fintech', color: '#...', ... },
};

// 새 Zone 추가 시
export const SHARED_ZONES = ['voc', 'idea'];  // 공용
export const TEAM_ZONES = ['lobby', 'kpi', 'notice'];  // 팀전용
// 향후: TEAM_ZONES.push('survey') 등으로 확장
```

#### 공지게시판 확장 대비
- `notices.team` 컬럼으로 팀별 분리 (이미 존재)
- `notices.unit` 컬럼으로 유닛별 분리도 가능
- 향후 "전체 공지" 기능: `team IS NULL AND unit IS NULL` → 모든 팀에 표시

---

## Part 2: Claude Code Sprint 프롬프트

> 이 설계는 크기가 크므로 **3개 Sprint로 분할** 권장.  
> Sprint A: 맵 구조 + 팀 시스템  
> Sprint B: 디자인 오버홀 (레트로 테마)  
> Sprint C: 권한 + RLS + 공지 팀 분리  

---

### Sprint A: 삼각형 맵 구조 + 팀별 타운 시스템

```
[Sprint A] 삼각형 맵 구조 + 팀별 타운

목표: 기존 직사각형 단일 맵을 삼각형 배치의 3개 팀 타운 + 중앙 광장 구조로 전면 교체한다.

불변 원칙:
- DB 데이터 삭제 금지 (마이그레이션 제외)
- Supabase anon key만 프론트에서 사용
- 기존 동작하는 코드 깨뜨리지 않기 (모달 내부 기능은 유지)

항목별 작업:

1. [맵 레이아웃 재설계]
   현재: renderRooms()에 6개 방 직사각형 배치 (1600x1100)
   변경: 2400x2000 맵에 삼각형 배치
     - 증권ITO 타운 (x:800, y:50, w:800, h:600) — 상단 중앙
     - 생명ITO 타운 (x:50, y:900, w:800, h:600) — 좌하
     - 손보ITO 타운 (x:1550, y:900, w:800, h:600) — 우하
     - 중앙 광장 (x:800, y:650, w:800, h:500) — 삼각형 중심
     - 각 타운↔중앙 광장 연결 도로 (corridor)
   파일: MapCanvas.tsx (React 전환 시) 또는 ito-metaverse-v2.html의 renderRooms()
   폴백: 기존 레이아웃 주석 보존 (/* DEPRECATED: v3 layout */)

2. [팀 타운 내부 구성]
   현재: 방별로 기능 1개 (VOC방, KPI방 등)
   변경: 각 팀 타운 내부에 3개 Zone 배치
     - 팀 로비 (마음의소리 + 캐릭터 모임 공간)
     - KPI 관리실 (팀 전용)
     - 공지게시판 (팀 전용)
   각 타운의 내부 레이아웃은 동일한 구조로, 테마만 다르게.
   파일: renderRooms() 또는 MapCanvas.tsx
   폴백: 단일 큰 방으로 처리 (Zone 구분 없이)

3. [중앙 광장 구성]
   현재: 없음
   변경: 중앙 광장에 2개 Zone 배치
     - VoC 센터 (공용)
     - 아이디어 보드 (공용)
     - 장식: 분수대(픽셀), 삼거리 이정표
   파일: renderRooms() / renderFurniture()
   폴백: 빈 광장 + Zone만 배치

4. [ZONES 배열 재정의]
   현재: ZONES = [{id:'mood', ...}, {id:'kpi', ...}, ...] — 5개 고정
   변경: 팀별 Zone + 공용 Zone 분리
     ```
     TEAM_ZONES = [
       // 증권ITO
       {id:'stock-lobby', team:'증권ITO', x:..., y:..., w:..., h:..., label:'🏠 증권 로비'},
       {id:'stock-kpi', team:'증권ITO', ...},
       {id:'stock-notice', team:'증권ITO', ...},
       // 생명ITO (동일 구조)
       // 손보ITO (동일 구조)
     ];
     SHARED_ZONES = [
       {id:'voc', x:..., y:..., w:..., h:..., label:'📞 VOC 센터'},
       {id:'idea', x:..., y:..., w:..., h:..., label:'💡 아이디어 보드'},
     ];
     ```
   파일: constants.ts 또는 HTML 내 ZONES 상수
   폴백: 기존 ZONES 배열 주석 보존

5. [플레이어 스폰 위치]
   현재: S.px=430, S.py=380 (고정)
   변경: 팀별 스폰 위치
     - 증권ITO: (1200, 300) — 증권 타운 로비 중앙
     - 생명ITO: (450, 1200) — 생명 타운 로비 중앙
     - 손보ITO: (1950, 1200) — 손보 타운 로비 중앙
   현재 사용자의 team 값으로 결정 (데모에서는 하드코딩 OK)
   파일: 상태 초기화 부분
   폴백: 중앙 광장 중심 (1200, 900)

6. [NPC 배치 팀별 분리]
   현재: npcs 배열에 8명이 랜덤 배치
   변경: 각 NPC에 team 속성 추가, 해당 팀 타운 내에서만 이동
   파일: npcs 배열 + moveNPCs()
   폴백: 기존 랜덤 이동 유지

구현 순서: 1 → 4 → 5 → 2 → 3 → 6

완료 체크리스트:
- [ ] 삼각형 배치 맵이 렌더링되는가
- [ ] 3개 팀 타운이 각각 구분되어 보이는가
- [ ] 중앙 광장이 존재하고 접근 가능한가
- [ ] 팀 간 도로가 연결되어 이동 가능한가
- [ ] 플레이어가 팀별 스폰 위치에서 시작하는가
- [ ] NPC가 팀별로 분리되어 움직이는가
- [ ] 기존 모달 기능(mood/kpi/voc/idea)이 여전히 동작하는가
- [ ] 맵 범위 제한 (벽 밖으로 나가지 않음)이 새 맵 크기에 맞게 조정되었는가
```

---

### Sprint B: 도트/픽셀아트 레트로 디자인 오버홀

```
[Sprint B] 도트/픽셀아트 레트로 디자인 오버홀

목표: 전체 UI를 게임보이 스타일 도트/픽셀아트 레트로 테마로 전면 교체한다.

불변 원칙:
- DB 데이터 삭제 금지
- 기존 기능 로직 유지 (디자인만 변경)
- 접근성 최소 기준 유지 (터치 타겟 44px+, 텍스트 대비비)

항목별 작업:

1. [폰트 교체]
   현재: Space Grotesk (헤딩) + Noto Sans KR (본문)
   변경: 
     - DungGeunMo (헤딩/강조) — CDN: https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_six@1.2/DungGeunMo.woff2
     - Galmuri11 (본문/UI) — 이미 import 되어 있음
     - Noto Sans KR (폴백)
   파일: CSS @import / font-family 선언
   폴백: Galmuri11만 사용

2. [CSS 변수 + 전역 스타일]
   현재: --bg-primary: #1a1a2e 등
   변경:
     --bg-primary: #0f0f23
     --bg-secondary: #1a1a3e
     --bg-tertiary: #2a2a4e
     모든 border-radius: 0px 또는 2px (각진 느낌)
     box-shadow: 4px 4px 0px rgba(0,0,0,0.5) (픽셀 그림자)
     border: 2px solid (실선 테두리)
     scanline 오버레이 (옵션): repeating-linear-gradient
   파일: 전역 CSS
   폴백: 기존 스타일 유지 (border-radius만 줄임)

3. [캐릭터 SVG → 픽셀 캐릭터]
   현재: charSVG()에 둥근 형태의 캐릭터
   변경: 8bit 스타일 정사각 픽셀로 구성된 캐릭터
     - 16x16 또는 32x32 pixel grid
     - 팀 컬러 반영 (옷 색상 = 팀 메인 컬러)
     - 움직임: 2프레임 walk cycle (정지/이동)
   파일: charSVG() 또는 CharacterSVG.tsx
   폴백: 기존 둥근 캐릭터에 각진 border만 적용

4. [맵 타일 + 가구 픽셀화]
   현재: CSS div 기반 가구 (desk, monitor, chair 등)
   변경: 모든 가구를 픽셀아트 스타일로
     - 바닥: 타일 패턴 (체크무늬 or 단색 + 격자)
     - 벽: 두꺼운 실선 + 그림자
     - 가구: 각진 형태, 2px border, no border-radius
     - 나무/식물: 픽셀 나무 SVG
   팀별 차별화:
     - 증권: 초록/빨강 톤 바닥, 주식 차트 벽 장식
     - 생명: 보라/골드 톤 바닥, 우산/하트 장식
     - 손보: 파랑/빨강 톤 바닥, 방패/자동차 장식
   파일: renderFurniture(), plantSVG(), 방 스타일
   폴백: 기존 가구에 border-radius:0 + border 강화

5. [UI 컴포넌트 레트로화]
   현재: 둥근 모달, 부드러운 버튼
   변경:
     - 모달: border-radius: 0, border: 3px solid #fff, pixel shadow
     - 버튼: 각진 형태, hover 시 색상 반전 (게임 선택 느낌)
     - 토스트: 게임 메시지 박스 스타일
     - 사이드바: 도트 패턴 배경
     - 탑바/바텀바: scanline 효과
     - 입력 필드: 밑줄 or 각진 border
     - 뱃지/태그: 각진 사각형, 단색 배경
   파일: 전체 CSS
   폴백: border-radius 줄이고 border 강화만

6. [팀별 타운 테마 적용]
   현재: 모든 방이 동일한 색상
   변경: 각 팀 타운의 바닥색/벽색/장식이 팀 테마에 맞게 다름
     증권ITO:
       - 바닥: #0d2818 (어두운 초록) 위에 격자 패턴
       - 장식: 캔들스틱 차트 (벽), 전광판, ₩ 심볼
     생명ITO:
       - 바닥: #1a0d2e (어두운 보라) 위에 격자 패턴
       - 장식: 우산, 가족 실루엣, 하트 모니터
     손보ITO:
       - 바닥: #0d1a2e (어두운 파랑) 위에 격자 패턴
       - 장식: 방패, 자동차 픽셀아트, 안전모
   파일: renderRooms() 내 방별 색상, renderFurniture() 내 장식
   폴백: 팀 메인 컬러로 바닥 배경만 변경

구현 순서: 1 → 2 → 5 → 3 → 4 → 6

완료 체크리스트:
- [ ] 폰트가 DungGeunMo + Galmuri11로 변경되었는가
- [ ] 모든 UI 요소가 각진 형태(border-radius ≤ 2px)인가
- [ ] 픽셀 그림자(4px 4px 0px)가 적용되었는가
- [ ] 캐릭터가 8bit 픽셀 스타일인가
- [ ] 3개 팀 타운의 바닥/벽/장식이 각각 다른 테마인가
- [ ] 중앙 광장에 분수대/이정표 장식이 있는가
- [ ] 모달/버튼/토스트가 레트로 스타일인가
- [ ] 모바일에서도 레트로 스타일이 적용되는가
- [ ] 텍스트 가독성이 유지되는가 (대비비 확인)
```

---

### Sprint C: 팀별 권한 시스템 + RLS + 공지 분리

```
[Sprint C] 팀별 권한 시스템 + 공지 분리

목표: 팀별 격리 로직 (프론트 + DB) 구현. 공지게시판 팀 전용화. KPI 팀별 분리.

불변 원칙:
- DB 데이터 삭제 금지
- RLS로 보안, 프론트 권한 체크는 UX 목적
- 익명 VOC: author_id = NULL 유지

항목별 작업:

1. [가입 시 팀 선택 고정]
   현재: Step 4에서 팀 선택 가능 (4개 팀)
   변경:
     - 선택지: 증권ITO / 생명ITO / 손보ITO (한금서 숨김, Phase 2에서 추가)
     - 한번 선택하면 변경 불가 (프론트에서 disabled)
     - 초대 코드에 팀 지정 시 자동 배정 (기존 로직 유지)
     - profiles 테이블의 team 값 = 이후 모든 필터링 기준
   파일: RegisterPage.tsx 또는 가입 폼 부분
   폴백: 4개 팀 모두 표시 (기존)

2. [공지게시판 팀별 분리]
   현재: notices 테이블에 team 컬럼 있으나 활용 안 함
   변경:
     - 공지 작성 시 team = 작성자의 team (자동 입력, 변경 불가)
     - 공지 목록 조회 시 내 team 것만 표시
     - RLS 정책 추가:
       ```sql
       -- 기존 notices_select를 DROP 후 재생성
       DROP POLICY IF EXISTS "notices_select" ON notices;
       CREATE POLICY "notices_select_team" ON notices FOR SELECT
         USING (
           auth.uid() IS NOT NULL
           AND (
             team = (SELECT team FROM profiles WHERE id = auth.uid())
             OR team IS NULL  -- 전체 공지
           )
         );
       ```
     - 공지 작성 정책도 팀 매칭 추가
   파일: 004_team_isolation.sql (마이그레이션), NoticePanel/NoticeForm
   폴백: 전체 공지 표시 (기존)

3. [KPI 팀별 분리]
   현재: kpi_items에 unit 기준 (조직/품질/전략/AX)
   변경:
     - kpi_items에 team 컬럼 추가 (ALTER TABLE)
     - 팀별 KPI 항목 등록 가능 (팀마다 다른 KPI)
     - KPI 조회 시 내 team 것만 표시
     - RLS 추가:
       ```sql
       DROP POLICY IF EXISTS "kpi_items_select" ON kpi_items;
       CREATE POLICY "kpi_items_select_team" ON kpi_items FOR SELECT
         USING (
           auth.uid() IS NOT NULL
           AND (
             team = (SELECT team FROM profiles WHERE id = auth.uid())
             OR team IS NULL  -- 공통 KPI
           )
         );
       ```
   파일: 004_team_isolation.sql, KpiPanel/KpiForm
   폴백: 기존 unit 기준 필터링 유지

4. [Zone 접근 권한 체크 (프론트)]
   현재: 모든 Zone에 누구나 접근
   변경:
     - Zone에 접근 시 팀 체크
     - 타 팀 KPI/공지 Zone → 모달 대신 "🔒 이 공간은 [증권ITO] 팀 전용입니다" 토스트
     - 타 팀 마음의소리 → 읽기 전용 모달 (기분 선택 버튼 비활성화)
     - 공용 Zone (VoC/아이디어) → 제한 없음
   파일: openModal() 또는 Zone 클릭 핸들러
   폴백: 모든 Zone 접근 허용 (기존)

5. [사이드바 팀원 목록 필터링]
   현재: 전체 NPC(팀원) 목록 표시
   변경:
     - 내 팀 타운에 있을 때: 같은 팀 멤버만 표시
     - 중앙 광장: 현재 광장에 있는 모든 팀 멤버 표시
     - 타 팀 타운 방문 시: 해당 팀 멤버 표시
   파일: Sidebar / people list 렌더링
   폴백: 전체 목록 표시 (기존)

6. [VoC/아이디어 팀 필터 UI]
   현재: 필터에 팀 선택 있으나 단일 공간
   변경:
     - 중앙 광장의 VoC/아이디어: 모든 팀 데이터 합쳐서 표시
     - 팀별 필터 탭: [전체] [증권] [생명] [손보]
     - 기본값: 전체
     - 타 팀 것도 읽기 가능, 작성 시 자동으로 내 팀 태그
   파일: VocPanel, IdeaPanel 필터 부분
   폴백: 기존 필터 유지

구현 순서: 1 → 2 → 3 → 4 → 5 → 6

완료 체크리스트:
- [ ] 가입 시 3개 팀만 선택 가능한가
- [ ] 팀 선택 후 변경 불가능한가
- [ ] 공지게시판에 내 팀 공지만 보이는가
- [ ] 타 팀 공지 Zone 접근 시 잠금 메시지가 뜨는가
- [ ] KPI에 내 팀 것만 보이는가
- [ ] VoC/아이디어는 모든 팀 데이터가 보이는가
- [ ] 사이드바가 현재 위치 기준으로 팀원을 필터하는가
- [ ] RLS 정책이 적용되어 DB 레벨에서도 팀 격리가 되는가
- [ ] 004 마이그레이션 SQL이 멱등하게 작성되었는가
```

---

## Part 3: Deprecated 항목 목록

> Sprint 실행 시 기존 코드에서 deprecated 처리할 항목

| 항목 | 위치 | 처리 방법 |
|---|---|---|
| 기존 ZONES 배열 (5개 고정) | HTML line 157~163 | 주석 + DEPRECATED 표시 후 새 배열로 대체 |
| renderRooms() 직사각형 레이아웃 | HTML line 273~296 | 주석 보존 후 새 함수로 대체 |
| renderFurniture() 기존 가구 배치 | HTML line 298~349 | 주석 보존 후 팀별 가구 함수로 대체 |
| charSVG() 둥근 캐릭터 | HTML line 177~197 | 주석 보존 후 pixelCharSVG()로 대체 |
| plantSVG() 둥근 식물 | HTML line 199~201 | 주석 보존 후 pixelPlantSVG()로 대체 |
| 고정 스폰 위치 S.px=430, S.py=380 | HTML line 165 | 팀별 스폰으로 대체 |
| 디자인 시스템 CSS 변수 (섹션 6) | 플랜 문서 | v4 값으로 대체, 기존은 /* v3 */ 주석 |

---

## Part 4: 마이그레이션 SQL 초안

### 004_team_isolation.sql

```sql
-- ==============================
-- 팀별 격리 (v4)
-- ==============================

-- KPI에 team 컬럼 추가
ALTER TABLE kpi_items ADD COLUMN IF NOT EXISTS team TEXT;

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_kpi_items_team ON kpi_items(team);
CREATE INDEX IF NOT EXISTS idx_notices_team ON notices(team);

-- ==============================
-- RLS 정책 업데이트
-- ==============================

-- 공지: 팀별 격리
DROP POLICY IF EXISTS "notices_select" ON notices;
CREATE POLICY "notices_select_team" ON notices FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND (
      team = (SELECT team FROM profiles WHERE id = auth.uid())
      OR team IS NULL
    )
  );

-- 공지 작성: 리더/관리자 + 자기 팀만
DROP POLICY IF EXISTS "notices_insert_leader" ON notices;
CREATE POLICY "notices_insert_leader_team" ON notices FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','leader'))
    AND (
      team = (SELECT team FROM profiles WHERE id = auth.uid())
      OR team IS NULL  -- 전체 공지는 admin만 (프론트에서 제어)
    )
  );

-- KPI: 팀별 격리
DROP POLICY IF EXISTS "kpi_items_select" ON kpi_items;
CREATE POLICY "kpi_items_select_team" ON kpi_items FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND (
      team = (SELECT team FROM profiles WHERE id = auth.uid())
      OR team IS NULL
    )
  );

-- KPI 레코드도 팀별 (kpi_item의 team 기준)
DROP POLICY IF EXISTS "kpi_records_select" ON kpi_records;
CREATE POLICY "kpi_records_select_team" ON kpi_records FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND (
      EXISTS (
        SELECT 1 FROM kpi_items ki
        WHERE ki.id = kpi_item_id
        AND (
          ki.team = (SELECT team FROM profiles WHERE id = auth.uid())
          OR ki.team IS NULL
        )
      )
    )
  );

-- VOC/아이디어는 격리 안 함 (기존 정책 유지 — 모든 팀 읽기 가능)
```

---

## 실행 순서 권장

```
1. ITO_METAVERSE_PLAN.md 업데이트 (Part 1 반영)
2. Sprint A 실행 → 맵 구조 변경 확인
3. Sprint B 실행 → 디자인 확인
4. Sprint C 실행 → 권한/격리 확인
5. 통합 QA + 미세 조정
```

각 Sprint는 독립적으로 실행 가능하되, A→B→C 순서 권장 (맵이 바뀌어야 디자인 적용 의미 있고, 디자인 후 권한 체크).
