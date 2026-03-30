-- VOC 테이블에 session_token 추가 (익명 VOC 양방향 대화용)
ALTER TABLE vocs ADD COLUMN session_token TEXT;
CREATE INDEX idx_vocs_session_token ON vocs(session_token);

-- notifications INSERT 정책 추가 (누락)
CREATE POLICY "notifications_insert" ON notifications FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
