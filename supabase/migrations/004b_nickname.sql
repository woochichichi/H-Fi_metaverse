-- ==============================
-- 별명(닉네임) 시스템 추가
-- ==============================

-- profiles 테이블에 nickname 컬럼 추가
ALTER TABLE profiles
  ADD COLUMN nickname TEXT UNIQUE;

-- nickname 길이 제한 (1~10자)
ALTER TABLE profiles
  ADD CONSTRAINT nickname_length CHECK (
    nickname IS NULL OR (char_length(nickname) >= 1 AND char_length(nickname) <= 10)
  );

-- 닉네임 검색용 인덱스
CREATE INDEX idx_profiles_nickname ON profiles(nickname);

-- handle_new_user 트리거 업데이트: 가입 시 nickname도 저장
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, name, team, role, nickname)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'team',
    COALESCE(NEW.raw_user_meta_data->>'role', 'member'),
    NEW.raw_user_meta_data->>'nickname'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
