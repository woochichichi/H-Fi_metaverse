import { useCallback, useEffect, useState } from 'react';
import { RefreshCw, ShieldAlert } from 'lucide-react';
import PageHeader from '../ui/PageHeader';
import EmptyState from '../ui/EmptyState';
import { supabase } from '../../../lib/supabase';
import { withTimeout } from '../../../lib/utils';
import { usePermissions } from '../../../hooks/usePermissions';

interface ModerationLog {
  id: string;
  channel: string;
  masked_content: string;
  reason: string;
  safe: boolean;
  created_at: string;
}

const CHANNEL_LABEL: Record<string, string> = {
  note: '쪽지',
  voc: 'VOC',
  thread: '대화',
};

export default function AdminModLogsPage() {
  const perm = usePermissions();
  const [logs, setLogs] = useState<ModerationLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchErr } = await withTimeout(
        () => supabase.from('moderation_logs').select('*').order('created_at', { ascending: false }).limit(100),
        8000,
        'moderationLogs',
      );
      if (fetchErr) throw fetchErr;
      setLogs((data as ModerationLog[]) ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : '불러오기 실패');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchLogs(); }, [fetchLogs]);

  if (!perm.canSeeModLogs) {
    return (
      <div className="w-card" style={{ padding: 40, textAlign: 'center', color: 'var(--w-text-muted)' }}>
        ADMIN 권한이 필요합니다.
      </div>
    );
  }

  return (
    <>
      <PageHeader
        crumbs={[
          { label: '한울타리' },
          { label: '관리' },
          { label: '차단 로그', badge: { text: 'ADMIN', tone: 'accent' } },
        ]}
        title="차단 로그"
        description="AI가 차단한 메시지 기록입니다. 내용은 마스킹 처리되어 있고 최근 100건만 조회됩니다."
        actions={
          <button className="w-btn w-btn-ghost" onClick={() => void fetchLogs()} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : undefined} />
            <span>새로고침</span>
          </button>
        }
      />

      {error && (
        <div
          className="w-card"
          style={{ padding: 14, color: 'var(--w-danger)', background: 'var(--w-urgency-critical-soft)', marginBottom: 12 }}
        >
          {error}
        </div>
      )}

      {loading ? (
        <div className="w-card" style={{ padding: 40, textAlign: 'center', color: 'var(--w-text-muted)' }}>
          불러오는 중...
        </div>
      ) : logs.length === 0 ? (
        <div className="w-card">
          <EmptyState icon={ShieldAlert} title="차단된 메시지가 없어요" description="AI 필터가 감지한 부적절한 메시지가 여기 쌓여요." />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {logs.map((log) => (
            <div key={log.id} className="w-card" style={{ padding: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span
                  className="w-badge"
                  style={{ background: 'var(--w-urgency-critical-soft)', color: 'var(--w-danger)' }}
                >
                  {CHANNEL_LABEL[log.channel] ?? log.channel}
                </span>
                <span style={{ fontSize: 11, color: 'var(--w-text-muted)' }}>
                  {new Date(log.created_at).toLocaleString('ko-KR', {
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: 'var(--w-text)',
                  wordBreak: 'break-all',
                  lineHeight: 1.5,
                  marginBottom: 4,
                }}
              >
                {log.masked_content}
              </div>
              <div style={{ fontSize: 11, color: 'var(--w-text-muted)' }}>
                사유: <span style={{ color: 'var(--w-text-soft)' }}>{log.reason}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
