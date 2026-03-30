import type { TeamStat } from '../../hooks/useUserActivities';

interface TeamHeatmapProps {
  stats: TeamStat[];
}

const ACTIVITY_COLS = [
  { key: 'voc_submit', label: 'VOC' },
  { key: 'idea_submit', label: '아이디어' },
  { key: 'notice_read', label: '공지읽음' },
  { key: 'event_join', label: '이벤트' },
] as const;

function getHeatColor(rate: number): string {
  // rate: 인당 활동 건수
  if (rate === 0) return 'rgba(255,255,255,.04)';
  if (rate < 0.5) return 'rgba(108,92,231,.15)';
  if (rate < 1) return 'rgba(108,92,231,.3)';
  if (rate < 2) return 'rgba(108,92,231,.5)';
  if (rate < 3) return 'rgba(108,92,231,.7)';
  return 'rgba(108,92,231,.9)';
}

export default function TeamHeatmap({ stats }: TeamHeatmapProps) {
  if (stats.length === 0) {
    return (
      <div className="py-6 text-center text-xs text-text-muted">
        데이터가 없습니다
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/[.06] overflow-hidden">
      <div className="bg-white/[.03] px-4 py-2">
        <h4 className="text-xs font-bold text-text-primary">팀별 참여율 히트맵</h4>
        <p className="text-[10px] text-text-muted mt-0.5">색상이 진할수록 인당 활동이 활발합니다</p>
      </div>

      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-white/[.06]">
            <th className="px-3 py-2 text-left font-semibold text-text-muted w-28">팀</th>
            {ACTIVITY_COLS.map((col) => (
              <th key={col.key} className="px-3 py-2 text-center font-semibold text-text-muted">
                {col.label}
              </th>
            ))}
            <th className="px-3 py-2 text-center font-semibold text-text-muted">총합</th>
          </tr>
        </thead>
        <tbody>
          {stats.map((s) => {
            const total =
              s.voc_submit + s.idea_submit + s.notice_read + s.event_join;

            return (
              <tr key={s.team} className="border-b border-white/[.04]">
                <td className="px-3 py-2 font-medium text-text-primary">{s.team}</td>
                {ACTIVITY_COLS.map((col) => {
                  const count = s[col.key as keyof TeamStat] as number;
                  const rate = count / s.memberCount;
                  return (
                    <td key={col.key} className="px-3 py-2 text-center">
                      <div
                        className="mx-auto flex h-10 w-14 items-center justify-center rounded-lg text-xs font-mono font-bold transition-colors"
                        style={{ backgroundColor: getHeatColor(rate) }}
                        title={`${count}건 (인당 ${rate.toFixed(1)})`}
                      >
                        <span className="text-text-primary">{count}</span>
                      </div>
                    </td>
                  );
                })}
                <td className="px-3 py-2 text-center">
                  <span className="font-mono font-bold text-accent">{total}</span>
                  <span className="ml-1 text-[10px] text-text-muted">
                    ({(total / s.memberCount).toFixed(1)}/인)
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* 범례 */}
      <div className="flex items-center gap-2 px-4 py-2 border-t border-white/[.04]">
        <span className="text-[10px] text-text-muted">낮음</span>
        {[0.1, 0.5, 1, 2, 3].map((v) => (
          <div
            key={v}
            className="h-3 w-6 rounded-sm"
            style={{ backgroundColor: getHeatColor(v) }}
          />
        ))}
        <span className="text-[10px] text-text-muted">높음</span>
      </div>
    </div>
  );
}
