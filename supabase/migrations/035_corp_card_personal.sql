-- 본인 카드 원본(EA 미생성 승인내역) 전용 테이블.
-- 소스: corporationCardExpenseList.do, 본인 사번만 조회되는 API.
-- RLS: 본인(auth.uid() 의 profiles.employee_no 와 emp_no 일치) + 관리자만 SELECT.
-- INSERT/UPDATE 는 service_role.

CREATE TABLE corp_card_personal_pending (
  id              BIGSERIAL PRIMARY KEY,
  captured_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  emp_no          TEXT NOT NULL,                -- 본인 사번
  team            TEXT NOT NULL CHECK (team IN ('증권ITO','생명ITO','손보ITO','한금서','금융ITO')),
  date_from       DATE NOT NULL,
  date_to         DATE NOT NULL,
  status_filter   TEXT NOT NULL,                -- 일반적으로 "01"
  add_date        DATE,                         -- 승인일
  card_last4      TEXT,                         -- 카드 뒤 4자리만 (보안)
  store_name      TEXT,
  amount          BIGINT NOT NULL DEFAULT 0,
  appr_no         TEXT,
  status_nm       TEXT
);

CREATE INDEX corp_card_personal_lookup
  ON corp_card_personal_pending (emp_no, captured_at DESC);

-- profiles 에 employee_no 가 있는지 확인 — 없으면 사용자 매핑을 위해 추가
-- (기존 profiles 스키마에 없으면 추가. 이미 있으면 IF NOT EXISTS 로 skip)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS employee_no TEXT;

-- RLS
ALTER TABLE corp_card_personal_pending ENABLE ROW LEVEL SECURITY;

-- 본인 사번 소유자만 SELECT
CREATE POLICY "my_card_pending_select_self" ON corp_card_personal_pending
  FOR SELECT USING (
    emp_no = (SELECT employee_no FROM profiles WHERE id = auth.uid())
  );

COMMENT ON TABLE corp_card_personal_pending IS
  '본인 카드 원본(EA 미생성). 본인 프로필에만 노출. 카드번호는 last4 만 저장.';
