-- 조회수(view_count) 기능 추가
-- 2026-04-02

-- 1. 각 게시판 테이블에 view_count 컬럼 추가
ALTER TABLE ideas        ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0 NOT NULL;
ALTER TABLE vocs         ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0 NOT NULL;
ALTER TABLE notices      ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0 NOT NULL;
ALTER TABLE gatherings   ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0 NOT NULL;
ALTER TABLE unit_activities ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0 NOT NULL;
ALTER TABLE team_posts   ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0 NOT NULL;
ALTER TABLE worries      ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0 NOT NULL;

-- 2. idea_with_votes 뷰 재생성 (view_count 포함)
DROP VIEW IF EXISTS idea_with_votes;
CREATE VIEW idea_with_votes AS
  SELECT i.id, i.author_id, i.title, i.description, i.category, i.status, i.created_at, i.view_count,
         COALESCE(v.vote_count, 0) AS vote_count
  FROM ideas i
  LEFT JOIN (
    SELECT idea_votes.idea_id, count(*)::integer AS vote_count
    FROM idea_votes
    GROUP BY idea_votes.idea_id
  ) v ON i.id = v.idea_id;

-- 2b. worry_with_counts 뷰 재생성 (view_count 포함)
-- PostgreSQL SELECT * 뷰는 컬럼 목록이 생성 시점 고정 → 025 이후 추가된 view_count 반영을 위해 재생성 필요
DROP VIEW IF EXISTS worry_with_counts;
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

-- 3. SECURITY DEFINER RPC 함수: 인증된 사용자라면 누구나 조회수 증가 가능
CREATE OR REPLACE FUNCTION increment_view_count(p_table text, p_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF p_table NOT IN ('ideas', 'worries', 'vocs', 'notices', 'team_posts', 'unit_activities', 'gatherings') THEN
    RAISE EXCEPTION 'Invalid table: %', p_table;
  END IF;
  EXECUTE format('UPDATE %I SET view_count = view_count + 1 WHERE id = $1', p_table)
  USING p_id;
END;
$$;
