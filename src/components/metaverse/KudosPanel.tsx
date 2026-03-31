import { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Eye, RefreshCw, Send, X, ChevronDown } from 'lucide-react';
import { useKudos, type ReactionType } from '../../hooks/useKudos';
import { useAuthStore } from '../../stores/authStore';
import { useUiStore } from '../../stores/uiStore';
import KudosCard from './KudosCard';
import LoadMore from '../common/LoadMore';

type PeriodFilter = 'week' | 'month' | 'all';
const PERIOD_OPTIONS: { key: PeriodFilter; label: string }[] = [
  { key: 'week', label: '이번 주' },
  { key: 'month', label: '이번 달' },
  { key: 'all', label: '전체' },
];

function getSinceDate(period: PeriodFilter): string | undefined {
  if (period === 'all') return undefined;
  const now = new Date();
  if (period === 'week') {
    const day = now.getDay();
    const diff = day === 0 ? 6 : day - 1; // 월요일 기준
    now.setDate(now.getDate() - diff);
  } else {
    now.setDate(1);
  }
  now.setHours(0, 0, 0, 0);
  return now.toISOString();
}

interface KudosPanelProps {
  team: string;
  readOnly: boolean;
}

export default function KudosPanel({ team, readOnly }: KudosPanelProps) {
  const { profile } = useAuthStore();
  const { addToast } = useUiStore();
  const { kudosList, loading, error, fetchKudos, createKudos, toggleReaction, deleteKudos, fetchTeamMembers } = useKudos();

  const [showForm, setShowForm] = useState(false);
  const [targetId, setTargetId] = useState('');
  const [message, setMessage] = useState('');
  const [members, setMembers] = useState<{ id: string; name: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [displayCount, setDisplayCount] = useState(20);
  const [period, setPeriod] = useState<PeriodFilter>('month');

  const since = useMemo(() => getSinceDate(period), [period]);

  const reload = useCallback(() => {
    fetchKudos(team, profile?.id, since);
  }, [fetchKudos, team, profile?.id, since]);

  useEffect(() => { reload(); }, [reload]);

  const openForm = async () => {
    setShowForm(true);
    try {
      const m = await fetchTeamMembers(team);
      setMembers(m.filter((p) => p.id !== profile?.id));
    } catch {
      addToast('팀원 목록을 불러오지 못했습니다', 'error');
    }
  };

  const handleSubmit = async () => {
    if (!profile || !targetId || !message.trim()) return;
    setSubmitting(true);
    try {
      await createKudos(profile.id, targetId, team, message.trim());
      addToast('칭찬을 보냈습니다!', 'success');
      setShowForm(false);
      setTargetId('');
      setMessage('');
      reload();
    } catch {
      addToast('칭찬 등록에 실패했습니다', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleReaction = async (kudosId: string, reaction: ReactionType) => {
    if (!profile) return;
    try { await toggleReaction(kudosId, profile.id, reaction); }
    catch { addToast('반응 처리 실패', 'error'); reload(); }
  };

  const handleDelete = async (kudosId: string) => {
    if (!confirm('칭찬을 삭제하시겠습니까?')) return;
    try {
      await deleteKudos(kudosId);
      addToast('삭제했습니다', 'success');
    } catch { addToast('삭제 실패', 'error'); }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-text-primary font-heading">칭찬 보드</h3>
        <div className="flex items-center gap-2">
          {readOnly && (
            <span className="flex items-center gap-1 rounded-full bg-white/[.06] px-2 py-0.5 text-[10px] text-text-muted">
              <Eye size={10} /> 읽기 전용
            </span>
          )}
          {!readOnly && (
            <button onClick={() => (showForm ? setShowForm(false) : openForm())}
              className="flex items-center gap-1 rounded-lg bg-accent/20 px-2.5 py-1 text-[11px] font-semibold text-accent transition-colors hover:bg-accent/30">
              {showForm ? <X size={12} /> : <Plus size={12} />}
              {showForm ? '취소' : '칭찬하기'}
            </button>
          )}
        </div>
      </div>

      {/* 기간 필터 */}
      <div className="flex items-center gap-1">
        {PERIOD_OPTIONS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => { setPeriod(key); setDisplayCount(20); }}
            className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors ${
              period === key
                ? 'bg-accent/25 text-accent ring-1 ring-accent/30'
                : 'bg-white/[.06] text-text-muted hover:bg-white/[.1]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 작성 폼 */}
      {showForm && (
        <div className="rounded-xl border border-accent/20 bg-accent/[.04] p-3 space-y-2.5">
          <div className="relative">
            <select value={targetId} onChange={(e) => setTargetId(e.target.value)}
              className="w-full appearance-none rounded-lg border border-white/[.1] bg-white/[.06] px-3 py-2 pr-8 text-xs text-text-primary outline-none focus:border-accent/50">
              <option value="">누구를 칭찬할까요?</option>
              {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
            <ChevronDown size={12} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
          </div>
          <textarea value={message} onChange={(e) => setMessage(e.target.value)}
            placeholder="감사한 마음을 전해보세요..."
            maxLength={200}
            rows={2}
            className="w-full resize-none rounded-lg border border-white/[.08] bg-white/[.04] px-3 py-2 text-xs text-text-primary placeholder:text-text-muted outline-none focus:border-accent/50" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-text-muted">{message.length}/200</span>
            <button onClick={handleSubmit}
              disabled={!targetId || !message.trim() || submitting}
              className="flex items-center gap-1 rounded-lg bg-accent px-3 py-1.5 text-[11px] font-bold text-white transition-all hover:bg-accent/80 disabled:opacity-30">
              <Send size={11} />
              보내기
            </button>
          </div>
        </div>
      )}

      {/* 칭찬 리스트 */}
      {error ? (
        <div className="flex flex-col items-center justify-center py-8">
          <span className="text-2xl mb-2">⚠️</span>
          <p className="text-xs text-text-muted mb-2">{error}</p>
          <button onClick={reload} className="flex items-center gap-1 rounded-lg bg-accent/20 px-2.5 py-1 text-[11px] font-medium text-accent hover:bg-accent/30">
            <RefreshCw size={12} /> 새로고침
          </button>
        </div>
      ) : loading ? (
        <div className="py-6 text-center text-xs text-text-muted">로딩 중...</div>
      ) : kudosList.length === 0 ? (
        <div className="py-10 text-center">
          <p className="text-3xl mb-2">👏</p>
          <p className="text-xs text-text-muted">아직 칭찬이 없어요</p>
          <p className="text-[10px] text-text-muted mt-1">{readOnly ? '' : '첫 칭찬을 보내보세요!'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 pt-2">
          {kudosList.slice(0, displayCount).map((k) => (
            <KudosCard key={k.id} kudos={k} readOnly={readOnly} userId={profile?.id} onToggleReaction={handleToggleReaction} onDelete={handleDelete} />
          ))}
          <div className="col-span-2">
            <LoadMore current={Math.min(displayCount, kudosList.length)} total={kudosList.length} onLoadMore={() => setDisplayCount((c) => c + 20)} />
          </div>
        </div>
      )}
    </div>
  );
}
