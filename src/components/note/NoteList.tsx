import NoteCard from './NoteCard';
import type { AnonymousNote } from '../../types';

interface NoteListProps {
  notes: AnonymousNote[];
  loading: boolean;
  onSelect: (note: AnonymousNote) => void;
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

export default function NoteList({ notes, loading, onSelect }: NoteListProps) {
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

  return (
    <div className="flex flex-col gap-2">
      {notes.map((note) => (
        <NoteCard key={note.id} note={note} onClick={() => onSelect(note)} />
      ))}
    </div>
  );
}
