import { CreditCard } from 'lucide-react';
import PageHeader from '../ui/PageHeader';
import CorpCardSection from '../dashboard/CorpCardSection';
import { useAuthStore } from '../../../stores/authStore';

/**
 * 법인카드 현황 — 증권ITO 팀 전용 페이지.
 * 접근 제한: 사이드바에서 증권ITO만 보이지만, 이 페이지 자체에서도
 * 팀 체크로 이중 방어 (다른 팀이 URL/navStore 조작해 진입하는 경우).
 */
export default function CorpCardPage() {
  const profile = useAuthStore((s) => s.profile);

  console.log('[CorpCardPage] render', {
    hasProfile: !!profile,
    team: profile?.team,
    userId: profile?.id,
  });

  if (profile?.team !== '증권ITO') {
    return (
      <div style={{ padding: 24 }}>
        <PageHeader
          crumbs={[{ label: '한울타리' }, { label: '법인카드 현황' }]}
          title="법인카드 현황"
          description="이 페이지는 증권ITO 팀 소속자에게만 노출됩니다."
        />
        <div
          className="w-card"
          style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--w-text-muted)' }}
        >
          <CreditCard size={20} style={{ marginBottom: 8, opacity: 0.5 }} />
          <div style={{ fontSize: 13 }}>접근 권한이 없습니다.</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <PageHeader
        crumbs={[{ label: '한울타리' }, { label: '법인카드 현황' }]}
        title="법인카드 현황"
        description="실시간 예산 사용 현황과 남은 버퍼를 한눈에 확인하세요."
      />
      <CorpCardSection team={profile.team} />
    </div>
  );
}
