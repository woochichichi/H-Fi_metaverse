import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('이메일과 비밀번호를 입력해주세요');
      return;
    }

    setLoading(true);
    const { error: loginError } = await login(email, password);
    setLoading(false);

    if (loginError) {
      if (loginError.includes('Email not confirmed')) {
        setError('이메일 인증이 필요합니다. 관리자에게 문의하세요.');
      } else {
        setError('이메일 또는 비밀번호가 올바르지 않습니다');
      }
      return;
    }

    navigate('/', { replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-primary px-4">
      <div className="w-full max-w-sm">
        {/* 로고 */}
        <div className="mb-8 text-center">
          <img src="/favicon.svg" alt="한울타리" className="mx-auto mb-3 h-16 w-16" />
          <h1 className="font-heading text-2xl font-bold text-text-primary">
            한울타리
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            금융ITO가 하나 되는 공간
          </p>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="rounded-xl bg-bg-secondary p-6">
          {/* 이메일 */}
          <div className="mb-4">
            <label className="mb-1.5 block text-sm text-text-secondary">이메일</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@hanwha.com"
              className="w-full rounded-lg bg-bg-primary px-3 py-2.5 text-sm text-text-primary placeholder-text-muted outline-none ring-1 ring-bg-tertiary transition-colors focus:ring-accent"
              autoComplete="email"
            />
          </div>

          {/* 비밀번호 */}
          <div className="mb-4">
            <label className="mb-1.5 block text-sm text-text-secondary">비밀번호</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호를 입력하세요"
                className="w-full rounded-lg bg-bg-primary px-3 py-2.5 pr-10 text-sm text-text-primary placeholder-text-muted outline-none ring-1 ring-bg-tertiary transition-colors focus:ring-accent"
                autoComplete="current-password"
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

          {/* 에러 메시지 */}
          {error && (
            <p className="mb-4 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
              {error}
            </p>
          )}

          {/* 로그인 버튼 */}
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent py-2.5 text-sm font-medium text-white transition-colors duration-200 hover:bg-accent-hover disabled:opacity-50"
          >
            {loading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <LogIn size={16} />
            )}
            {loading ? '로그인 중...' : '로그인'}
          </button>

          {/* 가입 링크 */}
          <p className="mt-4 text-center text-sm text-text-muted">
            계정이 없으신가요?{' '}
            <Link to="/register" className="text-accent hover:text-accent-light transition-colors">
              가입하기
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
