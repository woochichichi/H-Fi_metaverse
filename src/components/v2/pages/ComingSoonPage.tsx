import { ArrowLeft, Sparkles } from 'lucide-react';
import { useV2Nav } from '../../../stores/v2NavStore';

interface Props {
  title: string;
  description?: string;
}

/**
 * v2로 아직 포팅되지 않은 페이지의 플레이스홀더.
 * 기존 기능은 classic(v1)에서 그대로 동작하므로, 여기서는 안내 + 테마 변경 유도.
 */
export default function ComingSoonPage({ title, description }: Props) {
  const setPage = useV2Nav((s) => s.setPage);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 16,
        maxWidth: 720,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--w-text-muted)' }}>
        <span>한울타리</span>
        <span>/</span>
        <span style={{ color: 'var(--w-text)' }}>{title}</span>
      </div>

      <div
        className="w-card"
        style={{
          padding: 24,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--w-accent-hover)' }}>
          <Sparkles size={16} />
          <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.02em' }}>
            v2 포팅 준비 중
          </span>
        </div>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{title}</h2>
        <p style={{ margin: 0, fontSize: 14, color: 'var(--w-text-soft)', lineHeight: 1.6 }}>
          {description ??
            '이 기능은 기존 버전(classic)에서 정상 동작합니다. 곧 Modern Dark 스타일로 이전됩니다. 급하게 쓰셔야 하면 상단 [디자인] 버튼에서 classic으로 전환해 주세요.'}
        </p>
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <button className="w-btn w-btn-ghost" onClick={() => setPage('dashboard')}>
            <ArrowLeft size={14} />
            <span>대시보드로</span>
          </button>
        </div>
      </div>
    </div>
  );
}
