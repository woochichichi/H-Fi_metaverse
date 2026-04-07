import { useState, useEffect } from 'react';
import { BarChart3, MessageSquare, Copy, Check, ExternalLink, RefreshCw } from 'lucide-react';
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

// 선택지 라벨 매핑 (결과 표시용)
const OPTION_LABELS: Record<string, Record<string, string>> = {
  awareness: {
    what: '그게 뭔데요?',
    heard: '들어는 봤는데 뭔지 모름',
    visited_once: '한번 들어가봤음',
    use_sometimes: '가끔 들어감',
    active: '나 꽤 쓰는데?',
  },
  why_not: {
    no_time: '바빠서 시간이 없음',
    forgot: '까먹음 (링크가 어디였지?)',
    no_reason: '들어갈 이유를 모르겠음',
    boring: '한번 가봤는데 별로였음',
    login_hassle: '로그인이 귀찮음',
    nobody_uses: '아무도 안 쓰는 것 같아서',
    didnt_know: '이런 게 있는 줄 몰랐음',
    work_only: '업무 외 사이트 접속이 꺼려짐',
  },
  want_feature: {
    anonymous_voc: '진짜 익명으로 건의하기',
    mini_game: '미니게임',
    team_notice: '팀 공지를 한눈에',
    anonymous_note: '익명 쪽지',
    gathering: '번개/모임',
    idea_board: '아이디어 제안 & 투표',
    character: '캐릭터 꾸미기',
    ranking: '활동 랭킹/포인트',
    nothing: '뭘 해도 안 들어갈 듯',
  },
  when: {
    today: '오늘 바로',
    this_week: '이번 주 안에',
    if_reminded: '다시 알려주면',
    if_interesting: '재밌어 보이면 그때',
    never: '안 갈 것 같아',
  },
};

const QUESTION_TITLES: Record<string, string> = {
  awareness: '인지도',
  why_not: '안 오는 이유',
  want_feature: '원하는 기능',
  when: '방문 의향',
};

export default function SurveyResults() {
  const [surveys, setSurveys] = useState<SurveyRow[]>([]);
  const [selectedSurvey, setSelectedSurvey] = useState<string | null>(null);
  const [responses, setResponses] = useState<ResponseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

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

  const selectedSlug = surveys.find((s) => s.id === selectedSurvey)?.slug;
  const surveyUrl = `${window.location.origin}/survey/${selectedSlug || ''}`;

  const copyUrl = () => {
    navigator.clipboard.writeText(surveyUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 집계
  const aggregate = (questionId: string) => {
    const counts: Record<string, number> = {};
    responses.forEach((r) => {
      const vals = r.answers[questionId] || [];
      vals.forEach((v) => {
        counts[v] = (counts[v] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .map(([value, count]) => ({
        value,
        label: OPTION_LABELS[questionId]?.[value] || value,
        count,
        pct: responses.length > 0 ? Math.round((count / responses.length) * 100) : 0,
      }));
  };

  const freeTexts = responses.filter((r) => r.free_text).map((r) => r.free_text!);

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

  return (
    <div className="space-y-4">
      {/* 설문 선택 + 링크 복사 */}
      <div className="flex items-center gap-3 flex-wrap">
        <select
          value={selectedSurvey || ''}
          onChange={(e) => setSelectedSurvey(e.target.value)}
          className="rounded-lg bg-bg-primary px-3 py-2 text-sm text-text-primary ring-1 ring-bg-tertiary outline-none"
        >
          {surveys.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title} {s.is_active ? '' : '(종료)'}
            </option>
          ))}
        </select>
        <button
          onClick={copyUrl}
          className="flex items-center gap-1.5 rounded-lg bg-bg-primary px-3 py-2 text-xs text-text-secondary ring-1 ring-bg-tertiary transition-colors hover:bg-bg-tertiary"
        >
          {copied ? <Check size={12} className="text-success" /> : <Copy size={12} />}
          {copied ? '복사됨!' : '링크 복사'}
        </button>
        <a
          href={surveyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-accent hover:text-accent-light"
        >
          <ExternalLink size={12} /> 미리보기
        </a>
        <button
          onClick={() => selectedSurvey && loadResponses(selectedSurvey)}
          className="flex items-center gap-1 text-xs text-text-muted hover:text-text-secondary ml-auto"
        >
          <RefreshCw size={12} /> 새로고침
        </button>
      </div>

      {/* 응답 수 */}
      <div className="rounded-lg bg-bg-primary px-4 py-3 text-center">
        <span className="text-2xl font-bold text-accent">{responses.length}</span>
        <span className="ml-2 text-sm text-text-muted">명 응답</span>
      </div>

      {/* 질문별 결과 */}
      {Object.keys(QUESTION_TITLES).map((qId) => {
        const data = aggregate(qId);
        if (data.length === 0) return null;
        return (
          <div key={qId} className="rounded-lg bg-bg-primary p-4">
            <h3 className="flex items-center gap-2 text-sm font-bold text-text-primary mb-3">
              <BarChart3 size={14} className="text-accent" />
              {QUESTION_TITLES[qId]}
            </h3>
            <div className="space-y-2">
              {data.map((item) => (
                <div key={item.value}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-text-secondary">{item.label}</span>
                    <span className="text-text-muted">
                      {item.count}명 ({item.pct}%)
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-bg-tertiary overflow-hidden">
                    <div
                      className="h-full rounded-full bg-accent transition-all duration-500"
                      style={{ width: `${item.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* 자유 텍스트 응답 */}
      {freeTexts.length > 0 && (
        <div className="rounded-lg bg-bg-primary p-4">
          <h3 className="flex items-center gap-2 text-sm font-bold text-text-primary mb-3">
            <MessageSquare size={14} className="text-accent" />
            자유 응답 ({freeTexts.length}건)
          </h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {freeTexts.map((text, i) => (
              <div key={i} className="rounded-lg bg-bg-secondary px-3 py-2 text-sm text-text-secondary">
                "{text}"
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
