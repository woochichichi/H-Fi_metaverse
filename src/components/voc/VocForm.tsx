import { useState, useRef, useEffect, useMemo } from 'react';
import { X, AlertTriangle, Info } from 'lucide-react';
import FileUpload from '../common/FileUpload';
import { useVocs } from '../../hooks/useVocs';
import { useFileUpload } from '../../hooks/useFileUpload';
import { useAuthStore } from '../../stores/authStore';
import { useUiStore } from '../../stores/uiStore';
import { checkMessageSafety } from '../../lib/messageSafety';
import {
  VOC_CATEGORIES, VOC_TARGET_AREAS, VOC_SUB_CATEGORIES,
  VOC_SEVERITY_LABELS, FILE_LIMITS,
} from '../../lib/constants';
import type { VocCategory, VocTargetArea } from '../../lib/constants';
import { detectBannedWords } from '../../lib/profanityFilter';

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
  const [subCategory, setSubCategory] = useState<string | null>(null);
  const [targetArea, setTargetArea] = useState<VocTargetArea | null>(null);
  const [severity, setSeverity] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitStep, setSubmitStep] = useState('');
  const [showProfanityWarning, setShowProfanityWarning] = useState(false);
  const submitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isValid = category && title.trim() && content.trim();

  // 카테고리 변경 시 세부항목 리셋
  useEffect(() => {
    setSubCategory(null);
  }, [category]);

  // 금칙어 실시간 감지
  const detectedWords = useMemo(
    () => detectBannedWords(title + ' ' + content),
    [title, content]
  );

  const showConfirm = showProfanityWarning && detectedWords.length > 0;

  // submitting 타임아웃 15초
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

    // 금칙어 감지 시 경고 팝업
    if (detectedWords.length > 0 && !showProfanityWarning) {
      setShowProfanityWarning(true);
      return;
    }

    setShowProfanityWarning(false);
    setSubmitting(true);

    try {
      // 익명 VOC만 AI 안전성 검사
      if (anonymous) {
        setSubmitStep('AI 검사 중...');
        const safety = await checkMessageSafety(title.trim() + '\n' + content.trim(), 'voc');
        if (!safety.safe) {
          // 사일런트 차단: 사용자에게는 정상 접수처럼 보임
          addToast('VOC가 접수되었습니다', 'success');
          onCreated();
          return;
        }
      }

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
        severity,
        sub_category: subCategory,
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
    : '접수하기';

  const subCats = category ? VOC_SUB_CATEGORIES[category] ?? [] : [];

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
        {/* ① 가이드라인 배너 */}
        <div className="rounded-xl bg-info/10 border border-info/20 p-3">
          <div className="flex items-start gap-2">
            <Info size={14} className="text-info mt-0.5 shrink-0" />
            <div className="text-[11px] text-text-secondary leading-relaxed">
              <p className="font-semibold text-info mb-1">VOC 작성 가이드</p>
              <ul className="space-y-0.5 text-text-muted">
                <li>· <b className="text-text-secondary">건설적 의견만 반영됩니다</b> — 개선을 위한 구체적 제안을 담아주세요</li>
                <li>· 특정인 비방·욕설은 별도 분류되어 <b className="text-text-secondary">비공개 처리</b>됩니다</li>
                <li>· 익명이어도 조직 발전을 위한 <b className="text-text-secondary">책임 있는 의견</b>을 부탁드립니다</li>
                <li>· 접수된 VOC는 리더가 검토 후 <b className="text-text-secondary">처리 결과를 공유</b>합니다</li>
              </ul>
            </div>
          </div>
        </div>

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

        {/* ② 세부항목 (카테고리 선택 후 표시) */}
        {category && subCats.length > 1 && (
          <div>
            <label className="text-xs font-medium text-text-muted mb-1.5 block">
              세부 항목 <span className="text-text-muted">(선택)</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {subCats.map((sub) => (
                <button
                  key={sub}
                  onClick={() => setSubCategory(subCategory === sub ? null : sub)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors duration-200 ${
                    subCategory === sub
                      ? 'bg-warning/30 text-warning'
                      : 'bg-white/[.06] text-text-secondary hover:bg-white/10'
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ② 심각도 척도 (1~5) */}
        <div>
          <label className="text-xs font-medium text-text-muted mb-1.5 block">
            심각도 <span className="text-text-muted">(선택)</span>
          </label>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((level) => (
              <button
                key={level}
                onClick={() => setSeverity(severity === level ? null : level)}
                className={`flex-1 rounded-lg py-1.5 text-center text-xs font-medium transition-all duration-200 ${
                  severity === level
                    ? level <= 2
                      ? 'bg-success/25 text-success ring-1 ring-success/40'
                      : level === 3
                        ? 'bg-warning/25 text-warning ring-1 ring-warning/40'
                        : 'bg-danger/25 text-danger ring-1 ring-danger/40'
                    : 'bg-white/[.06] text-text-muted hover:bg-white/10'
                }`}
              >
                <div className="text-sm">{level}</div>
                <div className="text-[9px] opacity-70">{VOC_SEVERITY_LABELS[level]}</div>
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

        {/* ④ 금칙어 실시간 경고 */}
        {detectedWords.length > 0 && (
          <div className="rounded-xl bg-danger/10 border border-danger/20 p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle size={14} className="text-danger mt-0.5 shrink-0" />
              <div className="text-[11px] text-text-secondary">
                <p className="font-semibold text-danger mb-0.5">부적절한 표현이 감지되었습니다</p>
                <p className="text-text-muted">
                  비방·욕설이 포함된 VOC는 운영자 검토 후 <b className="text-danger">비공개 처리</b>될 수 있습니다.
                  건설적인 표현으로 수정해 주세요.
                </p>
              </div>
            </div>
          </div>
        )}

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

      {/* ④ 금칙어 확인 팝업 */}
      {showConfirm && (
        <div className="border-t border-danger/20 bg-danger/[.08] px-4 py-3 space-y-2">
          <div className="flex items-start gap-2">
            <AlertTriangle size={14} className="text-danger mt-0.5 shrink-0" />
            <p className="text-xs text-text-secondary">
              부적절한 표현이 포함되어 있습니다. 그래도 제출하시겠습니까?
              비방성 내용은 <b className="text-danger">비공개 처리</b>될 수 있습니다.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowProfanityWarning(false)}
              className="flex-1 rounded-lg bg-white/[.08] py-2 text-xs font-medium text-text-secondary hover:bg-white/[.12]"
            >
              수정하기
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 rounded-lg bg-danger/80 py-2 text-xs font-medium text-white hover:bg-danger"
            >
              그래도 제출
            </button>
          </div>
        </div>
      )}

      {/* 제출 */}
      {!showConfirm && (
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
            className="w-full rounded-xl bg-accent py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-accent/80 disabled:opacity-40"
          >
            {buttonLabel}
          </button>
        </div>
      )}
    </div>
  );
}
