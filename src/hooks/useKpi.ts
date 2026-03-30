import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { KpiItem, KpiRecord } from '../types';

export function useKpi() {
  const [kpiItems, setKpiItems] = useState<KpiItem[]>([]);
  const [kpiRecords, setKpiRecords] = useState<KpiRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchKpiItems = useCallback(async (unit?: string | null) => {
    setLoading(true);
    setError(null);

    let query = supabase.from('kpi_items').select('*');

    if (unit) {
      query = query.eq('unit', unit);
    }

    query = query.order('created_at', { ascending: true });

    const { data, error: fetchError } = await query;

    if (fetchError) {
      console.error('KPI 항목 조회 실패:', fetchError.message);
      setError(fetchError.message);
      setLoading(false);
      return;
    }

    setKpiItems(data ?? []);
    setLoading(false);
  }, []);

  const fetchKpiRecords = useCallback(async (kpiItemId?: string) => {
    let query = supabase.from('kpi_records').select('*');

    if (kpiItemId) {
      query = query.eq('kpi_item_id', kpiItemId);
    }

    query = query.order('month', { ascending: true });

    const { data, error: fetchError } = await query;

    if (fetchError) {
      console.error('KPI 실적 조회 실패:', fetchError.message);
      return;
    }

    setKpiRecords(data ?? []);
  }, []);

  const fetchAllRecords = useCallback(async (kpiItemIds: string[]) => {
    if (kpiItemIds.length === 0) return;

    const { data, error: fetchError } = await supabase
      .from('kpi_records')
      .select('*')
      .in('kpi_item_id', kpiItemIds)
      .order('month', { ascending: true });

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
      // upsert: 같은 kpi_item_id + month 조합이면 업데이트
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
    loading,
    error,
    fetchKpiItems,
    fetchKpiRecords,
    fetchAllRecords,
    upsertKpiRecord,
  };
}
