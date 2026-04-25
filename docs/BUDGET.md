# 팀 예산(법인카드 현황) 페이지 — 260424~25 개편 기록

> `corp-card` 페이지의 네이밍·섹션 구성·권한 모델을 팀장 피드백(2026-04-24) 기준으로 재설계한 기록.
> 의도와 선택의 이유를 남겨 다음 개편 때 동일 실수를 반복하지 않도록 함.

---

## 개요

- **URL(hash):** `#corp-card` — 내부 ID는 그대로 유지 (`v2NavStore` `V2Page` 타입, `profile.team === '증권ITO'` 가드)
- **접근 권한:** 증권ITO 팀 소속자만 노출. 사이드바·페이지 양쪽 이중 방어. RLS: `corp_card_snapshots_select_same_team` 이 DB 레벨 차단
- **DB 테이블:** `corp_card_snapshots`, `corp_card_accounts`, `corp_card_transactions`, `corp_card_personal_pending` — **이번 작업에서 스키마 변경 없음**
- **데이터 경로:** `cash/automation`이 매일 오전 ERP에서 수집 → Supabase upsert → 프론트는 `useCorpCardLive(team)` 훅으로 조회

---

## 배경 — 팀장 피드백 (2026-04-24)

녹취 요약:

| 표현 | 해석 |
|------|------|
| "사람 기준이 아니라 용도 기준으로" | 개인 랭킹 축소 + 카테고리 집계 중심 |
| "용도백 애를 빼고, 카테고리로 묶어서" | 정체된 분류 대신 실제 의미 있는 그룹으로 재구성 |
| "남이 쓴 건 이름 안 보이게, 내꺼만 보이게" | 팀 내부에서도 개인 식별 정보는 본인 외 차단 |
| "현황 VOC 제안 예산" (메뉴 열거) | 명칭을 "법인카드 현황" → "팀 예산" 으로 짧게 |

사용자 보충 (재질의 후 확정):
- "팀 집계(총액·%·차트)는 기존대로 두고" — 페이지의 본래 목적(팀 예산 모니터링) 유지
- "지금 우측에 개인별 랭킹 나오잖아, 거기만 내꺼만 보이게" — **팀원별 사용 리스트 한 곳만** 본인 필터
- "관리자·리더는 전체 이름 보이고, 나머지는 자기꺼만" — role 기반 분기

---

## Before → After 요약

| 영역 | Before (~2026-04-24) | After (2026-04-25) |
|------|----------------------|--------------------|
| 페이지 타이틀 / 메뉴 | "법인카드 현황" | **"팀 예산"** |
| 섹션 수 | 6 (KPI / 계정·팀원 / 바+알림 / 분기 / 본인미처리 / **거래피드**) | 7 (KPI / 계정·팀원 / 바+알림 / 분기 / 본인미처리 / **용도 도넛** / **용도 일별 추이**) |
| 팀원별 사용 리스트 | 팀원 **전원** 실명 + 랭킹 | **관리자·리더만 전원**, 일반 팀원은 **본인 행만** |
| 거래 피드 | 전원에게 모든 거래 실명 노출 | **제거** |
| 상위 사용처 TOP 5 | (Wave 4에서 신설 시도) | `store_name` 오염으로 실명 노출 → **즉시 제거** |
| 이름 마스킹 레벨 | 없음 | 프론트 필터 (`profile.role` / `profile.name` 매칭) |

---

## 현재 페이지 구성 (7개 섹션)

`src/components/v2/pages/CorpCardPage.tsx` 렌더 순서 기준.

### 1. Headline KPI (`CorpCardKpiHeadline`)
- **목적:** 페이지 진입 첫 인상 — 분기 잔여·주간 가용·소진 페이스·월말 예상치
- **데이터:** `stats.{totalPlanned,totalUsed,totalRemaining,burnPct,projectedMonth,…}` — 모두 팀 단위 집계
- **권한:** 전원 공개 (개인 식별 없음)

