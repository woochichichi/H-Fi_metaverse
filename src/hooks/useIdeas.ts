import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { withTimeout } from '../lib/utils';
import type { IdeaWithVotes, IdeaComment, Profile } from '../types';
import type { IdeaCategory, IdeaStatus } from '../lib/constants';

export interface IdeaFilters {
  category?: IdeaCategory | null;
  status?: IdeaStatus | null;
  sort?: 'newest' | 'popular';
}

export function useIdeas() {
  const [ideas, setIdeas] = useState<IdeaWithVotes[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchIdeas = useCallback(async (filters: IdeaFilters = {}) => {
    setLoading(true);
    setError(null);

    try {
      const buildQuery = () => {
        let q = supabase.from('idea_with_votes').select('*');
        if (filters.category) q = q.eq('category', filters.category);
        if (filters.status) q = q.eq('status', filters.status);
        return filters.sort === 'popular'
          ? q.order('vote_count', { ascending: false })
          : q.order('created_at', { ascending: false });
      };

      const { data, error: fetchError } = await withTimeout(buildQuery, 8000, 'ideas');

      if (fetchError) throw fetchError;
      setIdeas((data as IdeaWithVotes[]) ?? []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '데이터를 불러올 수 없습니다';
      console.error('아이디어 조회 실패:', msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const createIdea = useCallback(
    async (input: {
      title: string;
      description: string;
      category: IdeaCategory;
      author_id: string;
    }) => {
      console.log('[createIdea] 시작:', input);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      try {
        const { data, error: insertError } = await supabase
          .from('ideas')
          .insert({
            author_id: input.author_id,
            title: input.title,
            description: input.description,
            category: input.category,
          })
          .select()
          .single();

        clearTimeout(timeout);
        console.log('[createIdea] 응답:', { data, error: insertError });

        if (insertError) {
          console.error('아이디어 등록 실패:', insertError.message);
          return { data: null, error: insertError.message };
        }

        // 전체 리더/관리자에게 새 아이디어 알림
        if (data) {
          try {
            const { data: leaders } = await supabase
              .from('profiles')
              .select('id')
              .in('role', ['leader', 'admin']);
            if (leaders && leaders.length > 0) {
              const notifications = leaders
                .filter((l) => l.id !== input.author_id)
                .map((l) => ({
                  user_id: l.id,
                  type: 'new_idea',
                  urgency: '참고' as const,
                  title: `💡 새 아이디어: ${data.title}`,
                  body: (data.description ?? '').slice(0, 100),
                  link: `/idea/${data.id}`,
                  channel: 'in_app',
                }));
              if (notifications.length > 0) {
                await supabase.from('notifications').insert(notifications);
              }
            }
          } catch {
            // notification 실패해도 아이디어 등록은 정상 완료
          }
        }

        return { data, error: null };
      } catch (err) {
        clearTimeout(timeout);
        const msg = err instanceof DOMException && err.name === 'AbortError'
          ? '요청 시간이 초과되었습니다 (10초)'
          : err instanceof Error ? err.message : '알 수 없는 오류';
        console.error('[createIdea] 예외:', msg);
        return { data: null, error: msg };
      }
    },
    []
  );

  const toggleVote = useCallback(
    async (ideaId: string, userId: string) => {
      // 낙관적 업데이트: 즉시 UI 반영
      setIdeas((prev) =>
        prev.map((idea) => {
          if (idea.id !== ideaId) return idea;
          const hasVoted = (idea as IdeaWithVotes & { _voted?: boolean })._voted;
          return {
            ...idea,
            vote_count: hasVoted ? idea.vote_count - 1 : idea.vote_count + 1,
            _voted: !hasVoted,
          } as IdeaWithVotes;
        })
      );

      // 먼저 기존 투표 확인
      const { data: existing } = await supabase
        .from('idea_votes')
        .select('idea_id')
        .eq('idea_id', ideaId)
        .eq('user_id', userId)
        .maybeSingle();

      if (existing) {
        // 투표 취소
        const { error } = await supabase
          .from('idea_votes')
          .delete()
          .eq('idea_id', ideaId)
          .eq('user_id', userId);

        if (error) {
          console.error('투표 취소 실패:', error.message);
          // 롤백
          setIdeas((prev) =>
            prev.map((idea) =>
              idea.id === ideaId
                ? { ...idea, vote_count: idea.vote_count + 1, _voted: true } as IdeaWithVotes
                : idea
            )
          );
          return { voted: true, error: error.message };
        }
        return { voted: false, error: null };
      } else {
        // 투표
        const { error } = await supabase
          .from('idea_votes')
          .insert({ idea_id: ideaId, user_id: userId, created_at: new Date().toISOString() });

        if (error) {
          console.error('투표 실패:', error.message);
          // 롤백
          setIdeas((prev) =>
            prev.map((idea) =>
              idea.id === ideaId
                ? { ...idea, vote_count: idea.vote_count - 1, _voted: false } as IdeaWithVotes
                : idea
            )
          );
          return { voted: false, error: error.message };
        }
        return { voted: true, error: null };
      }
    },
    []
  );

  const updateIdeaStatus = useCallback(
    async (id: string, status: IdeaStatus) => {
      const { data, error: updateError } = await supabase
        .from('ideas')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        console.error('아이디어 상태 변경 실패:', updateError.message);
        return { data: null, error: updateError.message };
      }

      // 상태 변경 시 작성자에게 notification
      if (data.author_id) {
        try {
          await supabase.from('notifications').insert({
            user_id: data.author_id,
            type: 'idea_status',
            urgency: '할일' as const,
            title: `💡 아이디어 '${data.title}'이 ${status}되었습니다`,
            body: (data.description ?? '').slice(0, 100),
            link: `/idea/${data.id}`,
            channel: 'in_app',
          });
        } catch {
          // notification 실패해도 상태 변경은 정상 완료
        }
      }

      setIdeas((prev) =>
        prev.map((idea) => (idea.id === id ? { ...idea, status: data.status } : idea))
      );
      return { data, error: null };
    },
    []
  );

  // 사용자 투표 여부 일괄 조회
  const fetchUserVotes = useCallback(async (userId: string) => {
    const { data, error } = await withTimeout(
      () => supabase.from('idea_votes').select('idea_id').eq('user_id', userId),
      8000, 'userVotes',
    );
    if (error) console.error('투표 조회 실패:', error.message);

    const votedIds = new Set((data ?? []).map((v) => v.idea_id));

    setIdeas((prev) =>
      prev.map((idea) => ({
        ...idea,
        _voted: votedIds.has(idea.id),
      }) as IdeaWithVotes)
    );

    return votedIds;
  }, []);

  // ===== 댓글 =====

  const fetchIdeaComments = useCallback(async (ideaId: string) => {
    const { data, error: fetchError } = await withTimeout(
      () =>
        supabase
          .from('idea_comments')
          .select('id, idea_id, author_id, content, created_at')
          .eq('idea_id', ideaId)
          .order('created_at', { ascending: true }),
      8000,
      'ideaComments',
    );

    if (fetchError) {
      return { comments: [] as IdeaComment[], profiles: [] as Pick<Profile, 'id' | 'name' | 'nickname' | 'avatar_emoji' | 'avatar_color'>[], error: fetchError.message };
    }

    const comments = (data ?? []) as IdeaComment[];
    const authorIds = [...new Set(comments.map((c) => c.author_id).filter(Boolean))] as string[];
    let profiles: Pick<Profile, 'id' | 'name' | 'nickname' | 'avatar_emoji' | 'avatar_color'>[] = [];

    if (authorIds.length > 0) {
      const { data: pData } = await withTimeout(
        () => supabase.from('profiles').select('id, name, nickname, avatar_emoji, avatar_color').in('id', authorIds),
        8000,
        'ideaCommentProfiles',
      );
      profiles = (pData ?? []) as typeof profiles;
    }

    return { comments, profiles, error: null };
  }, []);

  const addIdeaComment = useCallback(async (ideaId: string, authorId: string, content: string) => {
    const { data, error: insertError } = await supabase
      .from('idea_comments')
      .insert({ idea_id: ideaId, author_id: authorId, content })
      .select()
      .single();

    if (insertError) {
      return { data: null, error: insertError.message };
    }
    return { data: data as IdeaComment, error: null };
  }, []);

  const deleteIdeaComment = useCallback(async (commentId: string) => {
    const { error: deleteError } = await supabase
      .from('idea_comments')
      .delete()
      .eq('id', commentId);

    if (deleteError) {
      return { error: deleteError.message };
    }
    return { error: null };
  }, []);

  // 아이디어별 댓글 수 일괄 조회
  const fetchCommentCounts = useCallback(async (ideaIds: string[]) => {
    if (ideaIds.length === 0) return new Map<string, number>();
    const { data } = await withTimeout(
      () => supabase.from('idea_comments').select('idea_id').in('idea_id', ideaIds),
      8000,
      'ideaCommentCounts',
    );
    const counts = new Map<string, number>();
    (data ?? []).forEach((r: { idea_id: string }) => {
      counts.set(r.idea_id, (counts.get(r.idea_id) ?? 0) + 1);
    });
    return counts;
  }, []);

  const deleteIdea = useCallback(async (id: string) => {
    // idea_votes, idea_comments는 FK CASCADE로 자동 삭제
    const { data, error: deleteError } = await supabase
      .from('ideas')
      .delete()
      .eq('id', id)
      .select('id');

    if (deleteError) {
      console.error('아이디어 삭제 실패:', deleteError.message);
      return { error: deleteError.message };
    }
    if (!data || data.length === 0) {
      return { error: '삭제 권한이 없거나 이미 삭제된 아이디어입니다' };
    }

    // 관련 알림 정리 (실패해도 무시)
    supabase.from('notifications').delete().eq('link', `/idea/${id}`).then();

    setIdeas((prev) => prev.filter((i) => i.id !== id));
    return { error: null };
  }, []);

  return {
    ideas,
    loading,
    error,
    fetchIdeas,
    createIdea,
    toggleVote,
    updateIdeaStatus,
    fetchUserVotes,
    fetchIdeaComments,
    addIdeaComment,
    deleteIdeaComment,
    deleteIdea,
    fetchCommentCounts,
  };
}
