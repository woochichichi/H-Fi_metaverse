-- 게시글 삭제 RLS 정책 (작성자 본인 또는 관리자)
-- 2026-03-31
--
-- FK CASCADE 자식 테이블(idea_votes, idea_comments, notice_reads,
-- gathering_members, gathering_comments)은 부모 삭제 시 DB가 자동 삭제하므로
-- 프론트에서 수동 삭제하지 않음. 단, message_threads는 FK가 없어 수동 삭제 필요.

-- ===== 메인 테이블 =====

-- ideas: 작성자 또는 관리자 삭제
CREATE POLICY "ideas_delete_own_or_admin" ON ideas
  FOR DELETE TO authenticated
  USING (
    auth.uid() = author_id
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'director')
    )
  );

-- notices: 작성자 또는 관리자 삭제
CREATE POLICY "notices_delete_own_or_admin" ON notices
  FOR DELETE TO authenticated
  USING (
    auth.uid() = author_id
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'director')
    )
  );

-- gatherings: 작성자 또는 관리자 삭제
CREATE POLICY "gatherings_delete_own_or_admin" ON gatherings
  FOR DELETE TO authenticated
  USING (
    auth.uid() = author_id
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'director')
    )
  );

-- anonymous_notes: 발신자 또는 관리자 삭제
CREATE POLICY "notes_delete_own_or_admin" ON anonymous_notes
  FOR DELETE TO authenticated
  USING (
    auth.uid() = sender_id
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'director')
    )
  );

-- ===== 수동 삭제가 필요한 자식 테이블 =====

-- message_threads: FK 없음 → 쪽지 삭제 시 프론트에서 수동 삭제
CREATE POLICY "threads_delete_by_note_author" ON message_threads
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM anonymous_notes
      WHERE anonymous_notes.id = message_threads.ref_id
        AND (
          anonymous_notes.sender_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
              AND profiles.role IN ('admin', 'director')
          )
        )
    )
  );

-- ===== FK CASCADE 자식 테이블 (DB 자동 삭제, 추가 보호용) =====
-- 프론트에서 직접 호출하지 않지만, 관리자가 개별 삭제할 수 있도록 정책 보존

CREATE POLICY "idea_votes_delete_by_idea_author" ON idea_votes
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM ideas
      WHERE ideas.id = idea_votes.idea_id
        AND (ideas.author_id = auth.uid()
          OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'director')))
    )
  );

CREATE POLICY "idea_comments_delete_by_idea_author" ON idea_comments
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM ideas
      WHERE ideas.id = idea_comments.idea_id
        AND (ideas.author_id = auth.uid()
          OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'director')))
    )
  );

CREATE POLICY "notice_reads_delete_by_notice_author" ON notice_reads
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM notices
      WHERE notices.id = notice_reads.notice_id
        AND (notices.author_id = auth.uid()
          OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'director')))
    )
  );

CREATE POLICY "gathering_members_delete_by_author" ON gathering_members
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM gatherings
      WHERE gatherings.id = gathering_members.gathering_id
        AND (gatherings.author_id = auth.uid()
          OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'director')))
    )
  );

CREATE POLICY "gathering_comments_delete_by_author" ON gathering_comments
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM gatherings
      WHERE gatherings.id = gathering_comments.gathering_id
        AND (gatherings.author_id = auth.uid()
          OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'director')))
    )
  );
