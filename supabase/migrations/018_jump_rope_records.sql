-- 단체 줄넘기 게임 기록
CREATE TABLE IF NOT EXISTS jump_rope_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  duration_ms INTEGER NOT NULL,
  jump_count INTEGER NOT NULL DEFAULT 0,
  max_speed REAL NOT NULL DEFAULT 1.0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE jump_rope_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "jump_rope_records_select" ON jump_rope_records
  FOR SELECT USING (true);

CREATE POLICY "jump_rope_records_insert" ON jump_rope_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 랭킹 뷰 (팀별 최고 생존 시간)
CREATE OR REPLACE VIEW jump_rope_ranking AS
SELECT
  p.id,
  p.name,
  p.nickname,
  p.team,
  MAX(jr.duration_ms) AS best_duration_ms,
  MAX(jr.jump_count) AS best_jump_count,
  COUNT(*)::INTEGER AS play_count
FROM profiles p
JOIN jump_rope_records jr ON p.id = jr.user_id
GROUP BY p.id, p.name, p.nickname, p.team;
