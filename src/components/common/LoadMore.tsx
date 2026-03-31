import { ChevronDown } from 'lucide-react';

interface LoadMoreProps {
  current: number;
  total: number;
  onLoadMore: () => void;
}

export default function LoadMore({ current, total, onLoadMore }: LoadMoreProps) {
  if (current >= total) return null;

  return (
    <div className="flex flex-col items-center gap-1 pt-3">
      <button
        onClick={onLoadMore}
        className="flex items-center gap-1 rounded-lg bg-white/[.06] px-4 py-2 text-xs font-medium text-text-secondary transition-colors hover:bg-white/10"
      >
        <ChevronDown size={14} />
        더 보기 ({current}/{total})
      </button>
    </div>
  );
}
