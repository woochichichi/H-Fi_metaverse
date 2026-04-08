import { useState, useEffect, useRef } from 'react';
import { Trash2, Pin, PinOff, ChevronDown, Pencil, Check, X, Download, Upload, FileText, Image as ImageIcon } from 'lucide-react';
import LabEntryTimeline from './LabEntryTimeline';
import LabCommentSection from './LabCommentSection';
import LabEntryForm from './LabEntryForm';
import { StatusBadge } from './LabHypothesisList';
import ConfirmDialog from '../common/ConfirmDialog';
import { supabase } from '../../lib/supabase';
import { formatDate } from '../../lib/utils';
import type {
  LabHypothesis, LabEntry, LabComment,
  LabHypothesisStatus, LabHypothesisCategory, LabEntryType, Profile,
} from '../../types';

const STATUSES: LabHypothesisStatus[] = ['탐색중', '실험중', '성공', '실패', '보류'];
const CATEGORIES: LabHypothesisCategory[] = ['구조', '문화', '소통', '참여', '성장', '기타'];

function getFileName(url: string) {
  try {
    const raw = decodeURIComponent(url.split('/').pop()?.split('?')[0] ?? '파일');
    // UUID prefix 제거 (8자_파일명 형태)
    return raw.replace(/^[a-f0-9]{8}_/, '');
  } catch { return '파일'; }
}
function isImageUrl(url: string) { return /\.(png|jpe?g|gif|webp|svg)(\?|$)/i.test(url); }

interface Props {
  hypothesis: LabHypothesis;
  entries: LabEntry[];
  comments: LabComment[];
  commentProfiles: Record<string, Profile>;
  isAdmin: boolean;
  profileId: string;
  loading: boolean;
  onUpdateHypothesis: (id: string, updates: { title?: string; description?: string; status?: LabHypothesisStatus; category?: LabHypothesisCategory; pinned?: boolean; attachment_urls?: string[] }) => Promise<{ error: string | null }>;
  onDeleteHypothesis: (id: string) => Promise<void>;
  onCreateEntry: (input: { hypothesis_id: string; type: LabEntryType; content: string; author_id: string; attachment_urls?: string[] }) => Promise<{ error: string | null }>;
  onUpdateEntry: (id: string, updates: { content?: string; type?: LabEntryType }) => Promise<{ error: string | null }>;
  onDeleteEntry: (id: string) => Promise<{ error: string | null }>;
  onCreateComment: (input: { hypothesis_id: string; author_id: string; content: string }) => Promise<{ error: string | null }>;
  onUpdateComment: (id: string, content: string) => Promise<{ error: string | null }>;
  onDeleteComment: (id: string) => Promise<{ error: string | null }>;
  showEntryForm: boolean;
  onShowEntryForm: (show: boolean) => void;
}

