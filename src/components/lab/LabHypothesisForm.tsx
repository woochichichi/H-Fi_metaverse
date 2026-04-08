import { useState, useRef } from 'react';
import { X, Upload } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { LabHypothesisCategory } from '../../types';

const CATEGORIES: LabHypothesisCategory[] = ['구조', '문화', '소통', '참여', '성장', '기타'];

interface Props {
  authorId: string;
  onSubmit: (input: {
    title: string;
    description: string;
    category: LabHypothesisCategory;
    author_id: string;
    attachment_urls?: string[];
  }) => Promise<{ error: string | null }>;
  onClose: () => void;
}

export default function LabHypothesisForm({ authorId, onSubmit, onClose }: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<LabHypothesisCategory>('구조');
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const dropRef = useRef<HTMLLabelElement>(null);

  const addFiles = (newFiles: File[]) => {
    const valid = newFiles.filter((f) => f.size <= 5 * 1024 * 1024 && (f.type.startsWith('image/') || f.type === 'application/pdf'));
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
      const ext = file.name.split('.').pop();
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
    if (!title.trim() || !description.trim() || submitting) return;
    setSubmitting(true);

    let attachmentUrls: string[] = [];
    if (files.length > 0) {
      setUploading(true);
      attachmentUrls = await uploadFiles();
      setUploading(false);
    }

    await onSubmit({
      title: title.trim(),
      description: description.trim(),
      category,
      author_id: authorId,
      attachment_urls: attachmentUrls.length > 0 ? attachmentUrls : undefined,
    });
    setSubmitting(false);
  };

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60">
      <div className="w-[420px] rounded-2xl border border-white/[.08] bg-bg-secondary p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-[15px] font-bold text-text-primary">🔬 새 가설 추가</h3>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary">
            <X size={16} />
          </button>
        </div>

        <div className="mb-3.5">
          <label className="mb-1.5 block text-[11px] font-semibold text-text-muted">제목</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="가설을 한 줄로 요약"
            className="w-full rounded-lg border border-white/[.08] bg-white/[.04] px-3 py-2 text-[12px] text-text-primary outline-none placeholder:text-text-muted focus:border-accent/40"
          />
        </div>

        <div className="mb-3.5">
          <label className="mb-1.5 block text-[11px] font-semibold text-text-muted">카테고리</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as LabHypothesisCategory)}
            className="w-full cursor-pointer rounded-lg border border-white/[.08] bg-white/[.04] px-3 py-2 text-[12px] text-text-primary outline-none"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="mb-3.5">
          <label className="mb-1.5 block text-[11px] font-semibold text-text-muted">배경 &amp; 설명</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="왜 이 가설을 세웠는지, 검증하고 싶은 것이 무엇인지"
            rows={4}
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
            {dragOver ? '여기에 놓으세요' : '클릭 또는 드래그하여 파일 첨부 (이미지, PDF / 5MB 이하)'}
            <input type="file" multiple accept="image/*,.pdf" onChange={handleFileChange} className="hidden" />
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
            disabled={!title.trim() || !description.trim() || submitting}
            className="rounded-lg bg-accent px-4 py-2 text-[12px] font-semibold text-bg-primary transition-colors hover:bg-accent/80 disabled:opacity-40"
          >
            {uploading ? '업로드 중...' : submitting ? '등록 중...' : '등록'}
          </button>
        </div>
      </div>
    </div>
  );
}
