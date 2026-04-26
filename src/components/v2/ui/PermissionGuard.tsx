import { Lock } from 'lucide-react';
import type { ReactNode } from 'react';
import PageHeader from './PageHeader';

interface Props {
  /** 접근 허용 여부. false 면 빈 권한 카드 노출. */
  allowed: boolean;
  /** 페이지 타이틀 (PageHeader 가 권한 없는 경우에도 동일하게 그려져 일관성 유지) */
  title: string;
  /** 페이지 brumbs */
  crumbs: Array<{ label: string }>;
  /** 권한 조건 안내 (예: "관리자만 접근 가능합니다") */
  requireDesc?: string;
  children: ReactNode;
}

/**
 * v2 페이지 상단 권한 가드.
 * 사이드바에서 안 보여도 URL hash 직접 접근으로 admin 페이지에 들어올 수 있어
 * 명시적 "권한 없음" 카드로 안내. RLS 가 빈 데이터를 줄 때보다 사용자에게 의도가 명확.
 *
 * 사용 예:
 *   <PermissionGuard allowed={perm.isSuperAdmin} title="초대 코드" crumbs={[...]}>
 *     <AdminInvitesPageContent />
 *   </PermissionGuard>
 */
export default function PermissionGuard({ allowed, title, crumbs, requireDesc, children }: Props) {
  if (allowed) return <>{children}</>;

  return (
    <>
      <PageHeader crumbs={crumbs} title={title} />
      <div
        className="w-card"
        style={{
          padding: '48px 24px',
          textAlign: 'center',
          color: 'var(--w-text-muted)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: 'var(--w-surface-2)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Lock size={20} style={{ color: 'var(--w-text-muted)' }} />
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--w-text)' }}>접근 권한이 없습니다</div>
        <div style={{ fontSize: 12, color: 'var(--w-text-muted)', maxWidth: 360, lineHeight: 1.6 }}>
          {requireDesc ?? '이 페이지는 권한이 있는 사용자만 접근할 수 있습니다. 필요 시 관리자에게 문의해주세요.'}
        </div>
      </div>
    </>
  );
}
