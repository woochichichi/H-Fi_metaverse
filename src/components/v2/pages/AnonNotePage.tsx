import { useEffect, useMemo, useState } from 'react';
import { Mail, Plus, Send, MessageCircle, ShieldOff, UserCheck, Check } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import PageHeader from '../ui/PageHeader';
import FilterBar from '../ui/FilterBar';
import EmptyState from '../ui/EmptyState';
import PanelShell, { PanelFoot } from '../ui/PanelShell';
import IntroNotice from '../ui/IntroNotice';
import { StatusPicker, type StatusTone } from '../ui/DetailShell';
import {
  PostHeaderCard,
  WorkflowStepper,
  DescriptionCard,
  ComposerCard,
} from '../ui/PostDetail';
import MasterDetail, { MasterListCard, MasterListItem } from '../ui/MasterDetail';
import { useAuthStore } from '../../../stores/authStore';
import { usePermissions } from '../../../hooks/usePermissions';
import { useNotes } from '../../../hooks/useNotes';
import { NOTE_CATEGORIES, NOTE_STATUSES } from '../../../lib/constants';
import type { NoteCategory, NoteStatus, NoteRecipient } from '../../../lib/constants';
import { formatRelativeTime } from '../../../lib/utils';
import { useV2Toast } from '../ui/Toast';
import { confirm } from '../ui/dialog';
import type { AnonymousNote } from '../../../types';

type Tab = 'inbox' | 'sent';

