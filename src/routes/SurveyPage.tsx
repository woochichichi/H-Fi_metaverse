import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Send, CheckCircle, XCircle, AlertTriangle, PartyPopper } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface SurveyOption {
  value: string;
  label: string;
  emoji: string;
}

interface SurveyQuestion {
  id: string;
  emoji: string;
  question: string;
  subtext?: string;
  options: SurveyOption[];
  multiple?: boolean;
}

interface SurveyConfig {
  title: string;
  description: string;
  dangerMessage?: string;
  dangerSub?: string;
  headerEmoji?: string;
  questions: SurveyQuestion[];
}

// 설문 정의 (slug 기반)
const SURVEY_CONFIGS: Record<string, SurveyConfig> = {
  'why-not-coming': {
    title: '조용히 닫았습니다.',
    description: '(왜 안 오시죠?)',
    headerEmoji: '🚨',
    dangerMessage: '한울타리 접속자 수가 위험합니다',
    dangerSub: '만든 사람의 멘탈도 위험합니다',
    questions: [
      {
        id: 'awareness',
        emoji: '🤔',
        question: '한울타리... 들어는 보셨나요?',
        subtext: '솔직하게 답해주세요. 안 울어요.',
        options: [
          { value: 'what', label: '그게 뭔데요?', emoji: '❓' },
          { value: 'heard', label: '들어는 봤는데 뭔지 모름', emoji: '👂' },
          { value: 'visited_once', label: '한번 들어가봤음', emoji: '👀' },
          { value: 'use_sometimes', label: '가끔 들어감', emoji: '🚶' },
          { value: 'active', label: '나 꽤 쓰는데?', emoji: '🏃' },
        ],
      },
      {
        id: 'why_not',
        emoji: '🚪',
        question: '안 들어오는 진짜 이유가 뭐예요?',
        subtext: '복수선택 가능. 다 때려주세요.',
        multiple: true,
        options: [
          { value: 'no_time', label: '바빠서 시간이 없음', emoji: '⏰' },
          { value: 'forgot', label: '까먹음 (링크가 어디였지?)', emoji: '🧠' },
          { value: 'no_reason', label: '들어갈 이유를 모르겠음', emoji: '🤷' },
          { value: 'boring', label: '한번 가봤는데 별로였음', emoji: '😐' },
          { value: 'login_hassle', label: '로그인이 귀찮음', emoji: '🔑' },
          { value: 'nobody_uses', label: '아무도 안 쓰는 것 같아서', emoji: '🏚️' },
          { value: 'didnt_know', label: '이런 게 있는 줄 몰랐음', emoji: '🫣' },
          { value: 'work_only', label: '업무 외 사이트 접속이 꺼려짐', emoji: '💼' },
        ],
      },
      {
        id: 'want_feature',
        emoji: '✨',
        question: '이런 거 있으면 들어올 것 같아요?',
        subtext: '복수선택 가능. 솔직하게!',
        multiple: true,
        options: [
          { value: 'anonymous_voc', label: '진짜 익명으로 건의하기', emoji: '🎭' },
          { value: 'mini_game', label: '미니게임 (줄넘기/오목/반응속도)', emoji: '🎮' },
          { value: 'team_notice', label: '팀 공지를 한눈에 보기', emoji: '📢' },
          { value: 'anonymous_note', label: '익명 쪽지 보내기', emoji: '💌' },
          { value: 'gathering', label: '번개/모임 만들기', emoji: '🍻' },
          { value: 'idea_board', label: '아이디어 제안 & 투표', emoji: '💡' },
          { value: 'character', label: '내 캐릭터 꾸미기', emoji: '🧑‍🎨' },
          { value: 'ranking', label: '활동 랭킹/포인트', emoji: '🏆' },
          { value: 'nothing', label: '솔직히 뭘 해도 안 들어갈 듯', emoji: '🙅' },
        ],
      },
      {
        id: 'when',
        emoji: '⏰',
        question: '언제쯤 들어와 볼 수 있으신가요?',
        options: [
          { value: 'today', label: '오늘 바로 들어가볼게요', emoji: '🏃' },
          { value: 'this_week', label: '이번 주 안에...', emoji: '📅' },
          { value: 'if_reminded', label: '누가 다시 알려주면', emoji: '🔔' },
          { value: 'if_interesting', label: '재밌어 보이면 그때', emoji: '👀' },
          { value: 'never', label: '미안... 안 갈 것 같아', emoji: '🙏' },
        ],
      },
    ],
  },
};

