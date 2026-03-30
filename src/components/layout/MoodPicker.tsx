import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import { useUiStore } from '../../stores/uiStore';
import { MOOD_EMOJIS } from '../../lib/constants';

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

export default function MoodPicker({ onClose }: { onClose: () => void }) {
  const { profile, setProfile } = useAuthStore();
  const { addToast } = useUiStore();

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
    onClose();
  };

  return (
    <div className="absolute right-0 top-full mt-2 z-[200] w-52 rounded-xl border border-white/[.08] bg-bg-secondary p-3 shadow-2xl">
      <p className="mb-2 text-xs font-bold text-text-primary">오늘 나의 기분은?</p>
      <div className="grid grid-cols-4 gap-1.5">
        {MOOD_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => selectMood(emoji)}
            className={`flex flex-col items-center gap-0.5 rounded-lg border p-2 transition-all duration-200 ${
              profile?.mood_emoji === emoji
                ? 'border-accent bg-accent/20'
                : 'border-transparent hover:bg-white/[.06]'
            }`}
          >
            <span className="text-lg">{emoji}</span>
            <span className="text-[9px] text-text-muted">{MOOD_LABELS[emoji]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
