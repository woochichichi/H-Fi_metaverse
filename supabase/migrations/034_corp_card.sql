-- 법인카드 현황판 테이블.
-- 소스: cash/automation 에서 매일 1회 통제예산조회 API를 수집해 INSERT.
-- 프론트: v2 DashboardPage → CorpCardSection (증권ITO 팀만 노출)

-- 스냅샷: 수집 시점 메타
CREATE TABLE corp_card_snapshots (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  captured_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  period_ym     TEXT NOT NULL,                -- YYYYMM (202604 형식)
  dept_cd       TEXT NOT NULL,                -- ERP 부서 코드
  -- 팀 가드: 어느 한울타리 팀이 이 스냅샷을 볼 수 있는가
  team          TEXT NOT NULL CHECK (team IN ('증권ITO','생명ITO','손보ITO','한금서','금융ITO')),
  source        TEXT DEFAULT 'budgetList.do'
);

CREATE INDEX corp_card_snapshots_latest ON corp_card_snapshots (team, captured_at DESC);

-- 계정별 예산 집계 (snapshot 1건당 최대 4행)
CREATE TABLE corp_card_accounts (
  snapshot_id   UUID NOT NULL REFERENCES corp_card_snapshots(id) ON DELETE CASCADE,
  acct_code     TEXT NOT NULL,                -- 53001040 등
  acct_name     TEXT NOT NULL,
  base_amt      BIGINT NOT NULL DEFAULT 0,    -- 편성예산(A)
  sin_bdget     BIGINT NOT NULL DEFAULT 0,    -- 저장금액(B)
  mis_bdget     BIGINT NOT NULL DEFAULT 0,    -- 처리중금액(C)
  non_bdget     BIGINT NOT NULL DEFAULT 0,    -- 처리완료금액(D)
  rst_amt       BIGINT NOT NULL DEFAULT 0,    -- 잔여(A-B-C-D)
  PRIMARY KEY (snapshot_id, acct_code)
);

-- 거래 상세 (snapshot 1건당 0~N행, budgetHistList.do 병합 결과)
CREATE TABLE corp_card_transactions (
  id              BIGSERIAL PRIMARY KEY,
  snapshot_id     UUID NOT NULL REFERENCES corp_card_snapshots(id) ON DELETE CASCADE,
  slip_no         TEXT,                       -- EA관리번호 (XP2026...)
  rtn_type        TEXT,                       -- SIN/MIS/NON
  acct_code       TEXT,
  add_date        DATE,
  posting_date    DATE,
  user_nm         TEXT,                       -- 작성자
  real_user_name  TEXT,                       -- 실사용자
  store_name      TEXT,                       -- 지급처
  t_text          TEXT,                       -- 적요
  status_nm       TEXT,                       -- 처리상태 텍스트
  blart_nm        TEXT,                       -- 관리항목
  belnr           TEXT,                       -- 전표번호
  amount          BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX corp_card_tx_snapshot ON corp_card_transactions (snapshot_id);
CREATE INDEX corp_card_tx_date ON corp_card_transactions (add_date DESC);

-- RLS
ALTER TABLE corp_card_snapshots    ENABLE ROW LEVEL SECURITY;
ALTER TABLE corp_card_accounts     ENABLE ROW LEVEL SECURITY;
ALTER TABLE corp_card_transactions ENABLE ROW LEVEL SECURITY;

-- SELECT: 프로필의 team이 snapshot.team과 일치할 때만
CREATE POLICY "corp_card_snapshots_select_same_team" ON corp_card_snapshots
  FOR SELECT USING (
    team = (SELECT team FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "corp_card_accounts_select_via_snapshot" ON corp_card_accounts
  FOR SELECT USING (
    snapshot_id IN (
      SELECT id FROM corp_card_snapshots
      WHERE team = (SELECT team FROM profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "corp_card_tx_select_via_snapshot" ON corp_card_transactions
  FOR SELECT USING (
    snapshot_id IN (
      SELECT id FROM corp_card_snapshots
      WHERE team = (SELECT team FROM profiles WHERE id = auth.uid())
    )
  );

-- INSERT/UPDATE/DELETE 는 service_role 만 허용 (프론트 anon key 는 접근 불가)
-- service_role 은 RLS 를 우회하므로 별도 정책 불필요.

-- 최신 스냅샷 + 계정 + 거래를 한 번에 반환하는 뷰
CREATE OR REPLACE VIEW corp_card_latest AS
SELECT
  s.id           AS snapshot_id,
  s.captured_at,
  s.period_ym,
  s.dept_cd,
  s.team
FROM corp_card_snapshots s
WHERE s.captured_at = (
  SELECT MAX(captured_at) FROM corp_card_snapshots s2 WHERE s2.team = s.team
);

COMMENT ON TABLE corp_card_snapshots    IS '법인카드 통제예산 수집 스냅샷 (매일 1건).';
COMMENT ON TABLE corp_card_accounts     IS '계정별 예산 집계 — budgetList.do 응답.';
COMMENT ON TABLE corp_card_transactions IS 'EA 거래 상세 — budgetHistList.do × 3 rtnType 병합.';
