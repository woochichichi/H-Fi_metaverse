-- ============================================================
-- 006_voc_soft_delete.sql
-- VOC 소프트 삭제: is_deleted 컬럼 추가 + 본인/관리자 삭제 허용
-- ============================================================

-- 1) is_deleted 컬럼 추가
ALTER TABLE vocs ADD COLUMN is_deleted BOOLEAN DEFAULT false;

-- 2) 기존 UPDATE 정책 삭제 후 재생성 (본인도 is_deleted 변경 가능하도록)
DROP POLICY IF EXISTS "vocs_update_leader" ON vocs;

-- 관리자/리더: 모든 필드 수정 가능
CREATE POLICY "vocs_update_leader" ON vocs FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','leader')));

-- 실명 작성자 본인: is_deleted만 변경 가능 (자기 글 삭제)
CREATE POLICY "vocs_update_own" ON vocs FOR UPDATE
  USING (author_id = auth.uid());