### 2. 계정별 예산 + 팀원별 사용 (2열 그리드)
#### 2a. 계정별 예산 (`CorpCardAccountList`)
- **목적:** 회계 계정(식대·회의비 등) 4개 예산의 사용률·잔여 파악
- **데이터:** `stats.accounts` — snapshot에서 계산된 계정별 집계
- **권한:** 전원 공개

#### 2b. 팀원별 사용 (`CorpCardMemberList`) — 이번 개편 핵심
- **목적:** 팀 내 사용 순위. 관리자·리더는 감사 용도, 팀원은 "내 사용액" 확인
- **권한 분기:** `CorpCardPage.tsx` 내부에서 계산
  ```ts
  const isPrivileged = ['admin','director','leader'].includes(profile?.role ?? '');
  const visibleMembers = isPrivileged
    ? stats.activeMembers
    : stats.activeMembers.filter(m => m.name === profile?.name);
  ```
- **라벨 (Wave 7):** 헤더에 권한별 배지
  - `isPrivileged=true` → "관리자·리더 전체 보기" (강조색)
  - `isPrivileged=false` → "본인만 표시" (중립색)
- **매칭 키의 한계:** `m.name === profile?.name` — 즉 DB상 `real_user_name || user_nm` 과 `profiles.name` 의 문자열 일치. 동명이인이 팀 내 존재할 경우 둘 다 노출될 수 있음. 증권ITO 팀 규모에서는 현실적 문제 없어 이 방식을 택함.

### 3. 일별 바차트 + 주의 알림 (2열 그리드)
#### 3a. 일별 소진 (`CorpCardDailyChart`)
- 오늘까지의 일별 바 + 예상 페이스 라인
- **권한:** 전원 공개 (개인 식별 없음 — 일별 총합)

#### 3b. 주의 알림 (`AlertCard` 내부 컴포넌트)
- 계정 사용률 ≥ 80%면 danger, ≥ 60%면 warn, burnPct 이상치면 info
- **권한:** 전원 공개

### 4. 분기 소진 흐름 (`CorpCardQuarterChart`) + 분기 KPI 스트립
- 전 분기 vs 당 분기 사용 추이 겹침
- 분기 누적/잔여/월말 예상/분기말 예상 4개 셀
- **데이터:** `useQuarterCompare(team)` 훅
- **권한:** 전원 공개

### 5. 본인 미처리 카드 (`MyPendingCard` 내부 컴포넌트)
- **목적:** 본인의 EA 미생성(미처리) 거래 72h 경과 알림
- **데이터:** `useMyCardPending()` — **DB 레벨 RLS (`corp_card_personal_pending_select_self`) 로 emp_no 매칭**. 네트워크에서도 본인 행만 내려옴
- **권한:** 본인 전용 (헤더에 "나에게만 보임" 명시)
- 이번 개편 전부터 구현되어 있던 유일한 "DB 레벨 개인 격리" 영역

### 6. 용도별 사용 비중 도넛 (`CorpCardCategoryDonut`)
- **목적:** "사람 기준 아니라 용도 기준" 맥락 반영. 이번 달 식대·회의·교통·기타 4개 카테고리 비율
- **분류 로직:** `classifyTransaction(t.memo)` — `src/lib/corpCardMockData.ts` 의 기존 유틸 재사용. 정규식 키워드 매칭 (택시/회의/야근 등)
- **시각:** Recharts `PieChart` (innerRadius 50, outerRadius 80) + 중앙에 총액 + 범례에 건수·% 표시
- **권한:** 전원 공개 (개인 식별 없음 — 카테고리 총합)

