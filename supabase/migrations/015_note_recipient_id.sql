-- 015: 쪽지에 특정 수신자 지정 기능 추가
-- recipient_id가 있으면 해당 리더만, NULL이면 모든 리더가 볼 수 있음

-- 1) recipient_id 컬럼 추가
ALTER TABLE anonymous_notes
  ADD COLUMN IF NOT EXISTS recipient_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_anonymous_notes_recipient ON anonymous_notes(recipient_id);

-- 2) 기존 leader SELECT 정책을 recipient_id 필터 포함하도록 교체
DROP POLICY IF EXISTS "anon_notes_select_leader" ON anonymous_notes;

CREATE POLICY "anon_notes_select_leader" ON anonymous_notes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'director', 'leader')
    )
    AND (recipient_id IS NULL OR recipient_id = auth.uid())
  );

-- 3) gathering member_count 트리거를 SECURITY DEFINER로 변경 (RLS 우회)
ALTER FUNCTION update_gathering_member_count() SECURITY DEFINER;
