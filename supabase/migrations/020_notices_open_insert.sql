-- 공지사항 작성 권한을 모든 인증 사용자로 확대
-- 기존: admin, leader만 INSERT 가능
-- 변경: 모든 인증 사용자 INSERT 가능 (멤버도 공지 작성 가능)
-- 삭제는 기존 정책 유지: 작성자 본인 또는 admin/director만 (019_delete_rls.sql)
-- 2026-03-31

DROP POLICY IF EXISTS "notices_insert_leader" ON notices;

CREATE POLICY "notices_insert_authenticated" ON notices
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
