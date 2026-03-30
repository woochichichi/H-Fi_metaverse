import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { getDisplayName } from '../lib/utils';
import { TEAMS, ACTIVITY_POINTS } from '../lib/constants';
import type { ActivityType } from '../lib/constants';
import type { UserActivity, Profile } from '../types';

export interface TeamStat {
  team: string;
  voc_submit: number;
  idea_submit: number;
  idea_vote: number;
  notice_read: number;
  event_join: number;
  note_send: number;
  exchange_join: number;
  memberCount: number;
}

export interface UserStat {
  userId: string;
  name: string;
  team: string;
  voc_submit: number;
  idea_submit: number;
  idea_vote: number;
  notice_read: number;
  event_join: number;
  note_send: number;
  exchange_join: number;
  totalPoints: number;
}

export interface UserDetailActivity extends UserActivity {
  // 상세 활동 목록용
}

export function useUserActivities() {
  const [teamStats, setTeamStats] = useState<TeamStat[]>([]);
  const [userStats, setUserStats] = useState<UserStat[]>([]);
  const [userDetail, setUserDetail] = useState<UserDetailActivity[]>([]);
  const [loading, setLoading] = useState(false);

  // 기간 필터 생성
  const getPeriodRange = (period: string): { from: string; to: string } => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    if (period === 'month') {
      const from = new Date(year, month, 1).toISOString();
      const to = new Date(year, month + 1, 0, 23, 59, 59).toISOString();
      return { from, to };
    }
    if (period === 'quarter') {
      const q = Math.floor(month / 3);
      const from = new Date(year, q * 3, 1).toISOString();
      const to = new Date(year, q * 3 + 3, 0, 23, 59, 59).toISOString();
      return { from, to };
    }
    // half
    const h = month < 6 ? 0 : 6;
    const from = new Date(year, h, 1).toISOString();
    const to = new Date(year, h + 6, 0, 23, 59, 59).toISOString();
    return { from, to };
  };

  // 팀별 활동 통계
  const fetchTeamStats = useCallback(async (period: string, team?: string) => {
    setLoading(true);
    const { from, to } = getPeriodRange(period);

    let query = supabase
      .from('user_activities')
      .select('*')
      .gte('created_at', from)
      .lte('created_at', to);

    if (team) {
      query = query.eq('team', team);
    }

    const { data: activities, error } = await query;
    if (error) {
      console.error('활동 통계 조회 실패:', error.message);
      setLoading(false);
      return;
    }

    // 프로필에서 팀별 인원수
    const { data: profiles } = await supabase.from('profiles').select('id, team');

    const stats: TeamStat[] = TEAMS.map((t) => {
      const teamActivities = (activities ?? []).filter((a) => a.team === t);
      const memberCount = (profiles ?? []).filter((p) => p.team === t).length;
      const countByType = (type: string) =>
        teamActivities.filter((a) => a.activity_type === type).length;

      return {
        team: t,
        voc_submit: countByType('voc_submit'),
        idea_submit: countByType('idea_submit'),
        idea_vote: countByType('idea_vote'),
        notice_read: countByType('notice_read'),
        event_join: countByType('event_join'),
        note_send: countByType('note_send'),
        exchange_join: countByType('exchange_join'),
        memberCount: memberCount || 1,
      };
    });

    if (team) {
      setTeamStats(stats.filter((s) => s.team === team));
    } else {
      setTeamStats(stats);
    }
    setLoading(false);
  }, []);

  // 개인별 활동 통계
  const fetchUserStats = useCallback(async (period: string, team?: string) => {
    setLoading(true);
    const { from, to } = getPeriodRange(period);

    let activityQuery = supabase
      .from('user_activities')
      .select('*')
      .gte('created_at', from)
      .lte('created_at', to)
      .not('user_id', 'is', null);

    if (team) {
      activityQuery = activityQuery.eq('team', team);
    }

    const { data: activities, error } = await activityQuery;
    if (error) {
      console.error('개인 통계 조회 실패:', error.message);
      setLoading(false);
      return;
    }

    let profileQuery = supabase.from('profiles').select('*');
    if (team) {
      profileQuery = profileQuery.eq('team', team);
    }
    const { data: profiles } = await profileQuery;

    const userMap = new Map<string, UserStat>();

    // 프로필 기반 초기화 — 평가 대시보드는 리더/관리자 전용이므로 별명(실명) 표시
    (profiles ?? []).forEach((p: Profile) => {
      userMap.set(p.id, {
        userId: p.id,
        name: getDisplayName(p, true),
        team: p.team,
        voc_submit: 0,
        idea_submit: 0,
        idea_vote: 0,
        notice_read: 0,
        event_join: 0,
        note_send: 0,
        exchange_join: 0,
        totalPoints: 0,
      });
    });

    // 활동 집계
    (activities ?? []).forEach((a) => {
      if (!a.user_id) return;
      const stat = userMap.get(a.user_id);
      if (stat) {
        const type = a.activity_type as keyof Omit<UserStat, 'userId' | 'name' | 'team' | 'totalPoints'>;
        if (type in stat && type !== ('totalPoints' as string)) {
          (stat[type] as number) += 1;
        }
        stat.totalPoints += a.points;
      }
    });

    setUserStats(Array.from(userMap.values()).sort((a, b) => b.totalPoints - a.totalPoints));
    setLoading(false);
  }, []);

  // 개인 활동 상세
  const fetchUserDetail = useCallback(async (userId: string, period: string) => {
    const { from, to } = getPeriodRange(period);
    const { data, error } = await supabase
      .from('user_activities')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', from)
      .lte('created_at', to)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('상세 활동 조회 실패:', error.message);
      return;
    }
    setUserDetail(data ?? []);
  }, []);

  // 리더 수동 활동 기록
  const manualLogActivity = useCallback(
    async (userId: string, team: string, type: ActivityType, memo?: string) => {
      const { error } = await supabase.from('user_activities').insert({
        user_id: userId,
        team,
        activity_type: type,
        points: ACTIVITY_POINTS[type],
        ref_id: memo || null,
      });
      if (error) {
        console.error('수동 기록 실패:', error.message);
        return { error: error.message };
      }
      return { error: null };
    },
    []
  );

  return {
    teamStats,
    userStats,
    userDetail,
    loading,
    fetchTeamStats,
    fetchUserStats,
    fetchUserDetail,
    manualLogActivity,
  };
}
