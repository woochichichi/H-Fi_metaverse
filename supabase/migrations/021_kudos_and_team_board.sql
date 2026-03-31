-- ==============================
-- 칭찬 보드 (Kudos Board)
-- ==============================
CREATE TABLE IF NOT EXISTS kudos (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id     UUID NOT NULL REFERENCES auth.users(id),
  target_id     UUID NOT NULL REFERENCES auth.users(id),
  team          TEXT NOT NULL,
  message       TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS kudos_likes (
  kudos_id      UUID REFERENCES kudos(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (kudos_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_kudos_team ON kudos(team, created_at DESC);

-- RLS
ALTER TABLE kudos ENABLE ROW LEVEL SECURITY;
ALTER TABLE kudos_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY kudos_select ON kudos FOR SELECT
  USING (auth.uid() IS NOT NULL);
CREATE POLICY kudos_insert ON kudos FOR INSERT
  WITH CHECK (
    auth.uid() = author_id
    AND author_id != target_id
    AND team = (SELECT team FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY kudos_likes_select ON kudos_likes FOR SELECT
  USING (auth.uid() IS NOT NULL);
CREATE POLICY kudos_likes_insert ON kudos_likes FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM kudos k
      WHERE k.id = kudos_id
      AND k.team = (SELECT team FROM profiles WHERE id = auth.uid())
    )
  );
CREATE POLICY kudos_likes_delete ON kudos_likes FOR DELETE
  USING (auth.uid() = user_id);

-- ==============================
-- 팀 게시판 (Team Board)
-- ==============================
CREATE TABLE IF NOT EXISTS team_posts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id     UUID NOT NULL REFERENCES auth.users(id),
  team          TEXT NOT NULL,
  content       TEXT NOT NULL,
  category      TEXT DEFAULT '자유' CHECK (category IN ('자유','질문','정보','잡담')),
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS team_post_likes (
  post_id       UUID REFERENCES team_posts(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);

CREATE TABLE IF NOT EXISTS team_post_comments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id       UUID REFERENCES team_posts(id) ON DELETE CASCADE,
  author_id     UUID REFERENCES auth.users(id),
  content       TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_team_posts_team ON team_posts(team, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_team_post_comments_post ON team_post_comments(post_id, created_at);

-- RLS
ALTER TABLE team_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_post_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY team_posts_select ON team_posts FOR SELECT
  USING (auth.uid() IS NOT NULL);
CREATE POLICY team_posts_insert ON team_posts FOR INSERT
  WITH CHECK (
    auth.uid() = author_id
    AND team = (SELECT team FROM profiles WHERE id = auth.uid())
  );
CREATE POLICY team_posts_update ON team_posts FOR UPDATE
  USING (auth.uid() = author_id);

CREATE POLICY team_post_likes_select ON team_post_likes FOR SELECT
  USING (auth.uid() IS NOT NULL);
CREATE POLICY team_post_likes_insert ON team_post_likes FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM team_posts tp
      WHERE tp.id = post_id
      AND tp.team = (SELECT team FROM profiles WHERE id = auth.uid())
    )
  );
CREATE POLICY team_post_likes_delete ON team_post_likes FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY team_post_comments_select ON team_post_comments FOR SELECT
  USING (auth.uid() IS NOT NULL);
CREATE POLICY team_post_comments_insert ON team_post_comments FOR INSERT
  WITH CHECK (
    auth.uid() = author_id
    AND EXISTS (
      SELECT 1 FROM team_posts tp
      WHERE tp.id = post_id
      AND tp.team = (SELECT team FROM profiles WHERE id = auth.uid())
    )
  );

-- ==============================
-- 활동 포인트 타입 확장
-- ==============================
ALTER TABLE user_activities DROP CONSTRAINT IF EXISTS user_activities_activity_type_check;
ALTER TABLE user_activities ADD CONSTRAINT user_activities_activity_type_check
  CHECK (activity_type IN (
    'voc_submit','idea_submit','idea_vote','notice_read',
    'event_join','note_send','exchange_join','custom',
    'kudos_send','kudos_receive','team_post'
  ));
