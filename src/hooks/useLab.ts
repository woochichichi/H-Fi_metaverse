import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { withTimeout } from '../lib/utils';
import type {
  LabHypothesis,
  LabEntry,
  LabComment,
  LabHypothesisStatus,
  LabHypothesisCategory,
  LabEntryType,
  Profile,
} from '../types';

export interface LabFilters {
  status?: LabHypothesisStatus | null;
  category?: LabHypothesisCategory | null;
}

export function useLab() {
  const [hypotheses, setHypotheses] = useState<LabHypothesis[]>([]);
  const [entries, setEntries] = useState<LabEntry[]>([]);
  const [comments, setComments] = useState<LabComment[]>([]);
  const [commentProfiles, setCommentProfiles] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ========== 가설 ==========

  const fetchHypotheses = useCallback(async (filters: LabFilters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const buildQuery = () => {
        let q = supabase.from('lab_hypotheses').select('*');
        if (filters.status) q = q.eq('status', filters.status);
        if (filters.category) q = q.eq('category', filters.category);
        return q.order('pinned', { ascending: false }).order('created_at', { ascending: false });
      };
      const { data, error: fetchError } = await withTimeout(buildQuery, 8000, 'lab_hypotheses');
      if (fetchError) throw fetchError;
      setHypotheses(data ?? []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '가설 목록을 불러올 수 없습니다';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const createHypothesis = useCallback(
    async (input: {
      title: string;
      description: string;
      category: LabHypothesisCategory;
      author_id: string;
      attachment_urls?: string[];
    }) => {
      const { data, error: insertError } = await supabase
        .from('lab_hypotheses')
        .insert({
          title: input.title,
          description: input.description,
          category: input.category,
          author_id: input.author_id,
          status: '탐색중' as LabHypothesisStatus,
          pinned: false,
          attachment_urls: input.attachment_urls ?? [],
        })
        .select()
        .single();

      if (insertError) return { data: null, error: insertError.message };
      if (data) setHypotheses((prev) => [data, ...prev]);
      return { data, error: null };
    },
    [],
  );

  const updateHypothesis = useCallback(
    async (id: string, updates: { title?: string; description?: string; status?: LabHypothesisStatus; category?: LabHypothesisCategory; pinned?: boolean; attachment_urls?: string[] }) => {
      const { data, error: updateError } = await supabase
        .from('lab_hypotheses')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (updateError) return { data: null, error: updateError.message };
      if (data) setHypotheses((prev) => prev.map((h) => (h.id === id ? data : h)));
      return { data, error: null };
    },
    [],
  );

  const deleteHypothesis = useCallback(async (id: string) => {
    const { error: deleteError } = await supabase.from('lab_hypotheses').delete().eq('id', id);
    if (deleteError) return { error: deleteError.message };
    setHypotheses((prev) => prev.filter((h) => h.id !== id));
    return { error: null };
  }, []);

  // ========== 엔트리 ==========

  const fetchEntries = useCallback(async (hypothesisId: string) => {
    setDetailLoading(true);
    try {
      const buildQuery = () =>
        supabase
          .from('lab_entries')
          .select('*')
          .eq('hypothesis_id', hypothesisId)
          .order('created_at', { ascending: true });
      const { data, error: fetchError } = await withTimeout(buildQuery, 8000, 'lab_entries');
      if (fetchError) throw fetchError;
      setEntries(data ?? []);
    } catch (err) {
      console.error('엔트리 조회 실패:', err);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const createEntry = useCallback(
    async (input: {
      hypothesis_id: string;
      type: LabEntryType;
      content: string;
      author_id: string;
      attachment_urls?: string[];
    }) => {
      const { data, error: insertError } = await supabase
        .from('lab_entries')
        .insert({
          hypothesis_id: input.hypothesis_id,
          type: input.type,
          content: input.content,
          author_id: input.author_id,
          attachment_urls: input.attachment_urls ?? [],
        })
        .select()
        .single();

      if (insertError) return { data: null, error: insertError.message };
      if (data) setEntries((prev) => [...prev, data]);
      return { data, error: null };
    },
    [],
  );

  const updateEntry = useCallback(
    async (id: string, updates: { content?: string; type?: LabEntryType }) => {
      const { data, error: updateError } = await supabase
        .from('lab_entries')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (updateError) return { data: null, error: updateError.message };
      if (data) setEntries((prev) => prev.map((e) => (e.id === id ? data : e)));
      return { data, error: null };
    },
    [],
  );

  const deleteEntry = useCallback(async (id: string) => {
    const { error: deleteError } = await supabase.from('lab_entries').delete().eq('id', id);
    if (deleteError) return { error: deleteError.message };
    setEntries((prev) => prev.filter((e) => e.id !== id));
    return { error: null };
  }, []);

  // ========== 코멘트 ==========

  const fetchComments = useCallback(async (hypothesisId: string) => {
    try {
      const buildQuery = () =>
        supabase
          .from('lab_comments')
          .select('*')
          .eq('hypothesis_id', hypothesisId)
          .order('created_at', { ascending: true });
      const { data, error: fetchError } = await withTimeout(buildQuery, 8000, 'lab_comments');
      if (fetchError) throw fetchError;
      setComments(data ?? []);

      // 코멘트 작성자 프로필 일괄 조회
      if (data && data.length > 0) {
        const authorIds = [...new Set(data.map((c) => c.author_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, name, nickname, avatar_emoji, team')
          .in('id', authorIds);
        if (profiles) {
          const map: Record<string, Profile> = {};
          for (const p of profiles) map[p.id] = p as Profile;
          setCommentProfiles(map);
        }
      }
    } catch (err) {
      console.error('코멘트 조회 실패:', err);
    }
  }, []);

  const createComment = useCallback(
    async (input: { hypothesis_id: string; author_id: string; content: string }) => {
      const { data, error: insertError } = await supabase
        .from('lab_comments')
        .insert({
          hypothesis_id: input.hypothesis_id,
          author_id: input.author_id,
          content: input.content,
        })
        .select()
        .single();

      if (insertError) return { data: null, error: insertError.message };
      if (data) {
        setComments((prev) => [...prev, data]);
        // 새 작성자 프로필이 없으면 조회하여 추가
        if (!commentProfiles[input.author_id]) {
          const { data: p } = await supabase
            .from('profiles')
            .select('id, name, nickname, avatar_emoji, team')
            .eq('id', input.author_id)
            .single();
          if (p) setCommentProfiles((prev) => ({ ...prev, [p.id]: p as Profile }));
        }
      }
      return { data, error: null };
    },
    [commentProfiles],
  );

  const updateComment = useCallback(
    async (id: string, content: string) => {
      const { data, error: updateError } = await supabase
        .from('lab_comments')
        .update({ content })
        .eq('id', id)
        .select()
        .single();
      if (updateError) return { data: null, error: updateError.message };
      if (data) setComments((prev) => prev.map((c) => (c.id === id ? data : c)));
      return { data, error: null };
    },
    [],
  );

  const deleteComment = useCallback(async (id: string) => {
    const { error: deleteError } = await supabase.from('lab_comments').delete().eq('id', id);
    if (deleteError) return { error: deleteError.message };
    setComments((prev) => prev.filter((c) => c.id !== id));
    return { error: null };
  }, []);

  const clearDetail = useCallback(() => {
    setEntries([]);
    setComments([]);
    setCommentProfiles({});
  }, []);

  return {
    hypotheses,
    entries,
    comments,
    commentProfiles,
    loading,
    detailLoading,
    error,
    fetchHypotheses,
    createHypothesis,
    updateHypothesis,
    deleteHypothesis,
    fetchEntries,
    createEntry,
    updateEntry,
    deleteEntry,
    fetchComments,
    createComment,
    updateComment,
    deleteComment,
    clearDetail,
  };
}
