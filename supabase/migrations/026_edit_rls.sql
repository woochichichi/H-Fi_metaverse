-- ═══════════════════════════════════════════════════════
-- 026_edit_rls.sql — 작성자 본인 글 수정(UPDATE) RLS 추가
-- ═══════════════════════════════════════════════════════

-- ── ideas: 본인 글 수정 (리더 정책은 기존 유지) ──────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='ideas' AND policyname='ideas_update_own') THEN
    CREATE POLICY "ideas_update_own" ON ideas
      FOR UPDATE TO authenticated
      USING (author_id = auth.uid());
  END IF;
END $$;

-- ── worries: 비익명 본인 글 수정 ─────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='worries' AND policyname='worries_update_own') THEN
    CREATE POLICY "worries_update_own" ON worries
      FOR UPDATE TO authenticated
      USING (author_id = auth.uid() AND anonymous = false);
  END IF;
END $$;

-- ── notices: 본인 글 수정 ────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='notices' AND policyname='notices_update_own') THEN
    CREATE POLICY "notices_update_own" ON notices
      FOR UPDATE TO authenticated
      USING (author_id = auth.uid());
  END IF;
END $$;

-- ── vocs: 비익명 작성자 본인 내용 수정 ──────────────────────
-- 기존 vocs_update_leader는 유지 (status/resolution/assignee_id)
-- 추가: 비익명 작성자는 title/content 수정 가능 (접수 상태만)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='vocs' AND policyname='vocs_update_author') THEN
    CREATE POLICY "vocs_update_author" ON vocs
      FOR UPDATE TO authenticated
      USING (author_id = auth.uid() AND anonymous = false AND status = '접수');
  END IF;
END $$;
