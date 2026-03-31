-- 사이트 건의/버그 리포트 테이블
CREATE TABLE IF NOT EXISTS site_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES auth.users(id),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  -- 브라우저 메타 (자동 수집)
  user_agent TEXT,
  screen_size TEXT,
  current_url TEXT,
  -- 콘솔 로그 스냅샷
  console_logs TEXT,
  -- 스크린샷 URL 배열
  attachment_urls TEXT[],
  -- 상태 관리
  status TEXT NOT NULL DEFAULT '접수' CHECK (status IN ('접수', '확인', '처리중', '완료')),
  admin_memo TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- updated_at 자동 갱신
CREATE OR REPLACE FUNCTION update_site_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_site_reports_updated_at
  BEFORE UPDATE ON site_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_site_reports_updated_at();

-- RLS 활성화
ALTER TABLE site_reports ENABLE ROW LEVEL SECURITY;

-- 누구나 자기 건의 INSERT 가능
CREATE POLICY site_reports_insert ON site_reports
  FOR INSERT WITH CHECK (auth.uid() = author_id);

-- 본인 건의만 조회 가능
CREATE POLICY site_reports_select_own ON site_reports
  FOR SELECT USING (auth.uid() = author_id);

-- admin은 전체 조회 + 상태/메모 업데이트 가능
CREATE POLICY site_reports_admin_select ON site_reports
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY site_reports_admin_update ON site_reports
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 스토리지 버킷 (Supabase Dashboard에서 수동 생성 필요 시 참고)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('report-attachments', 'report-attachments', true);
