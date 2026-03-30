-- 009: 모임방 (gatherings + gathering_members)

-- 모임 테이블
CREATE TABLE IF NOT EXISTS gatherings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id   UUID REFERENCES profiles(id) ON DELETE SET NULL,
  title       TEXT NOT NULL,
  description TEXT NOT NULL,
  category    TEXT NOT NULL DEFAULT '기타'
              CHECK (category IN ('운동','맛집','스터디','취미','기타')),
  status      TEXT NOT NULL DEFAULT 'recruiting'
              CHECK (status IN ('recruiting','closed','completed')),
  max_members INT,                        -- NULL = 제한 없음
  contact_info TEXT,                      -- 마감 후 참여자에게만 공개 (카톡 오픈채팅 등)
  deadline    TIMESTAMPTZ,                -- 자동 마감 시점
  member_count INT NOT NULL DEFAULT 0,    -- 캐시 카운트
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 모임 참여 테이블
CREATE TABLE IF NOT EXISTS gathering_members (
  gathering_id UUID NOT NULL REFERENCES gatherings(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (gathering_id, user_id)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_gatherings_status ON gatherings(status);
CREATE INDEX IF NOT EXISTS idx_gatherings_created ON gatherings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gathering_members_user ON gathering_members(user_id);

-- updated_at 자동 갱신
CREATE OR REPLACE FUNCTION update_gatherings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_gatherings_updated_at
  BEFORE UPDATE ON gatherings
  FOR EACH ROW
  EXECUTE FUNCTION update_gatherings_updated_at();

-- member_count 자동 관리 트리거
CREATE OR REPLACE FUNCTION update_gathering_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE gatherings SET member_count = member_count + 1 WHERE id = NEW.gathering_id;
    -- 정원 도달 시 자동 마감
    UPDATE gatherings SET status = 'closed'
    WHERE id = NEW.gathering_id
      AND max_members IS NOT NULL
      AND member_count >= max_members
      AND status = 'recruiting';
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE gatherings SET member_count = member_count - 1 WHERE id = OLD.gathering_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_gathering_member_count
  AFTER INSERT OR DELETE ON gathering_members
  FOR EACH ROW
  EXECUTE FUNCTION update_gathering_member_count();

-- RLS
ALTER TABLE gatherings ENABLE ROW LEVEL SECURITY;
ALTER TABLE gathering_members ENABLE ROW LEVEL SECURITY;

-- 모임: 모든 로그인 사용자 조회 가능
CREATE POLICY "gatherings_select" ON gatherings
  FOR SELECT TO authenticated USING (true);

-- 모임: 로그인 사용자 생성 가능
CREATE POLICY "gatherings_insert" ON gatherings
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);

-- 모임: 작성자만 수정 가능
CREATE POLICY "gatherings_update" ON gatherings
  FOR UPDATE TO authenticated USING (auth.uid() = author_id);

-- 참여: 모든 로그인 사용자 조회 가능
CREATE POLICY "gathering_members_select" ON gathering_members
  FOR SELECT TO authenticated USING (true);

-- 참여: 본인만 참여 가능
CREATE POLICY "gathering_members_insert" ON gathering_members
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- 참여: 본인만 취소 가능
CREATE POLICY "gathering_members_delete" ON gathering_members
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- user_activities에 gathering_join 타입 추가 (CHECK 제약 수정 불가하면 무시)
-- ALTER TABLE user_activities DROP CONSTRAINT IF EXISTS user_activities_activity_type_check;
-- ALTER TABLE user_activities ADD CONSTRAINT user_activities_activity_type_check
--   CHECK (activity_type IN ('voc_submit','idea_submit','idea_vote','notice_read','event_join','note_send','exchange_join','gathering_join','custom'));
