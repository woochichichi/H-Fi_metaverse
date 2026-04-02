-- ═══════════════════════════════════════════════════════
-- 029_team_post_comments_rls.sql — 팀 게시판 댓글 삭제 RLS 추가
-- ═══════════════════════════════════════════════════════

-- ── team_post_comments: 작성자 본인 댓글 삭제 ──────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='team_post_comments' AND policyname='team_post_comments_delete_own') THEN
    CREATE POLICY "team_post_comments_delete_own" ON team_post_comments
      FOR DELETE TO authenticated
      USING (author_id = auth.uid());
  END IF;
END $$;
