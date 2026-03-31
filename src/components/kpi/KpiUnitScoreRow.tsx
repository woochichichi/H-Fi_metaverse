import type { MemberUnitScores } from '../../hooks/useKpi';
import { UNITS } from '../../lib/constants';

interface Props {
  member: MemberUnitScores;
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 2.5 ? 'text-success' : score >= 1 ? 'text-warning' : 'text-text-muted';
  return (
    <span className={`text-xs font-mono font-semibold ${color}`}>
      {score > 0 ? score : '-'}
    </span>
  );
}

export default function KpiUnitScoreRow({ member }: Props) {
  return (
    <div className="rounded-lg bg-white/[.03] transition-colors hover:bg-white/[.06]">
      <div className="grid grid-cols-[1fr_repeat(4,40px)] gap-1 items-center px-2 py-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/20 text-[10px] font-bold text-accent">
            {member.name.slice(-2)}
          </div>
          <p className="text-xs font-medium text-text-primary truncate">{member.name}</p>
        </div>

        {UNITS.map((u) => (
          <div key={u} className="text-center">
            <ScoreBadge score={member.unitScores[u] ?? 0} />
          </div>
        ))}
      </div>
    </div>
  );
}
