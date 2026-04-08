import { useState, useRef } from 'react';
import { X, Upload } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useUiStore } from '../../stores/uiStore';
import type { LabEntryType } from '../../types';

const ENTRY_TYPES: { value: LabEntryType; label: string }[] = [
  { value: '시도', label: '🧪 시도 — 무엇을 했는가' },
  { value: '결과', label: '📊 결과 — 어떤 결과가 나왔는가' },
  { value: '학습', label: '💡 학습 — 무엇을 배웠는가' },
  { value: '메모', label: '📝 메모 — 기타 메모' },
];

interface Props {
  onSubmit: (input: {
    type: LabEntryType;
    content: string;
    attachment_urls?: string[];
  }) => Promise<{ error: string | null }>;
  onClose: () => void;
}

export default function LabEntryForm({ onSubmit, onClose }: Props) {
  const [type, setType] = useState<LabEntryType>('시도');
  const [content, setContent] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const dropRef = useRef<HTMLLabelElement>(null);

  const { addToast } = useUiStore();
  const addFiles = (newFiles: File[]) => {
    const over = newFiles.filter((f) => f.size > 5 * 1024 * 1024);
    if (over.length > 0) addToast(`${over.map((f) => f.name).join(', ')} — 5MB 초과로 제외됨`, 'error');
    const valid = newFiles.filter((f) => f.size <= 5 * 1024 * 1024);
    setFiles((prev) => [...prev, ...valid]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    addFiles(Array.from(e.target.files ?? []));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    addFiles(Array.from(e.dataTransfer.files));
  };

  const uploadFiles = async (): Promise<string[]> => {
    const urls: string[] = [];
    for (const file of files) {
      const ext = file.name.split('.').pop()?.replace(/[^a-zA-Z0-9]/g, '') || 'bin';
      const path = `lab/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from('attachments').upload(path, file);
      if (!error) {
        const { data: urlData } = supabase.storage.from('attachments').getPublicUrl(path);
        urls.push(urlData.publicUrl);
      }
    }
    return urls;
  };

  const handleSubmit = async () => {
    if (!content.trim() || submitting) return;
    setSubmitting(true);

    let attachmentUrls: string[] = [];
    if (files.length > 0) {
      attachmentUrls = await uploadFiles();
    }

    await onSubmit({
      type,
      content: content.trim(),
      attachment_urls: attachmentUrls.length > 0 ? attachmentUrls : undefined,
    });
    setSubmitting(false);
  };

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60">
      <div className="w-[420px] rounded-2xl border border-white/[.08] bg-bg-secondary p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-[15px] font-bold text-text-primary">📝 기록 추가</h3>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary">
            <X size={16} />
          </button>
        </div>

        <div className="mb-3.5">
          <label className="mb-1.5 block text-[11px] font-semibold text-text-muted">유형</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as LabEntryType)}
            className="w-full cursor-pointer rounded-lg border border-white/[.08] bg-white/[.04] px-3 py-2 text-[12px] text-text-primary outline-none"
          >
            {ENTRY_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        <div className="mb-3.5">
          <label className="mb-1.5 block text-[11px] font-semibold text-text-muted">내용</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="이번 기록의 내용을 작성하세요"
            rows={5}
            className="w-full resize-y rounded-lg border border-white/[.08] bg-white/[.04] px-3 py-2 text-[12px] leading-relaxed text-text-primary outline-none placeholder:text-text-muted focus:border-accent/40"
          />
        </div>

        <div className="mb-4">
          <label className="mb-1.5 block text-[11px] font-semibold text-text-muted">첨부파일</label>
          <label
            ref={dropRef}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`flex cursor-pointer flex-col items-center rounded-lg border border-dashed py-3 text-[11px] text-text-muted transition-colors ${
              dragOver ? 'border-accent bg-accent/[.06] text-accent' : 'border-white/[.12] hover:border-accent/40 hover:text-text-secondary'
            }`}
          >
            <Upload size={16} className="mb-1" />
            {dragOver ? '여기에 놓으세요' : '클릭 또는 드래그하여 파일 첨부 (5MB 이하)'}
            <input type="file" multiple accept="image/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.hwp,.hwpx,.txt,.zip" onChange={handleFileChange} className="hidden" />
          </label>
          {files.length > 0 && (
            <div className="mt-2 space-y-1">
              {files.map((f, i) => (
                <div key={i} className="flex items-center gap-2 text-[11px] text-text-muted">
                  <span>📎 {f.name}</span>
                  <button
                    onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
                    className="text-red-400 hover:text-red-300"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg bg-white/[.06] px-4 py-2 text-[12px] font-semibold text-text-muted transition-colors hover:bg-white/[.1]"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={!content.trim() || submitting}
            className="rounded-lg bg-accent px-4 py-2 text-[12px] font-semibold text-bg-primary transition-colors hover:bg-accent/80 disabled:opacity-40"
          >
            {submitting ? '등록 중...' : '등록'}
          </button>
        </div>
      </div>
    </div>
  );
}
