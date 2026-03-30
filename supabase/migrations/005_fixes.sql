-- ============================================================
-- 005_fixes.sql
-- 1) invite_codes: 가입 시 used_count 증가용 RPC 함수
-- 2) 익명 VOC 활동 트리거: author_id NULL이면 건너뛰기
-- ============================================================

-- 1) invite_codes increment 함수 (SECURITY DEFINER로 RLS 우회)
CREATE OR REPLACE FUNCTION increment_invite_usage(code_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE invite_codes
  SET used_count = used_count + 1
  WHERE id = code_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2) 익명 VOC 활동 트리거 수정: author_id가 NULL이면 건너뛰기
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
