import { Download } from 'lucide-react';
import type { UserStat } from '../../hooks/useUserActivities';
import type { CustomEvalItem } from '../../types';

interface ExportCsvProps {
  stats: UserStat[];
  customItems: CustomEvalItem[];
  period: string;
}

export default function ExportCsv({ stats, customItems, period }: ExportCsvProps) {
  const handleExport = () => {
    if (stats.length === 0) return;

    // 각 유저의 팀에 해당하는 커스텀 항목 수집
    const allTeams = [...new Set(stats.map((s) => s.team))];
    const relevantCustomItems = customItems.filter((ci) => allTeams.includes(ci.team));

    const baseHeaders = ['이름', '팀', 'VOC건수', '아이디어건수', '투표건수', '공지읽음', '이벤트참여', '쪽지', '인적교류'];
    const customHeaders = relevantCustomItems.map((ci) => `${ci.name}(${ci.team})`);
    const headers = [...baseHeaders, ...customHeaders, '총포인트'];

    const rows = stats.map((s) => {
      const baseRow = [
        s.name,
        s.team,
        s.voc_submit,
        s.idea_submit,
        s.idea_vote,
        s.notice_read,
        s.event_join,
        s.note_send,
        s.exchange_join,
      ];
      const customRow = relevantCustomItems.map((ci) =>
        ci.team === s.team ? (s.customCounts[ci.id] || 0) : ''
      );
      return [...baseRow, ...customRow, s.totalPoints.toFixed(1)];
    });

    const periodLabel = period === 'month' ? '월별' : period === 'quarter' ? '분기별' : '반기별';
    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;

    // UTF-8 BOM
    const BOM = '\uFEFF';
    const csv = BOM + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ITO_활동현황_${periodLabel}_${dateStr}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={handleExport}
      disabled={stats.length === 0}
      className="flex items-center gap-1.5 rounded-lg border border-white/[.08] px-3 py-1.5 text-xs font-semibold text-text-secondary transition-colors hover:bg-white/[.06] disabled:opacity-40 disabled:cursor-not-allowed"
    >
      <Download size={13} />
      CSV 내보내기
    </button>
  );
}
