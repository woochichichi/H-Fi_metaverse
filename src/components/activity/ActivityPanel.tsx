import { useState, useEffect, useCallback } from 'react';
import { Plus, Eye, RefreshCw } from 'lucide-react';
import { useUnitActivities } from '../../hooks/useUnitActivities';
import { useAuthStore } from '../../stores/authStore';
import { useUiStore } from '../../stores/uiStore';
import ActivityCard from './ActivityCard';
import ActivityForm from './ActivityForm';
import LoadMore from '../common/LoadMore';

interface ActivityPanelProps {
  team: string;
  readOnly: boolean;
}

export default function ActivityPanel({ team, readOnly }: ActivityPanelProps) {
  const { profile } = useAuthStore();
  const { addToast } = useUiStore();
  const {
    activities,
    comments,
    loading,
    error,
    fetchActivities,
    createActivity,
    updateActivityStatus,
    toggleReaction,
    fetchComments,
    addComment,
  } = useUnitActivities();

  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [displayCount, setDisplayCount] = useState(20);

  const isLeader = profile?.role === 'admin' || profile?.role === 'director' || profile?.role === 'leader';

  const reload = useCallback(() => {
    fetchActivities(team, profile?.id);
  }, [fetchActivities, team, profile?.id]);

  useEffect(() => {
    reload();
  }, [reload]);

  const handleCreate = async (data: {
    title: string;
    description: string | null;
    category: string | null;
    status: string;
    unit: string | null;
  }) => {
    if (!profile) return;
    try {
      await createActivity({
        author_id: profile.id,
        team,
        ...data,
      });
      addToast('활동이 등록되었습니다', 'success');
      setShowForm(false);
      reload();
    } catch {
      addToast('등록에 실패했습니다', 'error');
    }
  };

  const handleStatusChange = async (activityId: string, status: string) => {
    try {
      await updateActivityStatus(activityId, status);
      reload();
    } catch {
      addToast('상태 변경 실패', 'error');
    }
  };

  const handleToggleReaction = async (activityId: string) => {
    if (!profile) return;
    try {
      await toggleReaction(activityId, profile.id);
    } catch {
      addToast('반응 처리 실패', 'error');
      reload();
    }
  };

  const handleExpandComments = (activityId: string) => {
    if (expandedId === activityId) {
      setExpandedId(null);
    } else {
      setExpandedId(activityId);
      fetchComments(activityId);
    }
  };

  const handleAddComment = async (activityId: string, content: string) => {
    if (!profile) return;
    try {
      await addComment(activityId, profile.id, content);
      fetchComments(activityId);
    } catch {
      addToast('댓글 등록 실패', 'error');
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-text-primary">활동 타임라인</h3>
        <div className="flex items-center gap-2">
          {readOnly && (
            <span className="flex items-center gap-1 rounded-full bg-white/[.06] px-2 py-0.5 text-[10px] text-text-muted">
              <Eye size={10} /> 읽기 전용
            </span>
          )}
          {isLeader && !readOnly && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-1 rounded-lg bg-accent/20 px-2.5 py-1 text-[11px] font-semibold text-accent transition-colors hover:bg-accent/30"
            >
              <Plus size={12} />
              활동 등록
            </button>
          )}
        </div>
      </div>

      {/* 폼 */}
      {showForm && <ActivityForm onSubmit={handleCreate} onCancel={() => setShowForm(false)} />}

      {/* 카드 리스트 */}
      {error ? (
        <div className="flex flex-col items-center justify-center py-8">
          <span className="text-2xl mb-2">⚠️</span>
          <p className="text-xs text-text-muted mb-2">{error}</p>
          <button onClick={reload} className="flex items-center gap-1 rounded-lg bg-accent/20 px-2.5 py-1 text-[11px] font-medium text-accent hover:bg-accent/30">
            <RefreshCw size={12} /> 새로고침
          </button>
        </div>
      ) : loading ? (
        <div className="py-6 text-center text-xs text-text-muted">로딩 중...</div>
      ) : activities.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-2xl">📋</p>
          <p className="mt-2 text-xs text-text-muted">
            {readOnly ? '아직 등록된 활동이 없습니다' : '첫 활동을 등록해보세요!'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {activities.slice(0, displayCount).map((a) => (
            <ActivityCard
              key={a.id}
              activity={a}
              isLeader={isLeader}
              readOnly={readOnly}
              userId={profile?.id}
              comments={expandedId === a.id ? comments : []}
              onToggleReaction={handleToggleReaction}
              onStatusChange={handleStatusChange}
              onExpandComments={handleExpandComments}
              onAddComment={handleAddComment}
              expanded={expandedId === a.id}
            />
          ))}
          <LoadMore current={Math.min(displayCount, activities.length)} total={activities.length} onLoadMore={() => setDisplayCount((c) => c + 20)} />
        </div>
      )}
    </div>
  );
}
