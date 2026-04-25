import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Lightbulb,
  MessageSquareHeart,
  Megaphone,
  Target,
  Users2,
  ArrowRight,
  Heart,
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../../stores/authStore';
import { usePermissions } from '../../../hooks/usePermissions';
import { useV2Nav, type V2Page } from '../../../stores/v2NavStore';

interface Counts {
  noticeUnread: number;
  urgentUnread: number;
  vocOpen: number;
  vocOpenMyTeam: number;
  ideaProposed: number;
  ideaProposedMyTeam: number;
  anonNotesWaiting: number; // leader/admin만
  teamMembers: number;
}

interface RecentNotice {
  id: string;
  title: string;
  urgency: '긴급' | '할일' | '참고';
  team: string | null;
  created_at: string;
}

interface TopIdea {
  id: string;
  title: string;
  status: string;
  vote_count: number;
}

export default function DashboardPage() {
  const { user, profile } = useAuthStore();
  const perm = usePermissions();
  const setPage = useV2Nav((s) => s.setPage);
  const [counts, setCounts] = useState<Counts | null>(null);
  const [recentNotices, setRecentNotices] = useState<RecentNotice[]>([]);
  const [topIdeas, setTopIdeas] = useState<TopIdea[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !profile) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const team = profile!.team;
        const userId = user!.id;

        // 공지 전체 / 읽음 수
        const [{ count: totalNotices }, { count: readCount }, { count: urgentTotal }] = await Promise.all([
          supabase.from('notices').select('*', { count: 'exact', head: true }),
          supabase
            .from('notice_reads')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId),
          supabase
            .from('notices')
            .select('*', { count: 'exact', head: true })
            .eq('urgency', '긴급'),
        ]);

        // 긴급 중 읽은 수 (간단 계산)
        let urgentReadCount = 0;
        const { data: urgentIds } = await supabase
          .from('notices')
          .select('id')
          .eq('urgency', '긴급');
        if (urgentIds && urgentIds.length > 0) {
          const { count } = await supabase
            .from('notice_reads')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .in('notice_id', urgentIds.map((r) => r.id));
          urgentReadCount = count ?? 0;
        }

        // VOC 미완료
        const vocQ = supabase
          .from('vocs')
          .select('*', { count: 'exact', head: true })
          .neq('status', '완료');
        const { count: vocAll } = await vocQ;
        const { count: vocMine } = team
          ? await supabase
              .from('vocs')
              .select('*', { count: 'exact', head: true })
              .neq('status', '완료')
              .eq('team', team)
          : { count: 0 };

        // 아이디어 제안 상태 — ideas 테이블에 team 컬럼 없음(전사 광장 설계).
        // team 별 구분이 무의미하므로 ideaAll/ideaMine 모두 동일 카운트 사용.
        const ideaQ = supabase
          .from('ideas')
          .select('*', { count: 'exact', head: true })
          .eq('status', '제안');
        const { count: ideaAll } = await ideaQ;
        const ideaMine = ideaAll;

        // 익명 쪽지 (leader/admin): 자기 팀 수신 기준 미답변만
        let anonWaiting = 0;
        if (perm.canReceiveAnonNotes) {
          let q = supabase
            .from('anonymous_notes')
            .select('*', { count: 'exact', head: true })
            .neq('status', '답변완료');
          if (perm.isLeaderOnly && team) q = q.eq('team', team);
          const { count } = await q;
          anonWaiting = count ?? 0;
        }

        // 팀 인원
        const memberQ = team
          ? supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('team', team)
          : supabase.from('profiles').select('*', { count: 'exact', head: true });
        const { count: memberCount } = await memberQ;

        // 최근 공지 3건 (내 팀 우선 + 전사)
        const { data: noticesData } = await supabase
          .from('notices')
          .select('id, title, urgency, team, created_at')
          .order('pinned', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(3);

        // 인기 아이디어 Top 3 (상태=제안 + 공감 많은 순)
        const { data: ideasData } = await supabase
          .from('idea_with_votes')
          .select('id, title, status, vote_count')
          .order('vote_count', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(3);

        if (cancelled) return;
        setCounts({
          noticeUnread: Math.max(0, (totalNotices ?? 0) - (readCount ?? 0)),
          urgentUnread: Math.max(0, (urgentTotal ?? 0) - urgentReadCount),
          vocOpen: vocAll ?? 0,
          vocOpenMyTeam: vocMine ?? 0,
          ideaProposed: ideaAll ?? 0,
          ideaProposedMyTeam: ideaMine ?? 0,
          anonNotesWaiting: anonWaiting,
          teamMembers: memberCount ?? 0,
        });
        setRecentNotices((noticesData ?? []) as RecentNotice[]);
        setTopIdeas((ideasData ?? []) as TopIdea[]);
      } catch (e) {
        console.error('대시보드 로드 실패', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [user, profile, perm.canReceiveAnonNotes, perm.isLeaderOnly]);

  const greetName = profile?.nickname || profile?.name || '반가워요';
  const hour = new Date().getHours();
  const timeLabel =
    hour < 6 ? '새벽' : hour < 12 ? '오전' : hour < 18 ? '오후' : '저녁';

  // 현재 증권ITO 단일 팀 운영 단계. 추후 다팀 확장 시 admin=전사로 복원.
  const roleScope = profile?.team ?? '';

  // 역할별 KPI 구성
  const kpis = useMemo(() => {
    if (!counts) return [];
    const base = [
      {
        icon: Megaphone,
        label: '미확인 공지',
        value: counts.noticeUnread,
        sub: counts.urgentUnread > 0 ? `긴급 ${counts.urgentUnread}건` : '긴급 없음',
        tone: counts.urgentUnread > 0 ? 'critical' : 'info',
        page: 'notice' as V2Page,
      },
      {
        icon: MessageSquareHeart,
        label: '내 팀 바라는점 진행중',
        value: counts.vocOpenMyTeam,
        sub: '접수·검토·처리중',
        tone: 'todo',
        page: 'voc' as V2Page,
      },
      {
        icon: Lightbulb,
        label: '내 팀 신규 아이디어',
        value: counts.ideaProposedMyTeam,
        sub: '상태=제안',
        tone: 'info',
        page: 'idea' as V2Page,
      },
    ];

    if (perm.canReceiveAnonNotes) {
      base.push({
        icon: Heart,
        label: '내 팀 쪽지',
        value: counts.anonNotesWaiting,
        sub: '답변 대기',
        tone: counts.anonNotesWaiting > 0 ? 'todo' : 'info',
        page: 'anon-note' as V2Page,
      });
    } else {
      base.push({
        icon: Users2,
        label: '팀 동료',
        value: counts.teamMembers,
        sub: profile?.team ?? '',
        tone: 'info',
        page: 'directory' as V2Page,
      });
    }
    return base;
  }, [counts, perm, profile?.team]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* 브레드크럼 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--w-text-muted)' }}>
        <span>한울타리</span>
        <span>/</span>
        <span style={{ color: 'var(--w-text)' }}>대시보드</span>
        {profile?.team && (
          <span className="w-badge w-badge-accent" style={{ marginLeft: 4 }}>
            {perm.isAdmin ? 'ADMIN · ' : perm.isLeaderOnly ? '리더 · ' : ''}{profile.team}
          </span>
        )}
      </div>

      {/* 히어로 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0, color: 'var(--w-text)' }}>
            {timeLabel}이에요, {greetName}님
          </h1>
          <p style={{ margin: '6px 0 0', color: 'var(--w-text-soft)', fontSize: 14 }}>
            {buildSummary(counts, roleScope)}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="w-btn w-btn-ghost" onClick={() => setPage('voc')}>
            바라는점 올리기
          </button>
          <button className="w-btn w-btn-primary" onClick={() => setPage('idea')}>
            아이디어 올리기
          </button>
        </div>
      </div>

      {/* 긴급 공지 배너 */}
      {!loading && counts && counts.urgentUnread > 0 && (
        <div
          className="w-card"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '14px 16px',
            background: 'var(--w-urgency-critical-soft)',
            border: '1px solid var(--w-urgency-critical)',
          }}
        >
          <AlertTriangle size={18} color="var(--w-urgency-critical)" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--w-urgency-critical)' }}>
              미확인 긴급 공지 {counts.urgentUnread}건
            </div>
            <div style={{ fontSize: 12, color: 'var(--w-text-soft)' }}>
              빠르게 확인해 주세요.
            </div>
          </div>
          <button className="w-btn w-btn-primary" onClick={() => setPage('notice')}>
            공지 보기 <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* KPI 카드 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
        }}
      >
        {loading && Array.from({ length: 4 }).map((_, i) => <KpiSkeleton key={i} />)}
        {!loading &&
          kpis.map((k) => (
            <KpiCard
              key={k.label}
              Icon={k.icon}
              label={k.label}
              value={k.value}
              sub={k.sub}
              tone={k.tone as 'critical' | 'todo' | 'info'}
              onClick={() => setPage(k.page)}
            />
          ))}
      </div>

      {/* 콘텐츠 위젯: 최근 공지 + 인기 아이디어 */}
      {!loading && (recentNotices.length > 0 || topIdeas.length > 0) && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 16,
          }}
        >
          {recentNotices.length > 0 && (
            <RecentNoticesWidget notices={recentNotices} onMore={() => setPage('notice')} onSelect={() => setPage('notice')} />
          )}
          {topIdeas.length > 0 && (
            <TopIdeasWidget ideas={topIdeas} onMore={() => setPage('idea')} onSelect={() => setPage('idea')} />
          )}
        </div>
      )}

      {/* 역할별 추가 섹션 */}
      {perm.isLeader && <AdminHints perm={perm} />}
      {!perm.isLeader && <MemberHints />}
    </div>
  );
}

