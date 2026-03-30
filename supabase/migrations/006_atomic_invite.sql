-- ============================================================
-- 006_atomic_invite.sql
-- invite_codes.used_count 원자적 증가: 동시 접속 시 race condition 방지
-- ============================================================

-- 기존 함수를 원자적 검증+증가 버전으로 교체
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
