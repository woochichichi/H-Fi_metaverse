import { supabase } from '../lib/supabase';
import type { InviteCode } from '../types';

interface ValidateInviteResult {
  valid: boolean;
  error?: string;
  inviteCode?: InviteCode;
}

/** 초대 코드 검증 (보안 RPC — 테이블 직접 조회 차단) */
export async function validateInviteCode(code: string): Promise<ValidateInviteResult> {
  const { data, error } = await supabase.rpc('validate_invite_code_secure', {
    code_input: code,
  });

  if (error) {
    return { valid: false, error: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' };
  }

  const result = data as { valid: boolean; error?: string; invite?: Omit<InviteCode, 'code' | 'created_by' | 'created_at'> };

  if (!result.valid) {
    return { valid: false, error: result.error ?? '유효하지 않은 초대 코드입니다' };
  }

  return { valid: true, inviteCode: result.invite as InviteCode };
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
