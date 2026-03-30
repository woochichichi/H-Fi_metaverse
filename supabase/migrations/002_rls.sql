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
ALTER TABLE anonymous_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;

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

-- vocs (익명 INSERT 허용: author_id NULL OK)
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
CREATE POLICY "anon_notes_insert" ON anonymous_notes FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "anon_notes_select_leader" ON anonymous_notes FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','leader')));
CREATE POLICY "anon_notes_update_leader" ON anonymous_notes FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','leader')));

-- message_threads
CREATE POLICY "threads_select" ON message_threads FOR SELECT
  USING (auth.uid() IS NOT NULL);
CREATE POLICY "threads_insert" ON message_threads FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- user_activities
CREATE POLICY "activities_log_select_leader" ON user_activities FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','leader'))
    OR user_id = auth.uid());
CREATE POLICY "activities_log_insert" ON user_activities FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
