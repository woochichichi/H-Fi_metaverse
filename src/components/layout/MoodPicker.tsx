import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import { useUiStore } from '../../stores/uiStore';
import { useMetaverseStore } from '../../stores/metaverseStore';
import { MOOD_EMOJIS, REACTION_EMOJIS } from '../../lib/constants';

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

const REACTION_GROUPS = ['희 😊', '노 😤', '애 😢', '락 🎉'] as const;

export default function MoodPicker({ onClose }: { onClose: () => void }) {
  const { profile, setProfile } = useAuthStore();
  const { addToast } = useUiStore();
  const { addEmojiFloat } = useMetaverseStore();

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

  const sendReaction = (emoji: string) => {
    addEmojiFloat(emoji);
  };

  return (
    <div className="absolute right-0 top-full mt-2 z-[200] w-56 rounded-xl border border-white/[.08] bg-bg-secondary p-3 shadow-2xl">
      {/* 기분 선택 */}
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

      {/* 구분선 */}
      <div className="my-2.5 h-px bg-white/[.06]" />

      {/* 감정 리액션 4x4 */}
      <p className="mb-2 text-xs font-bold text-text-primary">감정 표현 💬</p>
      <div className="grid grid-cols-4 gap-1">
        {REACTION_EMOJIS.map((emoji, i) => (
          <button
            key={emoji}
            onClick={() => sendReaction(emoji)}
            className="group relative flex h-9 w-full items-center justify-center rounded-lg text-lg transition-all duration-150 hover:bg-accent/20 active:scale-[.88]"
            title={REACTION_GROUPS[Math.floor(i / 4)]}
          >
            {emoji}
          </button>
        ))}
      </div>
      <div className="mt-1.5 flex justify-between px-0.5">
        {REACTION_GROUPS.map((label) => (
          <span key={label} className="text-[8px] text-text-muted">{label}</span>
        ))}
      </div>
    </div>
  );
}