### 7. 용도별 일별 추이 (`CorpCardCategoryTrend`)
- **목적:** 카테고리별 일별 변동 시각화. 특정 일에 회의비 급증 같은 패턴 포착용
- **데이터 가공:** 거래를 `classifyTransaction` 로 분류 → `day × category` 매트릭스 → Recharts `LineChart` 멀티 라인
- **색상 일관성:** `CorpCardCategoryTrend` 와 `CorpCardCategoryDonut` 가 같은 `CATEGORY_COLOR` 맵 사용 (식대=앰버, 회의=보라, 교통=파랑, 기타=회색)
- **권한:** 전원 공개

---

## 권한 매트릭스

| 섹션 | admin / director / leader | member (일반 팀원) |
|------|---------------------------|---------------------|
| 1. Headline KPI | ✅ 전체 | ✅ 전체 (팀 집계) |
| 2a. 계정별 예산 | ✅ 전체 | ✅ 전체 |
| **2b. 팀원별 사용** | ✅ **전원 실명** | ⚠️ **본인 행만** |
| 3. 일별 바 + 알림 | ✅ | ✅ |
| 4. 분기 소진 흐름 | ✅ | ✅ |
| 5. 본인 미처리 | 본인 것만 (RLS) | 본인 것만 (RLS) |
| 6. 용도 도넛 | ✅ (카테고리 집계) | ✅ |
| 7. 용도 일별 추이 | ✅ | ✅ |

---

## 이름 마스킹 정책 — 프론트 필터 선택 이유

팀장 지시문에는 **"프론트 마스킹만으로는 약함 — 네트워크 탭에서 노출"** 이라는 경고가 명시됨. 그럼에도 이번 개편에서 **프론트 필터**를 선택한 경위:

1. 사용자 선택: "프론트만, 빠르게" (2026-04-25 질의응답)
2. 작업 범위 한정: 팀원별 리스트 **한 위젯만** 범위 (녹취 맥락)
3. 리스크 수용: F12 개발자 도구를 열 수 있는 팀원은 `useCorpCardLive` 훅 결과의 `stats.activeMembers` 배열에 접근 가능 — 개인 금액 확인 가능

### 네트워크 레벨로 강화하려면 (후속 작업)
`036_corp_card_rls_by_role.sql` 마이그레이션:
1. `corp_card_transactions` SELECT 정책을 role별 분기
   - `admin|director|leader`: 기존 그대로 (팀 일치)
   - `member`: 본인 거래만 (매칭 키 필요 — `profiles.employee_no` ↔ `corp_card_transactions.emp_no`. 단, 현재 `corp_card_transactions` 스키마에 `emp_no` 컬럼이 **없음**. 마이그레이션으로 emp_no 수집 추가 또는 이름 매칭 선택 필요)
2. 또는 뷰 `v_corp_card_members_masked` 신설 — member에게는 본인 외 `name` NULL 반환

이 작업은 개인경비 건의 비율이 낮아 현재는 보류.

---

## 제거된 섹션과 사유

### 6a. 실시간 거래 피드 (`CorpCardTxFeed`) — Wave 4에서 제거 (커밋 `a928cb5`)
- **문제:** 모든 거래의 `user`(실사용자 실명) + 아바타 + 금액·가맹점을 테이블로 노출
- **충돌:** "사람 기준 아니라 용도 기준" 방침과 정면 충돌. 리더가 아니어도 모든 거래 실명을 봄
- **대체:** 용도별 도넛 + 월 추이 (카테고리 집계) — 개인 식별 제거
- **파일 상태:** `src/components/v2/dashboard/CorpCardTxFeed.tsx` 는 남아있음 (재사용 가능성. 현재 미참조)

