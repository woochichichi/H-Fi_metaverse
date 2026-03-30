import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { withTimeout } from '../lib/utils';
import { ACTIVITY_POINTS } from '../lib/constants';
import type { AnonymousNote } from '../types';
import type { NoteCategory, NoteStatus } from '../lib/constants';

export interface NoteFilters {
  category?: NoteCategory | null;
  status?: NoteStatus | null;
  team?: string | null;
  sort?: 'newest' | 'oldest';
}

export function useNotes() {
  const [notes, setNotes] = useState<AnonymousNote[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 리더/관리자용: 수신 쪽지 목록
  const fetchNotes = useCallback(async (filters: NoteFilters = {}) => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase.from('anonymous_notes').select('*');

      if (filters.category) {
        query = query.eq('category', filters.category);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.team) {
        query = query.eq('team', filters.team);
      }

      query = query.order('created_at', {
        ascending: filters.sort === 'oldest',
      });

      const { data, error: fetchError } = await withTimeout(query);

      if (fetchError) throw fetchError;
      setNotes(data ?? []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '데이터를 불러올 수 없습니다';
      console.error('쪽지 조회 실패:', msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  // 멤버용: 내가 보낸 실명 쪽지 목록
  const fetchMyNotes = useCallback(async (userId: string) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await withTimeout(supabase
        .from('anonymous_notes')
        .select('*')
        .eq('sender_id', userId)
        .order('created_at', { ascending: false }));

      if (fetchError) throw fetchError;
      setNotes(data ?? []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '데이터를 불러올 수 없습니다';
      console.error('내 쪽지 조회 실패:', msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const createNote = useCallback(
    async (input: {
      anonymous: boolean;
      recipient_role: 'leader' | 'admin' | 'team_leaders';
      recipient_team?: string | null;
      category: NoteCategory;
      title: string;
      content: string;
      team: string;
      sender_id?: string | null;
    }) => {
      const sessionToken = input.anonymous ? crypto.randomUUID() : null;

      const { data, error: insertError } = await supabase
        .from('anonymous_notes')
        .insert({
          sender_id: input.anonymous ? null : input.sender_id,
          anonymous: input.anonymous,
          recipient_role: input.recipient_role,
          recipient_team: input.recipient_team ?? null,
          category: input.category,
          title: input.title,
          content: input.content,
          team: input.team,
          session_token: sessionToken,
        })
        .select()
        .single();

      if (insertError) {
        console.error('쪽지 발송 실패:', insertError.message);
        return { data: null, error: insertError.message };
      }

      // 익명 쪽지 → localStorage에 session_token 저장
      if (input.anonymous && data && sessionToken) {
        const tokens = JSON.parse(sessionStorage.getItem('note_tokens') || '{}');
        tokens[data.id] = sessionToken;
        sessionStorage.setItem('note_tokens', JSON.stringify(tokens));
      }

      // 수신 대상 리더에게 notification 생성
      await createNoteNotification(data, input.recipient_role, input.recipient_team ?? null);

      // user_activities 기록 (트리거 미커버 항목)
      try {
        const senderId = input.anonymous ? null : input.sender_id;
        if (senderId) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('team')
            .eq('id', senderId)
            .single();
          if (profile) {
            await supabase.from('user_activities').insert({
              user_id: senderId,
              team: profile.team,
              activity_type: 'note_send',
              points: ACTIVITY_POINTS.note_send,
              ref_id: data.id,
            });
          }
        }
      } catch {
        // 활동 기록 실패해도 쪽지 발송은 정상 완료
      }

      return { data, error: null };
    },
    []
  );

  const updateNoteStatus = useCallback(
    async (id: string, status: NoteStatus) => {
      const { data, error: updateError } = await supabase
        .from('anonymous_notes')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        console.error('쪽지 상태 변경 실패:', updateError.message);
        return { data: null, error: updateError.message };
      }

      setNotes((prev) => prev.map((n) => (n.id === id ? data : n)));
      return { data, error: null };
    },
    []
  );

  // 세션 토큰으로 익명 작성자 여부 확인
  const isAnonymousAuthor = useCallback((noteId: string, noteSessionToken: string | null) => {
    if (!noteSessionToken) return false;
    const tokens = JSON.parse(sessionStorage.getItem('note_tokens') || '{}');
    return tokens[noteId] === noteSessionToken;
  }, []);

  return {
    notes,
    loading,
    error,
    fetchNotes,
    fetchMyNotes,
    createNote,
    updateNoteStatus,
    isAnonymousAuthor,
  };
}

// 수신 대상에게 notification 생성
async function createNoteNotification(
  note: AnonymousNote,
  recipientRole: string,
  recipientTeam: string | null
) {
  // 수신 대상 프로필 조회
  let query = supabase.from('profiles').select('id');

  if (recipientRole === 'admin') {
    query = query.eq('role', 'admin');
  } else if (recipientRole === 'leader') {
    query = query.eq('role', 'leader');
  } else if (recipientRole === 'team_leaders') {
    query = query.in('role', ['admin', 'leader']);
    if (recipientTeam) {
      query = query.eq('team', recipientTeam);
    }
  }

  const { data: recipients } = await query;
  if (!recipients || recipients.length === 0) return;

  const notifications = recipients.map((r) => ({
    user_id: r.id,
    type: 'new_note',
    urgency: '할일' as const,
    title: '새 쪽지가 도착했습니다',
    body: note.title,
    link: `/note/${note.id}`,
    channel: 'in_app',
  }));

  const { error } = await supabase.from('notifications').insert(notifications);
  if (error) {
    console.error('쪽지 알림 생성 실패:', error.message);
  }
}

// Realtime: 새 쪽지 구독
export function useNoteRealtime(onNewNote: (note: AnonymousNote) => void) {
  useEffect(() => {
    const channel = supabase
      .channel('notes_realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'anonymous_notes' },
        (payload) => {
          onNewNote(payload.new as AnonymousNote);
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.error('쪽지 Realtime 구독 에러 — 자동 재연결 시도');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onNewNote]);
}
