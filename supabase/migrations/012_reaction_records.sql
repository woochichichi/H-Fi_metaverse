-- 반응속도 테스트 기록
CREATE TABLE IF NOT EXISTS reaction_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  avg_ms INTEGER NOT NULL,
  best_ms INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE reaction_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reaction_records_select" ON reaction_records
  FOR SELECT USING (true);

CREATE POLICY "reaction_records_insert" ON reaction_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 랭킹 뷰 (각 유저의 최고 평균 기록)
CREATE OR REPLACE VIEW reaction_ranking AS
SELECT
  p.id,
  p.name,
  p.nickname,
  p.team,
  MIN(rr.avg_ms) AS best_avg_ms,
  MIN(rr.best_ms) AS best_single_ms,
  COUNT(*)::INTEGER AS play_count
FROM profiles p
JOIN reaction_records rr ON p.id = rr.user_id
GROUP BY p.id, p.name, p.nickname, p.team;
