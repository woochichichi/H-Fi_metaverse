import { useEffect, useState } from 'react';
import { Mail, Plus, Send, Trash2 } from 'lucide-react';
import PageHeader from '../ui/PageHeader';
import FilterBar from '../ui/FilterBar';
import EmptyState from '../ui/EmptyState';
import Modal from '../ui/Modal';
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
            badge: perm.canReceiveAnonNotes
              ? perm.isAdmin
                ? { text: '전사 수신', tone: 'accent' }
                : { text: '내 팀 수신', tone: 'info' }
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
        <div className="w-card" style={{ padding: 0, overflow: 'hidden' }}>
          {notes.map((n, i) => (
            <button
              key={n.id}
              onClick={() => {
                setDetail(n);
                if (tab === 'inbox' && n.status === '미읽음') void updateNoteStatus(n.id, '읽음');
              }}
              style={{
                display: 'flex',
                gap: 12,
                padding: '14px 16px',
                width: '100%',
                textAlign: 'left',
                background: 'transparent',
                borderTop: i === 0 ? 'none' : '1px solid var(--w-border)',
                cursor: 'pointer',
                alignItems: 'flex-start',
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = 'var(--w-surface-2)')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = 'transparent')}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', marginBottom: 4 }}>
                  <NoteStatusBadge status={n.status} />
                  {n.category && <span className="w-badge w-badge-muted">{n.category}</span>}
                  {n.anonymous && <span className="w-badge w-badge-accent">익명</span>}
                  <span className="w-badge w-badge-muted">{n.team}</span>
                </div>
                <div style={{ fontSize: 14, fontWeight: n.status === '미읽음' ? 700 : 500, color: 'var(--w-text)' }}>
                  {n.title}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: 'var(--w-text-soft)',
                    marginTop: 3,
                    display: '-webkit-box',
                    WebkitLineClamp: 1,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {n.content}
                </div>
                <div style={{ fontSize: 11, color: 'var(--w-text-muted)', marginTop: 4 }}>
                  {formatRelativeTime(n.created_at)}
                </div>
              </div>
            </button>
          ))}
        </div>
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

      {detail && user && (
        <NoteDetailModal
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
      )}
    </>
  );
}

function NoteStatusBadge({ status }: { status: NoteStatus }) {
  if (status === '답변완료') return <span className="w-badge" style={{ background: '#E8F5EE', color: 'var(--w-success)' }}>답변완료</span>;
  if (status === '읽음') return <span className="w-badge w-badge-info">읽음</span>;
  return <span className="w-badge w-badge-todo">미읽음</span>;
}

function NoteDetailModal({
  note,
  onClose,
  canProcess,
  canDelete,
  onStatusChange,
  onDelete,
}: {
  note: AnonymousNote;
  onClose: () => void;
  canProcess: boolean;
  canDelete: boolean;
  onStatusChange: (s: NoteStatus) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  return (
    <Modal
      open
      onClose={onClose}
      title={note.title}
      width={560}
      footer={
        <>
          {canDelete && (
            <button className="w-btn w-btn-ghost" style={{ color: 'var(--w-danger)' }} onClick={onDelete}>
              <Trash2 size={14} />
              <span>삭제</span>
            </button>
          )}
          <button className="w-btn w-btn-primary" onClick={onClose}>닫기</button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          <NoteStatusBadge status={note.status} />
          {note.category && <span className="w-badge w-badge-muted">{note.category}</span>}
          {note.anonymous && <span className="w-badge w-badge-accent">익명</span>}
          <span className="w-badge w-badge-muted">{note.team}</span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--w-text-muted)' }}>{formatRelativeTime(note.created_at)}</div>
        <div style={{ fontSize: 14, color: 'var(--w-text)', whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
          {note.content}
        </div>
        {canProcess && (
          <div style={{ borderTop: '1px solid var(--w-border)', paddingTop: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--w-text-soft)', marginBottom: 8 }}>상태 변경</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {NOTE_STATUSES.map((s) => (
                <button
                  key={s}
                  className={note.status === s ? 'w-btn w-btn-primary' : 'w-btn w-btn-ghost'}
                  style={{ padding: '4px 10px', fontSize: 12 }}
                  onClick={() => onStatusChange(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
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
