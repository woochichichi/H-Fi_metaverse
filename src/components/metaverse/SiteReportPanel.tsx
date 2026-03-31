import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Bug, Send, ChevronDown, ChevronUp, Paperclip, ClipboardPaste, Image, Trash2 } from 'lucide-react';
import { useSiteReports } from '../../hooks/useSiteReports';
import { useFileUpload } from '../../hooks/useFileUpload';
import { useUiStore } from '../../stores/uiStore';
import { FILE_LIMITS } from '../../lib/constants';
import { formatFileSize } from '../../lib/utils';
import type { SiteReport } from '../../types/database';

const STATUS_COLORS: Record<SiteReport['status'], string> = {
  '접수': 'bg-white/10 text-text-muted',
  '확인': 'bg-info/20 text-info',
  '처리중': 'bg-warning/20 text-warning',
  '완료': 'bg-success/20 text-success',
};

interface SiteReportPanelProps {
  onClose: () => void;
}

export default function SiteReportPanel({ onClose }: SiteReportPanelProps) {
  const { reports, loading, fetchMyReports, createReport } = useSiteReports();
  const { upload, uploading, progress: uploadProgress } = useFileUpload({
    bucket: 'report-attachments',
    ...FILE_LIMITS.report,
  });
  const { addToast } = useUiStore();

  const [view, setView] = useState<'form' | 'list'>('form');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetchMyReports();
  }, [fetchMyReports]);

  // Ctrl+V 클립보드 이미지 붙여넣기
  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      const imageFiles: File[] = [];
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) imageFiles.push(file);
        }
      }
      if (imageFiles.length === 0) return;
      e.preventDefault();
      const merged = [...files, ...imageFiles].slice(0, FILE_LIMITS.report.maxFiles);
      setFiles(merged);
      if (merged.length >= FILE_LIMITS.report.maxFiles) {
        addToast(`최대 ${FILE_LIMITS.report.maxFiles}개까지 첨부 가능`, 'info');
      }
    },
    [files, addToast],
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (!selected) return;
    const arr = Array.from(selected).filter((f) => {
      if (f.size > FILE_LIMITS.report.maxSize) {
        addToast(`${f.name}: 파일 크기 초과 (최대 ${formatFileSize(FILE_LIMITS.report.maxSize)})`, 'error');
        return false;
      }
      return true;
    });
    setFiles((prev) => [...prev, ...arr].slice(0, FILE_LIMITS.report.maxFiles));
    e.target.value = '';
  };

  const removeFile = (idx: number) => setFiles((prev) => prev.filter((_, i) => i !== idx));

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim() || submitting) return;
    setSubmitting(true);
    try {
      let attachmentUrls: string[] = [];
      if (files.length > 0) {
        const results = await upload(files);
        attachmentUrls = results.map((r) => r.url);
      }

      const { error } = await createReport({
        title: title.trim(),
        content: content.trim(),
        attachment_urls: attachmentUrls.length > 0 ? attachmentUrls : undefined,
      });

      if (error) {
        addToast(error, 'error');
        return;
      }

      addToast('건의가 접수되었습니다', 'success');
      setTitle('');
      setContent('');
      setFiles([]);
      fetchMyReports();
    } catch {
      addToast('제출 중 오류가 발생했습니다', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const isValid = title.trim() && content.trim();

  return (
    <div className="flex flex-col h-full" onPaste={handlePaste}>
      {/* 헤더 */}
      <div className="flex items-center justify-between border-b border-white/[.06] px-4 py-3">
        <div className="flex items-center gap-2">
          <Bug size={16} className="text-accent" />
          <h2 className="font-heading text-base font-bold text-text-primary">사이트 건의</h2>
        </div>
        <button
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-white/10 hover:text-text-primary"
        >
          <X size={16} />
        </button>
      </div>

      {/* 탭 */}
      <div className="flex border-b border-white/[.06]">
        <button
          onClick={() => setView('form')}
          className={`flex-1 py-2 text-xs font-medium transition-colors ${
            view === 'form' ? 'text-accent border-b-2 border-accent' : 'text-text-muted hover:text-text-secondary'
          }`}
        >
          새 건의
        </button>
        <button
          onClick={() => setView('list')}
          className={`flex-1 py-2 text-xs font-medium transition-colors ${
            view === 'list' ? 'text-accent border-b-2 border-accent' : 'text-text-muted hover:text-text-secondary'
          }`}
        >
          내 건의 ({reports.length})
        </button>
      </div>

      {view === 'form' ? (
        <>
          {/* 폼 */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* 안내 */}
            <div className="rounded-xl bg-accent/10 border border-accent/20 p-3">
              <p className="text-[11px] text-text-secondary leading-relaxed">
                버그, 개선사항, 불편사항 등을 관리자에게 직접 전달합니다.
                <br />
                <span className="text-text-muted">스크린샷: Ctrl+V로 붙여넣기 또는 파일 첨부</span>
                <br />
                <span className="text-text-muted">콘솔 로그·브라우저 정보가 자동 첨부됩니다.</span>
              </p>
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
                placeholder="어떤 문제인가요?"
                className="w-full rounded-lg bg-white/[.06] px-3 py-2 text-sm text-text-primary placeholder-text-muted outline-none focus:ring-1 focus:ring-accent"
              />
              <p className="text-[10px] text-text-muted mt-1 text-right">{title.length}/100</p>
            </div>

            {/* 내용 */}
            <div>
              <label className="text-xs font-medium text-text-muted mb-1.5 block">
                상세 내용 <span className="text-danger">*</span>
              </label>
              <textarea
                ref={contentRef}
                value={content}
                onChange={(e) => setContent(e.target.value.slice(0, 2000))}
                placeholder="재현 방법, 기대 동작, 실제 동작 등을 적어주세요"
                rows={6}
                className="w-full resize-none rounded-lg bg-white/[.06] px-3 py-2 text-sm text-text-primary placeholder-text-muted outline-none focus:ring-1 focus:ring-accent"
              />
              <p className="text-[10px] text-text-muted mt-1 text-right">{content.length}/2000</p>
            </div>

            {/* 파일 첨부 */}
            <div>
              <label className="text-xs font-medium text-text-muted mb-1.5 block">
                스크린샷 첨부 <span className="text-text-muted">(최대 {FILE_LIMITS.report.maxFiles}장)</span>
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={files.length >= FILE_LIMITS.report.maxFiles}
                  className="flex items-center gap-1.5 rounded-lg bg-white/[.06] px-3 py-2 text-xs text-text-secondary transition-colors hover:bg-white/10 disabled:opacity-40"
                >
                  <Paperclip size={13} />
                  파일 선택
                </button>
                <button
                  onClick={() => contentRef.current?.focus()}
                  className="flex items-center gap-1.5 rounded-lg bg-white/[.06] px-3 py-2 text-xs text-text-secondary transition-colors hover:bg-white/10"
                >
                  <ClipboardPaste size={13} />
                  Ctrl+V 붙여넣기
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileSelect}
              />
              {files.length > 0 && (
                <div className="mt-2 space-y-1">
                  {files.map((file, i) => (
                    <div
                      key={`${file.name}-${i}`}
                      className="flex items-center gap-2 rounded-lg bg-white/[.04] px-3 py-2"
                    >
                      <Image size={14} className="text-info shrink-0" />
                      <span className="flex-1 truncate text-xs text-text-secondary">{file.name}</span>
                      <span className="text-[10px] text-text-muted">{formatFileSize(file.size)}</span>
                      <button
                        onClick={() => removeFile(i)}
                        className="flex h-5 w-5 items-center justify-center rounded text-text-muted transition-colors hover:bg-white/10 hover:text-danger"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 자동 수집 안내 */}
            <div className="rounded-lg bg-white/[.03] px-3 py-2">
              <p className="text-[10px] text-text-muted leading-relaxed">
                자동 첨부: 브라우저 정보, 화면 크기, 콘솔 로그 (최근 100건), 네트워크 에러
              </p>
            </div>
          </div>

          {/* 제출 */}
          <div className="border-t border-white/[.06] px-4 py-3">
            {submitting && uploading && (
              <div className="mb-2">
                <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-accent transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
            <button
              onClick={handleSubmit}
              disabled={!isValid || submitting || uploading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-accent/80 disabled:opacity-40"
            >
              <Send size={14} />
              {submitting ? (uploading ? `업로드 중... ${uploadProgress}%` : '제출 중...') : '건의 보내기'}
            </button>
          </div>
        </>
      ) : (
        /* 이력 목록 */
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <p className="text-center text-xs text-text-muted py-8">불러오는 중...</p>
          ) : reports.length === 0 ? (
            <p className="text-center text-xs text-text-muted py-8">아직 건의한 내역이 없습니다</p>
          ) : (
            <div className="space-y-2">
              {reports.map((r) => (
                <ReportCard key={r.id} report={r} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ReportCard({ report }: { report: SiteReport }) {
  const [expanded, setExpanded] = useState(false);
  const date = new Date(report.created_at);
  const dateStr = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;

  return (
    <div className="rounded-xl bg-white/[.04] border border-white/[.06] overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-2 px-3 py-2.5 text-left"
      >
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-text-primary truncate">{report.title}</p>
          <p className="text-[10px] text-text-muted mt-0.5">{dateStr}</p>
        </div>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_COLORS[report.status]}`}>
          {report.status}
        </span>
        {expanded ? <ChevronUp size={14} className="text-text-muted shrink-0" /> : <ChevronDown size={14} className="text-text-muted shrink-0" />}
      </button>
      {expanded && (
        <div className="border-t border-white/[.06] px-3 py-2.5 space-y-2">
          <p className="text-xs text-text-secondary whitespace-pre-wrap">{report.content}</p>
          {report.attachment_urls && report.attachment_urls.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {report.attachment_urls.map((url, i) => (
                <a
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block h-16 w-16 rounded-lg overflow-hidden border border-white/10"
                >
                  <img src={url} alt="" className="h-full w-full object-cover" />
                </a>
              ))}
            </div>
          )}
          {report.admin_memo && (
            <div className="rounded-lg bg-accent/10 border border-accent/20 p-2">
              <p className="text-[10px] font-medium text-accent mb-0.5">관리자 답변</p>
              <p className="text-xs text-text-secondary">{report.admin_memo}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
