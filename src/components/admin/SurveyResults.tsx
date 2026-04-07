import { useState, useEffect } from 'react';
import { MessageSquare, Copy, Check, ExternalLink, RefreshCw, Users, TrendingUp, ChevronDown } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface SurveyRow {
  id: string;
  slug: string;
  title: string;
  description: string;
  is_active: boolean;
  created_at: string;
}

interface ResponseRow {
  answers: Record<string, string[]>;
  free_text: string | null;
  created_at: string;
}

const OPTION_LABELS: Record<string, Record<string, { label: string; emoji: string }>> = {
  awareness: {
    what: { label: '그게 뭔데요?', emoji: '❓' },
    heard: { label: '들어는 봤는데 뭔지 모름', emoji: '👂' },
    visited_once: { label: '한번 들어가봤음', emoji: '👀' },
    use_sometimes: { label: '가끔 들어감', emoji: '🚶' },
    active: { label: '나 꽤 쓰는데?', emoji: '🏃' },
  },
  why_not: {
    no_time: { label: '바빠서 시간이 없음', emoji: '⏰' },
    forgot: { label: '까먹음 (링크가 어디였지?)', emoji: '🧠' },
    no_reason: { label: '들어갈 이유를 모르겠음', emoji: '🤷' },
    boring: { label: '한번 가봤는데 별로였음', emoji: '😐' },
    login_hassle: { label: '로그인이 귀찮음', emoji: '🔑' },
    nobody_uses: { label: '아무도 안 쓰는 것 같아서', emoji: '🏚️' },
    didnt_know: { label: '이런 게 있는 줄 몰랐음', emoji: '🫣' },
    work_only: { label: '업무 외 사이트 접속이 꺼려짐', emoji: '💼' },
  },
  want_feature: {
    anonymous_voc: { label: '익명 건의', emoji: '🎭' },
    mini_game: { label: '미니게임', emoji: '🎮' },
    team_notice: { label: '팀 공지', emoji: '📢' },
    anonymous_note: { label: '익명 쪽지', emoji: '💌' },
    gathering: { label: '번개/모임', emoji: '🍻' },
    idea_board: { label: '아이디어 제안', emoji: '💡' },
    character: { label: '캐릭터 꾸미기', emoji: '🧑‍🎨' },
    ranking: { label: '랭킹/포인트', emoji: '🏆' },
    nothing: { label: '뭘 해도 안 올 듯', emoji: '🙅' },
  },
  when: {
    today: { label: '오늘 바로', emoji: '🏃' },
    this_week: { label: '이번 주 안에', emoji: '📅' },
    if_reminded: { label: '다시 알려주면', emoji: '🔔' },
    if_interesting: { label: '재밌어 보이면', emoji: '👀' },
    never: { label: '안 갈 것 같아', emoji: '🙏' },
  },
};

const QUESTION_META: { id: string; title: string; emoji: string; insight: string }[] = [
  { id: 'awareness', title: '인지도', emoji: '🤔', insight: '얼마나 알고 있나?' },
  { id: 'why_not', title: '이탈 원인', emoji: '🚪', insight: '왜 안 오나?' },
  { id: 'want_feature', title: '원하는 기능', emoji: '✨', insight: '뭘 원하나?' },
  { id: 'when', title: '방문 의향', emoji: '⏰', insight: '언제 올까?' },
];

// 바 색상 그라데이션
const BAR_COLORS = [
  'bg-accent',
  'bg-accent/80',
  'bg-accent/60',
  'bg-accent/45',
  'bg-accent/30',
  'bg-accent/20',
  'bg-accent/15',
  'bg-accent/10',
];

