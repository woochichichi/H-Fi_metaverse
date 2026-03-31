import { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { sendChatMessage } from '../../hooks/usePlayerSync';

export default function ChatInput() {
  const [message, setMessage] = useState('');
  const [active, setActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Enter 키로 포커스 토글
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !active && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        setActive(true);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [active]);

  useEffect(() => {
    if (active) inputRef.current?.focus();
  }, [active]);

  const handleSend = () => {
    if (!message.trim()) return;
    sendChatMessage(message);
    setMessage('');
    setActive(false);
    inputRef.current?.blur();
  };

  if (!active) {
    return (
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-[80]">
        <button
          onClick={() => setActive(true)}
          className="flex items-center gap-2 rounded-full px-4 py-2 text-xs text-white/60 transition-all hover:text-white/90"
          style={{ background: 'rgba(30,25,35,.7)', border: '1px solid rgba(255,255,255,.1)', backdropFilter: 'blur(8px)' }}
        >
          <span className="text-white/40 text-[10px] border border-white/20 rounded px-1.5 py-0.5">Enter</span>
          채팅하기
        </button>
      </div>
    );
  }

  return (
    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-[80]">
      <form
        onSubmit={(e) => { e.preventDefault(); handleSend(); }}
        className="flex items-center gap-2 rounded-full px-3 py-1.5"
        style={{ background: 'rgba(30,25,35,.85)', border: '1px solid rgba(255,255,255,.15)', backdropFilter: 'blur(12px)', minWidth: 280 }}
      >
        <input
          ref={inputRef}
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === 'Escape') { setActive(false); setMessage(''); }
          }}
          onBlur={() => { if (!message) setActive(false); }}
          placeholder="메시지를 입력하세요..."
          maxLength={100}
          className="flex-1 bg-transparent text-sm text-white placeholder-white/40 outline-none"
        />
        <button
          type="submit"
          disabled={!message.trim()}
          className="flex h-7 w-7 items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-30"
        >
          <Send size={14} />
        </button>
      </form>
    </div>
  );
}
