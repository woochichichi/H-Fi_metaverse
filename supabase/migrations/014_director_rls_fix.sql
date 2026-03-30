-- ============================================================
-- 014_director_rls_fix.sql
-- RLS 정책에 director 역할 추가 + activity_type CHECK에 custom 추가
-- ============================================================

-- 1. user_activities.activity_type CHECK에 'custom' 추가
ALTER TABLE user_activities DROP CONSTRAINT IF EXISTS user_activities_activity_type_check;
ALTER TABLE user_activities ADD CONSTRAINT user_activities_activity_type_check
  CHECK (activity_type IN (
    'voc_submit','idea_submit','idea_vote','notice_read',
    'event_join','note_send','exchange_join','custom'
  ));

-- 2. RLS 정책에 director 역할 일괄 추가
-- vocs
DROP POLICY IF EXISTS "vocs_update_leader" ON vocs;
CREATE POLICY "vocs_update_leader" ON vocs FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'director', 'leader')
  ));

-- ideas
DROP POLICY IF EXISTS "ideas_update_leader" ON ideas;
CREATE POLICY "ideas_update_leader" ON ideas FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'director', 'leader')
  ));

-- notices
DROP POLICY IF EXISTS "notices_insert_leader" ON notices;
CREATE POLICY "notices_insert_leader" ON notices FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'director', 'leader')
  ));

-- kpi_items
DROP POLICY IF EXISTS "kpi_items_insert_leader" ON kpi_items;
CREATE POLICY "kpi_items_insert_leader" ON kpi_items FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'director', 'leader')
  ));
DROP POLICY IF EXISTS "kpi_items_update_leader" ON kpi_items;
CREATE POLICY "kpi_items_update_leader" ON kpi_items FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'director', 'leader')
  ));

-- kpi_records
DROP POLICY IF EXISTS "kpi_records_insert_leader" ON kpi_records;
CREATE POLICY "kpi_records_insert_leader" ON kpi_records FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'director', 'leader')
  ));
DROP POLICY IF EXISTS "kpi_records_update_leader" ON kpi_records;
CREATE POLICY "kpi_records_update_leader" ON kpi_records FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'director', 'leader')
  ));

-- activities
DROP POLICY IF EXISTS "activities_insert_leader" ON activities;
CREATE POLICY "activities_insert_leader" ON activities FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'director', 'leader')
  ));

-- anonymous_notes
DROP POLICY IF EXISTS "anon_notes_select_leader" ON anonymous_notes;
CREATE POLICY "anon_notes_select_leader" ON anonymous_notes FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'director', 'leader')
  ));
DROP POLICY IF EXISTS "anon_notes_update_leader" ON anonymous_notes;
CREATE POLICY "anon_notes_update_leader" ON anonymous_notes FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'director', 'leader')
  ));

-- user_activities
DROP POLICY IF EXISTS "activities_log_select_leader" ON user_activities;
CREATE POLICY "activities_log_select_leader" ON user_activities FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'director', 'leader')
    )
    OR user_id = auth.uid()
  );
