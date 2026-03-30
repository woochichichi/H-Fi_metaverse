-- handle_new_user 수정: search_path 명시 + public 스키마 명시
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, team, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'team',
    COALESCE(NEW.raw_user_meta_data->>'role', 'member')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 다른 SECURITY DEFINER 함수들도 동일하게 수정
CREATE OR REPLACE FUNCTION log_voc_activity()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_activities (user_id, team, activity_type, points, ref_id)
  VALUES (NEW.author_id, NEW.team, 'voc_submit', 1, NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION log_idea_activity()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_activities (user_id, team, activity_type, points, ref_id)
  VALUES (
    NEW.author_id,
    (SELECT team FROM public.profiles WHERE id = NEW.author_id),
    'idea_submit', 1, NEW.id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION log_vote_activity()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_activities (user_id, team, activity_type, points, ref_id)
  VALUES (
    NEW.user_id,
    (SELECT team FROM public.profiles WHERE id = NEW.user_id),
    'idea_vote', 0.5, NEW.idea_id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- invite_codes: 인증된 유저 누구나 used_count 증가 가능하도록 정책 추가
CREATE POLICY "invite_codes_update_used_count" ON public.invite_codes FOR UPDATE
  USING (true)
  WITH CHECK (true);
