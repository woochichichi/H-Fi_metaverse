-- 팀 게시판 & 활동 타임라인 수정/삭제 RLS
-- 2026-04-02

-- team_posts: 본인 글 삭제
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='team_posts' AND policyname='team_posts_delete_own') THEN
    CREATE POLICY team_posts_delete_own ON team_posts FOR DELETE USING (author_id = auth.uid());
  END IF;
END $$;

-- unit_activities: 본인 글 수정
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='unit_activities' AND policyname='unit_activities_update_own') THEN
    CREATE POLICY unit_activities_update_own ON unit_activities FOR UPDATE USING (author_id = auth.uid());
  END IF;
END $$;

-- unit_activities: 본인 글 삭제
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='unit_activities' AND policyname='unit_activities_delete_own') THEN
    CREATE POLICY unit_activities_delete_own ON unit_activities FOR DELETE USING (author_id = auth.uid());
  END IF;
END $$;
