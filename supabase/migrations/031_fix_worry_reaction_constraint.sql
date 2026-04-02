-- ═══════════════════════════════════════════════════════
-- 031_fix_worry_reaction_constraint.sql
-- worry_reactions_reaction_check 이모지 인코딩 오류 수정
-- (마이그레이션 025 실행 시 이모지 깨짐 → constraint 재생성)
-- ═══════════════════════════════════════════════════════

ALTER TABLE worry_reactions DROP CONSTRAINT IF EXISTS worry_reactions_reaction_check;
ALTER TABLE worry_reactions ADD CONSTRAINT worry_reactions_reaction_check
  CHECK (reaction IN ('🤝','💪','🫂','🙌'));
