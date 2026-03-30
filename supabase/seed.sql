-- 시드 데이터 (수동 실행: Supabase SQL Editor에서 실행)
-- 초대 코드: 전체 팀 대상, member 역할, 50회 사용 가능
INSERT INTO invite_codes (code, team, role, max_uses, used_count, active)
VALUES ('FITO-TEST-0001', NULL, 'member', 50, 0, true)
ON CONFLICT (code) DO NOTHING;
