-- 팀별 커스텀 평가 항목
CREATE TABLE IF NOT EXISTS custom_eval_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team TEXT NOT NULL,
  name TEXT NOT NULL,
  points NUMERIC NOT NULL DEFAULT 1,
  active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_custom_eval_items_team ON custom_eval_items(team);

-- RLS
ALTER TABLE custom_eval_items ENABLE ROW LEVEL SECURITY;

-- 조회: 인증 사용자 (자기 팀 항목만)
CREATE POLICY "custom_eval_items_select" ON custom_eval_items
  FOR SELECT TO authenticated
  USING (true);

-- 삽입/수정: admin, director, leader만
CREATE POLICY "custom_eval_items_insert" ON custom_eval_items
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'director', 'leader')
    )
  );

CREATE POLICY "custom_eval_items_update" ON custom_eval_items
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'director', 'leader')
    )
  );
