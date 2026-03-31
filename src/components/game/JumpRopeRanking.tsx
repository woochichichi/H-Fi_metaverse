import { Trophy } from 'lucide-react';
import { useJumpRopeRanking } from '../../hooks/useJumpRopeRanking';
import { formatDuration } from '../../hooks/useJumpRopeGame';
import { TEAM_COLORS, TEAMS } from '../../lib/constants';

const MEDAL = ['🥇', '🥈', '🥉'];

export default function JumpRopeRankingTab() {
  const { ranking, loading } = useJumpRopeRanking();

  if (loading) return <div className="flex flex-1 items-center justify-center p-6"><span className="text-sm text-text-muted">로딩 중...</span></div>;

  if (ranking.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6">
        <Trophy size={32} className="text-text-muted" />
        <p className="text-sm text-text-muted">아직 기록이 없습니다</p>
        <p className="text-xs text-text-muted">게임을 플레이하면 랭킹에 등록됩니다!</p>
      </div>
    );
  }

  const teamStats = TEAMS.map((team) => {
    const members = ranking.filter((r) => r.team === team);
    if (members.length === 0) return null;
    const avg = Math.round(members.reduce((s, m) => s + m.best_duration_ms, 0) / members.length);
    return { team, avg, count: members.length };
  }).filter(Boolean).sort((a, b) => b!.avg - a!.avg);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {teamStats.length > 1 && (
        <div className="rounded-lg bg-white/[.04] p-3">
          <p className="mb-2 text-xs font-medium text-text-muted">팀 순위 (평균 생존시간)</p>
          <div className="space-y-1.5">
            {teamStats.map((t, i) => (
              <div key={t!.team} className="flex items-center gap-2 rounded-md bg-white/[.06] px-3 py-2">
                <span className="w-6 text-center text-sm font-bold">{i < 3 ? MEDAL[i] : `${i + 1}`}</span>
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: TEAM_COLORS[t!.team]?.body }} />
                <span className="flex-1 text-sm font-medium text-text-primary">{t!.team}</span>
                <span className="text-sm font-mono font-semibold text-text-primary">{formatDuration(t!.avg)}</span>
                <span className="text-xs text-text-muted">{t!.count}명</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <p className="text-xs font-medium text-text-muted px-1">개인 순위</p>
        {ranking.map((r, i) => (
          <div key={r.id} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 ${i < 3 ? 'bg-white/[.06]' : 'bg-white/[.02]'}`}>
            <span className="w-7 text-center text-sm font-bold">{i < 3 ? MEDAL[i] : `${i + 1}`}</span>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-text-primary">{r.nickname || r.name}</p>
              <p className="text-xs text-text-muted">{r.team}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-mono font-semibold text-text-primary">{formatDuration(r.best_duration_ms)}</p>
              <p className="text-xs font-mono text-text-muted">{r.best_jump_count}회</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