/** 상단 인사말 아래 한 줄 요약: 미확인/진행 건수 중 가장 눈에 띄는 것 */
function buildSummary(counts: Counts | null, scope: string): string {
  if (!counts) return '오늘의 상태를 한눈에 확인하세요.';
  const items: string[] = [];
  if (counts.urgentUnread > 0) items.push(`미확인 긴급 공지 ${counts.urgentUnread}건`);
  else if (counts.noticeUnread > 0) items.push(`미확인 공지 ${counts.noticeUnread}건`);
  if (counts.vocOpenMyTeam > 0) items.push(`바라는점 진행중 ${counts.vocOpenMyTeam}건`);
  if (counts.anonNotesWaiting > 0) items.push(`답변 대기 쪽지 ${counts.anonNotesWaiting}건`);
  if (items.length === 0) return `${scope} 처리 대기 항목이 없어요. 깔끔한 하루 보내세요.`;
  return `오늘 ${scope}에 ${items.join(' · ')} 이 있어요.`;
}

function RecentNoticesWidget({
  notices,
  onMore,
  onSelect,
}: {
  notices: RecentNotice[];
  onMore: () => void;
  onSelect: () => void;
}) {
  return (
    <div className="w-card" style={{ padding: 0, overflow: 'hidden' }}>
      <WidgetHeader title="최근 공지" onMore={onMore} />
      <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
        {notices.map((n, i) => (
          <li
            key={n.id}
            onClick={onSelect}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 16px',
              borderTop: i === 0 ? 'none' : '1px solid var(--w-border)',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLLIElement).style.background = 'var(--w-surface-2)')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLLIElement).style.background = 'transparent')}
          >
            <UrgencyDot urgency={n.urgency} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--w-text)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {n.title}
              </div>
              <div style={{ fontSize: 11, color: 'var(--w-text-muted)' }}>
                {n.team ?? '공통'} · {relative(n.created_at)}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TopIdeasWidget({
  ideas,
  onMore,
  onSelect,
}: {
  ideas: TopIdea[];
  onMore: () => void;
  onSelect: () => void;
}) {
  return (
    <div className="w-card" style={{ padding: 0, overflow: 'hidden' }}>
      <WidgetHeader title="인기 아이디어" onMore={onMore} />
      <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
        {ideas.map((idea, i) => (
          <li
            key={idea.id}
            onClick={onSelect}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 16px',
              borderTop: i === 0 ? 'none' : '1px solid var(--w-border)',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLLIElement).style.background = 'var(--w-surface-2)')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLLIElement).style.background = 'transparent')}
          >
            <div
              style={{
                minWidth: 28,
                textAlign: 'center',
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--w-accent-hover)',
              }}
            >
              #{i + 1}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--w-text)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {idea.title}
              </div>
              <div style={{ fontSize: 11, color: 'var(--w-text-muted)' }}>
                {idea.status} · 공감 {idea.vote_count}
              </div>
            </div>
            <Heart size={13} color="var(--w-accent)" />
          </li>
        ))}
      </ul>
    </div>
  );
}

