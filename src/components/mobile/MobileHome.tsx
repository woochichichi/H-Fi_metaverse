import { useState, useEffect } from 'react';
import { Settings, HelpCircle } from 'lucide-react';
import VocPanel from '../voc/VocPanel';
import IdeaPanel from '../idea/IdeaPanel';
import NoticePanel from '../notice/NoticePanel';
import KpiPanel from '../kpi/KpiPanel';
import NotePanel from '../note/NotePanel';
import LobbyPanel from '../metaverse/LobbyPanel';
import GatheringPanel from '../gathering/GatheringPanel';
import OmokPanel from '../game/OmokPanel';
import ReactionPanel from '../game/ReactionPanel';
import JumpRopePanel from '../game/JumpRopePanel';
import FortunePanel from '../game/FortunePanel';
import FaqPanel from '../metaverse/FaqPanel';
import AdminPanel from '../admin/AdminPanel';
import { useNotices } from '../../hooks/useNotices';
import { useIdeas } from '../../hooks/useIdeas';
import { useKpi } from '../../hooks/useKpi';
import { useInbox } from '../../hooks/useInbox';
import { useAuthStore } from '../../stores/authStore';
import type { MobileTab } from './BottomTabBar';

interface MobileHomeProps {
  activeTab: MobileTab;
}

