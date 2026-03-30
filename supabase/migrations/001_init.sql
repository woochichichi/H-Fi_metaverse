-- ==============================
-- 프로필
-- ==============================
CREATE TABLE profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  emp_no        TEXT UNIQUE,
  name          TEXT NOT NULL,
  team          TEXT NOT NULL CHECK (team IN ('증권ITO','생명ITO','손보ITO','한금서')),
  role          TEXT DEFAULT 'member' CHECK (role IN ('admin','leader','member')),
  unit          TEXT CHECK (unit IN ('조직','품질','전략','AX')),
  avatar_color  TEXT DEFAULT '#6C5CE7',
  avatar_emoji  TEXT DEFAULT '😊',
  avatar_url    TEXT,
  status        TEXT DEFAULT 'offline' CHECK (status IN ('online','offline','재택')),
  mood_emoji    TEXT,
  position_x    REAL DEFAULT 430,
  position_y    REAL DEFAULT 380,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- ==============================
-- 초대 코드
-- ==============================
CREATE TABLE invite_codes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code          TEXT UNIQUE NOT NULL,
  created_by    UUID REFERENCES auth.users(id),
  team          TEXT,
  role          TEXT DEFAULT 'member',
  max_uses      INTEGER DEFAULT 10,
  used_count    INTEGER DEFAULT 0,
  expires_at    TIMESTAMPTZ,
  active        BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- ==============================
