import { useMetaverseStore } from '../../stores/metaverseStore';

export default function EmojiFloat() {
  const { emojiFloats } = useMetaverseStore();

  return (
    <>
      {emojiFloats.map((ef) => (
        <div
          key={ef.id}
          className="absolute z-[100] pointer-events-none text-[26px]"
          style={{
            left: ef.x,
            top: ef.y,
            animation: 'emojiRise 1.5s ease forwards',
          }}
        >
          {ef.emoji}
        </div>
      ))}
    </>
  );
}
