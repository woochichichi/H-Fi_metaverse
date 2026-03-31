import { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import NoteCard from './NoteCard';
import LoadMore from '../common/LoadMore';
import type { AnonymousNote } from '../../types';

interface NoteListProps {
  notes: AnonymousNote[];
  loading: boolean;
  error?: string | null;
  onSelect: (note: AnonymousNote) => void;
  onRetry?: () => void;
}

function Skeleton() {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-white/[.06] bg-white/[.03] p-3 animate-pulse">
      <div className="flex justify-between">
        <div className="h-4 w-12 rounded-full bg-white/10" />
        <div className="h-4 w-10 rounded-full bg-white/10" />
      </div>
      <div className="h-4 w-3/4 rounded bg-white/10" />
      <div className="h-3 w-1/2 rounded bg-white/[.06]" />
    </div>
  );
}

const PAGE_SIZE = 20;

export default function NoteList({ notes, loading, error, onSelect, onRetry }: NoteListProps) {
  const [skeletonTimeout, setSkeletonTimeout] = useState(false);
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE);

  useEffect(() => {
    if (!loading) {
      setSkeletonTimeout(false);
      return;
    }
    const timer = setTimeout(() => setSkeletonTimeout(true), 10000);
    return () => clearTimeout(timer);
  }, [loading]);

  if (loading && skeletonTimeout) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <span className="text-3xl mb-2">⚠️</span>
        <p className="text-sm text-text-muted mb-3">로딩에 실패했습니다. 새로고침해주세요</p>
        {onRetry && (
          <button onClick={onRetry} className="flex items-center gap-1.5 rounded-lg bg-accent/20 px-3 py-1.5 text-xs font-medium text-accent transition-colors hover:bg-accent/30">
            <RefreshCw size={13} /> 새로고침
          </button>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <span className="text-3xl mb-2">⚠️</span>
        <p className="text-sm text-text-muted mb-3">{error}</p>
        {onRetry && (
          <button onClick={onRetry} className="flex items-center gap-1.5 rounded-lg bg-accent/20 px-3 py-1.5 text-xs font-medium text-accent transition-colors hover:bg-accent/30">
            <RefreshCw size={13} /> 새로고침
          </button>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} />
        ))}
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <span className="text-3xl mb-2">✉️</span>
        <p className="text-sm text-text-muted">수신한 쪽지가 없어요</p>
      </div>
    );
  }

  const visible = notes.slice(0, displayCount);

  return (
    <div className="flex flex-col gap-2">
      {visible.map((note) => (
        <NoteCard key={note.id} note={note} onClick={() => onSelect(note)} />
      ))}
      <LoadMore current={visible.length} total={notes.length} onLoadMore={() => setDisplayCount((c) => c + PAGE_SIZE)} />
    </div>
  );
}
