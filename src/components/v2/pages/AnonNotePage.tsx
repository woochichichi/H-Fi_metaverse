import { useEffect, useState } from 'react';
import { Mail, Plus, Send } from 'lucide-react';
import PageHeader from '../ui/PageHeader';
import FilterBar from '../ui/FilterBar';
import EmptyState from '../ui/EmptyState';
import Modal from '../ui/Modal';
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
import type { AnonymousNote } from '../../../types';

type Tab = 'inbox' | 'sent';

export default function AnonNotePage() {
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
            label: '익명 쪽지',
            badge:
              perm.canReceiveAnonNotes && profile?.team
                ? { text: `${profile.team} 수신`, tone: 'accent' }
                : undefined,
          },
        ]}
        title="익명 쪽지"
        description={
          perm.canReceiveAnonNotes
            ? '내가 받은 쪽지와 내가 보낸 쪽지를 관리합니다. 익명 쪽지는 발신자가 숨겨져 있습니다.'
            : '리더·관리자에게 익명으로 의견을 전할 수 있어요. 실명으로도 보낼 수 있습니다.'
        }
        actions={
          <button className="w-btn w-btn-primary" onClick={() => setShowCreate(true)}>
            <Plus size={14} />
            <span>쪽지 보내기</span>
          </button>
        }
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
            title={tab === 'inbox' ? '받은 쪽지가 없어요' : '보낸 쪽지가 없어요'}
            description={tab === 'sent' ? '리더에게 의견을 전해보세요.' : undefined}
          />
        </div>
      ) : (
        <MasterDetail
          hasSelection={!!detail}
          onBackMobile={() => setDetail(null)}
          emptyTitle="쪽지를 선택하세요"
          emptyDescription="왼쪽 목록에서 쪽지를 선택하면 내용이 여기에 표시됩니다."
          master={
            <MasterListCard>
              {notes.map((n) => {
                const selected = detail?.id === n.id;
                const unread = n.status === '미읽음';
                return (
                  <MasterListItem
                    key={n.id}
                    selected={selected}
                    onClick={() => {
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
            detail && user && (
              <NoteDetailPanel
                note={detail}
                onClose={() => setDetail(null)}
                canProcess={tab === 'inbox' && perm.canReceiveAnonNotes}
                canDelete={perm.isAdmin || detail.sender_id === user.id}
                onStatusChange={async (s) => {
                  const { error } = await updateNoteStatus(detail.id, s);
                  if (error) alert(`변경 실패: ${error}`);
                  else setDetail({ ...detail, status: s });
                }}
                onDelete={async () => {
                  if (!confirm('쪽지를 삭제하시겠어요?')) return;
                  const { error } = await deleteNote(detail.id);
                  if (error) alert(`삭제 실패: ${error}`);
                  else setDetail(null);
                }}
              />
            )
          }
        />
      )}

      {showCreate && user && profile && (
        <CreateNoteModal
          open={showCreate}
          onClose={() => setShowCreate(false)}
          myTeam={profile.team}
          onSubmit={async (input) => {
            const { error } = await createNote({ ...input, sender_id: user.id });
            if (!error) {
              setShowCreate(false);
              if (tab === 'inbox') await fetchNotes({ status, category, team: teamFilter });
              else await fetchMyNotes(user.id);
            } else alert(`발송 실패: ${error}`);
          }}
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
  if (status === '답변완료') return <span className="w-badge" style={{ background: '#E8F5EE', color: 'var(--w-success)' }}>답변완료</span>;
  if (status === '읽음') return <span className="w-badge w-badge-info">읽음</span>;
  return <span className="w-badge w-badge-todo">미읽음</span>;
}

function CreateNoteModal({
  open,
  onClose,
  onSubmit,
  myTeam,
}: {
  open: boolean;
  onClose: () => void;
  myTeam: string;
  onSubmit: (input: {
    anonymous: boolean;
    recipient_role: NoteRecipient;
    recipient_team: string | null;
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

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="쪽지 보내기"
      width={520}
      footer={
        <>
          <button className="w-btn w-btn-ghost" onClick={onClose} disabled={submitting}>취소</button>
          <button
            className="w-btn w-btn-primary"
            disabled={!title.trim() || !content.trim() || submitting}
            onClick={async () => {
              setSubmitting(true);
              try {
                await onSubmit({
                  anonymous,
                  recipient_role: recipient,
                  recipient_team: recipient === 'team_leaders' ? myTeam : null,
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
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="수신 대상">
            <select value={recipient} onChange={(e) => setRecipient(e.target.value as NoteRecipient)}>
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
        <Field label="제목">
          <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} />
        </Field>
        <Field label="내용">
          <textarea rows={6} value={content} onChange={(e) => setContent(e.target.value)} />
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
    </Modal>
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
