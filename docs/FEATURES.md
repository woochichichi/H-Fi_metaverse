# FEATURES.md — 기능 상세 & DB 스키마

## 핵심 기능 9개

### 1. VOC (Voice of Customer)
- 익명/실명 접수 → 카테고리/상태 관리 → 양방향 익명 대화 → 통계
- 익명 ON → `author_id = NULL` (완전 익명, DB에도 흔적 없음)
- 익명이어도 `team`은 기록 (팀별 통계용)
- Storage 파일명: UUID 기반 (사용자 정보 노출 없음)

**폼 필드**: 익명 여부(토글, 기본 ON), 카테고리(불편/요청/칭찬/개선/기타), 대상 영역(업무환경/성장/관계/기타), 제목(100자), 내용(1000자), 첨부파일(이미지/PDF, 5MB, 3개)

**상태 흐름**: 접수 → 검토중 → 처리중 → 완료 / 보류

**통계 차트**: 카테고리별(도넛), 팀별(수평 바), 월별 추이(라인), 상태별(스택 바), 평균 처리 시간(숫자 카드)

### 2. 아이디어 보드
- 등록 → 좋아요 투표(토글) → 상태 관리
- 투표: 낙관적 업데이트 (즉시 +1 → idea_votes INSERT or DELETE 토글 → 실패 시 롤백)

**상태 흐름**: 제안 → 검토 → 채택 → 진행중 → 완료 / 반려

### 3. 공지사항
- 시급성 3단계(🔴긴급/🟡할일/🔵참고) → 차등 알림 → 읽음 추적
- 고정 공지: 상단 고정, 📌 아이콘
- 읽음 현황: "45/60명 읽음" (리더만 볼 수 있음)
- 읽음 처리: 상세 패널 열리면 자동 `notice_reads` INSERT

### 4. KPI 대시보드
- 유닛별 KPI 카드 + 월별 추이 차트 + 실적 입력
- 점수 0~3, 증적 설명 텍스트

### 5. 익명 쪽지함
- 건의/질문을 수평적으로 전달 → 양방향 익명 대화
- `sender_id = NULL` (VOC와 동일한 익명 원칙)
- `message_threads`: `sender_role`만 기록 (실제 user_id 절대 저장 안 함)

### 6. 개인 수집함
- 부재 중 알림/쪽지 모아보기 (시급성별 자동 정렬)
- 로그인 시 자동 확인

### 7. 평가 대시보드
- 활동 자동 축적 → 팀별 히트맵 + 개인별 요약 + CSV 내보내기
- `user_activities`: 자동 기록 전용 (사용자 직접 수정 불가)

**자동 기록 포인트**:
| 활동 | 포인트 |
|------|--------|
| VOC 작성 | +3pt |
| 아이디어 등록 | +3pt |
| 아이디어 투표 | +1pt |
| 공지 읽음 | +0.5pt |
| 이벤트 참여 | +5pt |
| 쪽지 발송 | +1pt |
| 인적교류 참여 | +5pt |

### 8. 관리자 패널
- 초대 코드 관리 (생성/목록/비활성화/복사)
- 사용자 관리 (목록/역할 변경/비활성화)

### 9. 라운지
- 기분 이모지 (8개: 😆최고 😊좋아요 😐보통 😰힘들어 🤯바빠 😴졸려 🔥열정 ☕커피중)
- 활동 타임라인 (최근 VOC/공지/아이디어/입장 피드)
- 이모지 → `profiles.mood_emoji` UPDATE → 메타버스 캐릭터 위에 표시

---

## DB 스키마

### 001_init.sql

