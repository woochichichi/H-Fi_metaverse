import { useState } from 'react';
import { X } from 'lucide-react';
import FileUpload from '../common/FileUpload';
import { useNotices } from '../../hooks/useNotices';
import { useFileUpload } from '../../hooks/useFileUpload';
import { useAuthStore } from '../../stores/authStore';
import { useUiStore } from '../../stores/uiStore';
import { URGENCY_LEVELS, NOTICE_CATEGORIES, TEAMS, FILE_LIMITS } from '../../lib/constants';
import type { UrgencyLevel, NoticeCategory } from '../../lib/constants';

interface NoticeFormProps {
  onClose: () => void;
  onCreated: () => void;
}

const URGENCY_STYLE: Record<UrgencyLevel, string> = {
  '긴급': 'bg-danger/20 text-danger border-danger/30',
  '할일': 'bg-warning/20 text-warning border-warning/30',
  '참고': 'bg-info/20 text-info border-info/30',
};

export default function NoticeForm({ onClose, onCreated }: NoticeFormProps) {
  const { user, profile } = useAuthStore();
  const { createNotice } = useNotices();
  const { addToast } = useUiStore();
  const { upload, uploading } = useFileUpload({
    bucket: 'notice-attachments',
    ...FILE_LIMITS.notice,
  });

  const isLeader = profile?.role === 'admin' || profile?.role === 'director';

  const [urgency, setUrgency] = useState<UrgencyLevel>('참고');
  const [category, setCategory] = useState<NoticeCategory>('일반');
  const [pinned, setPinned] = useState(false);
  const [targetTeam, setTargetTeam] = useState<string>(profile?.team ?? '');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const isValid = title.trim() && content.trim();

  // 긴급 선택 시 고정 자동 제안
  const handleUrgencyChange = (u: UrgencyLevel) => {
    setUrgency(u);
    if (u === '긴급' && !pinned) {
      setPinned(true);
    }
  };

  const handleSubmit = async () => {
    if (!isValid || submitting || !user) return;
    setSubmitting(true);

    try {
      let attachmentUrls: string[] = [];
      if (files.length > 0) {
        const results = await upload(files);
        attachmentUrls = results.map((r) => r.url);
      }

      const { error } = await createNotice({
        title: title.trim(),
        content: content.trim(),
        urgency,
        category,
        pinned,
        unit: null,
        team: targetTeam || null,
        attachment_urls: attachmentUrls.length > 0 ? attachmentUrls : undefined,
        author_id: user.id,
      });

      if (error) {
        addToast(`공지 등록 실패: ${error}`, 'error');
        return;
      }

      addToast('📋 공지가 등록되었습니다', 'success');
      onCreated();
    } catch (err) {
      const msg = err instanceof Error ? err.message : '알 수 없는 오류';
      addToast(`공지 등록 실패: ${msg}`, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* 헤더 */}
      <div className="flex items-center justify-between border-b border-white/[.06] px-4 py-3">
        <h2 className="font-heading text-base font-bold text-text-primary">공지 작성</h2>
        <button
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-white/10 hover:text-text-primary"
        >
          <X size={16} />
        </button>
      </div>

      {/* 폼 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* 시급성 — 멤버는 '참고'만 사용 가능 */}
        <div>
          <label className="text-xs font-medium text-text-muted mb-1.5 block">시급성</label>
          <div className="flex gap-1.5">
            {URGENCY_LEVELS.map((u) => {
              const disabled = !isLeader && u === '긴급';
              return (
                <button
                  key={u}
                  onClick={() => !disabled && handleUrgencyChange(u)}
                  disabled={disabled}
                  className={`flex-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors duration-200 ${
                    urgency === u
                      ? URGENCY_STYLE[u]
                      : 'border-white/[.06] bg-white/[.04] text-text-muted hover:bg-white/[.08]'
                  } ${disabled ? 'opacity-30 cursor-not-allowed' : ''}`}
                >
                  {u === '긴급' ? '🔴 긴급' : u === '할일' ? '🟡 할일' : '🔵 참고'}
                </button>
              );
            })}
          </div>
        </div>

        {/* 카테고리 */}
        <div>
          <label className="text-xs font-medium text-text-muted mb-1.5 block">카테고리</label>
          <div className="flex flex-wrap gap-1.5">
            {NOTICE_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors duration-200 ${
                  category === cat
                    ? 'bg-accent text-white'
                    : 'bg-white/[.06] text-text-secondary hover:bg-white/10'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* 대상 */}
        <div>
          <label className="text-xs font-medium text-text-muted mb-1.5 block">대상 팀</label>
          <select
            value={targetTeam}
            onChange={(e) => setTargetTeam(e.target.value)}
            disabled={!isLeader}
            className="w-full rounded-lg bg-white/[.06] px-3 py-1.5 text-xs text-text-secondary outline-none disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isLeader && <option value="">전체</option>}
            {TEAMS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {/* 상단 고정 — 리더 이상만 */}
        {isLeader && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary">📌 상단 고정</span>
            <button
              onClick={() => setPinned(!pinned)}
              className={`relative h-6 w-11 rounded-full transition-colors duration-200 ${
                pinned ? 'bg-accent' : 'bg-white/20'
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform duration-200 ${
                  pinned ? 'left-[22px]' : 'left-0.5'
                }`}
              />
            </button>
          </div>
        )}

        {/* 제목 */}
        <div>
          <label className="text-xs font-medium text-text-muted mb-1.5 block">
            제목 <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value.slice(0, 200))}
            placeholder="공지 제목을 입력하세요"
            className="w-full rounded-lg bg-white/[.06] px-3 py-2 text-sm text-text-primary placeholder-text-muted outline-none focus:ring-1 focus:ring-accent"
          />
          <p className="text-[10px] text-text-muted mt-1 text-right">{title.length}/200</p>
        </div>

        {/* 내용 */}
        <div>
          <label className="text-xs font-medium text-text-muted mb-1.5 block">
            내용 <span className="text-danger">*</span>
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value.slice(0, 2000))}
            placeholder="공지 내용을 작성해 주세요"
            rows={6}
            className="w-full resize-none rounded-lg bg-white/[.06] px-3 py-2 text-sm text-text-primary placeholder-text-muted outline-none focus:ring-1 focus:ring-accent"
          />
          <p className="text-[10px] text-text-muted mt-1 text-right">{content.length}/2000</p>
        </div>

        {/* 첨부파일 */}
        <div>
          <label className="text-xs font-medium text-text-muted mb-1.5 block">첨부파일</label>
          <FileUpload
            maxSize={FILE_LIMITS.notice.maxSize}
            maxFiles={FILE_LIMITS.notice.maxFiles}
            accept={FILE_LIMITS.notice.accept}
            files={files}
            onChange={setFiles}
          />
        </div>
      </div>

      {/* 제출 */}
      <div className="border-t border-white/[.06] px-4 py-3">
        <button
          onClick={handleSubmit}
          disabled={!isValid || submitting || uploading}
          className="w-full rounded-xl bg-accent py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-accent/80 disabled:opacity-40"
        >
          {submitting || uploading ? '등록 중...' : '📋 공지 등록'}
        </button>
      </div>
    </div>
  );
}
