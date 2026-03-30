-- ==============================
-- 008: 팀별 격리 (v4)
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
DROP POLICY IF EXISTS "notices_select_team" ON notices;
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
DROP POLICY IF EXISTS "notices_insert_leader_team" ON notices;
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
DROP POLICY IF EXISTS "kpi_items_select_team" ON kpi_items;
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
DROP POLICY IF EXISTS "kpi_records_select_team" ON kpi_records;
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
