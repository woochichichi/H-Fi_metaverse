import { useState, useEffect } from 'react';
import { BarChart3, ScrollText, PartyPopper, Settings } from 'lucide-react';
import VocPanel from '../voc/VocPanel';
import IdeaPanel from '../idea/IdeaPanel';
import NoticePanel from '../notice/NoticePanel';
import KpiPanel from '../kpi/KpiPanel';
import NotePanel from '../note/NotePanel';
import LobbyPanel from '../metaverse/LobbyPanel';
import GatheringPanel from '../gathering/GatheringPanel';
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
  const { user } = useAuthStore();
  const { notices, fetchNotices, fetchMyReads, readIds } = useNotices();
  const { ideas, fetchIdeas } = useIdeas();
  const { kpiItems, kpiRecords, fetchKpiItems, fetchAllRecords } = useKpi();
  const { unreadCount: inboxUnread } = useInbox(user?.id ?? null);

  useEffect(() => {
    fetchNotices({ urgency: '긴급' });
    fetchIdeas({ sort: 'popular' });
    fetchKpiItems();
    if (user) fetchMyReads(user.id);
  }, [fetchNotices, fetchIdeas, fetchKpiItems, fetchMyReads, user]);

  useEffect(() => {
    if (kpiItems.length > 0) {
      fetchAllRecords(kpiItems.map((i) => i.id));
    }
  }, [kpiItems, fetchAllRecords]);

  // 긴급 공지 중 안읽은 건수
  const unreadUrgent = notices.filter((n) => n.urgency === '긴급' && !readIds.has(n.id)).length;

  // 인기 아이디어 TOP 1
  const topIdea = ideas[0];

  // 첫 번째 KPI
  const firstKpi = kpiItems[0];
  const firstKpiRecords = firstKpi
    ? kpiRecords.filter((r) => r.kpi_item_id === firstKpi.id)
    : [];
  const latestRecord = [...firstKpiRecords].sort((a, b) => b.month.localeCompare(a.month))[0];
  const kpiPercentage = firstKpi && latestRecord
    ? Math.round(((latestRecord.score ?? 0) / (firstKpi.max_score || 3)) * 100)
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

      {/* KPI 요약 카드 */}
      <button
        onClick={() => onNavigate('more')}
        className="rounded-xl border border-white/[.06] bg-white/[.04] p-3 text-left transition-colors hover:bg-white/[.06]"
      >
        <span className="text-xs font-semibold text-info">📊 KPI 현황</span>
        {firstKpi && latestRecord ? (
          <div className="mt-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-text-primary">{firstKpi.title}</span>
              <span className="text-xs font-mono text-text-muted">
                {(latestRecord.score ?? 0).toFixed(1)}/{firstKpi.max_score}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[.08]">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(kpiPercentage, 100)}%`,
                  backgroundColor: kpiPercentage >= 90 ? '#22c55e' : kpiPercentage >= 70 ? '#f59e0b' : '#ef4444',
                }}
              />
            </div>
          </div>
        ) : (
          <p className="mt-1 text-sm text-text-secondary">KPI 데이터가 없습니다</p>
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

  return <DashboardHome onNavigate={setOverrideTab} />;
}

function MoreMenu({ onNavigate }: { onNavigate: (tab: MobileTab) => void }) {
  const { profile } = useAuthStore();

  const items = [
    { id: 'more_kpi' as MobileTab, label: 'KPI 관리', icon: BarChart3, emoji: '📊' },
    { id: 'more_gathering' as MobileTab, label: '모임방', icon: PartyPopper, emoji: '🎉' },
    { id: 'more_lounge' as MobileTab, label: '활동 타임라인', icon: ScrollText, emoji: '📋' },
  ];

  return (
    <div className="flex flex-1 flex-col gap-2 p-4">
      <h2 className="font-heading text-lg font-bold text-text-primary mb-1">더보기</h2>
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => onNavigate(item.id)}
          className="flex items-center gap-3 rounded-xl border border-white/[.06] bg-white/[.03] p-4 text-left transition-colors hover:bg-white/[.06]"
        >
          <span className="text-xl">{item.emoji}</span>
          <span className="text-sm font-semibold text-text-primary">{item.label}</span>
        </button>
      ))}
      {(profile?.role === 'admin' || profile?.role === 'director') && (
        <button
          onClick={() => onNavigate('more_admin' as MobileTab)}
          className="flex items-center gap-3 rounded-xl border border-accent/20 bg-accent/[.05] p-4 text-left transition-colors hover:bg-accent/[.1]"
        >
          <Settings size={20} className="text-accent" />
          <span className="text-sm font-semibold text-accent">관리자 패널</span>
        </button>
      )}
    </div>
  );
}
