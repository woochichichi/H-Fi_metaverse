import VocCard from './VocCard';
import type { Voc } from '../../types';

interface VocListProps {
  vocs: Voc[];
  loading: boolean;
  onSelect: (voc: Voc) => void;
  assigneeNames?: Record<string, string>;
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

export default function VocList({ vocs, loading, onSelect, assigneeNames = {} }: VocListProps) {
  if (loading) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} />
        ))}
      </div>
    );
  }

  if (vocs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <span className="text-3xl mb-2">📭</span>
        <p className="text-sm text-text-muted">아직 VOC가 없어요</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {vocs.map((voc) => (
        <VocCard key={voc.id} voc={voc} onClick={() => onSelect(voc)} assigneeName={voc.assignee_id ? assigneeNames[voc.assignee_id] : null} />
      ))}
    </div>
  );
}
