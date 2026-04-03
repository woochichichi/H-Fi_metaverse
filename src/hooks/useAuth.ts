import { supabase } from '../lib/supabase';
import type { InviteCode } from '../types';

interface ValidateInviteResult {
  valid: boolean;
  error?: string;
  inviteCode?: InviteCode;
}

/** 초대 코드 검증 */
export async function validateInviteCode(code: string): Promise<ValidateInviteResult> {
  // 모바일 키보드가 삽입하는 공백·콤마 제거, 대소문자 정규화
  // 모바일 키보드 공백·콤마 제거, ilike 와일드카드(%,_) 이스케이프, 대소문자 정규화
  const trimmed = code.trim().replace(/[\s,_%]/g, '').toUpperCase();

  const { data, error } = await supabase
    .from('invite_codes')
    .select('*')
    .ilike('code', trimmed)
    .single();

  if (error || !data) {
    return { valid: false, error: '유효하지 않은 초대 코드입니다' };
  }

  const invite = data as InviteCode;

  if (!invite.active) {
    return { valid: false, error: '비활성화된 초대 코드입니다' };
  }

  if (invite.used_count >= invite.max_uses) {
    return { valid: false, error: '사용 횟수가 초과된 초대 코드입니다' };
  }

  if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
    return { valid: false, error: '만료된 초대 코드입니다' };
  }

  return { valid: true, inviteCode: invite };
}

/** 별명 중복 체크 */
export async function checkNicknameAvailable(nickname: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('nickname', nickname)
    .maybeSingle();
  if (error) return false;
  return !data;
}

interface SignUpParams {
  email: string;
  password: string;
  name: string;
  nickname: string;
  team: string;
  role: string;
  inviteCodeId: string;
}

/** 비밀번호 재설정 이메일 발송 */
export async function requestPasswordReset(email: string): Promise<{ error: string | null }> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: 'https://h-fi-metaverse.pages.dev/reset-password',
  });
  if (error) return { error: error.message };
  return { error: null };
}

/** 회원가입 (Supabase Auth + invite_codes.used_count 증가) */
export async function signUp({ email, password, name, nickname, team, role, inviteCodeId }: SignUpParams): Promise<{ error: string | null }> {
  const { data, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name, nickname, team, role },
    },
  });

  if (authError) {
    const msg = authError.message;
    if (msg.includes('already registered') || msg.includes('already been registered') || msg.includes('User already registered')) {
      return { error: '이미 가입된 이메일입니다. 로그인하거나 비밀번호 찾기를 이용해주세요.' };
    }
    return { error: msg };
  }

  // autoconfirm이 꺼져있으면 세션이 없을 수 있음 → 명시적 로그인
  if (!data.session) {
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (loginError) {
      // 이메일 인증이 필요한 경우
      return { error: '가입은 완료되었으나 이메일 인증이 필요합니다. 관리자에게 문의하세요.' };
    }
  }

  // invite_codes.used_count += 1 (원자적 증가 — 동시 가입 시 race condition 방지)
  try {
    const { data: success } = await supabase.rpc('increment_invite_usage', { code_id: inviteCodeId });
    if (success === false) {
      console.warn('초대 코드 사용 횟수 초과 또는 만료');
    }
  } catch {
    // used_count 증가 실패해도 가입은 정상 완료
  }

  return { error: null };
}