export default function SurveyPage() {
  const { slug = 'why-not-coming' } = useParams<{ slug: string }>();
  const [surveyId, setSurveyId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [freeText, setFreeText] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const [submitted, setSubmitted] = useState(() => localStorage.getItem(`hf_survey_${slug}`) === 'true');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [notFound, setNotFound] = useState(false);
  const [slideDir, setSlideDir] = useState<'in' | 'out' | null>(null);
  const autoNextTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const config = SURVEY_CONFIGS[slug];

  useEffect(() => {
    if (!config) {
      setNotFound(true);
      return;
    }
    supabase
      .from('surveys')
      .select('id')
      .eq('slug', slug)
      .eq('is_active', true)
      .single()
      .then(({ data, error: err }) => {
        if (err || !data) {
          setNotFound(true);
        } else {
          setSurveyId(data.id);
        }
      });
  }, [slug, config]);

  if (notFound) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-primary px-4">
        <div className="text-center">
          <div className="text-5xl mb-4">🔒</div>
          <h1 className="font-heading text-xl text-text-primary mb-2">설문이 종료되었습니다</h1>
          <p className="text-sm text-text-muted">이미 마감되었거나 존재하지 않는 설문입니다.</p>
        </div>
      </div>
    );
  }

  if (!config) return null;

  const questions = config.questions;
  const currentQ = questions[currentStep];
  const isLastStep = currentStep === questions.length - 1;
  const hasAnswer = answers[currentQ?.id]?.length > 0;

  const goToStep = (next: number) => {
    setSlideDir('out');
    setTimeout(() => {
      setCurrentStep(next);
      setSlideDir('in');
      setTimeout(() => setSlideDir(null), 350);
    }, 250);
  };

  const toggleAnswer = (questionId: string, value: string, multiple?: boolean) => {
    if (autoNextTimer.current) clearTimeout(autoNextTimer.current);

    setAnswers((prev) => {
      const current = prev[questionId] || [];
      if (multiple) {
        if (value === 'nothing') {
          return { ...prev, [questionId]: current.includes(value) ? [] : [value] };
        }
        const filtered = current.filter((v) => v !== 'nothing');
        return {
          ...prev,
          [questionId]: filtered.includes(value)
            ? filtered.filter((v) => v !== value)
            : [...filtered, value],
        };
      }
      return { ...prev, [questionId]: [value] };
    });

    // 단일선택이면 잠깐 보여준 뒤 자동 넘김
    if (!multiple && currentStep < questions.length - 1) {
      autoNextTimer.current = setTimeout(() => goToStep(currentStep + 1), 400);
    }
  };

  const handleSubmit = async () => {
    if (!surveyId) return;
    setSubmitting(true);
    setError('');
    const { error: err } = await supabase.from('survey_responses').insert({
      survey_id: surveyId,
      answers,
      free_text: freeText.trim() || null,
    });
    setSubmitting(false);
    if (err) {
      setError('제출에 실패했어요. 다시 시도해주세요.');
      return;
    }
    localStorage.setItem(`hf_survey_${slug}`, 'true');
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-primary px-4">
        <div className="w-full max-w-md text-center">
          <div className="mb-6 text-6xl">🙏</div>
          <h1 className="font-heading text-2xl font-bold text-text-primary mb-3">감사합니다!</h1>
          <p className="text-text-secondary mb-2">소중한 답변 잘 받았습니다.</p>
          <p className="text-text-muted text-sm mb-8">
            한울타리가 더 나은 공간이 될 수 있도록 노력할게요.
          </p>
          <a
            href="/"
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
          >
            <PartyPopper size={16} />
            한울타리 구경하러 가기
          </a>
          <p className="mt-3 text-xs text-text-muted">↑ 여기 누르면 진짜 갈 수 있어요</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-primary px-4 py-8">
      <div className="w-full max-w-lg">
        {/* 헤더 */}
        <div className="mb-8 text-center">
          <div className="mb-4 text-5xl">{config.headerEmoji || '📋'}</div>
          <h1 className="font-heading text-2xl font-bold text-text-primary mb-2">{config.title}</h1>
          <p className="text-text-muted text-sm">{config.description}</p>
          {config.dangerMessage && (
            <div className="mt-4 rounded-lg bg-danger/10 px-4 py-3">
              <p className="text-sm text-danger flex items-center justify-center gap-2">
                <AlertTriangle size={14} />
                {config.dangerMessage}
              </p>
              {config.dangerSub && (
                <p className="text-xs text-text-muted mt-1">{config.dangerSub}</p>
              )}
            </div>
          )}
        </div>

        {/* 진행바 */}
        <div className="mb-6 flex items-center gap-2">
          {questions.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                i <= currentStep ? 'bg-accent' : 'bg-bg-tertiary'
              }`}
            />
          ))}
          <span className="text-xs text-text-muted ml-1">
            {currentStep + 1}/{questions.length}
          </span>
        </div>

        {/* 질문 카드 */}
        <div
          className={`rounded-xl bg-bg-secondary p-6 transition-all duration-300 ease-out ${
            slideDir === 'out' ? 'translate-x-8 opacity-0 scale-95' :
            slideDir === 'in' ? '-translate-x-8 opacity-0 scale-95' :
            'translate-x-0 opacity-100 scale-100'
          }`}
        >
          <div className="mb-4">
            <span className="text-3xl">{currentQ.emoji}</span>
            <h2 className="mt-2 text-lg font-bold text-text-primary">{currentQ.question}</h2>
            {currentQ.subtext && (
              <p className="mt-1 text-xs text-text-muted">{currentQ.subtext}</p>
            )}
          </div>

          {/* 선택지 */}
          <div className="space-y-2">
            {currentQ.options.map((opt) => {
              const selected = answers[currentQ.id]?.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  onClick={() => toggleAnswer(currentQ.id, opt.value, currentQ.multiple)}
                  className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm transition-all duration-200 ${
                    selected
                      ? 'bg-accent/20 text-accent ring-1 ring-accent'
                      : 'bg-bg-primary text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'
                  }`}
                >
                  <span className="text-lg">{opt.emoji}</span>
                  <span className="flex-1">{opt.label}</span>
                  {selected && <CheckCircle size={16} className="text-accent" />}
                </button>
              );
            })}
          </div>

          {/* 마지막 단계: 자유 텍스트 */}
          {isLastStep && (
            <div className="mt-4">
              <label className="mb-1.5 block text-sm text-text-muted">
                하고 싶은 말 (선택사항)
              </label>
              <textarea
                value={freeText}
                onChange={(e) => setFreeText(e.target.value)}
                placeholder="예: 점심시간에 오목 한판 하고 싶어요 / 이런 기능 있으면 좋겠어요"
                className="w-full rounded-lg bg-bg-primary px-3 py-2.5 text-sm text-text-primary placeholder-text-muted outline-none ring-1 ring-bg-tertiary transition-colors focus:ring-accent resize-none"
                rows={3}
                maxLength={500}
              />
              <p className="mt-1 text-right text-xs text-text-muted">{freeText.length}/500</p>
            </div>
          )}

          {error && (
            <p className="mt-3 flex items-center gap-1.5 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
              <XCircle size={14} /> {error}
            </p>
          )}

          {/* 네비게이션 */}
          <div className="mt-6 flex gap-3">
            {currentStep > 0 && (
              <button
                onClick={() => goToStep(currentStep - 1)}
                className="flex-1 rounded-lg bg-bg-primary py-2.5 text-sm text-text-secondary transition-colors hover:bg-bg-tertiary"
              >
                이전
              </button>
            )}
            {isLastStep ? (
              <button
                onClick={handleSubmit}
                disabled={!hasAnswer || submitting}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-accent py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
              >
                {submitting ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <Send size={14} />
                )}
                {submitting ? '보내는 중...' : '제출하기'}
              </button>
            ) : currentQ.multiple ? (
              <button
                onClick={() => goToStep(currentStep + 1)}
                disabled={!hasAnswer}
                className="flex-1 rounded-lg bg-accent py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
              >
                다음
              </button>
            ) : null}
          </div>
        </div>

        {/* 풋터 */}
        <p className="mt-6 text-center text-xs text-text-muted">
          완전 익명입니다. 누가 뭘 골랐는지 절대 모릅니다.
        </p>
      </div>
    </div>
  );
}
