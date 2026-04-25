import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { withTimeout } from '../lib/utils';

export interface PlannedExpense {
  id: string;
  team: string;
  period_ym: string;
  planned_date: string;
  category: string;
  amount: number;
  memo: string | null;
  headcount: number | null;
  author_id: string | null;
  author_name: string;
  created_at: string;
  updated_at: string;
}

export interface PlannedExpenseInput {
  planned_date: string;
  category: string;
  amount: number;
  memo?: string | null;
  headcount?: number | null;
}

/**
 * 분기 예정 지출 (corp_card_planned_expenses) — 같은 팀 모든 멤버가 등록·수정·삭제 가능.
 * RLS: SELECT/INSERT/UPDATE/DELETE 모두 같은 team 인 경우 허용.
 *
 * 기존 사용 합계와는 분리 — 차트 데이터에 영향 안 줌.
 * 팀장이 "어떤 일정에 어떤 규모 지출 예정인지" 미리 파악하는 용도.
 */
export function usePlannedExpenses(team: string | null, periodYm: string | null) {
  const [items, setItems] = useState<PlannedExpense[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    if (!team || !periodYm) {
      setItems([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data, error: e } = await withTimeout(
        () =>
          supabase
            .from('corp_card_planned_expenses')
            .select('*')
            .eq('team', team)
            .eq('period_ym', periodYm)
            .order('planned_date', { ascending: true }),
        8000,
        'planned_expenses',
      );
      if (e) {
        setError('예정 지출을 불러오지 못했습니다');
        return;
      }
      setItems((data ?? []) as PlannedExpense[]);
    } catch {
      setError('예정 지출을 불러오지 못했습니다');
    } finally {
      setLoading(false);
    }
  }, [team, periodYm]);

  useEffect(() => {
    void fetchItems();
  }, [fetchItems]);

  const create = useCallback(
    async (input: PlannedExpenseInput, author: { id: string; name: string }) => {
      if (!team || !periodYm) return { error: '팀/분기 정보가 없습니다' };
      const { error: e } = await supabase.from('corp_card_planned_expenses').insert({
        team,
        period_ym: periodYm,
        planned_date: input.planned_date,
        category: input.category,
        amount: input.amount,
        memo: input.memo ?? null,
        headcount: input.headcount ?? null,
        author_id: author.id,
        author_name: author.name,
      });
      if (e) return { error: e.message };
      await fetchItems();
      return { error: null };
    },
    [team, periodYm, fetchItems],
  );

  const update = useCallback(
    async (id: string, patch: Partial<PlannedExpenseInput>) => {
      const { error: e } = await supabase
        .from('corp_card_planned_expenses')
        .update(patch)
        .eq('id', id);
      if (e) return { error: e.message };
      await fetchItems();
      return { error: null };
    },
    [fetchItems],
  );

  const remove = useCallback(
    async (id: string) => {
      const { error: e } = await supabase.from('corp_card_planned_expenses').delete().eq('id', id);
      if (e) return { error: e.message };
      await fetchItems();
      return { error: null };
    },
    [fetchItems],
  );

  const total = items.reduce((s, x) => s + x.amount, 0);

  return { items, loading, error, total, refetch: fetchItems, create, update, remove };
}
