import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { withTimeout } from '../lib/utils';
import type { KpiItem, KpiRecord } from '../types';

/** 팀원별 활동 집계 */
export interface MemberActivity {
  userId: string;
  name: string;
  unit: string | null;
  vocCount: number;
  ideaCount: number;
  eventJoinCount: number;
  exchangeJoinCount: number;
}

/** 활동 상세 1건 */
export interface ActivityDetail {
  id: string;
  activityType: string;
  refId: string | null;
  title: string | null;
  createdAt: string;
}

export function useKpi() {
  const [kpiItems, setKpiItems] = useState<KpiItem[]>([]);
  const [kpiRecords, setKpiRecords] = useState<KpiRecord[]>([]);
  const [members, setMembers] = useState<MemberActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** KPI 항목 조회 (팀 + 유닛 필터) */
  const fetchKpiItems = useCallback(async (team?: string | null, unit?: string | null) => {
    setLoading(true);
    setError(null);

    try {
      const buildQuery = () => {
        let q = supabase.from('kpi_items').select('*');
        if (team) q = q.eq('team', team);
        if (unit) q = q.eq('unit', unit);
        return q.order('created_at', { ascending: true });
      };

      const { data, error: fetchError } = await withTimeout(buildQuery, 8000, 'kpi');

      if (fetchError) throw fetchError;
      setKpiItems(data ?? []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '데이터를 불러올 수 없습니다';
      console.error('KPI 항목 조회 실패:', msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  /** 팀원 목록 + 활동 건수 집계 (loading은 호출부에서 관리) */
  const fetchMemberActivities = useCallback(async (
    team: string,
    quarter?: string,
  ) => {
    try {
      // 1) 프로필 조회 (팀 기준, 유닛 필터 없음 — 프로필에 unit 미설정 상태)
      const profileQuery = () =>
        supabase.from('profiles').select('id, name, team, unit, role')
          .eq('team', team)
          .order('name');

      const { data: rawProfiles, error: profileErr } = await withTimeout(profileQuery, 8000, 'kpiProfiles');
      if (profileErr) throw profileErr;
      if (!rawProfiles || rawProfiles.length === 0) {
        setMembers([]);
        return;
      }
      const profiles = rawProfiles as { id: string; name: string; team: string; unit: string | null; role: string }[];

      // 2) 분기 날짜 범위 계산
      const { start, end } = getQuarterRange(quarter ?? getCurrentQuarter());

      // 3) 해당 팀원들의 활동 조회
      const userIds = profiles.map((p) => p.id);
      const actQuery = () =>
        supabase
          .from('user_activities')
          .select('user_id, activity_type')
          .in('user_id', userIds)
          .gte('created_at', start)
          .lt('created_at', end);

      const { data: activities, error: actErr } = await withTimeout(actQuery, 8000, 'kpiActivities');
      if (actErr) throw actErr;

      // 4) 집계
      const actMap = new Map<string, Record<string, number>>();
      (activities ?? []).forEach((a: { user_id: string; activity_type: string }) => {
        if (!actMap.has(a.user_id)) actMap.set(a.user_id, {});
        const m = actMap.get(a.user_id)!;
        m[a.activity_type] = (m[a.activity_type] ?? 0) + 1;
      });

      const result: MemberActivity[] = profiles.map((p) => {
        const acts = actMap.get(p.id) ?? {};
        return {
          userId: p.id,
          name: p.name,
          unit: p.unit,
          vocCount: acts['voc_submit'] ?? 0,
          ideaCount: acts['idea_submit'] ?? 0,
          eventJoinCount: acts['event_join'] ?? 0,
          exchangeJoinCount: acts['exchange_join'] ?? 0,
        };
      });

      setMembers(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '팀원 활동 조회 실패';
      console.error('팀원 활동 조회 실패:', msg);
      setError(msg);
    }
  }, []);

  const fetchKpiRecords = useCallback(async (kpiItemId?: string) => {
    const buildQuery = () => {
      let q = supabase.from('kpi_records').select('*');
      if (kpiItemId) q = q.eq('kpi_item_id', kpiItemId);
      return q.order('month', { ascending: true });
    };

    const { data, error: fetchError } = await withTimeout(buildQuery, 8000, 'kpiRecords');

    if (fetchError) {
      console.error('KPI 실적 조회 실패:', fetchError.message);
      return;
    }

    setKpiRecords(data ?? []);
  }, []);

  const fetchAllRecords = useCallback(async (kpiItemIds: string[]) => {
    if (kpiItemIds.length === 0) return;

    const { data, error: fetchError } = await withTimeout(
      () => supabase.from('kpi_records').select('*').in('kpi_item_id', kpiItemIds).order('month', { ascending: true }),
      8000, 'kpiAllRecords',
    );

    if (fetchError) {
      console.error('KPI 실적 일괄 조회 실패:', fetchError.message);
      return;
    }

    setKpiRecords(data ?? []);
  }, []);

  const upsertKpiRecord = useCallback(
    async (input: {
      kpi_item_id: string;
      user_id: string;
      month: string;
      score: number;
      evidence?: string | null;
    }) => {
      const { data: existing } = await supabase
        .from('kpi_records')
        .select('id')
        .eq('kpi_item_id', input.kpi_item_id)
        .eq('month', input.month)
        .maybeSingle();

      if (existing) {
        const { data, error } = await supabase
          .from('kpi_records')
          .update({ score: input.score, evidence: input.evidence ?? null })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) {
          console.error('KPI 실적 수정 실패:', error.message);
          return { data: null, error: error.message };
        }
        return { data, error: null };
      } else {
        const { data, error } = await supabase
          .from('kpi_records')
          .insert({
            kpi_item_id: input.kpi_item_id,
            user_id: input.user_id,
            month: input.month,
            score: input.score,
            evidence: input.evidence ?? null,
          })
          .select()
          .single();

        if (error) {
          console.error('KPI 실적 등록 실패:', error.message);
          return { data: null, error: error.message };
        }
        return { data, error: null };
      }
    },
    []
  );

  /** 특정 팀원의 활동 상세 조회 (제목 포함) */
  const fetchMemberDetail = useCallback(async (
    userId: string,
    quarter?: string,
  ): Promise<ActivityDetail[]> => {
    const { start, end } = getQuarterRange(quarter ?? getCurrentQuarter());

    const { data, error: err } = await withTimeout(
      () => supabase
        .from('user_activities')
        .select('id, activity_type, ref_id, created_at')
        .eq('user_id', userId)
        .gte('created_at', start)
        .lt('created_at', end)
        .order('created_at', { ascending: false }),
      8000, 'memberDetail',
    );
    if (err || !data) return [];

    const activities = data as { id: string; activity_type: string; ref_id: string | null; created_at: string }[];

    // ref_id → 제목 매핑 (타입별 소스 테이블)
    const tableMap: Record<string, string> = {
      voc_submit: 'vocs',
      idea_submit: 'ideas',
      event_join: 'gatherings',
      exchange_join: 'gatherings',
    };

    const refsByTable = new Map<string, Set<string>>();
    activities.forEach((a) => {
      const table = tableMap[a.activity_type];
      if (table && a.ref_id) {
        if (!refsByTable.has(table)) refsByTable.set(table, new Set());
        refsByTable.get(table)!.add(a.ref_id);
      }
    });

    const titleMap = new Map<string, string>();
    await Promise.all(
      Array.from(refsByTable.entries()).map(async ([table, ids]) => {
        const { data: rows } = await withTimeout(
          () => supabase.from(table).select('id, title').in('id', Array.from(ids)),
          8000, `kpiTitle_${table}`,
        );
        (rows ?? []).forEach((r: { id: string; title: string }) => {
          titleMap.set(r.id, r.title);
        });
      }),
    );

    return activities.map((a) => ({
      id: a.id,
      activityType: a.activity_type,
      refId: a.ref_id,
      title: a.ref_id ? (titleMap.get(a.ref_id) ?? null) : null,
      createdAt: a.created_at,
    }));
  }, []);

  return {
    kpiItems,
    kpiRecords,
    members,
    loading,
    error,
    fetchKpiItems,
    fetchMemberActivities,
    fetchMemberDetail,
    fetchKpiRecords,
    fetchAllRecords,
    upsertKpiRecord,
  };
}

// ── 유틸 ──

function getCurrentQuarter(): string {
  const now = new Date();
  const q = Math.ceil((now.getMonth() + 1) / 3);
  return `${now.getFullYear()}-Q${q}`;
}

function getQuarterRange(quarter: string): { start: string; end: string } {
  const [yearStr, qStr] = quarter.split('-Q');
  const year = Number(yearStr);
  const q = Number(qStr);
  const startMonth = (q - 1) * 3; // 0-indexed
  const start = new Date(year, startMonth, 1).toISOString();
  const end = new Date(year, startMonth + 3, 1).toISOString();
  return { start, end };
}
