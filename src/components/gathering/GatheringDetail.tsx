import { useState, useEffect } from 'react';
import { ArrowLeft, Users, Calendar, Clock, Link2, LogIn, LogOut, Lock } from 'lucide-react';
import { useGatherings } from '../../hooks/useGatherings';
import { useAuthStore } from '../../stores/authStore';
import { useUiStore } from '../../stores/uiStore';
import { GATHERING_STATUS_LABELS } from '../../lib/constants';
import type { Gathering, Profile } from '../../types';

interface GatheringDetailProps {
  gathering: Gathering;
  joined: boolean;
  isAuthor: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

type MemberProfile = Pick<Profile, 'id' | 'name' | 'nickname' | 'team' | 'avatar_emoji' | 'avatar_color'>;

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function GatheringDetail({ gathering, joined, isAuthor, onClose, onRefresh }: GatheringDetailProps) {
  const { user } = useAuthStore();
  const { addToast } = useUiStore();
  const { joinGathering, leaveGathering, closeGathering, fetchMembers } = useGatherings();

  const [members, setMembers] = useState<MemberProfile[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [acting, setActing] = useState(false);

  const isClosed = gathering.status !== 'recruiting';
  const canSeeMembers = isClosed && (joined || isAuthor);
  const canSeeContact = isClosed && (joined || isAuthor);

  // 마감 후 참여자 목록 로드
  useEffect(() => {
    if (!canSeeMembers) return;
    setLoadingMembers(true);
    fetchMembers(gathering.id).then(({ profiles }) => {
      setMembers(profiles);
      setLoadingMembers(false);
    });
  }, [canSeeMembers, gathering.id, fetchMembers]);

  const handleJoin = async () => {
    if (!user) return;
    setActing(true);
    const { error } = await joinGathering(gathering.id, user.id);
    setActing(false);
    if (error) {
      addToast(`참여 실패: ${error}`, 'error');
    } else {
      addToast('모임에 참여했습니다!', 'success');
      onRefresh();
    }
  };

  const handleLeave = async () => {
    if (!user) return;
    setActing(true);
    const { error } = await leaveGathering(gathering.id, user.id);
    setActing(false);
    if (error) {
      addToast(`취소 실패: ${error}`, 'error');
    } else {
      addToast('참여를 취소했습니다', 'info');
      onRefresh();
    }
  };

  const handleClose = async () => {
    setActing(true);
    const { error } = await closeGathering(gathering.id);
    setActing(false);
    if (error) {
      addToast(`마감 실패: ${error}`, 'error');
    } else {
      addToast('모임이 마감되었습니다', 'success');
      onRefresh();
    }
  };

  const statusLabel = GATHERING_STATUS_LABELS[gathering.status];
  const displayName = (p: MemberProfile) => p.nickname || p.name;

  return (
    <div className="flex h-full flex-col">
      {/* 헤더 */}
      <div className="flex items-center gap-2 border-b border-white/[.06] px-4 py-3">
        <button
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-white/[.08] hover:text-text-primary"
        >
          <ArrowLeft size={16} />
        </button>
        <h2 className="font-heading text-base font-bold text-text-primary truncate flex-1">{gathering.title}</h2>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
            gathering.status === 'recruiting'
              ? 'bg-success/20 text-success'
              : gathering.status === 'closed'
              ? 'bg-warning/20 text-warning'
              : 'bg-white/[.08] text-text-muted'
          }`}
        >
          {statusLabel}
        </span>
      </div>

      {/* 본문 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* 카테고리 + 메타 */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-text-muted">
          <span className="rounded-full bg-white/[.06] px-2.5 py-0.5 font-medium">{gathering.category}</span>
          <span className="flex items-center gap-1">
            <Users size={13} />
            {gathering.member_count}{gathering.max_members ? `/${gathering.max_members}` : ''}명
          </span>
          {gathering.deadline && (
            <span className="flex items-center gap-1">
              <Calendar size={13} />
              {formatDate(gathering.deadline)}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Clock size={13} />
            {formatDate(gathering.created_at)}
          </span>
        </div>

        {/* 설명 */}
        <div className="rounded-xl bg-white/[.04] p-3">
          <p className="text-sm text-text-secondary whitespace-pre-wrap leading-relaxed">{gathering.description}</p>
        </div>

        {/* 익명 안내 */}
        {!isClosed && (
          <div className="flex items-center gap-2 rounded-lg bg-accent/[.08] px-3 py-2 text-xs text-accent">
            <Lock size={14} />
            <span>모집 중에는 참여자 정보가 공개되지 않습니다 (인원수만 표시)</span>
          </div>
        )}

        {/* 마감 후: 참여자 목록 */}
        {canSeeMembers && (
          <div>
            <h3 className="text-xs font-semibold text-text-muted mb-2">참여자 ({members.length}명)</h3>
            {loadingMembers ? (
              <div className="flex flex-col gap-1.5">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-lg bg-white/[.03] p-2 animate-pulse">
                    <div className="h-8 w-8 rounded-full bg-white/10" />
                    <div className="h-3 w-20 rounded bg-white/10" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                {members.map((p) => (
                  <div key={p.id} className="flex items-center gap-2.5 rounded-lg bg-white/[.04] p-2">
                    <div
                      className="flex h-8 w-8 items-center justify-center rounded-full text-sm"
                      style={{ backgroundColor: p.avatar_color + '33' }}
                    >
                      {p.avatar_emoji}
                    </div>
                    <div>
                      <span className="text-sm font-medium text-text-primary">{displayName(p)}</span>
                      <span className="ml-1.5 text-[10px] text-text-muted">{p.team}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 마감 후: 연락 방법 */}
        {canSeeContact && gathering.contact_info && (
          <div className="rounded-xl border border-accent/20 bg-accent/[.06] p-3">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Link2 size={14} className="text-accent" />
              <span className="text-xs font-semibold text-accent">연락 방법</span>
            </div>
            <p className="text-sm text-text-primary break-all">{gathering.contact_info}</p>
          </div>
        )}

        {/* 마감됐는데 참여 안한 사람 */}
        {isClosed && !joined && !isAuthor && (
          <div className="flex items-center gap-2 rounded-lg bg-white/[.04] px-3 py-2 text-xs text-text-muted">
            <Lock size={14} />
            <span>마감된 모임입니다. 참여자 정보는 참여자에게만 공개됩니다.</span>
          </div>
        )}
      </div>

      {/* 하단 액션 */}
      <div className="border-t border-white/[.06] p-4 space-y-2">
        {/* 모집중 + 미참여 → 참여 버튼 */}
        {!isClosed && !joined && !isAuthor && (
          <button
            onClick={handleJoin}
            disabled={acting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent/80 disabled:opacity-40"
          >
            <LogIn size={16} />
            {acting ? '처리 중...' : '참여하기'}
          </button>
        )}

        {/* 모집중 + 참여중 → 취소 버튼 */}
        {!isClosed && joined && (
          <button
            onClick={handleLeave}
            disabled={acting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-white/[.08] py-2.5 text-sm font-semibold text-text-secondary transition-colors hover:bg-white/[.12] disabled:opacity-40"
          >
            <LogOut size={16} />
            {acting ? '처리 중...' : '참여 취소'}
          </button>
        )}

        {/* 작성자 + 모집중 → 마감 버튼 */}
        {!isClosed && isAuthor && (
          <button
            onClick={handleClose}
            disabled={acting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-warning/20 py-2.5 text-sm font-semibold text-warning transition-colors hover:bg-warning/30 disabled:opacity-40"
          >
            {acting ? '처리 중...' : '모집 마감하기'}
          </button>
        )}
      </div>
    </div>
  );
}
