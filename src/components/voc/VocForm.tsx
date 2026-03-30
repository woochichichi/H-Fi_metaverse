import { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import FileUpload from '../common/FileUpload';
import { useVocs } from '../../hooks/useVocs';
import { useFileUpload } from '../../hooks/useFileUpload';
import { useAuthStore } from '../../stores/authStore';
import { useUiStore } from '../../stores/uiStore';
import { VOC_CATEGORIES, VOC_TARGET_AREAS, FILE_LIMITS } from '../../lib/constants';
import type { VocCategory, VocTargetArea } from '../../lib/constants';

interface VocFormProps {
  onClose: () => void;
  onCreated: () => void;
}

export default function VocForm({ onClose, onCreated }: VocFormProps) {
  const { profile, user } = useAuthStore();
  const { createVoc } = useVocs();
  const { addToast } = useUiStore();
  const { upload, uploading, progress: uploadProgress } = useFileUpload({
    bucket: 'voc-attachments',
    ...FILE_LIMITS.voc,
  });

  const [anonymous, setAnonymous] = useState(true);
  const [category, setCategory] = useState<VocCategory | null>(null);
  const [targetArea, setTargetArea] = useState<VocTargetArea | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitStep, setSubmitStep] = useState('');
  const submitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isValid = category && title.trim() && content.trim();

  // submitting 타임아웃 15초: 초과 시 자동 해제
  useEffect(() => {
    if (!submitting) {
      if (submitTimeoutRef.current) {
        clearTimeout(submitTimeoutRef.current);
        submitTimeoutRef.current = null;
      }
      return;
    }
    submitTimeoutRef.current = setTimeout(() => {
      setSubmitting(false);
      setSubmitStep('');
      addToast('등록 시간이 초과되었습니다. 다시 시도해주세요', 'error');
    }, 15000);
    return () => {
      if (submitTimeoutRef.current) clearTimeout(submitTimeoutRef.current);
    };
  }, [submitting, addToast]);

  const handleSubmit = async () => {
    if (!isValid || submitting || !profile) return;
    setSubmitting(true);

    try {
      // 파일 업로드
      let attachmentUrls: string[] = [];
      if (files.length > 0) {
        setSubmitStep(`파일 업로드 (0/${files.length})`);
        const results = await upload(files);
        attachmentUrls = results.map((r) => r.url);
        if (results.length < files.length) {
          addToast('일부 파일 업로드에 실패했습니다. VOC는 등록을 계속합니다.', 'info');
        }
      }

      setSubmitStep('VOC 등록 중...');

      const { error } = await createVoc({
        anonymous,
        category: category!,
        title: title.trim(),
        content: content.trim(),
        team: profile.team,
        target_area: targetArea,
        attachment_urls: attachmentUrls.length > 0 ? attachmentUrls : undefined,
        author_id: anonymous ? null : user?.id,
      });

      if (error) {
        addToast(`VOC 등록 실패: ${error}`, 'error');
        return;
      }

      addToast('VOC가 접수되었습니다', 'success');
      onCreated();
    } catch (err) {
      const msg = err instanceof Error ? err.message : '알 수 없는 오류';
      addToast(`VOC 등록 실패: ${msg}`, 'error');
    } finally {
      setSubmitting(false);
      setSubmitStep('');
    }
  };

  const buttonLabel = submitting
    ? files.length > 0 && uploading
      ? `업로드 중... ${uploadProgress}%`
      : submitStep || '등록 중...'
    : '📞 VOC 접수';

  return (
    <div className="flex flex-col h-full">
      {/* 헤더 */}
      <div className="flex items-center justify-between border-b border-white/[.06] px-4 py-3">
        <h2 className="font-heading text-base font-bold text-text-primary">VOC 접수</h2>
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
          <span className="text-sm text-text-secondary">익명으로 접수</span>
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

        {/* 카테고리 */}
        <div>
          <label className="text-xs font-medium text-text-muted mb-1.5 block">
            카테고리 <span className="text-danger">*</span>
          </label>
          <div className="flex flex-wrap gap-1.5">
            {VOC_CATEGORIES.map((cat) => (
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

        {/* 대상 영역 (선택) */}
        <div>
          <label className="text-xs font-medium text-text-muted mb-1.5 block">
            대상 영역 <span className="text-text-muted">(선택)</span>
          </label>
          <div className="flex flex-wrap gap-1.5">
            {VOC_TARGET_AREAS.map((area) => (
              <button
                key={area}
                onClick={() => setTargetArea(targetArea === area ? null : area)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors duration-200 ${
                  targetArea === area
                    ? 'bg-info/30 text-info'
                    : 'bg-white/[.06] text-text-secondary hover:bg-white/10'
                }`}
              >
                {area}
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
            placeholder="VOC 제목을 입력하세요"
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
            placeholder="상세 내용을 작성해 주세요"
            rows={5}
            className="w-full resize-none rounded-lg bg-white/[.06] px-3 py-2 text-sm text-text-primary placeholder-text-muted outline-none focus:ring-1 focus:ring-accent"
          />
          <p className="text-[10px] text-text-muted mt-1 text-right">{content.length}/1000</p>
        </div>

        {/* 첨부파일 */}
        <div>
          <label className="text-xs font-medium text-text-muted mb-1.5 block">첨부파일</label>
          <FileUpload
            maxSize={FILE_LIMITS.voc.maxSize}
            maxFiles={FILE_LIMITS.voc.maxFiles}
            accept={FILE_LIMITS.voc.accept}
            files={files}
            onChange={setFiles}
          />
        </div>
      </div>

      {/* 제출 */}
      <div className="border-t border-white/[.06] px-4 py-3">
        {/* 업로드 진행률 바 */}
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
          className="w-full rounded-xl bg-accent py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-accent/80 disabled:opacity-40"
        >
          {buttonLabel}
        </button>
      </div>
    </div>
  );
}
