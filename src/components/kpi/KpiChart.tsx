import { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import type { KpiItem, KpiRecord } from '../../types';

const LINE_COLORS = ['#6C5CE7', '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#ec4899'];

interface KpiChartProps {
  items: KpiItem[];
  records: KpiRecord[];
}

export default function KpiChart({ items, records }: KpiChartProps) {
  const chartData = useMemo(() => {
    // 모든 월 수집
    const monthSet = new Set<string>();
    records.forEach((r) => monthSet.add(r.month));
    const months = Array.from(monthSet).sort();

    // 월별 데이터 구성
    return months.map((month) => {
      const point: Record<string, string | number> = { month: month.slice(5) }; // "01", "02" 등
      items.forEach((item) => {
        const record = records.find(
          (r) => r.kpi_item_id === item.id && r.month === month
        );
        point[item.title] = record?.score ?? 0;
      });
      return point;
    });
  }, [items, records]);

  if (chartData.length === 0) {
    return (
      <div className="rounded-xl bg-white/[.04] p-4">
        <h3 className="text-xs font-semibold text-text-secondary mb-3">월별 KPI 추이</h3>
        <div className="flex items-center justify-center py-8">
          <p className="text-xs text-text-muted">데이터가 부족합니다</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-white/[.04] p-4">
      <h3 className="text-xs font-semibold text-text-secondary mb-3">월별 KPI 추이</h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.06)" />
          <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 10 }} />
          <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} domain={[0, 3]} />
          <Tooltip
            contentStyle={{
              background: '#2d2d44',
              border: 'none',
              borderRadius: 8,
              fontSize: 12,
            }}
            itemStyle={{ color: '#e2e8f0' }}
          />
          <Legend wrapperStyle={{ fontSize: 10 }} />
          {items.map((item, i) => (
            <Line
              key={item.id}
              type="monotone"
              dataKey={item.title}
              stroke={LINE_COLORS[i % LINE_COLORS.length]}
              strokeWidth={2}
              dot={{ r: 3, fill: LINE_COLORS[i % LINE_COLORS.length] }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
