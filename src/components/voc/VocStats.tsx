import { useMemo } from 'react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  LineChart, Line, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { ArrowLeft } from 'lucide-react';
import { VOC_SEVERITY_LABELS } from '../../lib/constants';
import type { Voc } from '../../types';

interface VocStatsProps {
  vocs: Voc[];
  onBack: () => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  '불편': '#ef4444',
  '요청': '#3b82f6',
  '칭찬': '#22c55e',
  '개선': '#f59e0b',
  '기타': '#94a3b8',
};

const STATUS_COLORS: Record<string, string> = {
  '접수': '#94a3b8',
  '검토중': '#3b82f6',
  '처리중': '#f59e0b',
  '완료': '#22c55e',
  '보류': '#ef4444',
};

const SEVERITY_COLORS: Record<number, string> = {
  1: '#22c55e', 2: '#86efac', 3: '#f59e0b', 4: '#f97316', 5: '#ef4444',
};

export default function VocStats({ vocs, onBack }: VocStatsProps) {
  // 카테고리별 건수
  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    vocs.forEach((v) => {
      counts[v.category] = (counts[v.category] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [vocs]);

  // 팀별 건수
  const teamData = useMemo(() => {
    const counts: Record<string, number> = {};
    vocs.forEach((v) => {
      counts[v.team] = (counts[v.team] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [vocs]);

  // 월별 추이
  const monthlyData = useMemo(() => {
    const counts: Record<string, number> = {};
    vocs.forEach((v) => {
      const month = v.created_at.slice(0, 7);
      counts[month] = (counts[month] || 0) + 1;
    });
    return Object.entries(counts)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, count]) => ({ month: month.slice(5), count }));
  }, [vocs]);

  // 상태별 비율
  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    vocs.forEach((v) => {
      counts[v.status] = (counts[v.status] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [vocs]);

  // ③ 심각도별 분포 (정량 분석)
  const severityData = useMemo(() => {
    const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    vocs.forEach((v) => {
      if (v.severity) counts[v.severity] = (counts[v.severity] || 0) + 1;
    });
    return Object.entries(counts).map(([level, value]) => ({
      name: VOC_SEVERITY_LABELS[Number(level)],
      level: Number(level),
      value,
    }));
  }, [vocs]);

  // ③ 카테고리별 평균 심각도 (정량 패턴 분석)
  const categorySeverityData = useMemo(() => {
    const sums: Record<string, { total: number; count: number }> = {};
    vocs.forEach((v) => {
      if (v.severity) {
        if (!sums[v.category]) sums[v.category] = { total: 0, count: 0 };
        sums[v.category].total += v.severity;
        sums[v.category].count += 1;
      }
    });
    return Object.entries(sums).map(([name, { total, count }]) => ({
      name,
      avg: Math.round((total / count) * 10) / 10,
    }));
  }, [vocs]);

  // 평균 처리 시간 (완료된 것만)
  const avgProcessTime = useMemo(() => {
    const completed = vocs.filter((v) => v.status === '완료');
    if (completed.length === 0) return null;
    const totalHours = completed.reduce((sum, v) => {
      const created = new Date(v.created_at).getTime();
      const updated = new Date(v.updated_at).getTime();
      return sum + (updated - created) / (1000 * 60 * 60);
    }, 0);
    return Math.round(totalHours / completed.length);
  }, [vocs]);

  const hasSeverityData = vocs.some((v) => v.severity !== null);

  // 데이터 부족 시 샘플 데이터
  const hasSufficientData = vocs.length >= 3;
  const sampleCategoryData = [
    { name: '불편', value: 5 }, { name: '요청', value: 8 },
    { name: '칭찬', value: 3 }, { name: '개선', value: 4 }, { name: '기타', value: 2 },
  ];
  const sampleTeamData = [
    { name: '증권ITO', value: 6 }, { name: '생명ITO', value: 5 },
    { name: '손보ITO', value: 7 }, { name: '한금서', value: 4 },
  ];
  const sampleMonthlyData = [
    { month: '01', count: 3 }, { month: '02', count: 7 },
    { month: '03', count: 5 },
  ];
  const sampleStatusData = [
    { name: '접수', value: 4 }, { name: '검토중', value: 3 },
    { name: '처리중', value: 2 }, { name: '완료', value: 8 }, { name: '보류', value: 1 },
  ];

  const catChart = hasSufficientData ? categoryData : sampleCategoryData;
  const tmChart = hasSufficientData ? teamData : sampleTeamData;
  const mnChart = hasSufficientData ? monthlyData : sampleMonthlyData;
  const stChart = hasSufficientData ? statusData : sampleStatusData;

  return (
    <div className="flex flex-col h-full">
      {/* 헤더 */}
      <div className="flex items-center gap-2 border-b border-white/[.06] px-4 py-3">
        <button
          onClick={onBack}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-white/10 hover:text-text-primary"
        >
          <ArrowLeft size={16} />
        </button>
        <h2 className="font-heading text-base font-bold text-text-primary">VOC 통계</h2>
        {!hasSufficientData && (
          <span className="ml-auto text-[10px] text-warning">샘플 데이터</span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* 평균 처리 시간 */}
        <div className="rounded-xl bg-white/[.04] p-4 text-center">
          <p className="text-xs text-text-muted mb-1">평균 처리 시간</p>
          <p className="font-mono text-2xl font-bold text-accent">
            {avgProcessTime !== null ? `${avgProcessTime}h` : '-'}
          </p>
        </div>

        {/* ③ 심각도 분포 바 차트 (정량 분석) */}
        {hasSeverityData && (
          <div className="rounded-xl bg-white/[.04] p-4">
            <h3 className="text-xs font-semibold text-text-secondary mb-3">심각도별 분포</h3>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={severityData}>
                <XAxis dataKey="name" tick={{ fill: '#cbd5e1', fontSize: 10 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ background: '#2d2d44', border: 'none', borderRadius: 8, fontSize: 12 }}
                  itemStyle={{ color: '#e2e8f0' }}
                />
                <Bar dataKey="value" name="건수">
                  {severityData.map((entry) => (
                    <Cell key={entry.level} fill={SEVERITY_COLORS[entry.level] || '#94a3b8'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* ③ 카테고리별 평균 심각도 (패턴 분석) */}
        {categorySeverityData.length > 0 && (
          <div className="rounded-xl bg-white/[.04] p-4">
            <h3 className="text-xs font-semibold text-text-secondary mb-3">카테고리별 평균 심각도</h3>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={categorySeverityData} layout="vertical">
                <XAxis type="number" domain={[0, 5]} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#cbd5e1', fontSize: 11 }} width={50} />
                <Tooltip
                  contentStyle={{ background: '#2d2d44', border: 'none', borderRadius: 8, fontSize: 12 }}
                  itemStyle={{ color: '#e2e8f0' }}
                  formatter={(value) => [`${value} / 5`, '평균 심각도']}
                />
                <Bar dataKey="avg" fill="#f59e0b" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* 카테고리별 도넛 */}
        <div className="rounded-xl bg-white/[.04] p-4">
          <h3 className="text-xs font-semibold text-text-secondary mb-3">카테고리별 건수</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={catChart}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
                dataKey="value"
                label={({ name, value }) => `${name} ${value}`}
                labelLine={false}
              >
                {catChart.map((entry) => (
                  <Cell key={entry.name} fill={CATEGORY_COLORS[entry.name] || '#94a3b8'} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#2d2d44', border: 'none', borderRadius: 8, fontSize: 12 }}
                itemStyle={{ color: '#e2e8f0' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* 팀별 바 차트 */}
        <div className="rounded-xl bg-white/[.04] p-4">
          <h3 className="text-xs font-semibold text-text-secondary mb-3">팀별 건수</h3>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={tmChart} layout="vertical">
              <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#cbd5e1', fontSize: 11 }} width={60} />
              <Tooltip
                contentStyle={{ background: '#2d2d44', border: 'none', borderRadius: 8, fontSize: 12 }}
                itemStyle={{ color: '#e2e8f0' }}
              />
              <Bar dataKey="value" fill="#6C5CE7" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 월별 추이 */}
        <div className="rounded-xl bg-white/[.04] p-4">
          <h3 className="text-xs font-semibold text-text-secondary mb-3">월별 추이</h3>
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={mnChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.06)" />
              <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <Tooltip
                contentStyle={{ background: '#2d2d44', border: 'none', borderRadius: 8, fontSize: 12 }}
                itemStyle={{ color: '#e2e8f0' }}
              />
              <Line type="monotone" dataKey="count" stroke="#6C5CE7" strokeWidth={2} dot={{ r: 3, fill: '#6C5CE7' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* 상태별 비율 */}
        <div className="rounded-xl bg-white/[.04] p-4">
          <h3 className="text-xs font-semibold text-text-secondary mb-3">상태별 분포</h3>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={stChart}>
              <XAxis dataKey="name" tick={{ fill: '#cbd5e1', fontSize: 10 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <Tooltip
                contentStyle={{ background: '#2d2d44', border: 'none', borderRadius: 8, fontSize: 12 }}
                itemStyle={{ color: '#e2e8f0' }}
              />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Bar dataKey="value" name="건수">
                {stChart.map((entry) => (
                  <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || '#94a3b8'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
