import { supabase } from '../lib/supabase';
import type { InviteCode } from '../types';

interface ValidateInviteResult {
  valid: boolean;
  error?: string;
  inviteCode?: InviteCode;
}

/** 초대 코드 검증 */
export async function validateInviteCode(code: string): Promise<ValidateInviteResult> {
  const trimmed = code.trim().toUpperCase();

  const { data, error } = await supabase
    .from('invite_codes')
    .select('*')
    .eq('code', trimmed)
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

interface SignUpParams {
  email: string;
  password: string;
  name: string;
  team: string;
  role: string;
  inviteCodeId: string;
}

/** 회원가입 (Supabase Auth + invite_codes.used_count 증가) */
export async function signUp({ email, password, name, team, role, inviteCodeId }: SignUpParams): Promise<{ error: string | null }> {
  const { error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name, team, role },
    },
  });

  if (authError) {
    return { error: authError.message };
  }

  // invite_codes.used_count += 1 (read-then-write)
  const { data: current } = await supabase
    .from('invite_codes')
    .select('used_count')
    .eq('id', inviteCodeId)
    .single();

  if (current) {
    const count = (current as { used_count: number }).used_count;
    await supabase
      .from('invite_codes')
      .update({ used_count: count + 1 } as never)
      .eq('id', inviteCodeId);
  }

  return { error: null };
}
