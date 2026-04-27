import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { withTimeout } from '../lib/utils';
import type { Notification } from '../types';

// 시급성 순서: 긴급 → 할일 → 참고
const URGENCY_ORDER: Record<string, number> = {
  '긴급': 0,
  '할일': 1,
  '참고': 2,
};

export function useInbox(userId: string | null) {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  // 훅 인스턴스마다 고유 채널 — 동일 userId로 여러 곳(TopBar+MobileHome)에서 호출돼도
  // Supabase 채널 레지스트리 공유로 인한 on-after-subscribe 충돌 방지
  const [channelSuffix] = useState(() => Math.random().toString(36).slice(2, 8));

  const fetchInbox = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchErr } = await withTimeout(
        () => supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        8000, 'inbox',
      );

      if (fetchErr) {
        setError('알림을 불러오지 못했습니다');
        return;
      }

      // 시급성 순 + 시간 역순 정렬
      const sorted = (data ?? []).sort((a, b) => {
        const urgA = URGENCY_ORDER[a.urgency] ?? 9;
        const urgB = URGENCY_ORDER[b.urgency] ?? 9;
        if (urgA !== urgB) return urgA - urgB;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      setItems(sorted);
      setUnreadCount(sorted.filter((n) => !n.read).length);
    } catch {
      setError('알림을 불러오지 못했습니다');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const markAsRead = useCallback(
    async (id: string) => {
      // 낙관적 업데이트
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));

      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id);

      if (error) {
        console.error('읽음 처리 실패:', error.message);
      }
    },
    []
  );

  const markAllAsRead = useCallback(async () => {
    if (!userId) return;

    // 낙관적 업데이트
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) {
      console.error('전체 읽음 실패:', error.message);
    }
  }, [userId]);

  // 초기 로딩
  useEffect(() => {
    fetchInbox();
  }, [fetchInbox]);

  // Realtime 구독: 새 notification 시 자동 갱신
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`inbox_${userId}_${channelSuffix}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotif = payload.new as Notification;
          setItems((prev) => {
            if (prev.some((n) => n.id === newNotif.id)) return prev;
            // 새 항목을 시급성 순서에 맞게 삽입
            const updated = [newNotif, ...prev];
            return updated.sort((a, b) => {
              const urgA = URGENCY_ORDER[a.urgency] ?? 9;
              const urgB = URGENCY_ORDER[b.urgency] ?? 9;
              if (urgA !== urgB) return urgA - urgB;
              return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            });
          });
          setUnreadCount((prev) => prev + 1);
        }
      )
      .on(
        'postgres_changes',
        {
          // UPDATE 도 구독 — 다른 hook 인스턴스(InboxPanel)에서 read=true 로 바꾸면
          // TopBar 의 본 인스턴스도 자동 동기화되어 unread 배지가 새로고침 없이 사라짐.
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const updated = payload.new as Notification;
          const before = payload.old as Partial<Notification>;
          // items 갱신
          setItems((prev) => {
            const idx = prev.findIndex((n) => n.id === updated.id);
            if (idx < 0) return prev;
            const next = prev.slice();
            next[idx] = { ...next[idx], ...updated };
            return next;
          });
          // read 토글이 일어난 경우만 카운트 조정 (다른 컬럼 UPDATE 영향 없음).
          // payload.old 가 REPLICA IDENTITY 설정에 따라 일부만 올 수 있어 'before.read' 가
          // undefined 일 수 있음 — 그 경우 fetchInbox 로 안전하게 재계산.
          if (typeof before.read === 'boolean') {
            if (before.read === false && updated.read === true) {
              setUnreadCount((c) => Math.max(0, c - 1));
            } else if (before.read === true && updated.read === false) {
              setUnreadCount((c) => c + 1);
            }
          } else {
            // payload.old 에 read 가 없으면 안전하게 재계산.
            void fetchInbox();
          }
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.error('Inbox Realtime 구독 에러 — 자동 재연결 시도');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, channelSuffix]);

  return { items, loading, error, unreadCount, fetchInbox, markAsRead, markAllAsRead };
}
