-- 오목 게임 전적 기록
CREATE TABLE IF NOT EXISTS omok_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  winner_id UUID NOT NULL REFERENCES profiles(id),
  loser_id UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT different_players CHECK (winner_id <> loser_id)
);

CREATE INDEX idx_omok_records_winner ON omok_records(winner_id);
CREATE INDEX idx_omok_records_loser ON omok_records(loser_id);
CREATE INDEX idx_omok_records_created ON omok_records(created_at DESC);

-- RLS
ALTER TABLE omok_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "omok_records_select" ON omok_records
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "omok_records_insert" ON omok_records
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = winner_id);

-- 랭킹 뷰: 승/패/승률 집계
CREATE OR REPLACE VIEW omok_ranking AS
SELECT
  p.id,
  p.name,
  p.nickname,
  p.team,
  COALESCE(w.wins, 0)::INT AS wins,
  COALESCE(l.losses, 0)::INT AS losses,
  (COALESCE(w.wins, 0) + COALESCE(l.losses, 0))::INT AS total,
  CASE
    WHEN COALESCE(w.wins, 0) + COALESCE(l.losses, 0) = 0 THEN 0
    ELSE ROUND(COALESCE(w.wins, 0)::NUMERIC / (COALESCE(w.wins, 0) + COALESCE(l.losses, 0)) * 100)
  END AS win_rate
FROM profiles p
LEFT JOIN (
  SELECT winner_id, COUNT(*) AS wins FROM omok_records GROUP BY winner_id
) w ON w.winner_id = p.id
LEFT JOIN (
  SELECT loser_id, COUNT(*) AS losses FROM omok_records GROUP BY loser_id
) l ON l.loser_id = p.id
WHERE COALESCE(w.wins, 0) + COALESCE(l.losses, 0) > 0
ORDER BY wins DESC, win_rate DESC;
