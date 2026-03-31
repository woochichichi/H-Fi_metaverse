-- ==============================
-- 칭찬보드 개선: 익명 + 다양한 반응 + 삭제
-- ==============================

-- 1) kudos_likes에 reaction 컬럼 추가 (기존 하트 → 다양한 이모지)
ALTER TABLE kudos_likes ADD COLUMN IF NOT EXISTS reaction TEXT DEFAULT '❤️'
  CHECK (reaction IN ('👏','💪','🔥','❤️','😊','🎉'));

-- 2) PK를 (kudos_id, user_id, reaction)으로 변경 → 한 사람이 여러 반응 가능
ALTER TABLE kudos_likes DROP CONSTRAINT IF EXISTS kudos_likes_pkey;
ALTER TABLE kudos_likes ADD PRIMARY KEY (kudos_id, user_id, reaction);

-- 3) 본인 칭찬 삭제 RLS
CREATE POLICY kudos_delete ON kudos FOR DELETE
  USING (auth.uid() = author_id);
