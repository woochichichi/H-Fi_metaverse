import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { getDisplayName } from '../../lib/utils';
import { useAuthStore } from '../../stores/authStore';
import type { UserActivity } from '../../types';

const TYPE_ICONS: Record<string, string> = {
  voc_submit: '📞',
  idea_submit: '💡',
  idea_vote: '👍',
  notice_read: '📋',
  event_join: '🎉',
  note_send: '✉️',
  exchange_join: '🤝',
};

const TYPE_LABELS: Record<string, string> = {
  voc_submit: 'VOC를 접수',
  idea_submit: '아이디어를 제출',
  idea_vote: '아이디어에 투표',
  notice_read: '공지를 확인',
  event_join: '이벤트에 참여',
  note_send: '쪽지를 전송',
  exchange_join: '인적교류에 참여',
};

interface ActivityWithName extends UserActivity {
  profileName?: string;
}

export default function ActivityTimeline() {
  const { profile: myProfile } = useAuthStore();
  const isAdmin = myProfile?.role === 'admin';
  const [activities, setActivities] = useState<ActivityWithName[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchActivities = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('user_activities')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('활동 조회 실패:', error.message);
      setLoading(false);
      return;
    }

    // user_id가 있는 활동에 대해 이름 조회
    const userIds = [...new Set((data ?? []).filter((a) => a.user_id).map((a) => a.user_id!))];

    let nameMap = new Map<string, string>();
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, nickname')
        .in('id', userIds);
      (profiles ?? []).forEach((p) => nameMap.set(p.id, getDisplayName(p, isAdmin)));
    }

    const withNames: ActivityWithName[] = (data ?? []).map((a) => ({
      ...a,
      profileName: a.user_id ? nameMap.get(a.user_id) : undefined,
    }));

    setActivities(withNames);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchActivities();
    const interval = setInterval(fetchActivities, 30000);
    return () => clearInterval(interval);
  }, [fetchActivities]);

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return '방금 전';
    if (mins < 60) return `${mins}분 전`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}시간 전`;
    return `${Math.floor(hours / 24)}일 전`;
  };

  const getDescription = (a: ActivityWithName) => {
    const who = a.user_id
      ? `${a.profileName || '알 수 없음'}님이`
      : `익명(${a.team})이`;
    const action = TYPE_LABELS[a.activity_type] || '활동';
    return `${who} ${action}했습니다`;
  };

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-bold text-text-primary">최근 활동</h3>

      {loading ? (
        <div className="py-4 text-center text-xs text-text-muted">로딩 중...</div>
      ) : activities.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-2xl">📭</p>
          <p className="mt-2 text-xs text-text-muted">아직 활동이 없습니다</p>
        </div>
      ) : (
        <div className="flex flex-col">
          {activities.map((a, i) => (
            <div
              key={a.id}
              className="flex items-start gap-3 border-l-2 border-white/[.08] py-2.5 pl-4"
              style={{
                borderColor: i === 0 ? 'rgba(108,92,231,.5)' : undefined,
              }}
            >
              <span className="mt-0.5 text-base flex-shrink-0">
                {TYPE_ICONS[a.activity_type] || '📌'}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-text-secondary leading-relaxed">
                  {getDescription(a)}
                </p>
                <p className="mt-0.5 text-[10px] text-text-muted">
                  {timeAgo(a.created_at)} · +{a.points}pt
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