### 6b. 상위 사용처 TOP 5 (`CorpCardTopMerchants`) — 커밋 `f5941ae` 에서 제거
- **의도:** 가맹점 기준 TOP 집계로 "어디에 쓰는지" 파악 (팀장 녹취 맥락)
- **실제 결과:** DB `corp_card_transactions.store_name` 원본에 "전우형-2019", "김용현-2013" 같은 **사용자명-사번** 문자열이 일부 행에 섞여 있어, 집계 시 가맹점 자리에 팀원 실명이 올라감
- **오염 원인:** ERP 수집 원천(`budgetHistList.do`)이 일부 거래의 사용처에 가맹점 대신 실사용자를 기록 — `cash/automation` 수집 로직 수정이 없으면 DB도 계속 오염
- **판단:** 완전 제거. 이름 패턴 감지 병합(`/^[가-힣]{2,4}([\s\-_]?\d{2,6})?$/`) 로직을 한 번 작성했으나, 사용자가 "아예 저 섹션을 없애" 요청
- **교훈 기록:** `docs/ARCHITECTURE.md` 의 시행착오 섹션에 ERP 원본 데이터 오염 케이스로 등재

---

## 데이터 흐름

```
ERP(budgetList.do + budgetHistList.do)
   ↓ cash/automation (매일 07시)
Supabase corp_card_snapshots / corp_card_accounts / corp_card_transactions
   ↓ useCorpCardLive(team)
{ stats, transactions, snapshot }
   ↓ CorpCardPage
┌─────────────────┬──────────────────┬──────────────────┐
│ KPI             │ 계정별           │ 팀원별           │
│ (stats.*)       │ (stats.accounts) │ (filter by role) │
├─────────────────┼──────────────────┼──────────────────┤
│ 일별 바차트     │ 주의 알림         │ 분기 흐름        │
│ (stats.dayMap)  │ (derived)        │ (useQuarterCmp)  │
├─────────────────┼──────────────────┴──────────────────┤
│ 본인 미처리     │ 용도 도넛 / 월 추이 (classify x tx)  │
│ (RLS emp_no)    │                                      │
└─────────────────┴─────────────────────────────────────┘
```

---

## 변경 이력 (2026-04-24~25)

| 커밋 | 영역 | 내용 |
|------|------|------|
| `3b9d5ab` | 항목 D 라벨 | 법인카드 현황 → 팀 예산. `src/lib/boardLabels.ts` 신설, Sidebar·PageHeader·EmptyState·LoadingState 문구 일괄 교체 |
| `a928cb5` | 항목 F | 거래 피드(`CorpCardTxFeed`) 제거 + 카테고리 3위젯 신설 (`CorpCardCategoryDonut`, `CorpCardCategoryTrend`, `CorpCardTopMerchants`) |
| `8eb22c7` | 항목 E | `CorpCardMemberList` role 기반 필터 — `visibleMembers` 계산 |
| `9fbaefe` | Wave 7 | `CorpCardMemberList` 에 `isPrivilegedView` prop + 권한 배지 노출 |
| `f5941ae` | TOP 5 제거 | `CorpCardTopMerchants` 섹션 + 컴포넌트 파일 삭제 (개인 식별자 노출 문제) |

---

## 알려진 한계 / 향후 개선안

1. **프론트 필터 한계** — 팀원별 리스트의 본인 필터는 F12에서 우회 가능. 보안 엄격화 요구 시 RLS + view 분리 작업 (섹션 "이름 마스킹 정책" 참조)
2. **이름 매칭 불안정** — `profile.name === activeMember.name` 문자열 일치. `emp_no` 기반 매칭으로 전환하면 동명이인·닉네임 변경 등 엣지 내성 ↑. `corp_card_transactions` 에 `emp_no` 컬럼 추가 필요
3. **ERP `store_name` 오염** — 수집 단계에서 "사용자-사번" 패턴을 분류 규칙으로 옮기거나 별도 `category` 컬럼 도입 검토
4. **카테고리 분류 정확도** — `classifyTransaction` 은 정규식 키워드 매칭. 오분류 발생 시 관리자 수동 매핑 테이블(`budget_category_map`) 도입 고려 (팀장 지시문 폴백 섹션)
5. **모바일 미지원** — 팀 예산 페이지는 v2 Workspace 전용. 모바일 `MobileLayout`에서는 접근 경로 없음. 차후 모바일 전용 요약 카드 정도로 축소 포팅 가능
