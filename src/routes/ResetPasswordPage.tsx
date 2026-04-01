import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { KeyRound, Send, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { isAllowedEmail } from '../lib/utils';
import { requestPasswordReset } from '../hooks/useAuth';
import { useAuthStore } from '../stores/authStore';

type Mode = 'request' | 'sent' | 'reset' | 'done';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const [mode, setMode] = useState<Mode>('request');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Supabase recovery 토큰 감지 — 링크 클릭 시 PASSWORD_RECOVERY 이벤트 발생
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setMode('reset');
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) { setError('이메일을 입력해주세요'); return; }
    if (!isAllowedEmail(email)) { setError('한화 계열사 이메일만 사용할 수 있습니다'); return; }
    setLoading(true);
    const { error: reqError } = await requestPasswordReset(email.trim());
    setLoading(false);
    if (reqError) { setError(reqError); return; }
    setMode('sent');
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) { setError('비밀번호는 8자 이상이어야 합니다'); return; }
    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (updateError) { setError('링크가 만료되었거나 유효하지 않습니다. 다시 요청해주세요.'); return; }
    setMode('done');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-primary px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <img src="/favicon.svg" alt="한울타리" className="mx-auto mb-3 h-16 w-16" />
          <h1 className="font-heading text-2xl font-bold text-text-primary">비밀번호 찾기</h1>
          <p className="mt-1 text-sm text-text-muted">금융ITO가 하나 되는 공간</p>
        </div>

        <div className="rounded-xl bg-bg-secondary p-6">
          {mode === 'request' && (
            <form onSubmit={handleRequest}>
              <p className="mb-4 text-sm text-text-secondary leading-relaxed">
                가입 시 사용한 이메일을 입력하면 비밀번호 재설정 링크를 보내드립니다.
              </p>
              <div className="mb-4">
                <label className="mb-1.5 block text-sm text-text-secondary">이메일</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@hanwha.com"
                  className="w-full rounded-lg bg-bg-primary px-3 py-2.5 text-sm text-text-primary placeholder-text-muted outline-none ring-1 ring-bg-tertiary transition-colors focus:ring-accent"
                  autoComplete="email"
                  autoFocus
                />
              </div>
              {error && (
                <p className="mb-4 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
              >
                {loading
                  ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  : <Send size={16} />
                }
                {loading ? '전송 중...' : '재설정 링크 보내기'}
              </button>
            </form>
          )}

          {mode === 'sent' && (
            <div className="text-center">
              <CheckCircle size={40} className="mx-auto mb-3 text-success" />
              <p className="text-sm font-medium text-text-primary mb-2">이메일을 확인해주세요</p>
              <p className="text-xs text-text-muted leading-relaxed">
                <span className="text-text-secondary font-medium">{email}</span>으로<br />
                비밀번호 재설정 링크를 발송했습니다.<br />
                스팸함도 확인해주세요.
              </p>
            </div>
          )}

          {mode === 'reset' && (
            <form onSubmit={handleReset}>
              <p className="mb-4 text-sm text-text-secondary">새로운 비밀번호를 입력하세요.</p>
              <div className="mb-4">
                <label className="mb-1.5 block text-sm text-text-secondary">새 비밀번호</label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="8자 이상"
                    className="w-full rounded-lg bg-bg-primary px-3 py-2.5 pr-10 text-sm text-text-primary placeholder-text-muted outline-none ring-1 ring-bg-tertiary transition-colors focus:ring-accent"
                    autoComplete="new-password"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              {error && (
                <p className="mb-4 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
              >
                {loading
                  ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  : <KeyRound size={16} />
                }
                {loading ? '변경 중...' : '비밀번호 변경'}
              </button>
            </form>
          )}

          {mode === 'done' && (
            <div className="text-center">
              <CheckCircle size={40} className="mx-auto mb-3 text-success" />
              <p className="text-sm font-medium text-text-primary mb-4">비밀번호가 변경되었습니다</p>
              <button
                onClick={async () => {
                  // 세션 명시적 클리어 — 그렇지 않으면 PublicRoute가 user 있다고 판단해 /로 리다이렉트
                  await logout();
                  navigate('/login', { replace: true });
                }}
                className="w-full rounded-lg bg-accent py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
              >
                로그인하기
              </button>
            </div>
          )}

          {(mode === 'request' || mode === 'sent') && (
            <p className="mt-4 text-center text-sm text-text-muted">
              <Link to="/login" className="text-accent hover:text-accent-light transition-colors">
                로그인으로 돌아가기
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
