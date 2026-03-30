import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, Ticket, Mail, Lock, UserCircle } from 'lucide-react';
import { TEAMS } from '../lib/constants';
import { isAllowedEmail } from '../lib/utils';
import { validateInviteCode, signUp } from '../hooks/useAuth';
import type { InviteCode } from '../types';

const STEPS = [
  { label: '초대 코드', icon: Ticket },
  { label: '이메일', icon: Mail },
  { label: '비밀번호', icon: Lock },
  { label: '프로필', icon: UserCircle },
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 폼 데이터
  const [inviteCode, setInviteCode] = useState('');
  const [inviteData, setInviteData] = useState<InviteCode | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [name, setName] = useState('');
  const [team, setTeam] = useState('');

  const goNext = () => {
    setError('');
    setStep((s) => s + 1);
  };
  const goBack = () => {
    setError('');
    setStep((s) => s - 1);
  };

  // Step 1: 초대 코드 검증
  const handleValidateCode = async () => {
    if (!inviteCode.trim()) {
      setError('초대 코드를 입력해주세요');
      return;
    }
    setLoading(true);
    setError('');
    const result = await validateInviteCode(inviteCode);
    setLoading(false);

    if (!result.valid) {
      setError(result.error ?? '유효하지 않은 초대 코드입니다');
      return;
    }

    setInviteData(result.inviteCode!);
    // 초대 코드에 팀이 지정되어 있으면 자동 배정
    if (result.inviteCode?.team) {
      setTeam(result.inviteCode.team);
    }
    goNext();
  };

  // Step 2: 이메일 검증
  const handleValidateEmail = () => {
    if (!email.trim()) {
      setError('이메일을 입력해주세요');
      return;
    }
    if (!isAllowedEmail(email)) {
      setError('한화 계열사 이메일만 사용할 수 있습니다 (@hanwha.com 등)');
      return;
    }
    goNext();
  };

  // Step 3: 비밀번호 검증
  const handleValidatePassword = () => {
    if (password.length < 8) {
      setError('비밀번호는 8자 이상이어야 합니다');
      return;
    }
    goNext();
  };

  // Step 4: 가입 완료
  const handleSignUp = async () => {
    if (!name.trim()) {
      setError('이름을 입력해주세요');
      return;
    }
    if (!team) {
      setError('팀을 선택해주세요');
      return;
    }

    setLoading(true);
    setError('');
    const { error: signUpError } = await signUp({
      email,
      password,
      name: name.trim(),
      team,
      role: inviteData?.role ?? 'member',
      inviteCodeId: inviteData!.id,
    });
    setLoading(false);

    if (signUpError) {
      setError(signUpError);
      return;
    }

    navigate('/', { replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-primary px-4">
      <div className="w-full max-w-sm">
        {/* 헤더 */}
        <div className="mb-6 text-center">
          <h1 className="font-heading text-2xl font-bold text-text-primary">회원가입</h1>
          <p className="mt-1 text-sm text-text-muted">ITO 메타버스에 오신 것을 환영합니다</p>
        </div>

        {/* 스텝 인디케이터 */}
        <div className="mb-6 flex items-center justify-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s.label} className="flex items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium transition-colors ${
                  i < step
                    ? 'bg-success text-white'
                    : i === step
                      ? 'bg-accent text-white'
                      : 'bg-bg-tertiary text-text-muted'
                }`}
              >
                {i < step ? <Check size={14} /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`h-0.5 w-6 ${i < step ? 'bg-success' : 'bg-bg-tertiary'}`} />
              )}
            </div>
          ))}
        </div>

        {/* 폼 카드 */}
        <div className="rounded-xl bg-bg-secondary p-6">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-medium text-text-secondary">
            {(() => { const Icon = STEPS[step].icon; return <Icon size={16} />; })()}
            {STEPS[step].label}
          </h2>

          {/* Step 1: 초대 코드 */}
          {step === 0 && (
            <div>
              <input
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="FITO-XXXX-XXXX"
                className="w-full rounded-lg bg-bg-primary px-3 py-2.5 font-mono text-sm text-text-primary placeholder-text-muted outline-none ring-1 ring-bg-tertiary uppercase tracking-wider transition-colors focus:ring-accent"
                autoFocus
              />
              <p className="mt-2 text-xs text-text-muted">관리자로부터 받은 초대 코드를 입력하세요</p>
            </div>
          )}

          {/* Step 2: 이메일 */}
          {step === 1 && (
            <div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@hanwha.com"
                className="w-full rounded-lg bg-bg-primary px-3 py-2.5 text-sm text-text-primary placeholder-text-muted outline-none ring-1 ring-bg-tertiary transition-colors focus:ring-accent"
                autoFocus
                autoComplete="email"
              />
              <p className="mt-2 text-xs text-text-muted">한화 계열사 이메일만 사용할 수 있습니다</p>
            </div>
          )}

          {/* Step 3: 비밀번호 */}
          {step === 2 && (
            <div>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="8자 이상 비밀번호"
                  className="w-full rounded-lg bg-bg-primary px-3 py-2.5 pr-10 text-sm text-text-primary placeholder-text-muted outline-none ring-1 ring-bg-tertiary transition-colors focus:ring-accent"
                  autoFocus
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p className="mt-2 text-xs text-text-muted">8자 이상의 비밀번호를 설정하세요</p>
            </div>
          )}

          {/* Step 4: 이름 + 팀 */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs text-text-muted">이름</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="홍길동"
                  className="w-full rounded-lg bg-bg-primary px-3 py-2.5 text-sm text-text-primary placeholder-text-muted outline-none ring-1 ring-bg-tertiary transition-colors focus:ring-accent"
                  autoFocus
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs text-text-muted">팀</label>
                <select
                  value={team}
                  onChange={(e) => setTeam(e.target.value)}
                  disabled={!!inviteData?.team}
                  className="w-full rounded-lg bg-bg-primary px-3 py-2.5 text-sm text-text-primary outline-none ring-1 ring-bg-tertiary transition-colors focus:ring-accent disabled:opacity-50"
                >
                  <option value="">팀을 선택하세요</option>
                  {TEAMS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                {inviteData?.team && (
                  <p className="mt-1 text-xs text-accent">초대 코드에 의해 자동 배정됨</p>
                )}
              </div>
            </div>
          )}

          {/* 에러 */}
          {error && (
            <p className="mt-3 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
              {error}
            </p>
          )}

          {/* 버튼 */}
          <div className="mt-5 flex items-center gap-3">
            {step > 0 && (
              <button
                type="button"
                onClick={goBack}
                className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm text-text-secondary transition-colors hover:bg-bg-tertiary"
              >
                <ArrowLeft size={14} />
                이전
              </button>
            )}
            <div className="flex-1" />
            {step === 0 && (
              <button
                onClick={handleValidateCode}
                disabled={loading}
                className="flex items-center gap-1 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
              >
                {loading ? '확인 중...' : '확인'}
                {!loading && <ArrowRight size={14} />}
              </button>
            )}
            {step === 1 && (
              <button
                onClick={handleValidateEmail}
                className="flex items-center gap-1 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
              >
                다음 <ArrowRight size={14} />
              </button>
            )}
            {step === 2 && (
              <button
                onClick={handleValidatePassword}
                className="flex items-center gap-1 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
              >
                다음 <ArrowRight size={14} />
              </button>
            )}
            {step === 3 && (
              <button
                onClick={handleSignUp}
                disabled={loading}
                className="flex items-center gap-2 rounded-lg bg-success px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-success/90 disabled:opacity-50"
              >
                {loading ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <Check size={14} />
                )}
                {loading ? '가입 중...' : '가입 완료'}
              </button>
            )}
          </div>

          {/* 로그인 링크 */}
          <p className="mt-4 text-center text-sm text-text-muted">
            이미 계정이 있으신가요?{' '}
            <Link to="/login" className="text-accent hover:text-accent-light transition-colors">
              로그인
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
