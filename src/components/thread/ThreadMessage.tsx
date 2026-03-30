import { formatRelativeTime } from '../../lib/utils';
import type { MessageThread } from '../../types';

interface ThreadMessageProps {
  message: MessageThread;
}

export default function ThreadMessage({ message }: ThreadMessageProps) {
  const isAuthor = message.sender_role === 'author';

  return (
    <div className={`flex ${isAuthor ? 'justify-start' : 'justify-end'}`}>
      <div
        className={`max-w-[80%] rounded-xl px-3 py-2 ${
          isAuthor
            ? 'rounded-tl-sm bg-white/[.08]'
            : 'rounded-tr-sm bg-accent/20'
        }`}
      >
        <p className={`text-[10px] font-medium mb-0.5 ${isAuthor ? 'text-text-muted' : 'text-accent'}`}>
          {isAuthor ? '익명 작성자' : '관리자'}
        </p>
        <p className="text-sm text-text-primary whitespace-pre-wrap">{message.message}</p>
        <p className="text-[10px] text-text-muted mt-1">
          {formatRelativeTime(message.created_at)}
        </p>
      </div>
    </div>
  );
}
