import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useGatherings } from '../../hooks/useGatherings';
import { useAuthStore } from '../../stores/authStore';
import { useUiStore } from '../../stores/uiStore';
import { GATHERING_CATEGORIES } from '../../lib/constants';
import type { GatheringCategory } from '../../lib/constants';
import type { Gathering } from '../../types';

interface GatheringFormProps {
  onClose: () => void;
  onCreated: () => void;
  editData?: Gathering;
}

function toLocalDatetime(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function GatheringForm({ onClose, onCreated, editData }: GatheringFormProps) {
  const { user } = useAuthStore();
  const { addToast } = useUiStore();
  const { createGathering, updateGathering } = useGatherings();

  const isEdit = !!editData;

  const [title, setTitle] = useState(editData?.title ?? '');
  const [description, setDescription] = useState(editData?.description ?? '');
  const [category, setCategory] = useState<GatheringCategory>(editData?.category ?? '기타');
  const [maxMembers, setMaxMembers] = useState(editData?.max_members?.toString() ?? '');
  const [contactInfo, setContactInfo] = useState(editData?.contact_info ?? '');
  const [deadline, setDeadline] = useState(toLocalDatetime(editData?.deadline ?? null));
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user) return;
    if (!title.trim() || !description.trim()) {
      addToast('제목과 설명을 입력해주세요', 'error');
      return;
    }

    setSubmitting(true);
    try {
      if (isEdit) {
        const { error } = await updateGathering(editData.id, {
          title: title.trim(),
          description: description.trim(),
          category,
          max_members: maxMembers ? parseInt(maxMembers, 10) : null,
          contact_info: contactInfo.trim() || null,
          deadline: deadline ? new Date(deadline).toISOString() : null,
        });
        if (error) {
          addToast(`수정 실패: ${error}`, 'error');
        } else {
          addToast('모임이 수정되었습니다', 'success');
          onCreated();
        }
      } else {
        const { error } = await createGathering({
          author_id: user.id,
          title: title.trim(),
          description: description.trim(),
          category,
          max_members: maxMembers ? parseInt(maxMembers, 10) : null,
          contact_info: contactInfo.trim() || null,
          deadline: deadline ? new Date(deadline).toISOString() : null,
        });
        if (error) {
          addToast(`등록 실패: ${error}`, 'error');
        } else {
          addToast('모임이 등록되었습니다', 'success');
          onCreated();
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : '알 수 없는 오류';
      addToast(`${isEdit ? '수정' : '등록'} 실패: ${msg}`, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* 헤더 */}
      <div className="flex items-center gap-2 border-b border-white/[.06] px-4 py-3">
        <button
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-white/[.08] hover:text-text-primary"
        >
          <ArrowLeft size={16} />
        </button>
        <h2 className="font-heading text-base font-bold text-text-primary">{isEdit ? '모임 수정' : '새 모임 만들기'}</h2>
      </div>

      {/* 폼 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* 카테고리 */}
        <div>
          <label className="block text-xs font-medium text-text-muted mb-1.5">카테고리</label>
          <div className="flex flex-wrap gap-1.5">
            {GATHERING_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  category === cat ? 'bg-accent text-white' : 'bg-white/[.06] text-text-muted hover:bg-white/10'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* 제목 */}
        <div>
          <label className="block text-xs font-medium text-text-muted mb-1.5">제목</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="모임 제목을 입력하세요"
            className="w-full rounded-lg bg-white/[.06] px-3 py-2 text-sm text-text-primary outline-none placeholder:text-text-muted/50 focus:ring-2 focus:ring-accent/40"
            maxLength={50}
          />
        </div>

        {/* 설명 */}
        <div>
          <label className="block text-xs font-medium text-text-muted mb-1.5">설명</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="모임에 대해 설명해주세요 (장소, 시간 등)"
            rows={4}
            className="w-full rounded-lg bg-white/[.06] px-3 py-2 text-sm text-text-primary outline-none placeholder:text-text-muted/50 focus:ring-2 focus:ring-accent/40 resize-none"
            maxLength={500}
          />
        </div>

        {/* 최대 인원 */}
        <div>
          <label className="block text-xs font-medium text-text-muted mb-1.5">최대 인원 (선택)</label>
          <input
            type="number"
            value={maxMembers}
            onChange={(e) => setMaxMembers(e.target.value)}
            placeholder="제한 없음"
            min={2}
            max={60}
            className="w-full rounded-lg bg-white/[.06] px-3 py-2 text-sm text-text-primary outline-none placeholder:text-text-muted/50 focus:ring-2 focus:ring-accent/40"
          />
        </div>

        {/* 마감 기한 */}
        <div>
          <label className="block text-xs font-medium text-text-muted mb-1.5">모집 마감일 (선택)</label>
          <input
            type="datetime-local"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="w-full rounded-lg bg-white/[.06] px-3 py-2 text-sm text-text-primary outline-none placeholder:text-text-muted/50 focus:ring-2 focus:ring-accent/40"
          />
        </div>

        {/* 연락 방법 */}
        <div>
          <label className="block text-xs font-medium text-text-muted mb-1.5">연락 방법 (마감 후 참여자에게 공개)</label>
          <input
            value={contactInfo}
            onChange={(e) => setContactInfo(e.target.value)}
            placeholder="예: 카톡 오픈채팅 링크, 메일 등"
            className="w-full rounded-lg bg-white/[.06] px-3 py-2 text-sm text-text-primary outline-none placeholder:text-text-muted/50 focus:ring-2 focus:ring-accent/40"
            maxLength={200}
          />
          <p className="mt-1 text-[10px] text-text-muted/60">모집 중에는 숨겨지며, 마감 후 참여자에게만 공개됩니다</p>
        </div>
      </div>

      {/* 하단 버튼 */}
      <div className="border-t border-white/[.06] p-4">
        <button
          onClick={handleSubmit}
          disabled={submitting || !title.trim() || !description.trim()}
          className="w-full rounded-lg bg-accent py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent/80 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {submitting ? (isEdit ? '수정 중...' : '등록 중...') : (isEdit ? '수정 완료' : '모임 등록')}
        </button>
      </div>
    </div>
  );
}
