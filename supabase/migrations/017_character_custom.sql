-- 017: 캐릭터 커스터마이징 컬럼 추가
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS skin_color  text NOT NULL DEFAULT '#FFE0BD',
  ADD COLUMN IF NOT EXISTS hair_color  text NOT NULL DEFAULT '#5a3e28',
  ADD COLUMN IF NOT EXISTS hair_style  text NOT NULL DEFAULT 'default',
  ADD COLUMN IF NOT EXISTS accessory   text NOT NULL DEFAULT 'none';
