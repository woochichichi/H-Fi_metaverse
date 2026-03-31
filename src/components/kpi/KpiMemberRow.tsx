import type { MemberActivity } from '../../hooks/useKpi';

interface KpiMemberRowProps {
  member: MemberActivity;
}

function CountBadge({ count }: { count: number }) {
  const color = count >= 3 ? 'text-success' : count >= 1 ? 'text-warning' : 'text-text-muted';
  return (
    <span className={`text-xs font-mono font-semibold ${color}`}>
      {count}
    </span>
  );
}

export default function KpiMemberRow({ member }: KpiMemberRowProps) {
  return (
    <div className="grid grid-cols-[1fr_repeat(4,40px)] gap-1 items-center rounded-lg bg-white/[.03] px-2 py-2 transition-colors hover:bg-white/[.06]">
      {/* 이름 + 유닛 */}
      <div className="flex items-center gap-2 min-w-0">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/20 text-[10px] font-bold text-accent">
          {member.name.slice(-2)}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-text-primary truncate">{member.name}</p>
          {member.unit && (
            <p className="text-[9px] text-text-muted">{member.unit}</p>
          )}
        </div>
      </div>

      {/* 활동 건수 */}
      <div className="text-center"><CountBadge count={member.vocCount} /></div>
      <div className="text-center"><CountBadge count={member.ideaCount} /></div>
      <div className="text-center"><CountBadge count={member.eventJoinCount} /></div>
      <div className="text-center"><CountBadge count={member.exchangeJoinCount} /></div>
    </div>
  );
}