function WidgetHeader({ title, onMore }: { title: string; onMore: () => void }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 18px',
        borderBottom: '1px solid var(--w-border)',
      }}
    >
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
        <span
          style={{
            fontSize: 10.5,
            fontWeight: 700,
            color: 'var(--w-text-muted)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          Widget
        </span>
        <span style={{ color: 'var(--w-border-strong)' }}>·</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--w-text)' }}>{title}</span>
      </div>
      <button
        onClick={onMore}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          background: 'transparent',
          border: 'none',
          color: 'var(--w-accent-hover)',
          fontSize: 11,
          fontWeight: 600,
          cursor: 'pointer',
          padding: 0,
        }}
      >
        전체 보기 <ArrowRight size={12} />
      </button>
    </div>
  );
}

function UrgencyDot({ urgency }: { urgency: '긴급' | '할일' | '참고' }) {
  const color =
    urgency === '긴급'
      ? 'var(--w-urgency-critical)'
      : urgency === '할일'
        ? 'var(--w-urgency-todo)'
        : 'var(--w-urgency-info)';
  return <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />;
}

/** 상대 시간 포맷 - 외부 utils 대신 내부에서 간단 구현 */
function relative(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return '방금';
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}일 전`;
  return d.toLocaleDateString('ko-KR');
}

function KpiSkeleton() {
  return (
    <div
      className="w-card"
      style={{
        padding: 16,
        minHeight: 108,
        background:
          'linear-gradient(100deg, var(--w-surface) 30%, var(--w-surface-2) 50%, var(--w-surface) 70%)',
        backgroundSize: '200% 100%',
        animation: 'v2Shimmer 1.5s linear infinite',
      }}
    />
  );
}

function KpiCard({
  Icon,
  label,
  value,
  sub,
  tone,
  onClick,
}: {
  Icon: React.ComponentType<{ size?: number; color?: string }>;
  label: string;
  value: number;
  sub: string;
  tone: 'critical' | 'todo' | 'info';
  onClick?: () => void;
}) {
  const toneColor =
    tone === 'critical'
      ? 'var(--w-urgency-critical)'
      : tone === 'todo'
        ? 'var(--w-urgency-todo)'
        : 'var(--w-urgency-info)';
  const toneBg =
    tone === 'critical'
      ? 'var(--w-urgency-critical-soft)'
      : tone === 'todo'
        ? 'var(--w-urgency-todo-soft)'
        : 'var(--w-urgency-info-soft)';

  return (
    <button
      onClick={onClick}
      className="w-card"
      style={{
        padding: 18,
        textAlign: 'left',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        background: 'var(--w-surface)',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--w-border-strong)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--w-border)';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: toneBg,
            color: toneColor,
            display: 'grid',
            placeItems: 'center',
            flexShrink: 0,
          }}
        >
          <Icon size={18} color={toneColor} />
        </div>
        <div
          style={{
            fontSize: 10.5,
            fontWeight: 700,
            color: 'var(--w-text-muted)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          {label}
        </div>
      </div>
      <div>
        <div
          style={{
            fontSize: 30,
            fontWeight: 700,
            color: 'var(--w-text)',
            lineHeight: 1.05,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {value.toLocaleString()}
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--w-text-muted)', marginTop: 4 }}>{sub}</div>
      </div>
    </button>
  );
}

function AdminHints({ perm }: { perm: ReturnType<typeof usePermissions> }) {
  const setPage = useV2Nav((s) => s.setPage);
  return (
    <div className="w-card" style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: 'var(--w-accent-soft)',
            color: 'var(--w-accent-hover)',
            display: 'grid',
            placeItems: 'center',
            flexShrink: 0,
          }}
        >
          <Target size={18} />
        </div>
        <div>
          <div
            style={{
              fontSize: 10.5,
              fontWeight: 700,
              color: 'var(--w-text-muted)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            {perm.isAdmin ? 'ADMIN ACTIONS' : 'LEADER ACTIONS'}
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, marginTop: 2 }}>
            {perm.isAdmin ? '관리 업무 바로가기' : '리더 업무 바로가기 (내 팀)'}
          </div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8 }}>
        <HintButton label="사용자 관리" onClick={() => setPage('admin-users')} />
        <HintButton label="평가 대시보드" onClick={() => setPage('admin-eval')} />
        <HintButton label="평가 항목" onClick={() => setPage('admin-eval-items')} />
        {perm.canManageInvites && (
          <HintButton label="초대 코드" adminOnly onClick={() => setPage('admin-invites')} />
        )}
        {perm.canSeeModLogs && (
          <HintButton label="차단 로그" adminOnly onClick={() => setPage('admin-mod-logs')} />
        )}
      </div>
    </div>
  );
}

function MemberHints() {
  const setPage = useV2Nav((s) => s.setPage);
  return (
    <div className="w-card" style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: 'var(--w-accent-soft)',
            color: 'var(--w-accent-hover)',
            display: 'grid',
            placeItems: 'center',
            flexShrink: 0,
          }}
        >
          <Users2 size={18} />
        </div>
        <div>
          <div
            style={{
              fontSize: 10.5,
              fontWeight: 700,
              color: 'var(--w-text-muted)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            QUICK ACTIONS
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, marginTop: 2 }}>자주 쓰는 기능</div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8 }}>
        <HintButton label="바라는점 올리기" onClick={() => setPage('voc')} />
        <HintButton label="아이디어 올리기" onClick={() => setPage('idea')} />
        <HintButton label="쪽지 보내기" onClick={() => setPage('anon-note')} />
        <HintButton label="소모임 구경하기" onClick={() => setPage('gathering')} />
      </div>
    </div>
  );
}

function HintButton({
  label,
  onClick,
  adminOnly,
}: {
  label: string;
  onClick: () => void;
  adminOnly?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="w-btn w-btn-ghost"
      style={{ justifyContent: 'space-between', width: '100%' }}
    >
      <span>{label}</span>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        {adminOnly && <span className="w-badge w-badge-accent">ADMIN</span>}
        <ArrowRight size={14} />
      </span>
    </button>
  );
}
