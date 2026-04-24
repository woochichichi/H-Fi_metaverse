import { useMemo } from 'react';
import {
  LayoutDashboard,
  Megaphone,
  MessageSquareHeart,
  Lightbulb,
  Target,
  Mail,
  Users2,
  UserCog,
  ListChecks,
  GaugeCircle,
  KeyRound,
  ShieldAlert,
  PartyPopper,
  Building2,
  Bug,
  CreditCard,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { usePermissions } from '../../hooks/usePermissions';
import { useV2Nav, type V2Page } from '../../stores/v2NavStore';
import { useUrgentUnread } from '../../hooks/useUrgentUnread';
import { BOARD_LABELS } from '../../lib/boardLabels';

interface MenuItem {
  id: V2Page;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  scope?: string;
  visible: boolean;
  adminOnly?: boolean;
  badge?: { text: string; tone: 'critical' | 'accent' };
}

export default function V2Sidebar() {
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const perm = usePermissions();
  const { page, setPage } = useV2Nav();
  // 긴급 미확인 공지 배지용 (초기 로드 1회만, reload는 공지 페이지에서 처리)
  const { urgent } = useUrgentUnread(user?.id ?? null);
  const urgentCount = urgent.length;

  // 1) 소통 - 매일 쓰는 핵심 (공지/VOC/제안/KPI/팀 예산)
  const coreItems = useMemo<MenuItem[]>(() => [
    { id: 'dashboard', label: BOARD_LABELS.dashboard, icon: LayoutDashboard, visible: true },
    {
      id: 'notice',
      label: BOARD_LABELS.notice,
      icon: Megaphone,
      visible: true,
      badge: urgentCount > 0 ? { text: String(urgentCount), tone: 'critical' } : undefined,
    },
    { id: 'voc', label: BOARD_LABELS.voc, icon: MessageSquareHeart, visible: true },
    { id: 'idea', label: BOARD_LABELS.idea, icon: Lightbulb, visible: true },
    { id: 'kpi', label: BOARD_LABELS.kpi, icon: Target, visible: true },
    {
      id: 'corp-card',
      label: BOARD_LABELS.budget,
      icon: CreditCard,
      visible: profile?.team === '증권ITO',
    },
  ], [urgentCount, profile?.team]);

  // 2) 사내 활동 - 가끔 쓰는 (쪽지/소모임)
  const socialItems = useMemo<MenuItem[]>(() => [
    { id: 'anon-note', label: BOARD_LABELS.note, icon: Mail, visible: true },
    { id: 'gathering', label: BOARD_LABELS.gathering, icon: PartyPopper, visible: true },
  ], []);

  // 3) 참고 (피플/조직)
  const referenceItems = useMemo<MenuItem[]>(() => [
    { id: 'directory', label: '피플 목록', icon: Users2, visible: true },
    { id: 'unit-activities', label: '조직 활동', icon: Building2, visible: true },
  ], []);

  const helpItems = useMemo<MenuItem[]>(() => [
    { id: 'site-report', label: '사이트 제보', icon: Bug, visible: true },
  ], []);

  const adminItems = useMemo<MenuItem[]>(() => [
    {
      id: 'admin-users',
      label: '사용자 관리',
      icon: UserCog,
      scope: perm.isLeaderOnly ? '내 팀' : '전체',
      visible: perm.canManageUsers,
    },
    {
      id: 'admin-eval-items',
      label: '평가 항목',
      icon: ListChecks,
      scope: perm.isLeaderOnly ? '내 팀' : '전체',
      visible: perm.canManageEvalItems,
    },
    {
      id: 'admin-eval',
      label: '평가 대시보드',
      icon: GaugeCircle,
      scope: perm.isLeaderOnly ? '내 팀' : '전체',
      visible: perm.canAccessEvalDashboard,
    },
    {
      id: 'admin-invites',
      label: '초대 코드',
      icon: KeyRound,
      visible: perm.canManageInvites,
      adminOnly: true,
    },
    {
      id: 'admin-mod-logs',
      label: '차단 로그',
      icon: ShieldAlert,
      visible: perm.canSeeModLogs,
      adminOnly: true,
    },
  ], [perm]);

  const visibleAdminItems = adminItems.filter((i) => i.visible);

  const roleBadge = perm.isSuperAdmin
    ? { text: '관리자 · 전체', tone: 'accent' as const }
    : perm.role === 'director'
      ? { text: '담당 · 전체', tone: 'accent' as const }
      : perm.isLeaderOnly
        ? { text: `리더 · ${profile?.team ?? ''}`, tone: 'info' as const }
        : { text: profile?.team ?? '', tone: 'muted' as const };

  return (
    <aside
      style={{
        width: 240,
        flexShrink: 0,
        background: 'var(--w-surface)',
        borderRight: '1px solid var(--w-border)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* 브랜드 (클릭 시 대시보드로 이동) */}
      <button
        onClick={() => setPage('dashboard')}
        title="대시보드로 이동"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '20px 20px 16px',
          width: '100%',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <img src="/favicon.svg" alt="" style={{ width: 28, height: 28 }} />
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--w-text)' }}>한울타리</span>
          <span style={{ fontSize: 11, color: 'var(--w-text-muted)', marginTop: 2 }}>
            {roleBadge.text}
          </span>
        </div>
      </button>

      {/* 메뉴 */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '0 12px 16px' }}>
        <SidebarSection label="워크스페이스">
          {coreItems.filter((i) => i.visible).map((item) => (
            <SidebarItem
              key={item.id}
              item={item}
              active={page === item.id}
              onClick={() => setPage(item.id)}
            />
          ))}
        </SidebarSection>

        <SidebarSection label="사내 소통">
          {socialItems.map((item) => (
            <SidebarItem
              key={item.id}
              item={item}
              active={page === item.id}
              onClick={() => setPage(item.id)}
            />
          ))}
        </SidebarSection>

        <SidebarSection label="참고">
          {referenceItems.map((item) => (
            <SidebarItem
              key={item.id}
              item={item}
              active={page === item.id}
              onClick={() => setPage(item.id)}
            />
          ))}
        </SidebarSection>

        <SidebarSection label="도움">
          {helpItems.map((item) => (
            <SidebarItem
              key={item.id}
              item={item}
              active={page === item.id}
              onClick={() => setPage(item.id)}
            />
          ))}
        </SidebarSection>

        {perm.showAdminSection && visibleAdminItems.length > 0 && (
          <SidebarSection label="관리" sublabel="관리자·리더 전용">
            {visibleAdminItems.map((item) => (
              <SidebarItem
                key={item.id}
                item={item}
                active={page === item.id}
                onClick={() => setPage(item.id)}
              />
            ))}
          </SidebarSection>
        )}
      </nav>
    </aside>
  );
}

function SidebarSection({ label, sublabel, children }: { label: string; sublabel?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: 8 }}>
      <div
        style={{
          padding: '10px 12px 6px',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.04em',
          color: 'var(--w-text-muted)',
          textTransform: 'uppercase',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <span>{label}</span>
        {sublabel && (
          <span
            style={{
              fontSize: 9,
              fontWeight: 600,
              letterSpacing: '0',
              textTransform: 'none',
              padding: '1px 6px',
              borderRadius: 999,
              background: 'var(--w-accent-soft)',
              color: 'var(--w-accent-hover)',
            }}
          >
            {sublabel}
          </span>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>{children}</div>
    </div>
  );
}

function SidebarItem({
  item,
  active,
  onClick,
}: {
  item: MenuItem;
  active: boolean;
  onClick: () => void;
}) {
  const Icon = item.icon;
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 12px',
        width: '100%',
        textAlign: 'left',
        fontSize: 13,
        fontWeight: 500,
        color: active ? 'var(--w-accent-hover)' : 'var(--w-text-soft)',
        background: active ? 'var(--w-accent-soft)' : 'transparent',
        borderRadius: 'var(--w-radius-sm)',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'var(--w-surface-2)';
      }}
      onMouseLeave={(e) => {
        if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
      }}
    >
      <Icon size={16} />
      <span style={{ flex: 1 }}>{item.label}</span>
      {item.badge && (
        <span
          className={item.badge.tone === 'critical' ? 'w-badge w-badge-critical' : 'w-badge w-badge-accent'}
          style={{ fontSize: 10, padding: '1px 6px', minWidth: 18, textAlign: 'center' }}
        >
          {item.badge.text}
        </span>
      )}
      {item.scope && (
        <span className="w-badge w-badge-muted" style={{ fontSize: 10, padding: '1px 6px' }}>
          {item.scope}
        </span>
      )}
      {item.adminOnly && (
        <span className="w-badge w-badge-accent" style={{ fontSize: 10, padding: '1px 6px' }}>
          ADMIN
        </span>
      )}
    </button>
  );
}