-- VOC (완전 익명 지원)
-- ==============================
CREATE TABLE vocs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id     UUID REFERENCES auth.users(id),
  anonymous     BOOLEAN DEFAULT true,
  category      TEXT NOT NULL CHECK (category IN ('불편','요청','칭찬','개선','기타')),
  title         TEXT NOT NULL,
  content       TEXT NOT NULL,
  team          TEXT NOT NULL,
  target_area   TEXT CHECK (target_area IN ('업무환경','성장','관계','기타')),
  status        TEXT DEFAULT '접수' CHECK (status IN ('접수','검토중','처리중','완료','보류')),
  assignee_id   UUID REFERENCES auth.users(id),
  resolution    TEXT,
  attachment_urls TEXT[],
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- ==============================
-- 아이디어
-- ==============================
CREATE TABLE ideas (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id     UUID REFERENCES auth.users(id),
  title         TEXT NOT NULL,
  description   TEXT NOT NULL,
  category      TEXT CHECK (category IN ('이벤트','인적교류','업무개선','기타')),
  status        TEXT DEFAULT '제안' CHECK (status IN ('제안','검토','채택','진행중','완료','반려')),
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE idea_votes (
  idea_id       UUID REFERENCES ideas(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (idea_id, user_id)
);

CREATE VIEW idea_with_votes AS
SELECT i.*, COALESCE(v.vote_count, 0) as vote_count
FROM ideas i
LEFT JOIN (SELECT idea_id, COUNT(*) as vote_count FROM idea_votes GROUP BY idea_id) v
ON i.id = v.idea_id;

-- ==============================
-- 공지사항
-- ==============================
CREATE TABLE notices (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id     UUID REFERENCES auth.users(id),
  title         TEXT NOT NULL,
  content       TEXT NOT NULL,
  urgency       TEXT DEFAULT '참고' CHECK (urgency IN ('긴급','할일','참고')),
  category      TEXT DEFAULT '일반' CHECK (category IN ('일반','이벤트','활동보고')),
  pinned        BOOLEAN DEFAULT false,
  unit          TEXT,
  team          TEXT,
  attachment_urls TEXT[],
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE notice_reads (
  notice_id     UUID REFERENCES notices(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  read_at       TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (notice_id, user_id)
);

-- ==============================
-- KPI
-- ==============================
CREATE TABLE kpi_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit          TEXT NOT NULL,
  title         TEXT NOT NULL,
  description   TEXT,
  max_score     INTEGER DEFAULT 3,
  quarter       TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE kpi_records (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kpi_item_id   UUID REFERENCES kpi_items(id),
  user_id       UUID REFERENCES auth.users(id),
  month         TEXT NOT NULL,
  score         REAL,
  evidence      TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- ==============================
-- 활동 기록
-- ==============================
CREATE TABLE activities (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit          TEXT NOT NULL,
  task          TEXT,
  title         TEXT NOT NULL,
  description   TEXT,
  date          DATE NOT NULL,
  participants  INTEGER DEFAULT 0,
  evidence_url  TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- ==============================
-- 알림 (수집함 + Phase 2 텔레그램 확장 대비)
-- ==============================
CREATE TABLE notifications (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES auth.users(id),
  type          TEXT NOT NULL,
  urgency       TEXT DEFAULT '참고' CHECK (urgency IN ('긴급','할일','참고')),
  title         TEXT NOT NULL,
  body          TEXT,
  link          TEXT,
  read          BOOLEAN DEFAULT false,
  channel       TEXT DEFAULT 'web',
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- ==============================
-- 익명 쪽지함
-- ==============================
CREATE TABLE anonymous_notes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id     UUID REFERENCES auth.users(id),
  anonymous     BOOLEAN DEFAULT true,
  recipient_role TEXT NOT NULL CHECK (recipient_role IN ('leader','admin','team_leaders')),
  recipient_team TEXT,
  category      TEXT CHECK (category IN ('건의','질문','감사','불편','기타')),
  title         TEXT NOT NULL,
  content       TEXT NOT NULL,
  team          TEXT NOT NULL,
  status        TEXT DEFAULT '미읽음' CHECK (status IN ('미읽음','읽음','답변완료')),
  session_token TEXT,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- ==============================
-- 양방향 대화 스레드 (VOC + 쪽지 공용)
-- ==============================
CREATE TABLE message_threads (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ref_type      TEXT NOT NULL CHECK (ref_type IN ('voc','note')),
  ref_id        UUID NOT NULL,
  sender_role   TEXT NOT NULL CHECK (sender_role IN ('author','manager')),
  message       TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- ==============================
-- 사용자 활동 기록 (평가 대시보드용 — 자동 축적)
-- ==============================
CREATE TABLE user_activities (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES auth.users(id),
  team          TEXT NOT NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'voc_submit','idea_submit','idea_vote','notice_read',
    'event_join','note_send','exchange_join'
  )),
  points        REAL DEFAULT 1,
  ref_id        UUID,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- ==============================
-- 인덱스
-- ==============================
CREATE INDEX idx_vocs_team ON vocs(team);
CREATE INDEX idx_vocs_status ON vocs(status);
CREATE INDEX idx_vocs_created ON vocs(created_at DESC);
CREATE INDEX idx_ideas_created ON ideas(created_at DESC);
CREATE INDEX idx_notices_pinned ON notices(pinned DESC, created_at DESC);
CREATE INDEX idx_kpi_records_month ON kpi_records(month);
CREATE INDEX idx_activities_unit_date ON activities(unit, date DESC);
CREATE INDEX idx_profiles_team ON profiles(team);
CREATE INDEX idx_invite_codes_code ON invite_codes(code);
CREATE INDEX idx_notifications_user ON notifications(user_id, read, created_at DESC);
CREATE INDEX idx_notifications_urgency ON notifications(urgency, created_at DESC);
CREATE INDEX idx_anonymous_notes_team ON anonymous_notes(team);
CREATE INDEX idx_anonymous_notes_status ON anonymous_notes(status);
CREATE INDEX idx_anonymous_notes_token ON anonymous_notes(session_token);
CREATE INDEX idx_message_threads_ref ON message_threads(ref_type, ref_id, created_at);
CREATE INDEX idx_user_activities_user ON user_activities(user_id, created_at DESC);
CREATE INDEX idx_user_activities_team ON user_activities(team, activity_type, created_at DESC);