export default function LabHypothesisDetail({
  hypothesis, entries, comments, commentProfiles, isAdmin, profileId, loading,
  onUpdateHypothesis, onDeleteHypothesis,
  onCreateEntry, onUpdateEntry, onDeleteEntry,
  onCreateComment, onUpdateComment, onDeleteComment,
  showEntryForm, onShowEntryForm,
}: Props) {
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const statusMenuRef = useRef<HTMLDivElement>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // 인라인 편집
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editCategory, setEditCategory] = useState<LabHypothesisCategory>('기타');
  const [editUrls, setEditUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const startEdit = () => {
    setEditTitle(hypothesis.title);
    setEditDesc(hypothesis.description);
    setEditCategory(hypothesis.category);
    setEditUrls([...hypothesis.attachment_urls]);
    setEditing(true);
  };

  const handleAddFiles = async (fileList: FileList | File[]) => {
    const arr = Array.from(fileList).filter((f) => f.size <= 5 * 1024 * 1024 && (f.type.startsWith('image/') || f.type === 'application/pdf'));
    if (arr.length === 0) return;
    setUploading(true);
    for (const file of arr) {
      const safeName = file.name.replace(/[^a-zA-Z0-9가-힣._-]/g, '_');
      const path = `lab/${crypto.randomUUID().slice(0, 8)}_${safeName}`;
      const { error } = await supabase.storage.from('attachments').upload(path, file);
      if (error) {
        console.error('파일 업로드 실패:', error.message);
        continue;
      }
      const { data: urlData } = supabase.storage.from('attachments').getPublicUrl(path);
      setEditUrls((prev) => [...prev, urlData.publicUrl]);
    }
    setUploading(false);
  };

  const saveEdit = async () => {
    if (!editTitle.trim() || !editDesc.trim()) return;
    await onUpdateHypothesis(hypothesis.id, {
      title: editTitle.trim(),
      description: editDesc.trim(),
      category: editCategory,
      attachment_urls: editUrls,
    });
    setEditing(false);
  };

  useEffect(() => {
    if (!showStatusMenu) return;
    const handler = (e: MouseEvent) => {
      if (statusMenuRef.current && !statusMenuRef.current.contains(e.target as Node)) setShowStatusMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showStatusMenu]);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* 상세 헤더 */}
      <div className="shrink-0 border-b border-white/[.04] px-5 pb-3 pt-4">
        {editing ? (
          /* ── 편집 모드 ── */
          <div className="space-y-2">
            <input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full rounded-lg border border-white/[.1] bg-white/[.04] px-3 py-1.5 text-[15px] font-bold text-text-primary outline-none focus:border-accent/40"
              placeholder="가설 제목"
            />
            <textarea
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              rows={3}
              className="w-full resize-y rounded-lg border border-white/[.1] bg-white/[.04] px-3 py-1.5 text-[13px] leading-relaxed text-text-secondary outline-none focus:border-accent/40"
            />
            <div className="flex items-center gap-2">
              <select value={editCategory} onChange={(e) => setEditCategory(e.target.value as LabHypothesisCategory)}
                className="rounded-lg border border-white/[.1] bg-white/[.04] px-2 py-1 text-[11px] text-text-secondary outline-none">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            {/* 첨부파일 편집 */}
            <div className="rounded-lg border border-white/[.06] bg-white/[.02] p-2.5">
              <div className="mb-1.5 text-[11px] font-semibold text-text-muted">첨부파일 ({editUrls.length})</div>
              {editUrls.map((url, i) => (
                <div key={i} className="mb-1 flex items-center gap-2 rounded-md bg-white/[.03] px-2 py-1">
                  {isImageUrl(url) ? <ImageIcon size={12} className="shrink-0 text-blue-400" /> : <FileText size={12} className="shrink-0 text-text-muted" />}
                  <span className="flex-1 truncate text-[11px] text-text-secondary">{getFileName(url)}</span>
                  <button onClick={() => setEditUrls((prev) => prev.filter((_, idx) => idx !== i))} className="text-text-muted hover:text-red-400">
                    <X size={12} />
                  </button>
                </div>
              ))}
              <label className="mt-1 flex cursor-pointer items-center justify-center gap-1 rounded-md border border-dashed border-white/[.1] py-1.5 text-[10px] text-text-muted transition-colors hover:border-accent/40 hover:text-accent">
                <Upload size={11} /> {uploading ? '업로드 중...' : '파일 추가'}
                <input type="file" multiple accept="image/*,.pdf" onChange={(e) => { if (e.target.files && e.target.files.length > 0) handleAddFiles(e.target.files); e.target.value = ''; }} className="hidden" disabled={uploading} />
              </label>
            </div>
            <div className="flex gap-1.5">
              <button onClick={saveEdit} disabled={uploading} className="flex items-center gap-1 rounded-md bg-accent px-2.5 py-1 text-[11px] font-semibold text-bg-primary hover:bg-accent/80 disabled:opacity-40">
                <Check size={12} /> 저장
              </button>
              <button onClick={() => setEditing(false)} className="flex items-center gap-1 rounded-md bg-white/[.06] px-2.5 py-1 text-[11px] text-text-muted hover:bg-white/[.1]">
                <X size={12} /> 취소
              </button>
            </div>
          </div>
        ) : (
          /* ── 보기 모드 ── */
          <>
            {/* 제목 한 줄 */}
            <div className="flex items-center gap-2">
              {hypothesis.pinned && <Pin size={13} className="shrink-0 text-amber-400" />}
              <h3 className="flex-1 truncate text-[15px] font-bold text-text-primary" title={hypothesis.title}>
                {hypothesis.title}
              </h3>
              {isAdmin && (
                <button onClick={startEdit} className="shrink-0 text-text-muted hover:text-text-secondary" title="수정">
                  <Pencil size={13} />
                </button>
              )}
            </div>

            {/* 설명 */}
            <p className="mt-1.5 whitespace-pre-wrap text-[12px] leading-relaxed text-text-secondary">
              {hypothesis.description}
            </p>

            {/* 첨부파일 리스트 */}
            {hypothesis.attachment_urls.length > 0 && (
              <div className="mt-2 rounded-lg border border-white/[.06] bg-white/[.02] p-2">
                <div className="mb-1 text-[10px] font-semibold text-text-muted">📎 첨부파일 ({hypothesis.attachment_urls.length})</div>
                {hypothesis.attachment_urls.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                    className="mb-0.5 flex items-center gap-2 rounded-md px-2 py-1 text-[11px] text-text-secondary transition-colors hover:bg-white/[.04]">
                    {isImageUrl(url) ? <ImageIcon size={11} className="shrink-0 text-blue-400" /> : <FileText size={11} className="shrink-0 text-text-muted" />}
                    <span className="flex-1 truncate">{getFileName(url)}</span>
                    <Download size={11} className="shrink-0 text-text-muted" />
                  </a>
                ))}
              </div>
            )}

            {/* 메타 + 액션 (한 줄) */}
            <div className="mt-2 flex items-center gap-2 text-[11px] text-text-muted">
              <StatusBadge status={hypothesis.status} />
              <span className="rounded-md bg-white/[.06] px-1.5 py-0.5">{hypothesis.category}</span>
              <span>{formatDate(hypothesis.created_at)}</span>
              <span>댓글 {comments.length}</span>

              {isAdmin && (
                <>
                  <span className="mx-1 text-white/10">|</span>
                  <div className="relative" ref={statusMenuRef}>
                    <button onClick={() => setShowStatusMenu(!showStatusMenu)}
                      className="flex items-center gap-0.5 text-text-muted transition-colors hover:text-text-secondary">
                      상태 <ChevronDown size={10} />
                    </button>
                    {showStatusMenu && (
                      <div className="absolute left-0 top-full z-10 mt-1 w-24 rounded-lg border border-white/[.1] bg-bg-secondary py-1 shadow-xl">
                        {STATUSES.map((s) => (
                          <button key={s} onClick={() => { onUpdateHypothesis(hypothesis.id, { status: s }); setShowStatusMenu(false); }}
                            className={`w-full px-3 py-1 text-left text-[11px] transition-colors hover:bg-white/[.06] ${hypothesis.status === s ? 'font-bold text-accent' : 'text-text-secondary'}`}>
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <button onClick={() => onUpdateHypothesis(hypothesis.id, { pinned: !hypothesis.pinned })}
                    className="text-text-muted transition-colors hover:text-amber-400" title={hypothesis.pinned ? '핀 해제' : '핀 고정'}>
                    {hypothesis.pinned ? <PinOff size={12} /> : <Pin size={12} />}
                  </button>
                  <button onClick={() => setConfirmDelete(true)}
                    className="text-text-muted transition-colors hover:text-red-400" title="삭제">
                    <Trash2 size={12} />
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>

      {/* 타임라인 */}
      <LabEntryTimeline entries={entries} isAdmin={isAdmin} loading={loading}
        onAddClick={() => onShowEntryForm(true)} onUpdateEntry={onUpdateEntry} onDeleteEntry={onDeleteEntry} />

      {/* 코멘트 */}
      <LabCommentSection comments={comments} profiles={commentProfiles} profileId={profileId}
        onSubmit={async (content) => { await onCreateComment({ hypothesis_id: hypothesis.id, author_id: profileId, content }); }}
        onUpdate={onUpdateComment} onDelete={onDeleteComment} />

      {/* 엔트리 추가 폼 */}
      {showEntryForm && (
        <LabEntryForm
          onSubmit={async (input) => {
            const result = await onCreateEntry({ ...input, hypothesis_id: hypothesis.id, author_id: profileId });
            if (!result.error) onShowEntryForm(false);
            return result;
          }}
          onClose={() => onShowEntryForm(false)}
        />
      )}

      <ConfirmDialog open={confirmDelete} title="가설 삭제"
        message="이 가설과 모든 기록, 코멘트가 삭제됩니다. 정말 삭제하시겠습니까?"
        confirmLabel="삭제" danger
        onConfirm={() => { setConfirmDelete(false); onDeleteHypothesis(hypothesis.id); }}
        onCancel={() => setConfirmDelete(false)} />
    </div>
  );
}
