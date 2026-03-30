import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { MessageThread } from '../types';

export function useThreads(refType: 'voc' | 'note', refId: string | null) {
  const [messages, setMessages] = useState<MessageThread[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMessages = useCallback(async () => {
    if (!refId) return;
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('message_threads')
        .select('*')
        .eq('ref_type', refType)
        .eq('ref_id', refId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('대화 조회 실패:', error.message);
        return;
      }

      setMessages(data ?? []);
    } catch (err) {
      console.error('대화 로딩 실패:', err);
    } finally {
      setLoading(false);
    }
  }, [refType, refId]);

  const sendMessage = useCallback(
    async (senderRole: 'author' | 'manager', message: string) => {
      if (!refId) return { error: 'ref_id 없음' };

      const { data, error } = await supabase
        .from('message_threads')
        .insert({
          ref_type: refType,
          ref_id: refId,
          sender_role: senderRole,
          message,
        })
        .select()
        .single();

      if (error) {
        console.error('메시지 전송 실패:', error.message);
        return { error: error.message };
      }

      setMessages((prev) => [...prev, data]);
      return { error: null };
    },
    [refType, refId]
  );

  // 초기 로딩
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Realtime 구독
  useEffect(() => {
    if (!refId) return;

    const channel = supabase
      .channel(`threads_${refType}_${refId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'message_threads',
          filter: `ref_id=eq.${refId}`,
        },
        (payload) => {
          const newMsg = payload.new as MessageThread;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.error('Thread Realtime 구독 에러 — 자동 재연결 시도');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refType, refId]);

  return { messages, loading, sendMessage, refetchMessages: fetchMessages };
}
