import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { withTimeout } from '../lib/utils';
import type { CustomEvalItem } from '../types';

export function useCustomEvalItems() {
  const [items, setItems] = useState<CustomEvalItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchItems = useCallback(async (team?: string) => {
    setLoading(true);
    try {
      const buildQuery = () => {
        let q = supabase.from('custom_eval_items').select('*').eq('active', true).order('created_at', { ascending: true });
        if (team) q = q.eq('team', team);
        return q;
      };

      const { data, error } = await withTimeout(buildQuery, 8000, 'evalItems');
      if (error) {
        console.error('커스텀 평가 항목 조회 실패:', error.message);
        return;
      }
      setItems(data ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAllItems = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await withTimeout(
        () => supabase.from('custom_eval_items').select('*').order('created_at', { ascending: true }),
        8000, 'evalAllItems',
      );

      if (error) {
        console.error('커스텀 평가 항목 조회 실패:', error.message);
        return;
      }
      setItems(data ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  const createItem = useCallback(
    async (team: string, name: string, points: number, createdBy: string) => {
      const { error } = await supabase.from('custom_eval_items').insert({
        team,
        name,
        points,
        active: true,
        created_by: createdBy,
      });
      if (error) {
        console.error('커스텀 항목 생성 실패:', error.message);
        return { error: error.message };
      }
      return { error: null };
    },
    []
  );

  const updateItem = useCallback(
    async (id: string, updates: { name?: string; points?: number; active?: boolean }) => {
      const { error } = await supabase
        .from('custom_eval_items')
        .update(updates)
        .eq('id', id);
      if (error) {
        console.error('커스텀 항목 수정 실패:', error.message);
        return { error: error.message };
      }
      return { error: null };
    },
    []
  );

  const deleteItem = useCallback(async (id: string) => {
    // soft delete (active = false)
    const { error } = await supabase
      .from('custom_eval_items')
      .update({ active: false })
      .eq('id', id);
    if (error) {
      console.error('커스텀 항목 삭제 실패:', error.message);
      return { error: error.message };
    }
    return { error: null };
  }, []);

  return { items, loading, fetchItems, fetchAllItems, createItem, updateItem, deleteItem };
}
