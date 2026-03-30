-- ============================================================
-- 013_p0_fixes.sql
-- P0: Storage RLS + director 역할 + FK CASCADE 수정
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. profiles.role CHECK 제약에 'director' 추가
-- ────────────────────────────────────────────────────────────
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('admin', 'director', 'leader', 'member'));

-- ────────────────────────────────────────────────────────────
-- 2. FK ON DELETE 수정 — 사용자 삭제 시 연쇄 정리
-- ────────────────────────────────────────────────────────────

-- omok_records: winner_id, loser_id → ON DELETE CASCADE
ALTER TABLE omok_records DROP CONSTRAINT IF EXISTS omok_records_winner_id_fkey;
ALTER TABLE omok_records DROP CONSTRAINT IF EXISTS omok_records_loser_id_fkey;
ALTER TABLE omok_records
  ADD CONSTRAINT omok_records_winner_id_fkey
    FOREIGN KEY (winner_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE omok_records
  ADD CONSTRAINT omok_records_loser_id_fkey
    FOREIGN KEY (loser_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- reaction_records: user_id → ON DELETE CASCADE
ALTER TABLE reaction_records DROP CONSTRAINT IF EXISTS reaction_records_user_id_fkey;
ALTER TABLE reaction_records
  ADD CONSTRAINT reaction_records_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- unit_activities: author_id → ON DELETE SET NULL
ALTER TABLE unit_activities ALTER COLUMN author_id DROP NOT NULL;
ALTER TABLE unit_activities DROP CONSTRAINT IF EXISTS unit_activities_author_id_fkey;
ALTER TABLE unit_activities
  ADD CONSTRAINT unit_activities_author_id_fkey
    FOREIGN KEY (author_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- activity_comments: author_id → ON DELETE CASCADE
ALTER TABLE activity_comments DROP CONSTRAINT IF EXISTS activity_comments_author_id_fkey;
ALTER TABLE activity_comments
  ADD CONSTRAINT activity_comments_author_id_fkey
    FOREIGN KEY (author_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- activity_reactions: user_id → ON DELETE CASCADE
ALTER TABLE activity_reactions DROP CONSTRAINT IF EXISTS activity_reactions_user_id_fkey;
ALTER TABLE activity_reactions
  ADD CONSTRAINT activity_reactions_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- custom_eval_items: created_by → ON DELETE SET NULL
ALTER TABLE custom_eval_items ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE custom_eval_items DROP CONSTRAINT IF EXISTS custom_eval_items_created_by_fkey;
ALTER TABLE custom_eval_items
  ADD CONSTRAINT custom_eval_items_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- ────────────────────────────────────────────────────────────
-- 3. 누락 인덱스 추가
-- ────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_vocs_author ON vocs(author_id);
CREATE INDEX IF NOT EXISTS idx_vocs_assignee ON vocs(assignee_id);
CREATE INDEX IF NOT EXISTS idx_idea_votes_user ON idea_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_unit_activities_author ON unit_activities(author_id);
CREATE INDEX IF NOT EXISTS idx_reaction_records_user ON reaction_records(user_id);

-- ────────────────────────────────────────────────────────────
-- 4. Storage RLS 정책 (버킷이 존재할 때만 적용)
--    Supabase Dashboard에서 버킷 생성 후 적용
-- ────────────────────────────────────────────────────────────
-- voc-attachments 버킷
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'voc-attachments') THEN
    -- 인증 사용자만 읽기
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE policyname = 'voc_attachments_select' AND tablename = 'objects'
    ) THEN
      CREATE POLICY "voc_attachments_select" ON storage.objects
        FOR SELECT TO authenticated
        USING (bucket_id = 'voc-attachments');
    END IF;

    -- 인증 사용자만 업로드
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE policyname = 'voc_attachments_insert' AND tablename = 'objects'
    ) THEN
      CREATE POLICY "voc_attachments_insert" ON storage.objects
        FOR INSERT TO authenticated
        WITH CHECK (bucket_id = 'voc-attachments');
    END IF;
  END IF;
END $$;

-- notice-attachments 버킷
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'notice-attachments') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE policyname = 'notice_attachments_select' AND tablename = 'objects'
    ) THEN
      CREATE POLICY "notice_attachments_select" ON storage.objects
        FOR SELECT TO authenticated
        USING (bucket_id = 'notice-attachments');
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE policyname = 'notice_attachments_insert' AND tablename = 'objects'
    ) THEN
      CREATE POLICY "notice_attachments_insert" ON storage.objects
        FOR INSERT TO authenticated
        WITH CHECK (
          bucket_id = 'notice-attachments'
          AND EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'director', 'leader')
          )
        );
    END IF;
  END IF;
END $$;

-- avatars 버킷
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'avatars') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE policyname = 'avatars_select' AND tablename = 'objects'
    ) THEN
      CREATE POLICY "avatars_select" ON storage.objects
        FOR SELECT USING (bucket_id = 'avatars');
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE policyname = 'avatars_insert' AND tablename = 'objects'
    ) THEN
      CREATE POLICY "avatars_insert" ON storage.objects
        FOR INSERT TO authenticated
        WITH CHECK (bucket_id = 'avatars');
    END IF;
  END IF;
END $$;
