-- ============================================================
-- 007_comprehensive_check.sql
-- 누락 가능성 있는 컬럼/함수/정책을 한번에 점검 및 적용
-- 이미 존재하면 무시됨 (IF NOT EXISTS / OR REPLACE 사용)
-- ============================================================

-- 1) profiles.nickname 컬럼
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'nickname'
  ) THEN
    ALTER TABLE profiles ADD COLUMN nickname TEXT UNIQUE;
    ALTER TABLE profiles ADD CONSTRAINT nickname_length CHECK (
      nickname IS NULL OR (char_length(nickname) >= 1 AND char_length(nickname) <= 10)
    );
    CREATE INDEX IF NOT EXISTS idx_profiles_nickname ON profiles(nickname);
  END IF;
END $$;

-- 2) vocs.session_token 컬럼
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vocs' AND column_name = 'session_token'
  ) THEN
    ALTER TABLE vocs ADD COLUMN session_token TEXT;
    CREATE INDEX IF NOT EXISTS idx_vocs_session_token ON vocs(session_token);
  END IF;
END $$;

-- 3) vocs.is_deleted 컬럼
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vocs' AND column_name = 'is_deleted'
  ) THEN
    ALTER TABLE vocs ADD COLUMN is_deleted BOOLEAN DEFAULT false;
  END IF;
END $$;

-- 4) notifications INSERT 정책
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'notifications_insert' AND tablename = 'notifications'
  ) THEN
    CREATE POLICY "notifications_insert" ON notifications FOR INSERT
      WITH CHECK (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- 5) notifications INSERT 정책 (시스템 알림용 — service_role)
-- service_role은 RLS 우회하므로 별도 정책 불필요

-- 6) vocs_update_own 정책 (본인 소프트 삭제)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'vocs_update_own' AND tablename = 'vocs'
  ) THEN
    CREATE POLICY "vocs_update_own" ON vocs FOR UPDATE
      USING (author_id = auth.uid());
  END IF;
END $$;

-- 7) handle_new_user 트리거: nickname 포함
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, name, team, role, nickname)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'team',
    COALESCE(NEW.raw_user_meta_data->>'role', 'member'),
    NEW.raw_user_meta_data->>'nickname'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8) increment_invite_usage 원자적 함수
CREATE OR REPLACE FUNCTION increment_invite_usage(code_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  rows_affected INTEGER;
BEGIN
  UPDATE invite_codes
  SET used_count = used_count + 1
  WHERE id = code_id
    AND active = true
    AND used_count < max_uses
    AND (expires_at IS NULL OR expires_at > now());
  GET DIAGNOSTICS rows_affected = ROW_COUNT;
  RETURN rows_affected > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9) 익명 VOC 활동 트리거: author_id NULL이면 건너뛰기
CREATE OR REPLACE FUNCTION log_voc_activity()
RETURNS trigger AS $$
BEGIN
  IF NEW.author_id IS NOT NULL THEN
    INSERT INTO user_activities (user_id, team, activity_type, points, ref_id)
    VALUES (NEW.author_id, NEW.team, 'voc_submit', 1, NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10) idea_with_votes 뷰 재생성 (혹시 누락된 경우)
CREATE OR REPLACE VIEW idea_with_votes AS
SELECT i.*, COALESCE(v.vote_count, 0)::INTEGER as vote_count
FROM ideas i
LEFT JOIN (SELECT idea_id, COUNT(*)::INTEGER as vote_count FROM idea_votes GROUP BY idea_id) v
ON i.id = v.idea_id;

-- 11) kpi_items/kpi_records UPDATE 정책 (리더가 수정 가능)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'kpi_items_update_leader' AND tablename = 'kpi_items'
  ) THEN
    CREATE POLICY "kpi_items_update_leader" ON kpi_items FOR UPDATE
      USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','leader')));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'kpi_records_update_leader' AND tablename = 'kpi_records'
  ) THEN
    CREATE POLICY "kpi_records_update_leader" ON kpi_records FOR UPDATE
      USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','leader')));
  END IF;
END $$;

-- 12) invite_codes UPDATE 정책: 가입 시 used_count 증가를 위해
-- (RPC 함수가 SECURITY DEFINER이므로 RLS 우회 — 추가 정책 불필요)

-- 완료
SELECT 'Migration 007 완료: 모든 누락 항목 점검 완료' AS result;
