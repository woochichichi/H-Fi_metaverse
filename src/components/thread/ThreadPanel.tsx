import { useState, useRef, useEffect } from 'react';
import { Send, Loader } from 'lucide-react';
import ThreadMessage from './ThreadMessage';
import { useThreads } from '../../hooks/useThreads';
import { useUiStore } from '../../stores/uiStore';
import { checkMessageSafety } from '../../lib/messageSafety';

interface ThreadPanelProps {
  refType: 'voc' | 'note';
  refId: string;
  canReplyAsAuthor: boolean;
  canReplyAsManager: boolean;
  onMessageSent?: () => void;
}

export default function ThreadPanel({
  refType,
  refId,
  canReplyAsAuthor,
  canReplyAsManager,
  onMessageSent,
}: ThreadPanelProps) {
  const { messages, loading, error: threadError, sendMessage } = useThreads(refType, refId);
  const { addToast } = useUiStore();
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const canReply = canReplyAsAuthor || canReplyAsManager;

  // 새 메시지 시 자동 스크롤
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending || checking) return;

    const role = canReplyAsManager ? 'manager' : 'author';

    // AI 안전성 검사
    setChecking(true);
    const safety = await checkMessageSafety(text, 'thread');
    setChecking(false);
    if (!safety.safe) {
      addToast('전송할 수 없는 내용이 포함되어 있습니다.', 'error');
      return; // input 유지 (setInput 호출 없음)
    }

    setSending(true);
    setInput('');

    const { error } = await sendMessage(role, text);
    if (error) {
      setInput(text);
    } else {
      onMessageSent?.();
    }
    setSending(false);
  };

  return (
    <div className="flex flex-col rounded-xl border border-white/[.06] bg-white/[.02]">
      {/* 헤더 */}
      <div className="border-b border-white/[.06] px-3 py-2">
        <h4 className="text-xs font-semibold text-text-secondary">대화 스레드</h4>
      </div>

      {/* 메시지 목록 */}
      <div ref={scrollRef} className="flex flex-col gap-2 p-3 max-h-60 overflow-y-auto">
        {threadError ? (
          <p className="text-xs text-danger text-center py-4">
            대화를 불러오지 못했습니다
          </p>
        ) : loading ? (
          <div className="space-y-2 py-2">
            {[1, 2].map((i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : ''}`}>
                <div className="w-2/3 rounded-lg bg-white/[.06] p-2.5 animate-pulse">
                  <div className="h-3 w-1/3 rounded bg-white/10 mb-1.5" />
                  <div className="h-3 w-full rounded bg-white/[.06]" />
                </div>
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <p className="text-xs text-text-muted text-center py-4">
            아직 대화가 없습니다
          </p>
        ) : (
          messages.map((msg) => <ThreadMessage key={msg.id} message={msg} />)
        )}
      </div>

      {/* 입력창 */}
      {canReply && (
        <div className="flex items-center gap-2 border-t border-white/[.06] px-3 py-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            disabled={checking || sending}
            placeholder={checking ? '검사 중...' : canReplyAsManager ? '관리자로 답변...' : '익명으로 답변...'}
            className="flex-1 rounded-lg bg-white/[.06] px-3 py-1.5 text-sm text-text-primary placeholder-text-muted outline-none focus:ring-1 focus:ring-accent disabled:opacity-60"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending || checking}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-white transition-colors duration-200 hover:bg-accent/80 disabled:opacity-40"
          >
            {checking ? <Loader size={14} className="animate-spin" /> : <Send size={14} />}
          </button>
        </div>
      )}
    </div>
  );
}