function DashboardHome({ onNavigate }: { onNavigate: (tab: MobileTab) => void }) {
  const { user, profile } = useAuthStore();
  const { notices, fetchNotices, fetchMyReads, readIds } = useNotices();
  const { ideas, fetchIdeas } = useIdeas();
  const { members, fetchKpiItems, fetchMemberActivities } = useKpi();
  const { unreadCount: inboxUnread } = useInbox(user?.id ?? null);
  const userTeam = profile?.team ?? '';

  useEffect(() => {
    fetchNotices({ urgency: '긴급' });
    fetchIdeas({ sort: 'popular' });
    if (userTeam) {
      fetchKpiItems(userTeam);
      fetchMemberActivities(userTeam);  // quarter 생략 → 현재 분기 기본값
    }
    if (user) fetchMyReads(user.id);
  }, [fetchNotices, fetchIdeas, fetchKpiItems, fetchMemberActivities, fetchMyReads, user, userTeam]);

  // 긴급 공지 중 안읽은 건수
  const unreadUrgent = notices.filter((n) => n.urgency === '긴급' && !readIds.has(n.id)).length;

  // 인기 아이디어 TOP 1
  const topIdea = ideas[0];

  // 내 활동 요약
  const myActivity = members.find((m) => m.userId === user?.id);
  const myTotalActivity = myActivity
    ? myActivity.vocCount + myActivity.ideaCount + myActivity.eventJoinCount + myActivity.exchangeJoinCount
    : 0;

  return (
    <div className="flex flex-1 flex-col gap-3 p-4">
      <h2 className="font-heading text-lg font-bold text-text-primary">홈</h2>

      {/* 긴급 공지 카드 */}
      <button
        onClick={() => onNavigate('notice')}
        className="rounded-xl border border-danger/20 bg-danger/[.08] p-3 text-left transition-colors hover:bg-danger/[.12]"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-danger">🔴 긴급 공지</span>
          {unreadUrgent > 0 && (
            <span className="rounded-full bg-danger/20 px-2 py-0.5 text-[10px] font-bold text-danger">
              {unreadUrgent}건 미확인
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-text-secondary">
          {unreadUrgent > 0
            ? `확인하지 않은 긴급 공지 ${unreadUrgent}건이 있습니다`
            : '모든 긴급 공지를 확인했습니다'}
        </p>
      </button>

      {/* 인기 아이디어 카드 */}
      <button
        onClick={() => onNavigate('idea')}
        className="rounded-xl border border-accent/20 bg-accent/[.08] p-3 text-left transition-colors hover:bg-accent/[.12]"
      >
        <span className="text-xs font-semibold text-accent">💡 인기 아이디어</span>
        {topIdea ? (
          <div className="mt-1">
            <p className="text-sm font-medium text-text-primary line-clamp-1">{topIdea.title}</p>
            <p className="text-[11px] text-text-muted mt-0.5">
              ❤️ {topIdea.vote_count}표 · {topIdea.status}
            </p>
          </div>
        ) : (
          <p className="mt-1 text-sm text-text-secondary">아직 등록된 아이디어가 없습니다</p>
        )}
      </button>

      {/* 수집함 카드 */}
      <button
        onClick={() => onNavigate('note')}
        className="rounded-xl border border-accent/20 bg-white/[.04] p-3 text-left transition-colors hover:bg-white/[.06]"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-accent">📬 수집함</span>
          {inboxUnread > 0 && (
            <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-bold text-accent">
              {inboxUnread}건
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-text-secondary">
          {inboxUnread > 0
            ? `확인하지 않은 알림 ${inboxUnread}건이 있습니다`
            : '새로운 알림이 없습니다'}
        </p>
      </button>

      {/* KPI 활동 요약 카드 */}
      <button
        onClick={() => onNavigate('more')}
        className="rounded-xl border border-white/[.06] bg-white/[.04] p-3 text-left transition-colors hover:bg-white/[.06]"
      >
        <span className="text-xs font-semibold text-info">📊 KPI 활동 현황</span>
        {myActivity ? (
          <div className="mt-2 flex items-center gap-3">
            <span className="text-lg font-bold text-text-primary">{myTotalActivity}건</span>
            <span className="text-[11px] text-text-muted">
              VoC {myActivity.vocCount} · 아이디어 {myActivity.ideaCount} · 이벤트 {myActivity.eventJoinCount} · 교류 {myActivity.exchangeJoinCount}
            </span>
          </div>
        ) : (
          <p className="mt-1 text-sm text-text-secondary">이번 분기 활동 기록이 없습니다</p>
        )}
      </button>
    </div>
  );
}


export default function MobileHome({ activeTab }: MobileHomeProps) {
  const [overrideTab, setOverrideTab] = useState<MobileTab | null>(null);
  const currentTab = overrideTab ?? activeTab;

  // activeTab이 바뀌면 override 초기화
  useEffect(() => {
    setOverrideTab(null);
  }, [activeTab]);

  if (currentTab === 'voc') {
    return (
      <div className="relative flex flex-1 flex-col">
        <VocPanel />
      </div>
    );
  }

  if (currentTab === 'idea') {
    return (
      <div className="relative flex flex-1 flex-col">
        <IdeaPanel />
      </div>
    );
  }

  if (currentTab === 'notice') {
    return (
      <div className="relative flex flex-1 flex-col">
        <NoticePanel />
      </div>
    );
  }

  if (currentTab === 'note') {
    return (
      <div className="relative flex flex-1 flex-col">
        <NotePanel />
      </div>
    );
  }

  if (currentTab === 'more') {
    return <MoreMenu onNavigate={setOverrideTab} />;
  }

  if (currentTab === 'more_kpi') {
    return (
      <div className="relative flex flex-1 flex-col">
        <KpiPanel />
      </div>
    );
  }

  if (currentTab === 'more_lounge') {
    const myTeam = useAuthStore.getState().profile?.team ?? '';
    return (
      <div className="relative flex flex-1 flex-col">
        <LobbyPanel onClose={() => setOverrideTab('more')} team={myTeam} readOnly={false} />
      </div>
    );
  }

  if (currentTab === 'more_gathering') {
    return (
      <div className="relative flex flex-1 flex-col">
        <GatheringPanel onClose={() => setOverrideTab('more')} />
      </div>
    );
  }

  if (currentTab === 'more_admin') {
    return (
      <div className="relative flex flex-1 flex-col">
        <AdminPanel onClose={() => setOverrideTab('more')} />
      </div>
    );
  }

  if (currentTab === 'more_omok') {
    return (
      <div className="relative flex flex-1 flex-col">
        <OmokPanel onClose={() => setOverrideTab('more')} />
      </div>
    );
  }

  if (currentTab === 'more_reaction') {
    return (
      <div className="relative flex flex-1 flex-col">
        <ReactionPanel onClose={() => setOverrideTab('more')} />
      </div>
    );
  }

  if (currentTab === 'more_jumprope') {
    return (
      <div className="relative flex flex-1 flex-col">
        <JumpRopePanel onClose={() => setOverrideTab('more')} />
      </div>
    );
  }

  if (currentTab === 'more_fortune') {
    return (
      <div className="relative flex flex-1 flex-col">
        <FortunePanel onClose={() => setOverrideTab('more')} />
      </div>
    );
  }

  if (currentTab === 'more_faq') {
    return (
      <div className="relative flex flex-1 flex-col">
        <FaqPanel onClose={() => setOverrideTab('more')} />
      </div>
    );
  }

  return <DashboardHome onNavigate={setOverrideTab} />;
}

function MoreMenu({ onNavigate }: { onNavigate: (tab: MobileTab) => void }) {
  const { profile } = useAuthStore();

  const activityItems = [
    { id: 'more_kpi' as MobileTab, label: 'KPI 관리', emoji: '📊' },
    { id: 'more_gathering' as MobileTab, label: '모임방', emoji: '🎉' },
    { id: 'more_lounge' as MobileTab, label: '활동 타임라인', emoji: '📋' },
  ];

  const gameItems = [
    { id: 'more_reaction' as MobileTab, label: '반응속도', emoji: '⚡' },
    { id: 'more_omok' as MobileTab, label: '오목', emoji: '⚫' },
    { id: 'more_jumprope' as MobileTab, label: '줄넘기', emoji: '🏃' },
    { id: 'more_fortune' as MobileTab, label: '바나프레소', emoji: '☕' },
  ];

  return (
    <div className="flex flex-1 flex-col gap-3 p-4 overflow-y-auto">
      <h2 className="font-heading text-lg font-bold text-text-primary">더보기</h2>

      {/* 활동 */}
      <div>
        <p className="text-[10px] font-medium text-text-muted uppercase mb-1.5 px-1">활동</p>
        <div className="space-y-1.5">
          {activityItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className="flex w-full items-center gap-3 rounded-xl border border-white/[.06] bg-white/[.03] p-3.5 text-left transition-colors hover:bg-white/[.06]"
            >
              <span className="text-lg">{item.emoji}</span>
              <span className="text-sm font-semibold text-text-primary">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 미니게임 */}
      <div>
        <p className="text-[10px] font-medium text-text-muted uppercase mb-1.5 px-1">미니게임</p>
        <div className="space-y-1.5">
          {gameItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className="flex w-full items-center gap-3 rounded-xl border border-white/[.06] bg-white/[.03] p-3.5 text-left transition-colors hover:bg-white/[.06]"
            >
              <span className="text-lg">{item.emoji}</span>
              <span className="text-sm font-semibold text-text-primary">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 도움말 */}
      <div>
        <p className="text-[10px] font-medium text-text-muted uppercase mb-1.5 px-1">도움말</p>
        <button
          onClick={() => onNavigate('more_faq')}
          className="flex w-full items-center gap-3 rounded-xl border border-white/[.06] bg-white/[.03] p-3.5 text-left transition-colors hover:bg-white/[.06]"
        >
          <HelpCircle size={18} className="text-text-secondary" />
          <span className="text-sm font-semibold text-text-primary">궁금해요</span>
        </button>
      </div>

      {/* 관리자 */}
      {(profile?.role === 'admin' || profile?.role === 'director' || profile?.role === 'leader') && (
        <div>
          <p className="text-[10px] font-medium text-text-muted uppercase mb-1.5 px-1">관리</p>
          <button
            onClick={() => onNavigate('more_admin' as MobileTab)}
            className="flex w-full items-center gap-3 rounded-xl border border-accent/20 bg-accent/[.05] p-3.5 text-left transition-colors hover:bg-accent/[.1]"
          >
            <Settings size={18} className="text-accent" />
            <span className="text-sm font-semibold text-accent">
              {profile?.role === 'leader' ? '팀 관리' : '관리자 패널'}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
