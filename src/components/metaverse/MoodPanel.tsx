import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import { useUiStore } from '../../stores/uiStore';
import { MOOD_EMOJIS } from '../../lib/constants';

interface MoodEntry {
  id: string;
  name: string;
  team: string;
  mood_emoji: string;
  updated_at: string;
}

const MOOD_LABELS: Record<string, string> = {
  '😆': '최고',
  '😊': '좋아요',
  '😐': '보통',
  '😰': '힘들어',
  '🤯': '바빠',
  '😴': '졸려',
  '🔥': '열정',
  '☕': '커피중',
};

export default function MoodPanel() {
  const { profile, setProfile } = useAuthStore();
  const { addToast } = useUiStore();
  const [moods, setMoods] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMoods = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, team, mood_emoji, updated_at')
      .not('mood_emoji', 'is', null)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('기분 목록 조회 실패:', error.message);
    } else {
      setMoods(data ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchMoods();
  }, [fetchMoods]);

  const selectMood = async (emoji: string) => {
    if (!profile) return;

    const isSame = profile.mood_emoji === emoji;
    const newEmoji = isSame ? null : emoji;

    const { error } = await supabase
      .from('profiles')
      .update({ mood_emoji: newEmoji })
      .eq('id', profile.id);

    if (error) {
      addToast('기분 변경 실패', 'error');
      return;
    }

    setProfile({ ...profile, mood_emoji: newEmoji });
    addToast(isSame ? '기분을 해제했습니다' : `기분: ${emoji} ${MOOD_LABELS[emoji]}`, 'success');
    fetchMoods();
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return '방금 전';
    if (mins < 60) return `${mins}분 전`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}시간 전`;
    return `${Math.floor(hours / 24)}일 전`;
  };

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-sm font-bold text-text-primary">오늘 나의 기분은?</h3>

      {/* 이모지 그리드 */}
      <div className="grid grid-cols-4 gap-2">
        {MOOD_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => selectMood(emoji)}
            className={`flex flex-col items-center gap-1 rounded-xl border p-3 transition-all duration-200 ${
              profile?.mood_emoji === emoji
                ? 'border-accent bg-accent/20 shadow-lg shadow-accent/10'
                : 'border-white/[.06] bg-white/[.03] hover:border-accent/30 hover:bg-white/[.06]'
            }`}
          >
            <span className="text-2xl">{emoji}</span>
            <span className="text-[10px] text-text-muted">{MOOD_LABELS[emoji]}</span>
          </button>
        ))}
      </div>

      {/* 팀 기분 목록 */}
      <div className="mt-2">
        <h4 className="mb-2 text-xs font-semibold text-text-secondary">팀원들의 기분</h4>
        {loading ? (
          <div className="py-4 text-center text-xs text-text-muted">로딩 중...</div>
        ) : moods.length === 0 ? (
          <div className="py-4 text-center text-xs text-text-muted">
            아직 아무도 기분을 공유하지 않았어요
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {moods.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between rounded-lg bg-white/[.03] px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{m.mood_emoji}</span>
                  <div>
                    <span className="text-xs font-medium text-text-primary">{m.name}</span>
                    <span className="ml-1.5 text-[10px] text-text-muted">{m.team}</span>
                  </div>
                </div>
                <span className="text-[10px] text-text-muted">{timeAgo(m.updated_at)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
