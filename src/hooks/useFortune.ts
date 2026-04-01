import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';

export interface FortuneResult {
  score: number;
  message: string;
  fortune_date: string;
}

// 점수 80~100 → 5단계 구간별 문구 (유쾌 버전)
const FORTUNE_MESSAGES: { min: number; max: number; messages: string[] }[] = [
  {
    min: 80, max: 83,
    messages: [
      '오늘은 조용히 칼퇴하는 날. 퇴근길 치킨 각.',
      '무난한 하루! 점심 메뉴 고민이 오늘의 최대 난관.',
      '잔잔한 바다 같은 하루. 파도 없는 게 최고야~',
      '오늘의 미션: 아무 탈 없이 퇴근하기. 클리어 가능!',
      '커피 한 잔이면 충분한 하루. 괜히 두 잔 마시지 마세요.',
    ],
  },
  {
    min: 84, max: 87,
    messages: [
      '점심 메뉴 고민 중? 오늘은 뭘 먹어도 맛있는 날!',
      '누군가 간식 돌릴 예감... 자리 지키세요!',
      '오늘 회의에서 센스 있는 한마디 가능. 기회를 노리세요.',
      '동료가 커피 사줄 운세. 은근슬쩍 어필해보세요.',
      '코드 리뷰에서 칭찬받을 수 있는 날. 커밋 메시지 정성껏!',
    ],
  },
  {
    min: 88, max: 91,
    messages: [
      '오늘 밀린 업무 정리하면 내일의 내가 감사할 걸?',
      '점심 후 졸음이 안 오는 기적의 날! 생산성 폭발!',
      '슬랙 알림이 반가운 날. 좋은 소식이 올 수도?',
      '오늘 퇴근 후 로또 한 장... 은 너무 과하고, 편의점 행운뽑기 도전!',
      '회의에서 아이디어 뿜뿜! 메모장 준비하세요.',
    ],
  },
  {
    min: 92, max: 96,
    messages: [
      '오늘의 당신은 팀의 에이스! 뭘 해도 척척!',
      '상사가 흡족해하는 날. 연봉 협상 타이밍...은 아직.',
      '버그가 한 번에 잡히는 기적의 날! 커밋 많이 하세요.',
      '오늘 자리에서 일어나면 좋은 일이! ...화장실 갔다 오세요.',
      '배포해도 장애 안 나는 날. 지금이 기회!',
    ],
  },
  {
    min: 97, max: 100,
    messages: [
      '잭팟! 오늘 뭘 해도 대박! 로또는 직접 사세요.',
      '전설의 날! 이 운세 스크린샷 찍어서 자랑하세요!',
      '오늘의 운: MAX! 퇴근길에 만원 줍는 상상 해도 될 듯.',
      '우주가 당신 편인 날. 단, 야근은 우주도 못 막음.',
      '100점 만점 인생! 오늘 하루만큼은 주인공이세요!',
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
  const [checked, setChecked] = useState(false);

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

  const drawFortune = useCallback(async (): Promise<FortuneResult | null> => {
    if (!user) return null;
    const today = getTodayKST();
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
