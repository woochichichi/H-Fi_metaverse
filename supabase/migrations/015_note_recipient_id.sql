-- 015: RLS 보안 강화 — 데이터 격리 수정

-- ══════════════════════════════════════════════
-- 1) anonymous_notes: recipient_id 추가
--    모든 역할 동일: 본인에게 온 편지 + 본인이 보낸 편지만 조회
-- ══════════════════════════════════════════════

ALTER TABLE anonymous_notes
  ADD COLUMN IF NOT EXISTS recipient_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_anonymous_notes_recipient ON anonymous_notes(recipient_id);

-- SELECT: 수신자 또는 발신자만
DROP POLICY IF EXISTS "anon_notes_select_leader" ON anonymous_notes;
DROP POLICY IF EXISTS "anon_notes_select_sender" ON anonymous_notes;
CREATE POLICY "anon_notes_select" ON anonymous_notes
  FOR SELECT USING (
    recipient_id = auth.uid() OR sender_id = auth.uid()
  );

-- UPDATE: 수신자만 (읽음 처리 등)
DROP POLICY IF EXISTS "anon_notes_update_leader" ON anonymous_notes;
DROP POLICY IF EXISTS "anon_notes_update_recipient" ON anonymous_notes;
CREATE POLICY "anon_notes_update_recipient" ON anonymous_notes
  FOR UPDATE USING (recipient_id = auth.uid());

-- ══════════════════════════════════════════════
-- 2) message_threads: 권한 기반 접근 제어
--    쪽지 스레드: 수신자 또는 발신자만
--    VOC 스레드: 리더 또는 작성자만
-- ══════════════════════════════════════════════

DROP POLICY IF EXISTS "threads_select" ON message_threads;
CREATE POLICY "threads_select" ON message_threads
  FOR SELECT USING (
    (ref_type = 'note' AND (
      EXISTS (SELECT 1 FROM anonymous_notes WHERE id = message_threads.ref_id AND recipient_id = auth.uid())
      OR EXISTS (SELECT 1 FROM anonymous_notes WHERE id = message_threads.ref_id AND sender_id = auth.uid())
    ))
    OR (ref_type = 'voc' AND (
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','director','leader'))
      OR EXISTS (SELECT 1 FROM vocs WHERE id = message_threads.ref_id AND author_id = auth.uid())
    ))
  );

DROP POLICY IF EXISTS "threads_insert" ON message_threads;
CREATE POLICY "threads_insert" ON message_threads
  FOR INSERT WITH CHECK (
    (ref_type = 'note' AND (
      EXISTS (SELECT 1 FROM anonymous_notes WHERE id = message_threads.ref_id AND recipient_id = auth.uid())
      OR EXISTS (SELECT 1 FROM anonymous_notes WHERE id = message_threads.ref_id AND sender_id = auth.uid())
    ))
    OR (ref_type = 'voc' AND (
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','director','leader'))
      OR EXISTS (SELECT 1 FROM vocs WHERE id = message_threads.ref_id AND author_id = auth.uid())
    ))
  );

-- ══════════════════════════════════════════════
-- 3) vocs: 멤버는 자기 팀 VOC만 (리더는 전체)
-- ══════════════════════════════════════════════

DROP POLICY IF EXISTS "vocs_select" ON vocs;
CREATE POLICY "vocs_select" ON vocs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin','director','leader'))
    OR (vocs.team = (SELECT profiles.team FROM profiles WHERE profiles.id = auth.uid()))
    OR (vocs.author_id = auth.uid())
  );

-- ══════════════════════════════════════════════
-- 4) gathering 트리거 SECURITY DEFINER
-- ══════════════════════════════════════════════

ALTER FUNCTION update_gathering_member_count() SECURITY DEFINER;
