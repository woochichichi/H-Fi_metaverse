import { useState } from 'react';
import { X } from 'lucide-react';
import { useNotes } from '../../hooks/useNotes';
import { useAuthStore } from '../../stores/authStore';
import { useUiStore } from '../../stores/uiStore';
import { NOTE_CATEGORIES, TEAMS } from '../../lib/constants';
import type { NoteCategory } from '../../lib/constants';

interface NoteFormProps {
  onClose: () => void;
  onCreated: () => void;
}

const RECIPIENT_OPTIONS = [
  { value: 'leader', label: '유닛 리더' },
  { value: 'admin', label: '관리자 (우형)' },
  { value: 'team_leaders', label: '팀 전체 리더' },
] as const;

export default function NoteForm({ onClose, onCreated }: NoteFormProps) {
  const { profile, user } = useAuthStore();
  const { createNote } = useNotes();
  const { addToast } = useUiStore();

  const [anonymous, setAnonymous] = useState(true);
  const [category, setCategory] = useState<NoteCategory | null>(null);
  const [recipientRole, setRecipientRole] = useState<'leader' | 'admin' | 'team_leaders'>('leader');
  const [recipientTeam, setRecipientTeam] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isValid = category && title.trim() && content.trim();

  const handleSubmit = async () => {
    if (!isValid || submitting || !profile) return;
    setSubmitting(true);

    const { error } = await createNote({
      anonymous,
      recipient_role: recipientRole,
      recipient_team: recipientRole === 'team_leaders' ? recipientTeam : null,
      category: category!,
      title: title.trim(),
      content: content.trim(),
      team: profile.team,
      sender_id: anonymous ? null : user?.id,
    });

    setSubmitting(false);

    if (error) {
      addToast(`쪽지 발송 실패: ${error}`, 'error');
      return;
    }

    addToast('✉️ 쪽지가 전달되었습니다', 'success');
    onCreated();
  };

  return (
    <div className="flex flex-col h-full">
      {/* 헤더 */}
      <div className="flex items-center justify-between border-b border-white/[.06] px-4 py-3">
        <h2 className="font-heading text-base font-bold text-text-primary">쪽지 보내기</h2>
        <button
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-white/10 hover:text-text-primary"
        >
          <X size={16} />
        </button>
      </div>

      {/* 폼 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* 익명 토글 */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-text-secondary">익명으로 보내기</span>
          <button
            onClick={() => setAnonymous(!anonymous)}
            className={`relative h-6 w-11 rounded-full transition-colors duration-200 ${
              anonymous ? 'bg-accent' : 'bg-white/20'
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform duration-200 ${
                anonymous ? 'left-[22px]' : 'left-0.5'
              }`}
            />
          </button>
        </div>

        {/* 수신 대상 */}
        <div>
          <label className="text-xs font-medium text-text-muted mb-1.5 block">
            수신 대상 <span className="text-danger">*</span>
          </label>
          <div className="flex flex-wrap gap-1.5">
            {RECIPIENT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setRecipientRole(opt.value)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors duration-200 ${
                  recipientRole === opt.value
                    ? 'bg-accent text-white'
                    : 'bg-white/[.06] text-text-secondary hover:bg-white/10'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* 팀 선택 (팀 전체 리더 선택 시) */}
          {recipientRole === 'team_leaders' && (
            <select
              value={recipientTeam ?? ''}
              onChange={(e) => setRecipientTeam(e.target.value || null)}
              className="mt-2 w-full rounded-lg bg-white/[.06] px-3 py-2 text-sm text-text-secondary outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="">전체 팀</option>
              {TEAMS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          )}
        </div>

        {/* 카테고리 */}
        <div>
          <label className="text-xs font-medium text-text-muted mb-1.5 block">
            카테고리 <span className="text-danger">*</span>
          </label>
          <div className="flex flex-wrap gap-1.5">
            {NOTE_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors duration-200 ${
                  category === cat
                    ? 'bg-info/30 text-info'
                    : 'bg-white/[.06] text-text-secondary hover:bg-white/10'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* 제목 */}
        <div>
          <label className="text-xs font-medium text-text-muted mb-1.5 block">
            제목 <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value.slice(0, 100))}
            placeholder="쪽지 제목을 입력하세요"
            className="w-full rounded-lg bg-white/[.06] px-3 py-2 text-sm text-text-primary placeholder-text-muted outline-none focus:ring-1 focus:ring-accent"
          />
          <p className="text-[10px] text-text-muted mt-1 text-right">{title.length}/100</p>
        </div>

        {/* 내용 */}
        <div>
          <label className="text-xs font-medium text-text-muted mb-1.5 block">
            내용 <span className="text-danger">*</span>
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value.slice(0, 1000))}
            placeholder="전달하고 싶은 내용을 작성해 주세요"
            rows={5}
            className="w-full resize-none rounded-lg bg-white/[.06] px-3 py-2 text-sm text-text-primary placeholder-text-muted outline-none focus:ring-1 focus:ring-accent"
          />
          <p className="text-[10px] text-text-muted mt-1 text-right">{content.length}/1000</p>
        </div>

        {/* 익명 안내 */}
        {anonymous && (
          <p className="rounded-lg bg-accent/10 px-3 py-2 text-[11px] text-accent">
            작성자 정보는 관리자도 확인할 수 없습니다
          </p>
        )}
      </div>

      {/* 제출 */}
      <div className="border-t border-white/[.06] px-4 py-3">
        <button
          onClick={handleSubmit}
          disabled={!isValid || submitting}
          className="w-full rounded-xl bg-accent py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-accent/80 disabled:opacity-40"
        >
          {submitting ? '전송 중...' : '✉️ 쪽지 보내기'}
        </button>
      </div>
    </div>
  );
}
