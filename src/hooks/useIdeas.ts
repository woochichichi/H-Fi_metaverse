import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { IdeaWithVotes } from '../types';
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

    let query = supabase.from('idea_with_votes').select('*');

    if (filters.category) {
      query = query.eq('category', filters.category);
    }
    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.sort === 'popular') {
      query = query.order('vote_count', { ascending: false });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    const { data, error: fetchError } = await query;

    if (fetchError) {
      console.error('아이디어 조회 실패:', fetchError.message);
      setError(fetchError.message);
      setLoading(false);
      return;
    }

    setIdeas((data as IdeaWithVotes[]) ?? []);
    setLoading(false);
  }, []);

  const createIdea = useCallback(
    async (input: {
      title: string;
      description: string;
      category: IdeaCategory;
      author_id: string;
    }) => {
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

      if (insertError) {
        console.error('아이디어 등록 실패:', insertError.message);
        return { data: null, error: insertError.message };
      }

      return { data, error: null };
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
    const { data } = await supabase
      .from('idea_votes')
      .select('idea_id')
      .eq('user_id', userId);

    const votedIds = new Set((data ?? []).map((v) => v.idea_id));

    setIdeas((prev) =>
      prev.map((idea) => ({
        ...idea,
        _voted: votedIds.has(idea.id),
      }) as IdeaWithVotes)
    );

    return votedIds;
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
  };
}