```sql
-- 프로필
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

-- 초대 코드
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

-- VOC (완전 익명 지원)
CREATE TABLE vocs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id     UUID REFERENCES auth.users(id),  -- NULL = 완전 익명
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

-- 아이디어
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

-- 공지사항
CREATE TABLE notices (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id     UUID REFERENCES auth.users(id),
  title         TEXT NOT NULL,
  content       TEXT NOT NULL,
  category      TEXT DEFAULT '일반' CHECK (category IN ('일반','긴급','이벤트','활동보고')),
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

-- KPI
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

-- 활동 기록
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

-- 알림 (Phase 2 텔레그램 확장 대비)
CREATE TABLE notifications (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES auth.users(id),  -- NULL = 전체 알림
  type          TEXT NOT NULL,
  title         TEXT NOT NULL,
  body          TEXT,
  link          TEXT,
  read          BOOLEAN DEFAULT false,
  channel       TEXT DEFAULT 'web',  -- 'web' | 'telegram'
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- 익명 쪽지
CREATE TABLE anonymous_notes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id     UUID REFERENCES auth.users(id),  -- NULL = 익명
  recipient_id  UUID REFERENCES auth.users(id) NOT NULL,
  title         TEXT NOT NULL,
  content       TEXT NOT NULL,
  anonymous     BOOLEAN DEFAULT true,
  status        TEXT DEFAULT '접수' CHECK (status IN ('접수','확인','답변완료')),
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- 양방향 익명 대화 (VOC + 쪽지 공용)
CREATE TABLE message_threads (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_type TEXT NOT NULL CHECK (reference_type IN ('voc','note')),
  reference_id  UUID NOT NULL,
  sender_role   TEXT NOT NULL CHECK (sender_role IN ('author','admin','leader')),
  content       TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- 사용자 활동 자동 기록
CREATE TABLE user_activities (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES auth.users(id) NOT NULL,
  activity_type TEXT NOT NULL,
  points        REAL DEFAULT 0,
  reference_id  UUID,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- 인덱스
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
CREATE INDEX idx_user_activities_user ON user_activities(user_id, created_at DESC);
CREATE INDEX idx_message_threads_ref ON message_threads(reference_type, reference_id);
```

### 002_rls.sql

```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE vocs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE idea_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE notice_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE anonymous_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- invite_codes (가입 전 검증: anon 읽기 허용)
CREATE POLICY "invite_codes_select" ON invite_codes FOR SELECT USING (true);
CREATE POLICY "invite_codes_insert_admin" ON invite_codes FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "invite_codes_update_admin" ON invite_codes FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- vocs (익명 INSERT 허용: author_id NULL OK)
CREATE POLICY "vocs_select" ON vocs FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "vocs_insert" ON vocs FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "vocs_update_leader" ON vocs FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','leader')));

-- ideas
CREATE POLICY "ideas_select" ON ideas FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "ideas_insert" ON ideas FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "ideas_update_leader" ON ideas FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','leader')));

-- idea_votes
CREATE POLICY "idea_votes_select" ON idea_votes FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "idea_votes_insert" ON idea_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "idea_votes_delete_own" ON idea_votes FOR DELETE USING (auth.uid() = user_id);

-- notices
CREATE POLICY "notices_select" ON notices FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "notices_insert_leader" ON notices FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','leader')));

-- notice_reads
CREATE POLICY "notice_reads_select" ON notice_reads FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "notice_reads_insert_own" ON notice_reads FOR INSERT WITH CHECK (auth.uid() = user_id);

-- kpi
CREATE POLICY "kpi_items_select" ON kpi_items FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "kpi_items_insert_leader" ON kpi_items FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','leader')));
CREATE POLICY "kpi_records_select" ON kpi_records FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "kpi_records_insert_leader" ON kpi_records FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','leader')));

-- activities
CREATE POLICY "activities_select" ON activities FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "activities_insert_leader" ON activities FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','leader')));

-- notifications
CREATE POLICY "notifications_select_own" ON notifications FOR SELECT
  USING (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "notifications_update_own" ON notifications FOR UPDATE
  USING (user_id = auth.uid());

-- anonymous_notes
CREATE POLICY "notes_select_own" ON anonymous_notes FOR SELECT
  USING (recipient_id = auth.uid() OR sender_id = auth.uid());
CREATE POLICY "notes_insert" ON anonymous_notes FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- message_threads (로그인 사용자 읽기/쓰기)
CREATE POLICY "threads_select" ON message_threads FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "threads_insert" ON message_threads FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- user_activities (읽기만 — 쓰기는 트리거로만)
CREATE POLICY "user_activities_select" ON user_activities FOR SELECT USING (auth.uid() IS NOT NULL);
```

### 003_triggers.sql

```sql
-- 가입 시 profiles 자동 생성
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, name, team, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'team',
    COALESCE(NEW.raw_user_meta_data->>'role', 'member')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- updated_at 자동 갱신
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER vocs_updated_at BEFORE UPDATE ON vocs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```
