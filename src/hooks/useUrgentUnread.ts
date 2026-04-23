import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Notice } from '../types';

/**
 * 로그인 사용자가 아직 읽지 않은 '긴급' 공지 목록을 반환.
 * v2 공지 랜딩 gate에서 사용한다.
 *
 * RLS: notices.select는 authenticated 전체 허용 / notice_reads.select도 authenticated 전체 허용.
 * 여기서는 내 user_id로만 필터해서 서버에서 계산을 최소화한다.
 */
export function useUrgentUnread(userId: string | null) {
  const [urgent, setUrgent] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!userId) {
      setUrgent([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      // 긴급 공지 전체
      const { data: urgentNotices } = await supabase
        .from('notices')
        .select('*')
        .eq('urgency', '긴급')
        .order('pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (!urgentNotices || urgentNotices.length === 0) {
        setUrgent([]);
        return;
      }

      // 내가 읽은 공지 ID 목록
      const { data: reads } = await supabase
        .from('notice_reads')
        .select('notice_id')
        .eq('user_id', userId)
        .in('notice_id', urgentNotices.map((n) => n.id));

      const readIds = new Set((reads ?? []).map((r) => r.notice_id));
      const unread = urgentNotices.filter((n) => !readIds.has(n.id)) as Notice[];
      setUrgent(unread);
    } catch (err) {
      console.error('긴급 공지 조회 실패:', err);
      setUrgent([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { urgent, loading, reload };
}
