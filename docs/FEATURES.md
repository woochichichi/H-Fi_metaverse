# FEATURES.md — 기능 상세 & DB 스키마

## 핵심 기능 13개

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
- 커스텀 평가 항목: 팀별 맞춤 활동 항목 정의 가능 (관리자 패널에서 관리)

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
- 커스텀 평가 항목 관리 (생성/수정/삭제)
- 평가 대시보드 (팀별/사용자별 통계 조회)

### 9. 라운지
- 기분 이모지 (8개: 😆최고 😊좋아요 😐보통 😰힘들어 🤯바빠 😴졸려 🔥열정 ☕커피중)
- 활동 타임라인 (최근 VOC/공지/아이디어/입장 피드)
- 이모지 → `profiles.mood_emoji` UPDATE → 메타버스 캐릭터 위에 표시

### 10. 모임 (인적교류 / Gathering)
- 운동/맛집/스터디/취미 등 소셜 이벤트 생성 및 참여
- 모집 마감일, 최대 인원 설정
- 참여/탈퇴 기능 + 댓글 소통
- 연락처 정보 공유 (주최자)

**폼 필드**: 제목, 설명, 카테고리(운동/맛집/스터디/취미), 마감일, 최대 인원, 연락처

**상태 흐름**: 모집중 → 마감 → 완료

### 11. 줄넘기 게임 (Jump Rope)
- **실시간 멀티플레이어** (Supabase Realtime 채널)
- 로비 시스템: 방 생성 → 대기 → 전원 준비 → 시작
- 물리 시뮬레이션: 줄 회전 + 충돌 판정
- 난이도: 15초마다 속도 증가
- 생존 방식: 줄에 맞으면 탈락
- Space/탭으로 점프
- 기록: 생존 시간, 점프 횟수, 최고 속도
- 랭킹: 생존 시간 기준 순위

### 12. 오목 게임 (Omok / Five-in-a-Row)
- **실시간 2인 대전** (Supabase Realtime 채널)
- 15×15 바둑판, 턴제 (60초 턴 타이머)
- 흑 먼저 두기 + **렌주룰** 적용
  - 장목(6목 이상) 금지
  - 삼삼(3-3) 금지
  - 사사(4-4) 금지
- 매치메이킹: 2인 로비
- 타임아웃 시 패배
- 랭킹: 승률 기준

### 13. 반응속도 게임 (Reaction Speed)
- **싱글 플레이어** 스킬 테스트
- 화면 색상 변화 → 최대한 빨리 클릭
- 5라운드 진행
- 기록: 평균 반응시간(ms), 최고 기록
- 너무 일찍 클릭 감지 (too early)
- 랭킹: 평균 시간 기준

---

## 메타버스 코어 기능

