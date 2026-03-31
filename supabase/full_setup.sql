-- ============================================================
-- ITO 메타버스 — 전체 DB 셋업 (Supabase SQL Editor에서 1회 실행)
-- 001_init + 002_rls + 003_triggers + 004_voc_session_token + 초대코드
-- ============================================================

-- ==============================
-- 001_init: 테이블 생성
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
  avatar_url    TEXT,
  status        TEXT DEFAULT 'offline' CHECK (status IN ('online','offline','재택','퇴사')),
  mood_emoji    TEXT,
  position_x    REAL DEFAULT 430,
  position_y    REAL DEFAULT 380,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

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

CREATE TABLE vocs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id     UUID REFERENCES auth.users(id),
  anonymous     BOOLEAN DEFAULT true,
  category      TEXT NOT NULL CHECK (category IN ('불편','요청','칭찬','개선','기타')),
  title         TEXT NOT NULL,
  content       TEXT NOT NULL,
  team          TEXT NOT NULL,
  target_area   TEXT CHECK (target_area IN ('업무환경','성장','관계','기타')),
  status        TEXT DEFAULT '접수' CHECK (status IN ('접수','검토중','처리중','완료','보류')),
  assignee_id   UUID REFERENCES auth.users(id),
  resolution    TEXT,
  attachment_urls TEXT[],
  session_token TEXT,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

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

CREATE TABLE notifications (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES auth.users(id),
  type          TEXT NOT NULL,
  urgency       TEXT DEFAULT '참고' CHECK (urgency IN ('긴급','할일','참고')),
  title         TEXT NOT NULL,
  body          TEXT,
  link          TEXT,
  read          BOOLEAN DEFAULT false,
  channel       TEXT DEFAULT 'web',
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE anonymous_notes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id     UUID REFERENCES auth.users(id),
  anonymous     BOOLEAN DEFAULT true,
  recipient_role TEXT NOT NULL CHECK (recipient_role IN ('leader','admin','team_leaders')),
  recipient_team TEXT,
  category      TEXT CHECK (category IN ('건의','질문','감사','불편','기타')),
  title         TEXT NOT NULL,
  content       TEXT NOT NULL,
  team          TEXT NOT NULL,
  status        TEXT DEFAULT '미읽음' CHECK (status IN ('미읽음','읽음','답변완료')),
  session_token TEXT,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE message_threads (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ref_type      TEXT NOT NULL CHECK (ref_type IN ('voc','note')),
  ref_id        UUID NOT NULL,
  sender_role   TEXT NOT NULL CHECK (sender_role IN ('author','manager')),
  message       TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE user_activities (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES auth.users(id),
  team          TEXT NOT NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'voc_submit','idea_submit','idea_vote','notice_read',
    'event_join','note_send','exchange_join'
  )),
  points        REAL DEFAULT 1,
  ref_id        UUID,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- 인덱스
CREATE INDEX idx_vocs_team ON vocs(team);
CREATE INDEX idx_vocs_status ON vocs(status);
CREATE INDEX idx_vocs_created ON vocs(created_at DESC);
CREATE INDEX idx_vocs_session_token ON vocs(session_token);
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

-- ==============================
-- 002_rls: Row Level Security
-- ==============================

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
CREATE POLICY "profiles_update_admin_leader" ON profiles FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM profiles AS me WHERE me.id = auth.uid()
    AND (me.role IN ('admin', 'director') OR (me.role = 'leader' AND profiles.team = me.team))
  ));
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- invite_codes (가입 전 검증: anon 읽기 허용)
CREATE POLICY "invite_codes_select" ON invite_codes FOR SELECT USING (true);
CREATE POLICY "invite_codes_insert_admin" ON invite_codes FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "invite_codes_update_admin" ON invite_codes FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- vocs
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
CREATE POLICY "notices_insert_authenticated" ON notices FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

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
CREATE POLICY "notifications_insert" ON notifications FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

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

-- ==============================
-- 003_triggers
-- ==============================

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

-- 활동 자동 기록 트리거
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

-- ==============================
-- Storage 버킷 (SQL로 생성 불가 — 대시보드에서 수동 생성 필요)
-- ==============================
-- voc-attachments: 5MB, image/*/pdf
-- notice-attachments: 10MB, image/*/pdf
-- avatars: 2MB, image/*

-- ==============================
-- 초대 코드 삽입
-- ==============================
INSERT INTO invite_codes (code, team, role, max_uses, active)
VALUES ('24227543', NULL, 'admin', 50, true);
