-- ══════════════════════════════════════════════════════════════════
-- 032_note_thread_rls_fix.sql
-- 쪽지(note) 스레드를 수신자·관리자만 조회/작성 가능하도록 수정
--
-- 변경 전(015): sender_id = auth.uid() 도 SELECT/INSERT 허용
--   → 실명 쪽지 발신자(일반 팀원)가 관리자 답변 스레드를 읽을 수 있는 버그
-- 변경 후: 수신자(recipient_id) 또는 admin/director 역할만 허용
-- ══════════════════════════════════════════════════════════════════

-- ── SELECT ──────────────────────────────────────────────────────
DROP POLICY IF EXISTS "threads_select" ON message_threads;

CREATE POLICY "threads_select" ON message_threads
  FOR SELECT USING (
    -- 쪽지 스레드: 수신자 또는 관리자(admin/director)만
    (ref_type = 'note' AND (
      EXISTS (
        SELECT 1 FROM anonymous_notes
        WHERE id = message_threads.ref_id
          AND recipient_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
          AND role IN ('admin', 'director')
      )
    ))
    -- VOC 스레드: 리더 이상 또는 VOC 작성자(실명)
    OR (ref_type = 'voc' AND (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
          AND role IN ('admin', 'director', 'leader')
      )
      OR EXISTS (
        SELECT 1 FROM vocs
        WHERE id = message_threads.ref_id
          AND author_id = auth.uid()
      )
    ))
  );

-- ── INSERT ──────────────────────────────────────────────────────
DROP POLICY IF EXISTS "threads_insert" ON message_threads;

CREATE POLICY "threads_insert" ON message_threads
  FOR INSERT WITH CHECK (
    -- 쪽지 스레드: 수신자만 답변 가능 (admin/director는 recipient_id로 포함됨)
    (ref_type = 'note' AND
      EXISTS (
        SELECT 1 FROM anonymous_notes
        WHERE id = message_threads.ref_id
          AND recipient_id = auth.uid()
      )
    )
    -- VOC 스레드: 리더 이상 또는 VOC 작성자(실명)
    OR (ref_type = 'voc' AND (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
          AND role IN ('admin', 'director', 'leader')
      )
      OR EXISTS (
        SELECT 1 FROM vocs
        WHERE id = message_threads.ref_id
          AND author_id = auth.uid()
      )
    ))
  );
