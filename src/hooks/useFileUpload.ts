import { useState, useCallback } from 'react';
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

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const ext = file.name.split('.').pop();
        const path = `${Date.now()}_${crypto.randomUUID().slice(0, 8)}.${ext}`;

        const { data, error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(path, file);

        if (uploadError) {
          console.error('업로드 실패:', uploadError.message);
          setError(`업로드 실패: ${uploadError.message}`);
          setUploading(false);
          return results;
        }

        const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);

        results.push({ path: data.path, url: urlData.publicUrl });
        setProgress(Math.round(((i + 1) / files.length) * 100));
      }

      setUploading(false);
      return results;
    },
    [bucket, maxFiles, validateFile]
  );

  return { upload, uploading, progress, error, validateFile, setError };
}
