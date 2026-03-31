import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { withTimeout } from '../lib/utils';
import { ACTIVITY_POINTS } from '../lib/constants';
import type { Notice, Profile } from '../types';
import type { UrgencyLevel, NoticeCategory } from '../lib/constants';

export interface NoticeFilters {
  urgency?: UrgencyLevel | null;
  category?: NoticeCategory | null;
  sort?: 'newest' | 'oldest';
}

export function useNotices() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  const fetchNotices = useCallback(async (filters: NoticeFilters = {}) => {
    setLoading(true);
    setError(null);

    try {
      const buildQuery = () => {
        let q = supabase.from('notices').select('*');
        if (filters.urgency) q = q.eq('urgency', filters.urgency);
        if (filters.category) q = q.eq('category', filters.category);
        const asc = filters.sort === 'oldest';
        return q.order('pinned', { ascending: false }).order('created_at', { ascending: asc });
      };

      const { data, error: fetchError } = await withTimeout(buildQuery, 8000, 'notices');

      if (fetchError) throw fetchError;
      setNotices(data ?? []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '데이터를 불러올 수 없습니다';
      console.error('공지 조회 실패:', msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  // 현재 사용자의 읽음 상태 조회
  const fetchMyReads = useCallback(async (userId: string) => {
    const { data, error } = await withTimeout(
      () => supabase.from('notice_reads').select('notice_id').eq('user_id', userId),
      8000, 'myReads',
    );
    if (error) console.error('읽음 상태 조회 실패:', error.message);

    const ids = new Set((data ?? []).map((r) => r.notice_id));
    setReadIds(ids);
    return ids;
  }, []);

  const createNotice = useCallback(
    async (input: {
      title: string;
      content: string;
      urgency: UrgencyLevel;
      category: NoticeCategory;
      pinned: boolean;
      unit?: string | null;
      team?: string | null;
      attachment_urls?: string[];
      author_id: string;
    }) => {
      const { data, error: insertError } = await supabase
        .from('notices')
        .insert({
          author_id: input.author_id,
          title: input.title,
          content: input.content,
          urgency: input.urgency,
          category: input.category,
          pinned: input.pinned,
          unit: input.unit ?? null,
          team: input.team ?? null,
          attachment_urls: input.attachment_urls ?? null,
        })
        .select()
        .single();

      if (insertError) {
        console.error('공지 등록 실패:', insertError.message);
        return { data: null, error: insertError.message };
      }

      // 대상 유저에게 notification 생성 (팀 공지면 같은 팀만)
      if (data) {
        try {
          let profileQuery = supabase
            .from('profiles')
            .select('id')
            .neq('id', input.author_id);
          if (input.team) {
            profileQuery = profileQuery.eq('team', input.team);
          }
          const { data: allProfiles } = await profileQuery;

          if (allProfiles && allProfiles.length > 0) {
            const notifications = allProfiles.map((p) => ({
              user_id: p.id,
              type: 'new_notice',
              urgency: input.urgency,
              title: `새 공지: ${data.title}`,
              body: data.content.slice(0, 100),
              link: `/notice/${data.id}`,
              channel: 'in_app',
            }));

            await supabase.from('notifications').insert(notifications);
          }
        } catch {
          // notification 실패해도 공지 등록은 정상 완료
        }
      }

      return { data, error: null };
    },
    []
  );

  const markAsRead = useCallback(
    async (noticeId: string, userId: string) => {
      if (readIds.has(noticeId)) return;

      // 낙관적 업데이트
      setReadIds((prev) => new Set(prev).add(noticeId));

      const { error } = await supabase
        .from('notice_reads')
        .insert({ notice_id: noticeId, user_id: userId, read_at: new Date().toISOString() });

      // 이미 읽은 경우 (unique constraint) 무시
      if (error && !error.message.includes('duplicate')) {
        console.error('읽음 처리 실패:', error.message);
      }

      // user_activities 기록 (트리거 미커버 항목)
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('team')
          .eq('id', userId)
          .single();
        if (profile) {
          await supabase.from('user_activities').insert({
            user_id: userId,
            team: profile.team,
            activity_type: 'notice_read',
            points: ACTIVITY_POINTS.notice_read,
            ref_id: noticeId,
          });
        }
      } catch {
        // 활동 기록 실패해도 읽음 처리는 정상 완료
      }
    },
    [readIds]
  );

  // 특정 공지의 읽음 현황 (리더용)
  const fetchReadStatus = useCallback(
    async (noticeId: string): Promise<{ readers: Profile[]; total: number }> => {
      const { data, error } = await withTimeout(
        () => supabase.from('notice_reads').select('user_id').eq('notice_id', noticeId),
        8000, 'readStatus',
      );

      if (error || !data) return { readers: [], total: 0 };

      const userIds = data.map((r) => r.user_id);
      if (userIds.length === 0) return { readers: [], total: 0 };

      const { data: profiles } = await withTimeout(
        () => supabase.from('profiles').select('*').in('id', userIds),
        8000, 'readStatusProfiles',
      );

      return { readers: (profiles as Profile[]) ?? [], total: userIds.length };
    },
    []
  );

  // 안읽은 공지 수 (알림 벨용)
  const fetchUnreadCount = useCallback(async (userId: string): Promise<number> => {
    const { count: totalCount } = await withTimeout(
      () => supabase.from('notices').select('*', { count: 'exact', head: true }),
      8000, 'noticeCount',
    );

    const { count: readCount } = await withTimeout(
      () => supabase.from('notice_reads').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      8000, 'readCount',
    );

    return (totalCount ?? 0) - (readCount ?? 0);
  }, []);

  return {
    notices,
    loading,
    error,
    readIds,
    fetchNotices,
    fetchMyReads,
    createNotice,
    markAsRead,
    fetchReadStatus,
    fetchUnreadCount,
  };
}
