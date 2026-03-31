-- leader는 자기 팀의 custom_eval_items만 INSERT/UPDATE 가능
-- admin, director는 전체 팀 가능

DROP POLICY IF EXISTS "custom_eval_items_insert" ON custom_eval_items;
CREATE POLICY "custom_eval_items_insert" ON custom_eval_items
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (
        profiles.role IN ('admin', 'director')
        OR (profiles.role = 'leader' AND profiles.team = custom_eval_items.team)
      )
    )
  );

DROP POLICY IF EXISTS "custom_eval_items_update" ON custom_eval_items;
CREATE POLICY "custom_eval_items_update" ON custom_eval_items
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (
        profiles.role IN ('admin', 'director')
        OR (profiles.role = 'leader' AND profiles.team = custom_eval_items.team)
      )
    )
  );
