import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { useMetaverseStore } from '../stores/metaverseStore';
import { useUiStore } from '../stores/uiStore';
import type { RoomId } from '../lib/constants';

const BROADCAST_INTERVAL = 150; // ms

// 채널 ref를 모듈 레벨에서 공유 (ChatInput에서 접근)
let sharedChannel: ReturnType<typeof supabase.channel> | null = null;

export function sendChatMessage(message: string) {
  const { user, profile } = useAuthStore.getState();
  if (!sharedChannel || !user?.id || !message.trim()) return;
  const bubble = {
    userId: user.id,
    name: profile?.nickname || profile?.name || '???',
    message: message.trim(),
    team: profile?.team || '',
    timestamp: Date.now(),
  };
  sharedChannel.send({ type: 'broadcast', event: 'chat', payload: bubble });
  useMetaverseStore.getState().addChatBubble({ ...bubble, id: crypto.randomUUID() });
}

export default function usePlayerSync() {
  const { profile, user } = useAuthStore();
  const { currentRoom, playerPosition } =
    useMetaverseStore();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const lastSentRef = useRef(0);
  const prevOnlineIdsRef = useRef<Set<string>>(new Set());

  // playerPosition 변경 시 throttled broadcast
  useEffect(() => {
    const now = Date.now();
    if (now - lastSentRef.current < BROADCAST_INTERVAL) return;
    if (!channelRef.current || !user?.id) return;
    lastSentRef.current = now;

    channelRef.current.send({
      type: 'broadcast',
      event: 'position',
      payload: {
        userId: user.id,
        name: profile?.nickname || profile?.name || '???',
        team: profile?.team || '',
        room: currentRoom,
        x: playerPosition.x,
        y: playerPosition.y,
        moodEmoji: profile?.mood_emoji || undefined,
      },
    });
  }, [playerPosition, user?.id, profile?.nickname, profile?.name, profile?.team, profile?.mood_emoji, currentRoom]);

  // 채널 구독 (방 변경 시 재구독)
  useEffect(() => {
    if (!user?.id) return;

    useMetaverseStore.getState().clearOtherPlayers();

    const channel = supabase.channel(`room-${currentRoom}`, {
      config: { presence: { key: user.id } },
    });

    // Presence: 접속/퇴장 감지 + 새 유저 알림
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const onlineIds = Object.keys(state);
      useMetaverseStore.getState().setOnlineUsers(onlineIds);

      // 이전 목록과 비교하여 새로 접속한 유저 감지
      const prev = prevOnlineIdsRef.current;
      if (prev.size > 0) {
        const newUsers = onlineIds.filter((id) => !prev.has(id) && id !== user?.id);
        if (newUsers.length > 0) {
          // presence state에서 이름 추출
          const names = newUsers.map((id) => {
            const presences = state[id] as Array<{ name?: string }> | undefined;
            return presences?.[0]?.name || '알 수 없음';
          });
          const msg = names.length === 1
            ? `🟢 ${names[0]}님이 접속했습니다`
            : `🟢 ${names[0]}님 외 ${names.length - 1}명이 접속했습니다`;
          useUiStore.getState().addToast(msg, 'info');
        }
      }
      prevOnlineIdsRef.current = new Set(onlineIds);
    });

    channel.on('presence', { event: 'leave' }, ({ key }) => {
      useMetaverseStore.getState().removeOtherPlayer(key);
    });

    // Broadcast: 위치 수신
    channel.on('broadcast', { event: 'position' }, ({ payload }) => {
      if (payload.userId === user.id) return;
      if (payload.room !== useMetaverseStore.getState().currentRoom) return;

      useMetaverseStore.getState().updateOtherPlayer({
        userId: payload.userId,
        name: payload.name,
        team: payload.team,
        room: payload.room as RoomId,
        x: 0,
        y: 0,
        targetX: payload.x,
        targetY: payload.y,
        moodEmoji: payload.moodEmoji,
      });
    });

    // Broadcast: 채팅 수신
    channel.on('broadcast', { event: 'chat' }, ({ payload }) => {
      if (payload.userId === user.id) return;
      useMetaverseStore.getState().addChatBubble({
        id: crypto.randomUUID(),
        userId: payload.userId,
        message: payload.message,
        team: payload.team || '',
        timestamp: payload.timestamp,
      });
    });

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        const p = useAuthStore.getState().profile;
        await channel.track({
          user_id: user.id,
          name: p?.nickname || p?.name || '???',
          team: p?.team || '',
          room: currentRoom,
        });
      }
    });

    channelRef.current = channel;
    sharedChannel = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
      sharedChannel = null;
      prevOnlineIdsRef.current = new Set();
    };
  }, [user?.id, currentRoom]);

  return { sendChat: useCallback((msg: string) => sendChatMessage(msg), []) };
}
