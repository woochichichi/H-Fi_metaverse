import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { withTimeout } from '../lib/utils';
import type { Voc, VocComment, Profile } from '../types';
import type { VocCategory, VocStatus } from '../lib/constants';

export interface VocFilters {
  category?: VocCategory | null;
  status?: VocStatus | null;
  team?: string | null;
  sort?: 'newest' | 'oldest';
}

export function useVocs() {
  const [vocs, setVocs] = useState<Voc[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchVocs = useCallback(async (filters: VocFilters = {}) => {
    setLoading(true);
    setError(null);

    try {
      const buildQuery = () => {
        let q = supabase.from('vocs').select('*').eq('is_deleted', false);
        if (filters.category) q = q.eq('category', filters.category);
        if (filters.status) q = q.eq('status', filters.status);
        if (filters.team) q = q.eq('team', filters.team);
        return q.order('created_at', { ascending: filters.sort === 'oldest' });
      };

      const { data, error: fetchError } = await withTimeout(buildQuery, 8000, 'vocs');

      if (fetchError) throw fetchError;
      setVocs(data ?? []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '데이터를 불러올 수 없습니다';
      console.error('VOC 조회 실패:', msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const createVoc = useCallback(
    async (input: {
      anonymous: boolean;
      category: VocCategory;
      title: string;
      content: string;
      team: string;
      target_area?: string | null;
      severity?: number | null;
      sub_category?: string | null;
      attachment_urls?: string[];
      author_id?: string | null;
    }) => {
      const sessionToken = input.anonymous ? crypto.randomUUID() : null;

      const { data, error: insertError } = await supabase
        .from('vocs')
        .insert({
          author_id: input.anonymous ? null : input.author_id,
          anonymous: input.anonymous,
          category: input.category,
          title: input.title,
          content: input.content,
          team: input.team,
          target_area: input.target_area ?? null,
          severity: input.severity ?? null,
          sub_category: input.sub_category ?? null,
          attachment_urls: input.attachment_urls ?? null,
          session_token: sessionToken,
        })
        .select()
        .single();

      if (insertError) {
        console.error('VOC 등록 실패:', insertError.message);
        return { data: null, error: insertError.message };
      }

      // 리더/관리자에게 새 VOC 알림
      if (data) {
        try {
          const { data: leaders } = await supabase
            .from('profiles')
            .select('id')
            .in('role', ['leader', 'admin'])
            .eq('team', input.team);
          if (leaders && leaders.length > 0) {
            const notifications = leaders
              .filter((l) => l.id !== input.author_id)
              .map((l) => ({
                user_id: l.id,
                type: 'new_voc',
                urgency: '할일' as const,
                title: `새 VOC: ${data.title}`,
                body: data.content.slice(0, 100),
                link: `/voc/${data.id}`,
                channel: 'in_app',
              }));
            if (notifications.length > 0) {
              await supabase.from('notifications').insert(notifications);
            }
          }
        } catch {
          // notification 실패해도 VOC 등록은 정상 완료
        }
      }

      // 익명 VOC → sessionStorage에 session_token 저장
      if (input.anonymous && data && sessionToken) {
        const tokens = JSON.parse(sessionStorage.getItem('voc_tokens') || '{}');
        tokens[data.id] = sessionToken;
        sessionStorage.setItem('voc_tokens', JSON.stringify(tokens));
      }

      return { data, error: null };
    },
    []
  );

  const updateVoc = useCallback(
    async (
      id: string,
      updates: {
        status?: VocStatus;
        assignee_id?: string | null;
        resolution?: string | null;
      }
    ) => {
      const { data, error: updateError } = await supabase
        .from('vocs')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        console.error('VOC 수정 실패:', updateError.message);
        return { data: null, error: updateError.message };
      }

      // 상태 변경 시 실명 작성자에게 notification
      if (updates.status && data.author_id) {
        try {
          await supabase.from('notifications').insert({
            user_id: data.author_id,
            type: 'voc_status',
            urgency: '참고' as const,
            title: `VOC 상태가 '${updates.status}'로 변경되었습니다`,
            body: data.title,
            link: `/voc/${data.id}`,
            channel: 'in_app',
          });
        } catch {
          // notification 실패해도 상태 변경은 정상 완료
        }
      }

      setVocs((prev) => prev.map((v) => (v.id === id ? data : v)));
      return { data, error: null };
    },
    []
  );

  // ④ 비공개 처리 / 공개 전환
  const hideVoc = useCallback(async (id: string, hidden: boolean) => {
    const { data, error: hideError } = await supabase
      .from('vocs')
      .update({ is_hidden: hidden })
      .eq('id', id)
      .select()
      .single();

    if (hideError) {
      console.error('VOC 비공개 처리 실패:', hideError.message);
      return { data: null, error: hideError.message };
    }

    setVocs((prev) => prev.map((v) => (v.id === id ? data : v)));
    return { data, error: null };
  }, []);

  // VOC 소프트 삭제 (본인 또는 관리자)
  const deleteVoc = useCallback(async (id: string) => {
    const { error: deleteError } = await supabase
      .from('vocs')
      .update({ is_deleted: true })
      .eq('id', id);

    if (deleteError) {
      console.error('VOC 삭제 실패:', deleteError.message);
      return { error: deleteError.message };
    }

    setVocs((prev) => prev.filter((v) => v.id !== id));
    return { error: null };
  }, []);

  // 세션 토큰으로 익명 작성자 여부 확인
  const isAnonymousAuthor = useCallback((vocId: string, vocSessionToken: string | null) => {
    if (!vocSessionToken) return false;
    const tokens = JSON.parse(sessionStorage.getItem('voc_tokens') || '{}');
    return tokens[vocId] === vocSessionToken;
  }, []);

  // 같은 팀의 리더/관리자 목록 (담당자 배정용)
  const fetchAssignees = useCallback(async (team: string) => {
    const { data, error } = await withTimeout(
      () => supabase.from('profiles').select('id, name, nickname, role, team').in('role', ['leader', 'admin']).eq('team', team),
      8000, 'assignees',
    );
    if (error) console.error('담당자 조회 실패:', error.message);
    return data ?? [];
  }, []);

  // ===== 댓글 =====

  const fetchVocComments = useCallback(async (vocId: string) => {
    const { data, error: fetchError } = await withTimeout(
      () =>
        supabase
          .from('voc_comments')
          .select('id, voc_id, author_id, content, created_at')
          .eq('voc_id', vocId)
          .order('created_at', { ascending: true }),
      8000,
      'vocComments',
    );

    if (fetchError) {
      console.error('VOC 댓글 조회 실패:', fetchError.message);
      return { comments: [] as VocComment[], profiles: [] as Pick<Profile, 'id' | 'name' | 'nickname' | 'avatar_emoji' | 'avatar_color'>[], error: fetchError.message };
    }

    const comments = (data ?? []) as VocComment[];
    const authorIds = [...new Set(comments.map((c) => c.author_id).filter(Boolean))] as string[];
    let profiles: Pick<Profile, 'id' | 'name' | 'nickname' | 'avatar_emoji' | 'avatar_color'>[] = [];

    if (authorIds.length > 0) {
      const { data: pData } = await withTimeout(
        () => supabase.from('profiles').select('id, name, nickname, avatar_emoji, avatar_color').in('id', authorIds),
        8000,
        'vocCommentProfiles',
      );
      profiles = (pData ?? []) as typeof profiles;
    }

    return { comments, profiles, error: null };
  }, []);

  const addVocComment = useCallback(async (vocId: string, authorId: string, content: string) => {
    const { data, error: insertError } = await supabase
      .from('voc_comments')
      .insert({ voc_id: vocId, author_id: authorId, content })
      .select()
      .single();

    if (insertError) {
      console.error('VOC 댓글 등록 실패:', insertError.message);
      return { data: null, error: insertError.message };
    }
    return { data: data as VocComment, error: null };
  }, []);

  const deleteVocComment = useCallback(async (commentId: string) => {
    const { error: deleteError } = await supabase
      .from('voc_comments')
      .delete()
      .eq('id', commentId);

    if (deleteError) {
      console.error('VOC 댓글 삭제 실패:', deleteError.message);
      return { error: deleteError.message };
    }
    return { error: null };
  }, []);

  return {
    vocs,
    loading,
    error,
    fetchVocs,
    createVoc,
    updateVoc,
    hideVoc,
    deleteVoc,
    isAnonymousAuthor,
    fetchAssignees,
    fetchVocComments,
    addVocComment,
    deleteVocComment,
  };
}

// Realtime: 새 VOC 구독
export function useVocRealtime(onNewVoc: (voc: Voc) => void) {
  useEffect(() => {
    const channel = supabase
      .channel('vocs_realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'vocs' },
        (payload) => {
          onNewVoc(payload.new as Voc);
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.error('VOC Realtime 구독 에러 — 자동 재연결 시도');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onNewVoc]);
}
