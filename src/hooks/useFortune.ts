import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';

export interface FortuneResult {
  score: number;
  message: string;
  fortune_date: string;
}

// 점수 80~100 → 5단계 구간별 문구
const FORTUNE_MESSAGES: { min: number; max: number; messages: string[] }[] = [
  {
    min: 80, max: 83,
    messages: [
      '오늘은 차분하게 흘러가는 하루. 작은 여유를 즐겨보세요.',
      '평범한 하루도 감사한 법. 오늘 하루가 내일의 기반이 됩니다.',
      '잔잔하지만 든든한 하루. 기본에 충실하면 좋은 결과가 옵니다.',
      '오늘은 무리하지 말고 페이스를 유지하세요. 꾸준함이 답입니다.',
    ],
  },
  {
    min: 84, max: 87,
    messages: [
      '소소한 행운이 찾아올 예감! 주변을 잘 살펴보세요.',
      '동료와의 대화에서 좋은 영감을 얻을 수 있는 날입니다.',
      '점심 메뉴 선택이 오늘 기분을 좌우할지도? 맛있는 걸 드세요!',
      '작은 도전이 큰 변화를 만드는 날. 망설이지 마세요.',
    ],
  },
  {
    min: 88, max: 91,
    messages: [
      '오늘은 일이 술술 풀리는 날! 밀린 업무를 처리하기 좋아요.',
      '좋은 소식이 들려올 수 있어요. 메신저를 잘 확인하세요!',
      '팀워크가 빛나는 하루. 함께하면 더 좋은 결과가 나옵니다.',
      '커피 한 잔의 여유가 창의력을 높여주는 날입니다.',
    ],
  },
  {
    min: 92, max: 96,
    messages: [
      '오늘 당신은 팀의 MVP! 자신감을 갖고 의견을 내보세요.',
      '행운이 함께하는 날. 새로운 시도가 좋은 결과로 이어집니다.',
      '오늘은 뭘 해도 잘 되는 날! 미뤄둔 일을 시작하기 딱 좋아요.',
      '긍정 에너지가 넘치는 하루. 주변 사람들도 덩달아 행복해질 거예요.',
    ],
  },
  {
    min: 97, max: 100,
    messages: [
      '대길! 오늘은 모든 것이 완벽하게 맞아떨어지는 날입니다!',
      '최고의 운세! 로또를 사야 할지도? (농담) 뭘 해도 잘 됩니다!',
      '100점 만점에 가까운 행운! 오늘 하루를 마음껏 즐기세요!',
      '전설의 대길! 이런 날은 1년에 몇 번 없어요. 적극적으로!',
    ],
  },
];

// KST 기준 오늘 날짜 (YYYY-MM-DD)
function getTodayKST(): string {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().split('T')[0];
}

function generateFortune(): { score: number; message: string } {
  const score = Math.floor(Math.random() * 21) + 80; // 80~100
  const tier = FORTUNE_MESSAGES.find((t) => score >= t.min && score <= t.max)!;
  const message = tier.messages[Math.floor(Math.random() * tier.messages.length)];
  return { score, message };
}

export function useFortune() {
  const { user } = useAuthStore();
  const [todayResult, setTodayResult] = useState<FortuneResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState(false); // 오늘 이미 조회했는지 체크 완료 여부

  // 오늘 운세 기록이 있는지 확인 — 조회된 결과를 반환
  const checkToday = useCallback(async (): Promise<FortuneResult | null> => {
    if (!user) return null;
    setLoading(true);
    const today = getTodayKST();
    const { data, error } = await supabase
      .from('daily_fortunes')
      .select('score, message, fortune_date')
      .eq('user_id', user.id)
      .eq('fortune_date', today)
      .maybeSingle();

    if (!error && data) {
      const result = data as FortuneResult;
      setTodayResult(result);
      setChecked(true);
      setLoading(false);
      return result;
    }
    setChecked(true);
    setLoading(false);
    return null;
  }, [user]);

  // 운세 뽑기
  const drawFortune = useCallback(async (): Promise<FortuneResult | null> => {
    if (!user) return null;
    const today = getTodayKST();

    // 이미 오늘 뽑았으면 무시
    if (todayResult) return todayResult;

    const fortune = generateFortune();
    const { data, error } = await supabase
      .from('daily_fortunes')
      .insert({
        user_id: user.id,
        fortune_date: today,
        score: fortune.score,
        message: fortune.message,
      })
      .select('score, message, fortune_date')
      .single();

    if (error) {
      // unique constraint 위반 = 이미 오늘 뽑음 → 다시 조회해서 반환
      if (error.code === '23505') {
        return await checkToday();
      }
      return null;
    }

    const result = data as FortuneResult;
    setTodayResult(result);
    return result;
  }, [user, todayResult, checkToday]);

  return { todayResult, loading, checked, checkToday, drawFortune };
}
