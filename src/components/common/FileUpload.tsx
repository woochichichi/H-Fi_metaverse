import { useState, useRef, useCallback } from 'react';
import { Upload, X, FileText, Image } from 'lucide-react';
import { formatFileSize } from '../../lib/utils';
import { useUiStore } from '../../stores/uiStore';

interface FileUploadProps {
  maxSize: number;
  maxFiles: number;
  accept: readonly string[];
  files: File[];
  onChange: (files: File[]) => void;
}

export default function FileUpload({ maxSize, maxFiles, accept, files, onChange }: FileUploadProps) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { addToast } = useUiStore();

  const handleFiles = useCallback(
    (newFiles: FileList | null) => {
      if (!newFiles) return;
      const arr = Array.from(newFiles);
      const rejected: string[] = [];
      const valid = arr.filter((f) => {
        if (f.size > maxSize) {
          rejected.push(`${f.name}: 파일 크기 초과 (최대 ${formatFileSize(maxSize)})`);
          return false;
        }
        const typeOk = accept.some((type) =>
          type.endsWith('/*') ? f.type.startsWith(type.replace('/*', '/')) : f.type === type
        );
        if (!typeOk) {
          rejected.push(`${f.name}: 지원하지 않는 파일 형식`);
          return false;
        }
        return true;
      });
      if (rejected.length > 0) {
        addToast(rejected[0], 'error');
      }
      const merged = [...files, ...valid].slice(0, maxFiles);
      onChange(merged);
    },
    [files, maxSize, maxFiles, accept, onChange, addToast]
  );

  const removeFile = useCallback(
    (index: number) => {
      onChange(files.filter((_, i) => i !== index));
    },
    [files, onChange]
  );

  return (
    <div className="space-y-2">
      {/* 드롭존 */}
      <div
        className={`flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed p-4 transition-colors duration-200 ${
          dragOver
            ? 'border-accent bg-accent/10'
            : 'border-white/10 bg-white/[.02] hover:border-white/20'
        }`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
      >
        <Upload size={20} className="text-text-muted" />
        <p className="text-xs text-text-muted">
          클릭 또는 드래그하여 파일 추가 (최대 {maxFiles}개, {formatFileSize(maxSize)})
        </p>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={accept.join(',')}
          multiple={maxFiles > 1}
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {/* 파일 목록 */}
      {files.length > 0 && (
        <div className="space-y-1">
          {files.map((file, i) => (
            <div
              key={`${file.name}-${i}`}
              className="flex items-center gap-2 rounded-lg bg-white/[.04] px-3 py-2"
            >
              {file.type.startsWith('image/') ? (
                <Image size={14} className="text-info" />
              ) : (
                <FileText size={14} className="text-warning" />
              )}
              <span className="flex-1 truncate text-xs text-text-secondary">{file.name}</span>
              <span className="text-[10px] text-text-muted">{formatFileSize(file.size)}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(i);
                }}
                className="flex h-5 w-5 items-center justify-center rounded text-text-muted transition-colors hover:bg-white/10 hover:text-danger"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
