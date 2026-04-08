-- ============================================================
-- 033_secure_invite_validation.sql
-- 초대 코드 보안 강화:
--   1) 공개 SELECT 정책 제거 (비인증자 전체 조회 차단)
--   2) 관리자 전용 SELECT 정책 추가
--   3) 보안 RPC로만 코드 검증 (rate limiting 포함)
-- ============================================================

-- ── 1. 기존 공개 SELECT 정책 제거 ──
DROP POLICY IF EXISTS "invite_codes_select" ON invite_codes;

-- ── 2. 관리자만 SELECT 허용 (InviteManager 용) ──
CREATE POLICY "invite_codes_select_admin" ON invite_codes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ── 3. Rate limiting 테이블 ──
CREATE TABLE IF NOT EXISTS invite_attempt_log (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  client_ip   INET,
  attempted_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: 이 테이블은 RPC 내부(SECURITY DEFINER)에서만 사용
ALTER TABLE invite_attempt_log ENABLE ROW LEVEL SECURITY;
-- 외부 직접 접근 차단 (정책 없음 = 전부 거부)

-- 오래된 로그 자동 정리 (1시간 이상 된 기록 삭제)
CREATE OR REPLACE FUNCTION cleanup_invite_attempts()
RETURNS VOID AS $$
BEGIN
  DELETE FROM invite_attempt_log WHERE attempted_at < now() - interval '1 hour';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 4. 보안 초대 코드 검증 RPC ──
CREATE OR REPLACE FUNCTION validate_invite_code_secure(code_input TEXT)
RETURNS JSONB AS $$
DECLARE
  attempt_count INTEGER;
  cleaned_code TEXT;
  found_invite RECORD;
BEGIN
  -- 입력 정리: 공백/콤마 제거, 대문자화
  cleaned_code := UPPER(REGEXP_REPLACE(TRIM(code_input), '[\s,]', '', 'g'));

  -- rate limit 체크: 최근 15분간 시도 횟수 (전체 — IP 구분 없이)
  -- Supabase 무료 플랜은 request header에서 IP 추출 불가하므로 전역 제한
  SELECT COUNT(*) INTO attempt_count
  FROM invite_attempt_log
  WHERE attempted_at > now() - interval '15 minutes';

  -- 15분간 30회 초과 시 차단
  IF attempt_count >= 30 THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', '너무 많은 시도가 감지되었습니다. 잠시 후 다시 시도해주세요.'
    );
  END IF;

  -- 시도 기록
  INSERT INTO invite_attempt_log (client_ip) VALUES (NULL);

  -- 오래된 로그 정리 (10회마다 한 번)
  IF attempt_count % 10 = 0 THEN
    PERFORM cleanup_invite_attempts();
  END IF;

  -- 코드 검색 (정확 일치)
  SELECT * INTO found_invite
  FROM invite_codes
  WHERE code = cleaned_code;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'error', '유효하지 않은 초대 코드입니다');
  END IF;

  IF NOT found_invite.active THEN
    RETURN jsonb_build_object('valid', false, 'error', '비활성화된 초대 코드입니다');
  END IF;

  IF found_invite.used_count >= found_invite.max_uses THEN
    RETURN jsonb_build_object('valid', false, 'error', '사용 횟수가 초과된 초대 코드입니다');
  END IF;

  IF found_invite.expires_at IS NOT NULL AND found_invite.expires_at < now() THEN
    RETURN jsonb_build_object('valid', false, 'error', '만료된 초대 코드입니다');
  END IF;

  -- 유효한 코드 → 필요한 필드만 반환 (코드 자체는 반환하지 않음)
  RETURN jsonb_build_object(
    'valid', true,
    'invite', jsonb_build_object(
      'id', found_invite.id,
      'team', found_invite.team,
      'role', found_invite.role,
      'max_uses', found_invite.max_uses,
      'used_count', found_invite.used_count,
      'expires_at', found_invite.expires_at,
      'active', found_invite.active
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 비인증 사용자도 RPC 호출 가능 (가입 전이므로)
GRANT EXECUTE ON FUNCTION validate_invite_code_secure(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION validate_invite_code_secure(TEXT) TO authenticated;