export default function SurveyResults() {
  const [surveys, setSurveys] = useState<SurveyRow[]>([]);
  const [selectedSurvey, setSelectedSurvey] = useState<string | null>(null);
  const [responses, setResponses] = useState<ResponseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    loadSurveys();
  }, []);

  useEffect(() => {
    if (selectedSurvey) loadResponses(selectedSurvey);
  }, [selectedSurvey]);

  const loadSurveys = async () => {
    const { data } = await supabase.from('surveys').select('*').order('created_at', { ascending: false });
    if (data) {
      setSurveys(data);
      if (data.length > 0) setSelectedSurvey(data[0].id);
    }
    setLoading(false);
  };

  const loadResponses = async (surveyId: string) => {
    const { data } = await supabase
      .from('survey_responses')
      .select('answers, free_text, created_at')
      .eq('survey_id', surveyId)
      .order('created_at', { ascending: false });
    if (data) setResponses(data);
  };

  const selected = surveys.find((s) => s.id === selectedSurvey);
  const surveyUrl = `${window.location.origin}/survey/${selected?.slug || ''}`;

  const copyUrl = () => {
    navigator.clipboard.writeText(surveyUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const aggregate = (questionId: string) => {
    const counts: Record<string, number> = {};
    responses.forEach((r) => {
      const vals = r.answers[questionId] || [];
      vals.forEach((v) => { counts[v] = (counts[v] || 0) + 1; });
    });
    const total = responses.length || 1;
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .map(([value, count], i) => ({
        value,
        label: OPTION_LABELS[questionId]?.[value]?.label || value,
        emoji: OPTION_LABELS[questionId]?.[value]?.emoji || '',
        count,
        pct: Math.round((count / total) * 100),
        color: BAR_COLORS[Math.min(i, BAR_COLORS.length - 1)],
      }));
  };

  const freeTexts = responses.filter((r) => r.free_text).map((r) => ({
    text: r.free_text!,
    date: new Date(r.created_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }),
  }));

  // 인사이트 요약 계산
  const getInsightSummary = () => {
    if (responses.length === 0) return null;
    const awarenessData = aggregate('awareness');
    const whyData = aggregate('why_not');
    const featureData = aggregate('want_feature');
    const whenData = aggregate('when');

    const topAwareness = awarenessData[0];
    const topWhy = whyData[0];
    const topFeature = featureData.filter(f => f.value !== 'nothing')[0];
    const positiveWhen = whenData.filter(w => ['today', 'this_week', 'if_reminded', 'if_interesting'].includes(w.value));
    const positiveRate = positiveWhen.reduce((sum, w) => sum + w.count, 0);
    const positivePercent = Math.round((positiveRate / responses.length) * 100);

    return { topAwareness, topWhy, topFeature, positivePercent };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-bg-tertiary border-t-accent" />
      </div>
    );
  }

  if (surveys.length === 0) {
    return <p className="text-center text-sm text-text-muted py-8">등록된 설문이 없습니다.</p>;
  }

  const insight = getInsightSummary();

  return (
    <div className="space-y-4">
      {/* 상단: 설문 선택 + 액션 */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* 커스텀 드롭다운 (네이티브 select 대체 - 한글 깨짐 방지) */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 rounded-lg bg-bg-primary px-3 py-2 text-sm text-text-primary ring-1 ring-bg-tertiary transition-colors hover:bg-bg-tertiary"
          >
            <span>{selected?.title || '설문 선택'}</span>
            {selected && !selected.is_active && (
              <span className="text-[10px] text-text-muted bg-bg-tertiary px-1.5 py-0.5 rounded">종료</span>
            )}
            <ChevronDown size={14} className="text-text-muted" />
          </button>
          {showDropdown && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />
              <div className="absolute left-0 top-full mt-1 z-20 min-w-48 rounded-lg bg-bg-secondary ring-1 ring-bg-tertiary shadow-lg overflow-hidden">
                {surveys.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => { setSelectedSurvey(s.id); setShowDropdown(false); }}
                    className={`flex w-full items-center gap-2 px-3 py-2 text-sm text-left transition-colors ${
                      s.id === selectedSurvey ? 'bg-accent/15 text-accent' : 'text-text-secondary hover:bg-bg-tertiary'
                    }`}
                  >
                    <span>{s.title}</span>
                    {!s.is_active && <span className="text-[10px] text-text-muted bg-bg-tertiary px-1.5 py-0.5 rounded">종료</span>}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <button
          onClick={copyUrl}
          className="flex items-center gap-1.5 rounded-lg bg-bg-primary px-3 py-2 text-xs text-text-secondary ring-1 ring-bg-tertiary transition-colors hover:bg-bg-tertiary"
        >
          {copied ? <Check size={12} className="text-success" /> : <Copy size={12} />}
          {copied ? '복사됨!' : '링크 복사'}
        </button>
        <a href={surveyUrl} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-accent hover:text-accent-light">
          <ExternalLink size={12} /> 미리보기
        </a>
        <button
          onClick={() => selectedSurvey && loadResponses(selectedSurvey)}
          className="flex items-center gap-1 text-xs text-text-muted hover:text-text-secondary ml-auto"
        >
          <RefreshCw size={12} /> 새로고침
        </button>
      </div>

      {/* 핵심 지표 카드 */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-bg-primary p-3 text-center">
          <Users size={16} className="mx-auto mb-1 text-accent" />
          <div className="text-2xl font-bold text-accent">{responses.length}</div>
          <div className="text-[11px] text-text-muted">총 응답</div>
        </div>
        <div className="rounded-lg bg-bg-primary p-3 text-center">
          <TrendingUp size={16} className="mx-auto mb-1 text-success" />
          <div className="text-2xl font-bold text-success">{insight?.positivePercent ?? 0}%</div>
          <div className="text-[11px] text-text-muted">방문 가능성</div>
        </div>
      </div>

      {/* 한줄 인사이트 */}
      {insight && responses.length > 0 && (
        <div className="rounded-lg bg-accent/10 px-4 py-3">
          <p className="text-xs font-semibold text-accent mb-1.5">핵심 인사이트</p>
          <div className="space-y-1 text-xs text-text-secondary">
            {insight.topAwareness && (
              <p>대부분 <strong className="text-text-primary">"{insight.topAwareness.label}"</strong> 상태</p>
            )}
            {insight.topWhy && (
              <p>1위 이탈 원인: <strong className="text-text-primary">{insight.topWhy.emoji} {insight.topWhy.label}</strong></p>
            )}
            {insight.topFeature && (
              <p>가장 원하는 기능: <strong className="text-text-primary">{insight.topFeature.emoji} {insight.topFeature.label}</strong></p>
            )}
          </div>
        </div>
      )}

      {/* 질문별 결과 (수평 바 차트) */}
      {QUESTION_META.map(({ id: qId, title, emoji, insight: insightText }) => {
        const data = aggregate(qId);
        if (data.length === 0) return null;
        const maxPct = data[0]?.pct || 1;
        return (
          <div key={qId} className="rounded-lg bg-bg-primary p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="flex items-center gap-2 text-sm font-bold text-text-primary">
                <span>{emoji}</span>
                {title}
              </h3>
              <span className="text-[10px] text-text-muted">{insightText}</span>
            </div>
            <div className="space-y-2.5">
              {data.map((item, i) => (
                <div key={item.value} className="group">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm w-5 text-center">{item.emoji}</span>
                    <span className={`text-xs flex-1 ${i === 0 ? 'text-text-primary font-semibold' : 'text-text-secondary'}`}>
                      {item.label}
                    </span>
                    <span className={`text-xs tabular-nums ${i === 0 ? 'text-accent font-bold' : 'text-text-muted'}`}>
                      {item.count}명
                    </span>
                    <span className="text-[10px] text-text-muted tabular-nums w-10 text-right">
                      {item.pct}%
                    </span>
                  </div>
                  <div className="ml-7 h-2 rounded-full bg-bg-tertiary overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ease-out ${item.color}`}
                      style={{ width: `${Math.max((item.pct / maxPct) * 100, 4)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* 자유 응답 */}
      {freeTexts.length > 0 && (
        <div className="rounded-lg bg-bg-primary p-4">
          <h3 className="flex items-center gap-2 text-sm font-bold text-text-primary mb-3">
            <MessageSquare size={14} className="text-accent" />
            자유 응답
            <span className="text-[10px] text-text-muted font-normal ml-1">{freeTexts.length}건</span>
          </h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {freeTexts.map((item, i) => (
              <div key={i} className="flex items-start gap-2 rounded-lg bg-bg-secondary px-3 py-2">
                <span className="text-sm text-text-secondary flex-1">"{item.text}"</span>
                <span className="text-[10px] text-text-muted whitespace-nowrap mt-0.5">{item.date}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {responses.length === 0 && (
        <div className="text-center py-8">
          <div className="text-4xl mb-3">📭</div>
          <p className="text-sm text-text-muted">아직 응답이 없습니다</p>
          <p className="text-xs text-text-muted mt-1">링크를 공유해보세요!</p>
        </div>
      )}
    </div>
  );
}
