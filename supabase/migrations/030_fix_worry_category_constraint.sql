-- ═══════════════════════════════════════════════════════
-- 030_fix_worry_category_constraint.sql
-- worries_category_check 제약조건 인코딩 오류 수정
-- (마이그레이션 025 실행 시 한글 깨짐 → constraint 재생성)
-- ═══════════════════════════════════════════════════════

ALTER TABLE worries DROP CONSTRAINT IF EXISTS worries_category_check;
ALTER TABLE worries ADD CONSTRAINT worries_category_check
  CHECK (category IN ('일상','업무','인간관계','성장','기타'));
