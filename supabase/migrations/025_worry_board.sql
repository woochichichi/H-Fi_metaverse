-- ═══════════════════════════════════════════════════════
-- 025_worry_board.sql — 고민방 (위로·공감 게시판)
-- ═══════════════════════════════════════════════════════

-- ── 고민 게시글 ──────────────────────────────────────────
CREATE TABLE worries (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  anonymous   BOOLEAN NOT NULL DEFAULT false,
  title       TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 100),
  content     TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  category    TEXT NOT NULL DEFAULT '일상' CHECK (category IN ('일상','업무','인간관계','성장','기타')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 고민 댓글 ────────────────────────────────────────────
CREATE TABLE worry_comments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worry_id    UUID NOT NULL REFERENCES worries(id) ON DELETE CASCADE,
  author_id   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  anonymous   BOOLEAN NOT NULL DEFAULT false,
  content     TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 500),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 고민 반응 ─────────────────────────────────────────────
-- 동일 유저가 같은 반응을 두 번 누르면 토글(삭제)
CREATE TABLE worry_reactions (
  worry_id    UUID NOT NULL REFERENCES worries(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction    TEXT NOT NULL CHECK (reaction IN ('🤝','💪','🫂','🙌')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (worry_id, user_id, reaction)
);

-- ── 댓글 수 빠른 조회용 뷰 ──────────────────────────────────
CREATE VIEW worry_with_counts AS
SELECT
  w.*,
  COALESCE(c.comment_count, 0) AS comment_count,
  COALESCE(r.reaction_count, 0) AS reaction_count
FROM worries w
LEFT JOIN (
  SELECT worry_id, COUNT(*) AS comment_count
  FROM worry_comments
  GROUP BY worry_id
) c ON c.worry_id = w.id
LEFT JOIN (
  SELECT worry_id, COUNT(*) AS reaction_count
  FROM worry_reactions
  GROUP BY worry_id
) r ON r.worry_id = w.id;

-- ── RLS 활성화 ────────────────────────────────────────────
ALTER TABLE worries          ENABLE ROW LEVEL SECURITY;
ALTER TABLE worry_comments   ENABLE ROW LEVEL SECURITY;
ALTER TABLE worry_reactions  ENABLE ROW LEVEL SECURITY;

-- ── worries RLS ──────────────────────────────────────────
-- 로그인한 사람은 누구나 읽기 가능
CREATE POLICY "worries_select" ON worries
  FOR SELECT TO authenticated USING (true);

-- 본인 글만 쓰기 (author_id = 본인 UUID, 또는 익명이면 NULL)
CREATE POLICY "worries_insert" ON worries
  FOR INSERT TO authenticated
  WITH CHECK (
    (anonymous = false AND author_id = auth.uid()) OR
    (anonymous = true  AND author_id IS NULL)
  );

-- 본인 글 삭제 (author_id 일치 or 관리자)
CREATE POLICY "worries_delete_own" ON worries
  FOR DELETE TO authenticated
  USING (author_id = auth.uid());

-- ── worry_comments RLS ────────────────────────────────────
CREATE POLICY "worry_comments_select" ON worry_comments
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "worry_comments_insert" ON worry_comments
  FOR INSERT TO authenticated
  WITH CHECK (
    (anonymous = false AND author_id = auth.uid()) OR
    (anonymous = true  AND author_id IS NULL)
  );

CREATE POLICY "worry_comments_delete_own" ON worry_comments
  FOR DELETE TO authenticated
  USING (author_id = auth.uid());

-- ── worry_reactions RLS ───────────────────────────────────
CREATE POLICY "worry_reactions_select" ON worry_reactions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "worry_reactions_insert" ON worry_reactions
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "worry_reactions_delete" ON worry_reactions
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());
