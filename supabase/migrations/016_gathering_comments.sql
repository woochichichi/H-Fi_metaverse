-- 016: 모임방 댓글

CREATE TABLE IF NOT EXISTS gathering_comments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gathering_id  UUID NOT NULL REFERENCES gatherings(id) ON DELETE CASCADE,
  author_id     UUID REFERENCES profiles(id) ON DELETE SET NULL,
  content       TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_gathering_comments_gathering
  ON gathering_comments(gathering_id, created_at);

-- RLS
ALTER TABLE gathering_comments ENABLE ROW LEVEL SECURITY;

-- 댓글 조회: 로그인 사용자
CREATE POLICY "gathering_comments_select" ON gathering_comments
  FOR SELECT TO authenticated USING (true);

-- 댓글 작성: 로그인 사용자, 본인 author_id
CREATE POLICY "gathering_comments_insert" ON gathering_comments
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = author_id);

-- 댓글 삭제: 본인만
CREATE POLICY "gathering_comments_delete" ON gathering_comments
  FOR DELETE TO authenticated
  USING (auth.uid() = author_id);
