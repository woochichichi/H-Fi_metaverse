import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { withTimeout } from '../lib/utils';
import type { KpiItem, KpiRecord, Profile } from '../types';

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

      const { data: profiles, error: profileErr } = await withTimeout(profileQuery, 8000, 'kpiProfiles');
      if (profileErr) throw profileErr;
      if (!profiles || profiles.length === 0) {
        setMembers([]);
        return;
      }

      // 2) 분기 날짜 범위 계산
      const { start, end } = getQuarterRange(quarter ?? getCurrentQuarter());

      // 3) 해당 팀원들의 활동 조회
      const userIds = profiles.map((p: Profile) => p.id);
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

      const result: MemberActivity[] = profiles.map((p: Profile) => {
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

  return {
    kpiItems,
    kpiRecords,
    members,
    loading,
    error,
    fetchKpiItems,
    fetchMemberActivities,
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
