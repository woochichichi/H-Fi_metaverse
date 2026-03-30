import { useState } from 'react';
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
  const { upload, uploading } = useFileUpload({
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

  const isValid = category && title.trim() && content.trim();

  const handleSubmit = async () => {
    if (!isValid || submitting || !profile) return;
    setSubmitting(true);

    // 파일 업로드
    let attachmentUrls: string[] = [];
    if (files.length > 0) {
      const results = await upload(files);
      attachmentUrls = results.map((r) => r.url);
    }

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

    setSubmitting(false);

    if (error) {
      addToast(`VOC 등록 실패: ${error}`, 'error');
      return;
    }

    addToast('📞 VOC가 접수되었습니다', 'success');
    onCreated();
  };

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
        <button
          onClick={handleSubmit}
          disabled={!isValid || submitting || uploading}
          className="w-full rounded-xl bg-accent py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-accent/80 disabled:opacity-40"
        >
          {submitting || uploading ? '등록 중...' : '📞 VOC 접수'}
        </button>
      </div>
    </div>
  );
}
