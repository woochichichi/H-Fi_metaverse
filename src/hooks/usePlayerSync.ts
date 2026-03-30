import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { useMetaverseStore } from '../stores/metaverseStore';
import type { RoomId } from '../lib/constants';

const BROADCAST_INTERVAL = 150; // ms

export default function usePlayerSync() {
  const { profile, user } = useAuthStore();
  const { currentRoom, playerPosition } =
    useMetaverseStore();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const lastSentRef = useRef(0);

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

    // Presence: 접속/퇴장 감지
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const onlineIds = Object.keys(state);
      useMetaverseStore.getState().setOnlineUsers(onlineIds);
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
        x: 0, // lerp에서 처리
        y: 0,
        targetX: payload.x,
        targetY: payload.y,
        moodEmoji: payload.moodEmoji,
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

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [user?.id, currentRoom]);

}
