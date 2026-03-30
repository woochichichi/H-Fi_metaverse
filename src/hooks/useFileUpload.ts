import { useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

interface UploadResult {
  path: string;
  url: string;
}

interface UseFileUploadOptions {
  bucket: string;
  maxSize: number;
  maxFiles: number;
  accept: readonly string[];
}

export function useFileUpload({ bucket, maxSize, maxFiles, accept }: UseFileUploadOptions) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const validateFile = useCallback(
    (file: File): string | null => {
      if (file.size > maxSize) {
        return `파일 크기가 ${(maxSize / 1024 / 1024).toFixed(0)}MB를 초과합니다`;
      }
      const isAllowed = accept.some((type) => {
        if (type.endsWith('/*')) {
          return file.type.startsWith(type.replace('/*', '/'));
        }
        return file.type === type;
      });
      if (!isAllowed) {
        return '허용되지 않는 파일 형식입니다';
      }
      return null;
    },
    [maxSize, accept]
  );

  const upload = useCallback(
    async (files: File[]): Promise<UploadResult[]> => {
      if (files.length > maxFiles) {
        setError(`최대 ${maxFiles}개까지 업로드할 수 있습니다`);
        return [];
      }

      for (const file of files) {
        const err = validateFile(file);
        if (err) {
          setError(err);
          return [];
        }
      }

      setUploading(true);
      setError(null);
      setProgress(0);

      const results: UploadResult[] = [];
      const controller = new AbortController();
      abortRef.current = controller;

      // 30초 타임아웃
      const timeout = setTimeout(() => controller.abort(), 30000);

      try {
        for (let i = 0; i < files.length; i++) {
          if (controller.signal.aborted) break;

          const file = files[i];
          const ext = file.name.split('.').pop();
          const path = `${Date.now()}_${crypto.randomUUID().slice(0, 8)}.${ext}`;

          // 가짜 진행률: 파일별 0~90% 구간을 3초간 채움
          const baseProgress = Math.round((i / files.length) * 100);
          const fileProgress = Math.round((1 / files.length) * 90);
          const progressInterval = setInterval(() => {
            setProgress((prev) => {
              const target = baseProgress + fileProgress;
              return prev < target ? prev + 2 : prev;
            });
          }, 100);

          const { data, error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(path, file);

          clearInterval(progressInterval);

          if (uploadError) {
            // abort에 의한 에러인지 확인
            if (controller.signal.aborted) {
              throw new DOMException('Upload timeout', 'AbortError');
            }
            console.error('업로드 실패:', uploadError.message);
            setError(`업로드 실패: ${uploadError.message}`);
            // 업로드 실패해도 이미 올린 파일 결과는 반환
            break;
          }

          const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
          results.push({ path: data.path, url: urlData.publicUrl });
          setProgress(Math.round(((i + 1) / files.length) * 100));
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          setError('파일 업로드 시간이 초과되었습니다. 다시 시도해주세요');
        } else {
          setError(err instanceof Error ? err.message : '업로드 중 오류가 발생했습니다');
        }
      } finally {
        clearTimeout(timeout);
        abortRef.current = null;
        setUploading(false);
      }

      return results;
    },
    [bucket, maxFiles, validateFile]
  );

  return { upload, uploading, progress, error, validateFile, setError };
}
