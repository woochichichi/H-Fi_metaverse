-- ==============================
-- 활동 타임라인 (라운지 대체)
-- ==============================
CREATE TABLE IF NOT EXISTS unit_activities (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id     UUID REFERENCES auth.users(id),
  team          TEXT NOT NULL,
  unit          TEXT,
  title         TEXT NOT NULL,
  description   TEXT,
  category      TEXT CHECK (category IN ('이벤트','인적교류','VoC','소프트랜딩','기타')),
  status        TEXT DEFAULT '계획' CHECK (status IN ('계획','진행중','완료','보류')),
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS activity_reactions (
  activity_id   UUID REFERENCES unit_activities(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (activity_id, user_id)
);

CREATE TABLE IF NOT EXISTS activity_comments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id   UUID REFERENCES unit_activities(id) ON DELETE CASCADE,
  author_id     UUID REFERENCES auth.users(id),
  content       TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_unit_activities_team ON unit_activities(team, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_comments_activity ON activity_comments(activity_id, created_at);

-- RLS
ALTER TABLE unit_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_comments ENABLE ROW LEVEL SECURITY;

-- 활동: 로그인 사용자 읽기 (타 팀도 OK)
CREATE POLICY "unit_activities_select" ON unit_activities FOR SELECT
  USING (auth.uid() IS NOT NULL);
-- 활동: 리더/관리자만 작성 + 자기 팀만
CREATE POLICY "unit_activities_insert" ON unit_activities FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','leader'))
    AND team = (SELECT team FROM profiles WHERE id = auth.uid())
  );
-- 활동: 리더/관리자만 수정 + 자기 팀만
CREATE POLICY "unit_activities_update" ON unit_activities FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','leader'))
    AND team = (SELECT team FROM profiles WHERE id = auth.uid())
  );

-- 반응: 자기 팀 활동에만
CREATE POLICY "activity_reactions_select" ON activity_reactions FOR SELECT
  USING (auth.uid() IS NOT NULL);
CREATE POLICY "activity_reactions_insert" ON activity_reactions FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM unit_activities ua
      WHERE ua.id = activity_id
      AND ua.team = (SELECT team FROM profiles WHERE id = auth.uid())
    )
  );
CREATE POLICY "activity_reactions_delete" ON activity_reactions FOR DELETE
  USING (auth.uid() = user_id);

-- 댓글: 자기 팀 활동에만
CREATE POLICY "activity_comments_select" ON activity_comments FOR SELECT
  USING (auth.uid() IS NOT NULL);
CREATE POLICY "activity_comments_insert" ON activity_comments FOR INSERT
  WITH CHECK (
    auth.uid() = author_id
    AND EXISTS (
      SELECT 1 FROM unit_activities ua
      WHERE ua.id = activity_id
      AND ua.team = (SELECT team FROM profiles WHERE id = auth.uid())
    )
  );

-- updated_at 자동 갱신
CREATE TRIGGER unit_activities_updated_at BEFORE UPDATE ON unit_activities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