export default function AnonNotePage() {
  const showToast = useV2Toast((s) => s.show);
  const { user, profile } = useAuthStore();
  const perm = usePermissions();
  const { notes, loading, fetchNotes, fetchMyNotes, createNote, updateNoteStatus, deleteNote } = useNotes();

  const [tab, setTab] = useState<Tab>(perm.canReceiveAnonNotes ? 'inbox' : 'sent');
  const [status, setStatus] = useState<NoteStatus | null>(null);
  const [category, setCategory] = useState<NoteCategory | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [detail, setDetail] = useState<AnonymousNote | null>(null);

  const teamFilter = perm.isAdmin ? null : profile?.team ?? null;

  useEffect(() => {
    if (!user) return;
    if (tab === 'inbox' && perm.canReceiveAnonNotes) {
      void fetchNotes({ status, category, team: teamFilter });
    } else {
      void fetchMyNotes(user.id);
    }
  }, [tab, status, category, teamFilter, fetchNotes, fetchMyNotes, user, perm.canReceiveAnonNotes]);

  return (
    <>
      <PageHeader
        crumbs={[
          { label: '한울타리' },
          {
            label: '쪽지',
            badge:
              perm.canReceiveAnonNotes && profile?.team
                ? { text: `${profile.team} 수신`, tone: 'accent' }
                : undefined,
          },
        ]}
        title="쪽지"
        description={
          perm.canReceiveAnonNotes
            ? '내가 받은 쪽지와 내가 보낸 쪽지를 관리합니다. 익명 쪽지는 발신자가 숨겨져 있습니다.'
            : '리더·관리자에게 익명으로 한 줄 전해보세요 — 칭찬·감사·고민 모두 환영합니다.'
        }
        actions={
          <button className="w-btn w-btn-primary" onClick={() => setShowCreate(true)}>
            <Plus size={14} />
            <span>쪽지 보내기</span>
          </button>
        }
      />

      <IntroNotice
        items={[
          {
            icon: MessageCircle,
            iconColor: 'var(--w-accent)',
            title: '1:1 사적인 대화 공간',
            body: (
              <>
                바라는점이 <b>공식 접수</b>라면, 쪽지는 <b>가벼운 한마디</b>예요.
                칭찬·감사·고민·궁금한 점 — 평소 말 꺼내기 애매한 이야기를 부담 없이 전해보세요.
              </>
            ),
          },
          {
            icon: ShieldOff,
            iconColor: 'var(--w-success)',
            title: '익명 옵션 — 정말 익명',
            body: (
              <>
                "익명으로 보내기" 체크 시 <b>발신자 ID 가 DB 에 저장되지 않아요</b>. 받는 사람·관리자
                누구도 누가 썼는지 알 수 없습니다. 마음 편히 적되 인신공격은 피해주세요.
              </>
            ),
          },
          {
            icon: UserCheck,
            iconColor: 'var(--w-info)',
            title: '받는 사람을 직접 고를 수 있어요',
            body: (
              <>
                내 팀 리더 / 전체 리더 / 관리자뿐 아니라 <b>특정 팀원</b>에게도 쪽지를 보낼 수 있어요.
                칭찬·감사를 동료에게 전할 때 가장 편한 통로입니다.
              </>
            ),
          },
        ]}
      />

      {perm.canReceiveAnonNotes && (
        <div
          style={{
            display: 'inline-flex',
            background: 'var(--w-surface-2)',
            padding: 3,
            borderRadius: 999,
            marginBottom: 14,
          }}
        >
          {[
            { id: 'inbox' as const, label: '받은 쪽지' },
            { id: 'sent' as const, label: '보낸 쪽지' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                padding: '6px 16px',
                fontSize: 12,
                fontWeight: 600,
                borderRadius: 999,
                background: tab === t.id ? 'var(--w-surface)' : 'transparent',
                color: tab === t.id ? 'var(--w-text)' : 'var(--w-text-muted)',
                boxShadow: tab === t.id ? 'var(--w-shadow-card)' : 'none',
                cursor: 'pointer',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {tab === 'inbox' && (
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 14 }}>
          <FilterBar
            label="상태"
            value={status}
            onChange={setStatus}
            options={[{ value: null, label: '전체' }, ...NOTE_STATUSES.map((s) => ({ value: s as NoteStatus, label: s }))]}
          />
          <FilterBar
            label="카테고리"
            value={category}
            onChange={setCategory}
            options={[
              { value: null, label: '전체' },
              ...NOTE_CATEGORIES.map((c) => ({ value: c as NoteCategory, label: c })),
            ]}
          />
        </div>
      )}

      {loading ? (
        <div className="w-card" style={{ padding: 40, textAlign: 'center', color: 'var(--w-text-muted)' }}>
          불러오는 중...
        </div>
      ) : notes.length === 0 ? (
        <div className="w-card">
          <EmptyState
            icon={Mail}
            title={tab === 'inbox' ? '아직 받은 쪽지가 없어요 ✉️' : '보낸 쪽지가 없어요'}
            description={tab === 'sent' ? '리더에게 의견을 전해보세요.' : undefined}
          />
        </div>
      ) : (
        <MasterDetail
          hasSelection={showCreate || !!detail}
          onBackMobile={() => {
            setShowCreate(false);
            setDetail(null);
          }}
          emptyTitle="쪽지를 선택하세요"
          emptyDescription="왼쪽 목록에서 쪽지를 선택하면 내용이 여기에 표시됩니다."
          master={
            <MasterListCard>
              {notes.map((n) => {
                const selected = !showCreate && detail?.id === n.id;
                const unread = n.status === '미읽음';
                return (
                  <MasterListItem
                    key={n.id}
                    selected={selected}
                    onClick={() => {
                      setShowCreate(false);
                      setDetail(n);
                      if (tab === 'inbox' && unread) void updateNoteStatus(n.id, '읽음');
                    }}
                  >
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                      <NoteStatusBadge status={n.status} />
                      {n.category && <span className="w-badge w-badge-muted">{n.category}</span>}
                      {n.anonymous && <span className="w-badge w-badge-accent">익명</span>}
                    </div>
                    <div
                      style={{
                        fontSize: 13.5,
                        fontWeight: unread ? 700 : 600,
                        color: 'var(--w-text)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {n.title}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--w-text-muted)' }}>
                      {n.team} · {formatRelativeTime(n.created_at)}
                    </div>
                  </MasterListItem>
                );
              })}
            </MasterListCard>
          }
          detail={
            showCreate && user && profile ? (
              <CreateNotePanel
                myTeam={profile.team}
                myUserId={user.id}
                onClose={() => setShowCreate(false)}
                onSubmit={async (input) => {
                  const { error } = await createNote({ ...input, sender_id: user.id });
                  if (error) {
                    showToast(`발송 실패: ${error}`, 'error');
                    return;
                  }
                  setShowCreate(false);
                  if (tab === 'inbox') await fetchNotes({ status, category, team: teamFilter });
                  else await fetchMyNotes(user.id);
                  showToast('쪽지가 발송되었습니다', 'success');
                }}
              />
            ) : detail && user ? (
              <NoteDetailPanel
                note={detail}
                onClose={() => setDetail(null)}
                canProcess={tab === 'inbox' && perm.canReceiveAnonNotes}
                canDelete={perm.isAdmin || detail.sender_id === user.id}
                onStatusChange={async (s) => {
                  const { error } = await updateNoteStatus(detail.id, s);
                  if (error) showToast(`변경 실패: ${error}`, 'error');
                  else setDetail({ ...detail, status: s });
                }}
                onDelete={async () => {
                  const ok = await confirm({ title: '쪽지 삭제', message: '쪽지를 삭제하시겠어요?' });
                  if (!ok) return;
                  const { error } = await deleteNote(detail.id);
                  if (error) showToast(`삭제 실패: ${error}`, 'error');
                  else setDetail(null);
                }}
              />
            ) : null
          }
        />
      )}
    </>
  );
}

const NOTE_STATUS_TONE: Record<NoteStatus, StatusTone> = {
  '미읽음': 'todo',
  '읽음': 'neutral',
  '답변완료': 'success',
};

function NoteDetailPanel({
  note,
  canProcess,
  canDelete,
  onStatusChange,
  onDelete,
}: {
  note: AnonymousNote;
  onClose: () => void; // 시그니처 호환용 (미사용)
  canProcess: boolean;
  canDelete: boolean;
  onStatusChange: (s: NoteStatus) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const flowSteps: { key: NoteStatus; label: string }[] = [
    { key: '미읽음', label: '미읽음' },
    { key: '읽음', label: '읽음' },
    { key: '답변완료', label: '답변완료' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <PostHeaderCard
        icon={<Mail size={22} />}
        iconTone={
          note.status === '답변완료' ? 'success' : note.status === '미읽음' ? 'todo' : 'info'
        }
        badgeId={`NOTE-${note.id.slice(0, 6)}`}
        badges={
          <>
            <NoteStatusBadge status={note.status} />
            {note.category && <span className="w-badge w-badge-muted">{note.category}</span>}
            {note.anonymous && <span className="w-badge w-badge-accent">익명</span>}
          </>
        }
        title={note.title}
        metaLine={
          <>
            <span>{note.anonymous ? '익명 발신자' : '발신자'}</span>
            <span>·</span>
            <span>{note.team}</span>
            <span>·</span>
            <span>{formatRelativeTime(note.created_at)}</span>
          </>
        }
        canDelete={canDelete}
        onDelete={onDelete}
      />

      {canProcess && (
        <WorkflowStepper<NoteStatus>
          title="처리 진행"
          steps={flowSteps}
          currentKey={note.status}
          quickActions={
            <>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--w-text-muted)' }}>
                빠른 진행 →
              </span>
              {NOTE_STATUSES.filter((s) => s !== note.status).map((s) => (
                <button
                  key={s}
                  className="w-btn"
                  style={{
                    padding: '4px 10px',
                    fontSize: 11,
                    background: s === '답변완료' ? 'var(--w-accent)' : 'var(--w-surface-2)',
                    color: s === '답변완료' ? '#fff' : 'var(--w-text-soft)',
                    border:
                      s === '답변완료' ? '1px solid var(--w-accent)' : '1px solid var(--w-border)',
                    fontWeight: 600,
                  }}
                  onClick={() => {
                    void onStatusChange(s);
                  }}
                >
                  {s}
                </button>
              ))}
            </>
          }
        />
      )}

      <DescriptionCard label="쪽지 내용" timestamp={formatRelativeTime(note.created_at)}>
        {note.content}
      </DescriptionCard>

      {canProcess && (
        <ComposerCard
          label="상태 변경"
          topActions={
            <div style={{ marginLeft: 'auto' }}>
              <StatusPicker<NoteStatus>
                current={note.status}
                options={[...NOTE_STATUSES]}
                toneOf={(s) => NOTE_STATUS_TONE[s]}
                onChange={(s) => {
                  void onStatusChange(s);
                }}
              />
            </div>
          }
        />
      )}
    </div>
  );
}

function NoteStatusBadge({ status }: { status: NoteStatus }) {
  if (status === '답변완료') return <span className="w-badge" style={{ background: 'var(--w-success-soft)', color: 'var(--w-success)' }}>답변완료</span>;
  if (status === '읽음') return <span className="w-badge w-badge-info">읽음</span>;
  return <span className="w-badge w-badge-todo">미읽음</span>;
}

function CreateNotePanel({
  onClose,
  onSubmit,
  myTeam,
  myUserId,
}: {
  onClose: () => void;
  myTeam: string;
  /** 본인 ID — 본인 팀 팀원 목록에서 본인 제외용 */
  myUserId: string;
  onSubmit: (input: {
    anonymous: boolean;
    recipient_role: NoteRecipient;
    recipient_team: string | null;
    recipient_id: string | null;
    category: NoteCategory;
    title: string;
    content: string;
    team: string;
  }) => Promise<void>;
}) {
  const [anonymous, setAnonymous] = useState(true);
  const [recipient, setRecipient] = useState<NoteRecipient>('team_leaders');
  const [category, setCategory] = useState<NoteCategory>('건의');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // 'specific' 선택 시 본인 팀 팀원 목록 + 선택된 ID
  const [teamMembers, setTeamMembers] = useState<Array<{ id: string; name: string; role: string | null }>>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [memberSearch, setMemberSearch] = useState('');

  useEffect(() => {
    // specific 선택 시 한 번만 로드
    if (recipient !== 'specific' || teamMembers.length > 0) return;
    let cancelled = false;
    void (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, name, role')
        .eq('team', myTeam)
        .neq('id', myUserId)
        .neq('status', '퇴사')
        .order('name');
      if (!cancelled) setTeamMembers((data ?? []) as Array<{ id: string; name: string; role: string | null }>);
    })();
    return () => {
      cancelled = true;
    };
  }, [recipient, myTeam, myUserId, teamMembers.length]);

  const filteredMembers = useMemo(() => {
    const q = memberSearch.trim().toLowerCase();
    if (!q) return teamMembers;
    return teamMembers.filter((m) => m.name.toLowerCase().includes(q));
  }, [teamMembers, memberSearch]);

  const isReady =
    title.trim() &&
    content.trim() &&
    (recipient !== 'specific' || selectedMemberId);

  return (
    <PanelShell title="쪽지 보내기" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '0 18px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="수신 대상">
            <select
              value={recipient}
              onChange={(e) => {
                setRecipient(e.target.value as NoteRecipient);
                setSelectedMemberId(null);
              }}
            >
              <option value="specific">특정 팀원 ({myTeam})</option>
              <option value="team_leaders">내 팀 리더</option>
              <option value="leader">전체 리더</option>
              <option value="admin">관리자</option>
            </select>
          </Field>
          <Field label="카테고리">
            <select value={category} onChange={(e) => setCategory(e.target.value as NoteCategory)}>
              {NOTE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
        </div>

        {recipient === 'specific' && (
          <Field label="받는 사람">
            <input
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              placeholder="이름 검색"
              style={{ marginBottom: 6 }}
            />
            <div
              style={{
                maxHeight: 180,
                overflowY: 'auto',
                border: '1px solid var(--w-border)',
                borderRadius: 6,
                background: 'var(--w-surface)',
              }}
            >
              {filteredMembers.length === 0 ? (
                <div style={{ padding: '14px 12px', fontSize: 12, color: 'var(--w-text-muted)', textAlign: 'center' }}>
                  {teamMembers.length === 0 ? '팀원 목록을 불러오는 중...' : '검색 결과가 없어요'}
                </div>
              ) : (
                filteredMembers.map((m) => {
                  const active = selectedMemberId === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSelectedMemberId(m.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        width: '100%',
                        padding: '8px 12px',
                        background: active ? 'var(--w-accent-soft)' : 'transparent',
                        border: 0,
                        borderBottom: '1px solid var(--w-border)',
                        cursor: 'pointer',
                        fontSize: 13,
                        color: active ? 'var(--w-accent-hover)' : 'var(--w-text)',
                        fontWeight: active ? 700 : 500,
                        textAlign: 'left',
                        fontFamily: 'inherit',
                      }}
                    >
                      <span style={{ flex: 1 }}>{m.name}</span>
                      {m.role && m.role !== 'member' && (
                        <span className="w-badge w-badge-muted" style={{ fontSize: 10 }}>
                          {m.role === 'admin' ? '관리자' : m.role === 'director' ? '담당' : '리더'}
                        </span>
                      )}
                      {active && <Check size={13} />}
                    </button>
                  );
                })
              )}
            </div>
          </Field>
        )}

        <Field label="제목">
          <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} placeholder="예) 어제 도와주셔서 감사했어요" />
        </Field>
        <Field label="내용">
          <textarea rows={6} value={content} onChange={(e) => setContent(e.target.value)} placeholder="칭찬·감사·고민 등 전하고 싶은 마음을 편하게 적어주세요" />
        </Field>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--w-text-soft)' }}>
          <input
            type="checkbox"
            checked={anonymous}
            onChange={(e) => setAnonymous(e.target.checked)}
            style={{ width: 'auto', padding: 0 }}
          />
          익명으로 전송 (받는 사람이 작성자를 알 수 없어요)
        </label>
      </div>
      <PanelFoot>
        <button className="w-btn w-btn-ghost" onClick={onClose} disabled={submitting}>취소</button>
        <button
          className="w-btn w-btn-primary"
          disabled={!isReady || submitting}
          onClick={async () => {
            setSubmitting(true);
            try {
              await onSubmit({
                anonymous,
                recipient_role: recipient,
                recipient_team:
                  recipient === 'team_leaders' || recipient === 'specific' ? myTeam : null,
                recipient_id: recipient === 'specific' ? selectedMemberId : null,
                category,
                title: title.trim(),
                content: content.trim(),
                team: myTeam,
              });
            } finally {
              setSubmitting(false);
            }
          }}
        >
          <Send size={14} />
          <span>{submitting ? '전송 중...' : '전송'}</span>
        </button>
      </PanelFoot>
    </PanelShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--w-text-soft)' }}>{label}</span>
      {children}
    </label>
  );
}
