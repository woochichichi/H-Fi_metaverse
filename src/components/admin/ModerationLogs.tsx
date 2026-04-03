import { useState, useEffect, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { withTimeout } from '../../lib/utils';

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

export default function ModerationLogs() {
  const [logs, setLogs] = useState<ModerationLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchErr } = await withTimeout(
        () => supabase
          .from('moderation_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100),
        8000,
        'moderationLogs',
      );
      if (fetchErr) throw fetchErr;
      setLogs(data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : '불러오기 실패');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-text-muted">
          AI가 차단한 메시지 로그 (마스킹 처리됨, 최근 100건)
        </p>
        <button
          onClick={fetchLogs}
          disabled={loading}
          className="flex items-center gap-1 rounded-lg bg-white/[.06] px-2.5 py-1 text-xs text-text-secondary hover:bg-white/10 disabled:opacity-50"
        >
          <RefreshCw size={11} className={loading ? 'animate-spin' : ''} />
          새로고침
        </button>
      </div>

      {error && (
        <p className="text-xs text-danger">{error}</p>
      )}

      {!loading && logs.length === 0 && !error && (
        <p className="py-8 text-center text-xs text-text-muted">차단된 메시지가 없습니다</p>
      )}

      {logs.length > 0 && (
        <div className="space-y-2">
          {logs.map((log) => (
            <div
              key={log.id}
              className="rounded-xl border border-white/[.06] bg-white/[.02] p-3 space-y-1.5"
            >
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-danger/20 px-2 py-0.5 text-[10px] font-semibold text-danger">
                  {CHANNEL_LABEL[log.channel] ?? log.channel}
                </span>
                <span className="text-[10px] text-text-muted">
                  {new Date(log.created_at).toLocaleString('ko-KR', {
                    month: '2-digit', day: '2-digit',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </span>
              </div>
              <p className="text-xs text-text-secondary break-all">{log.masked_content}</p>
              <p className="text-[11px] text-text-muted">사유: {log.reason}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
