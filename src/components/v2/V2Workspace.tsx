import { useEffect, useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { usePermissions } from '../../hooks/usePermissions';
import { useUrgentUnread } from '../../hooks/useUrgentUnread';
import { useV2Nav } from '../../stores/v2NavStore';
import { useThemeStore } from '../../stores/themeStore';
import DashboardLayout from './DashboardLayout';
import NoticeLanding from './NoticeLanding';
import OnboardingV2 from './OnboardingV2';
import DashboardPage from './pages/DashboardPage';
import NoticePage from './pages/NoticePage';
import VocPage from './pages/VocPage';
import IdeaPage from './pages/IdeaPage';
import AnonNotePage from './pages/AnonNotePage';
import KpiPage from './pages/KpiPage';
import DirectoryPage from './pages/DirectoryPage';
import GatheringPage from './pages/GatheringPage';
import UnitActivitiesPage from './pages/UnitActivitiesPage';
import CorpCardPage from './pages/CorpCardPage';
import SiteReportPage from './pages/SiteReportPage';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminEvalItemsPage from './pages/AdminEvalItemsPage';
import AdminEvalDashboardPage from './pages/AdminEvalDashboardPage';
import AdminInvitesPage from './pages/AdminInvitesPage';
import AdminModLogsPage from './pages/AdminModLogsPage';

/**
 * v2 워크스페이스 루트.
 *
 * 흐름:
 * 1) 로딩 중: 간단 스피너
 * 2) 미확인 긴급 공지가 있고 사용자가 아직 스킵/확인 안 했으면 → NoticeLanding
 * 3) 그 외 → DashboardLayout + 현재 V2Nav 페이지
 *
 * gate는 세션 스토리지에 저장해 한 세션에서 한 번만 보이게 한다.
 * (사용자 결정: "미확인 긴급 공지가 있을 때만" 노출)
 */

const GATE_DISMISSED_KEY = 'hanultari_v2_urgent_gate_dismissed';
const gateKeyFor = (userId: string | null | undefined) =>
  userId ? `${GATE_DISMISSED_KEY}_${userId}` : GATE_DISMISSED_KEY;

const ONBOARDING_KEY = 'hanultari_v2_onboarding_done';
const onboardingKeyFor = (userId: string | null | undefined) =>
  userId ? `${ONBOARDING_KEY}_${userId}` : ONBOARDING_KEY;

export default function V2Workspace() {
  const user = useAuthStore((s) => s.user);
  const perm = usePermissions();
  const { page } = useV2Nav();
  const { urgent, loading, reload } = useUrgentUnread(user?.id ?? null);
  const themeClass = useThemeStore((s) => (s.version === 'dark' ? 'v2-dark' : 'v2-warm'));

  // 세션 내에서 "나중에 읽기"를 눌렀는지 여부 (사용자별 키)
  const [dismissed, setDismissed] = useState<boolean>(() => {
    try {
      // 초기값도 사용자 키 기준으로 일관되게 읽는다
      return sessionStorage.getItem(gateKeyFor(null)) === '1';
    } catch {
      return false;
    }
  });

  // 사용자 변경 시 dismissed 상태도 초기화
  // 외부 storage(sessionStorage)에서 1회 read → setState. set-state-in-effect 룰의
  // 정당한 예외 (외부 시스템과 동기화).
  useEffect(() => {
    if (!user) return;
    let next = false;
    try {
      next = sessionStorage.getItem(gateKeyFor(user.id)) === '1';
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDismissed(next);
  }, [user]);

  // v2 온보딩: 사용자별 localStorage. 한 번 완료하면 다시 안 보임
  // ("튜토리얼 다시 보기" 이벤트로 재진입 가능)
  const [showOnboarding, setShowOnboarding] = useState(false);
  useEffect(() => {
    if (!user) return;
    let done = false;
    try {
      done = localStorage.getItem(onboardingKeyFor(user.id)) === '1';
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShowOnboarding(!done);
  }, [user]);

  useEffect(() => {
    const handler = () => setShowOnboarding(true);
    window.addEventListener('restart-onboarding', handler);
    return () => window.removeEventListener('restart-onboarding', handler);
  }, []);

  const completeOnboarding = () => {
    setShowOnboarding(false);
    if (user) {
      try {
        localStorage.setItem(onboardingKeyFor(user.id), '1');
      } catch {
        /* ignore */
      }
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    if (user) {
      try {
        sessionStorage.setItem(gateKeyFor(user.id), '1');
      } catch {
        /* ignore */
      }
    }
  };

  const handleAllRead = () => {
    setDismissed(true);
    void reload();
  };

  if (loading) {
    return (
      <div
        className={themeClass}
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--w-bg)',
          color: 'var(--w-text-muted)',
          fontSize: 13,
        }}
      >
        불러오는 중...
      </div>
    );
  }

  // gate: 미확인 긴급 공지가 있고, 아직 skip하지 않았으면 랜딩
  if (!dismissed && urgent.length > 0) {
    return (
      <>
        <NoticeLanding
          urgent={urgent}
          onContinue={handleDismiss}
          onAllRead={handleAllRead}
          themeClass={themeClass}
        />
        {showOnboarding && (
          <OnboardingV2 themeClass={themeClass} onComplete={completeOnboarding} />
        )}
      </>
    );
  }

  return (
    <>
      <DashboardLayout themeClass={themeClass}>
        <V2Router page={page} role={perm.role} />
      </DashboardLayout>
      {showOnboarding && (
        <OnboardingV2 themeClass={themeClass} onComplete={completeOnboarding} />
      )}
    </>
  );
}

function V2Router({ page }: { page: string; role: string | null }) {
  switch (page) {
    case 'dashboard': return <DashboardPage />;
    case 'notice': return <NoticePage />;
    case 'voc': return <VocPage />;
    case 'idea': return <IdeaPage />;
    case 'kpi': return <KpiPage />;
    case 'anon-note': return <AnonNotePage />;
    case 'gathering': return <GatheringPage />;
    case 'directory': return <DirectoryPage />;
    case 'unit-activities': return <UnitActivitiesPage />;
    case 'corp-card': return <CorpCardPage />;
    case 'site-report': return <SiteReportPage />;
    case 'admin-users': return <AdminUsersPage />;
    case 'admin-eval-items': return <AdminEvalItemsPage />;
    case 'admin-eval': return <AdminEvalDashboardPage />;
    case 'admin-invites': return <AdminInvitesPage />;
    case 'admin-mod-logs': return <AdminModLogsPage />;
    default: return <DashboardPage />;
  }
}
