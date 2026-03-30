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
