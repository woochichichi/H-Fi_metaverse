import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { withTimeout } from '../lib/utils';
import { ROOMS_DATA, TEAM_TO_ROOM } from '../lib/constants';
import type { RoomId } from '../lib/constants';

/** zone → 테이블 + 팀 필터 매핑 */
const ZONE_TABLE_MAP: Record<string, { table: string; teamCol?: string }> = {
  voc: { table: 'vocs', teamCol: undefined },       // 광장: 전체
  idea: { table: 'ideas', teamCol: undefined },      // 광장: 전체
  gathering: { table: 'gatherings', teamCol: undefined }, // 광장: 전체
};

function getZoneTableInfo(zoneId: string): { table: string; teamCol?: string } | null {
  if (ZONE_TABLE_MAP[zoneId]) return ZONE_TABLE_MAP[zoneId];
  if (zoneId.endsWith('-notice')) return { table: 'notices', teamCol: 'team' };
  return null; // lobby, kpi, game 등은 새글 알림 대상 아님
}

/** 각 존에 새 글이 있는지 체크 결과 */
export type ZoneAlertMap = Record<string, boolean>;
/** 방 단위로 묶은 결과 */
export type RoomAlertMap = Record<RoomId, boolean>;

export function useZoneAlerts() {
  const [zoneAlerts, setZoneAlerts] = useState<ZoneAlertMap>({});
  const [loading, setLoading] = useState(false);

  const checkAlerts = useCallback(async (userId: string, userTeam: string) => {
    setLoading(true);
    try {
      // 1) 내 zone_visits 가져오기
      const { data: visits } = await withTimeout(
        supabase.from('zone_visits').select('zone_id, last_seen_at').eq('user_id', userId)
      );
      const visitMap = new Map<string, string>();
      (visits ?? []).forEach((v: { zone_id: string; last_seen_at: string }) => {
        visitMap.set(v.zone_id, v.last_seen_at);
      });

      // 2) 체크 대상 존 목록 (내 팀 방 + 광장)
      const myRoom = TEAM_TO_ROOM[userTeam] || 'stock';
      const targetRooms: RoomId[] = [myRoom, 'plaza'];
      const targetZones: { zoneId: string; table: string; teamCol?: string }[] = [];

      for (const roomId of targetRooms) {
        const room = ROOMS_DATA[roomId];
        for (const zone of room.zones) {
          const info = getZoneTableInfo(zone.id);
          if (!info) continue;
          targetZones.push({ zoneId: zone.id, ...info });
        }
      }

      // 3) 각 존별로 last_seen_at 이후 새 글 존재 여부 체크
      const alerts: ZoneAlertMap = {};
      const queries = targetZones.map(async ({ zoneId, table, teamCol }) => {
        const lastSeen = visitMap.get(zoneId) || '1970-01-01T00:00:00Z';
        let q = supabase.from(table).select('id', { count: 'exact', head: true })
          .gt('created_at', lastSeen);

        // 팀 필터: notice는 내 팀 or team=null(전사 공지)
        if (teamCol) {
          q = q.or(`${teamCol}.eq.${userTeam},${teamCol}.is.null`);
        }
        // vocs에서 삭제된 건 제외
        if (table === 'vocs') {
          q = q.eq('is_deleted', false);
        }

        const { count } = await withTimeout(q);
        alerts[zoneId] = (count ?? 0) > 0;
      });

      await Promise.all(queries);
      setZoneAlerts(alerts);
    } catch {
      // 실패 시 빈 상태 유지
    } finally {
      setLoading(false);
    }
  }, []);

  /** 존 진입 시 last_seen_at 갱신 */
  const markZoneVisited = useCallback(async (userId: string, zoneId: string) => {
    // 즉시 UI 반영
    setZoneAlerts((prev) => ({ ...prev, [zoneId]: false }));

    await supabase.from('zone_visits').upsert(
      { user_id: userId, zone_id: zoneId, last_seen_at: new Date().toISOString() },
      { onConflict: 'user_id,zone_id' }
    );
  }, []);

  /** 방 단위 알림 집계 */
  const getRoomAlerts = useCallback((): RoomAlertMap => {
    const result = { stock: false, life: false, shield: false, plaza: false } as RoomAlertMap;
    for (const [roomId, room] of Object.entries(ROOMS_DATA)) {
      result[roomId as RoomId] = room.zones.some((z) => zoneAlerts[z.id]);
    }
    return result;
  }, [zoneAlerts]);

  return { zoneAlerts, loading, checkAlerts, markZoneVisited, getRoomAlerts };
}