### 멀티룸 시스템
4개 방 + 포탈 이동:
| 방 | 팀 | 색상 | 설명 |
|----|-----|------|------|
| Stock Room | 증권ITO | 초록(#00D68F) | 증권 팀 전용 공간 |
| Life Room | 생명ITO | 보라(#6C5CE7) | 생명 팀 전용 공간 |
| Shield Room | 손보ITO | 파랑(#0984E3) | 손보 팀 전용 공간 |
| Plaza | 한금서/공용 | 금(#F8B500) | 중앙 광장 (공용 Zone) |

- 포탈: 방 간 자동 이동 (쿨다운 적용)
- 각 방에 팀 전용 Zone (로비, KPI, 공지) + 공용 Zone (VOC, 아이디어, 게임 등)

### 캐릭터 커스텀
- 피부색 (5종)
- 머리색 (8종)
- 몸 색상 (10종)
- 헤어스타일 (5종)
- 악세서리 (6종)
- 프로필에 저장, 메타버스에서 실시간 반영

### 실시간 기능
- **플레이어 동기화**: Supabase Realtime으로 위치 실시간 동기화
- **채팅 말풍선**: 캐릭터 위에 15초간 표시
- **이모지 리액션**: 근처 플레이어에게 이모지 전송 (1.5초 애니메이션)
- **기분 이모지**: 캐릭터 위에 현재 기분 표시
- **온라인 상태**: 사이드바에서 접속자 목록 실시간 확인

### Zone 인터랙션
플레이어가 Zone 위를 걸으면 진입 가능 (13+ Zone):
- **공용**: VOC 센터, 아이디어 보드, 모임 광장, 반응속도 게임, 오목, 줄넘기
- **팀 전용**: 팀 로비, 팀 KPI, 팀 공지

### 비속어 필터
- `lib/profanityFilter.ts`로 채팅/게시 내용 필터링

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
  -- 캐릭터 커스텀 필드
  skin_color    TEXT,
  hair_color    TEXT,
  body_color    TEXT,
  hair_style    TEXT,
  accessory     TEXT,
  nickname      TEXT,
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

-- 알림
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

-- 모임 (인적교류)
CREATE TABLE gatherings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id     UUID REFERENCES auth.users(id),
  title         TEXT NOT NULL,
  description   TEXT,
  category      TEXT CHECK (category IN ('운동','맛집','스터디','취미','기타')),
  max_members   INTEGER,
  deadline      TIMESTAMPTZ,
  contact       TEXT,
  status        TEXT DEFAULT '모집중' CHECK (status IN ('모집중','마감','완료')),
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE gathering_members (
  gathering_id  UUID REFERENCES gatherings(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (gathering_id, user_id)
);

CREATE TABLE gathering_comments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gathering_id  UUID REFERENCES gatherings(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES auth.users(id),
  content       TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- 커스텀 평가 항목
CREATE TABLE custom_eval_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team          TEXT NOT NULL,
  title         TEXT NOT NULL,
  description   TEXT,
  points        REAL DEFAULT 1,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- 줄넘기 게임 기록
CREATE TABLE jump_rope_records (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES auth.users(id),
  duration_ms   INTEGER NOT NULL,
  jump_count    INTEGER DEFAULT 0,
  max_speed     REAL,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE VIEW jump_rope_ranking AS
SELECT user_id, MAX(duration_ms) as best_duration, MAX(jump_count) as best_jumps
FROM jump_rope_records GROUP BY user_id;

-- 오목 게임 기록
CREATE TABLE omok_records (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  winner_id     UUID REFERENCES auth.users(id),
  loser_id      UUID REFERENCES auth.users(id),
  black_id      UUID REFERENCES auth.users(id),
  white_id      UUID REFERENCES auth.users(id),
  total_moves   INTEGER,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE VIEW omok_ranking AS
SELECT user_id,
  COUNT(*) FILTER (WHERE user_id = winner_id) as wins,
  COUNT(*) FILTER (WHERE user_id = loser_id) as losses
FROM (
  SELECT winner_id as user_id, winner_id, loser_id FROM omok_records
  UNION ALL
  SELECT loser_id as user_id, winner_id, loser_id FROM omok_records
) sub GROUP BY user_id;

-- 반응속도 게임 기록
CREATE TABLE reaction_records (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES auth.users(id),
  avg_time_ms   REAL NOT NULL,
  best_time_ms  REAL,
  rounds        INTEGER DEFAULT 5,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE VIEW reaction_ranking AS
SELECT user_id, MIN(avg_time_ms) as best_avg, MIN(best_time_ms) as best_single
FROM reaction_records GROUP BY user_id;

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
CREATE INDEX idx_gatherings_status ON gatherings(status);
CREATE INDEX idx_jump_rope_user ON jump_rope_records(user_id);
CREATE INDEX idx_omok_winner ON omok_records(winner_id);
CREATE INDEX idx_reaction_user ON reaction_records(user_id);
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
ALTER TABLE gatherings ENABLE ROW LEVEL SECURITY;
ALTER TABLE gathering_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE gathering_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_eval_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE jump_rope_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE omok_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE reaction_records ENABLE ROW LEVEL SECURITY;

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

-- gatherings
CREATE POLICY "gatherings_select" ON gatherings FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "gatherings_insert" ON gatherings FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "gatherings_update_own" ON gatherings FOR UPDATE USING (author_id = auth.uid());

-- gathering_members
CREATE POLICY "gathering_members_select" ON gathering_members FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "gathering_members_insert" ON gathering_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "gathering_members_delete_own" ON gathering_members FOR DELETE USING (auth.uid() = user_id);

-- gathering_comments
CREATE POLICY "gathering_comments_select" ON gathering_comments FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "gathering_comments_insert" ON gathering_comments FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- custom_eval_items
CREATE POLICY "custom_eval_items_select" ON custom_eval_items FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "custom_eval_items_insert_admin" ON custom_eval_items FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- game records (로그인 사용자 읽기/쓰기)
CREATE POLICY "jump_rope_select" ON jump_rope_records FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "jump_rope_insert" ON jump_rope_records FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "omok_select" ON omok_records FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "omok_insert" ON omok_records FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "reaction_select" ON reaction_records FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "reaction_insert" ON reaction_records FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
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
