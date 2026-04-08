import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, FlaskConical } from 'lucide-react';
import LabHypothesisList from './LabHypothesisList';
import LabHypothesisDetail from './LabHypothesisDetail';
import LabHypothesisForm from './LabHypothesisForm';
import { useLab } from '../../hooks/useLab';
import { useAuthStore } from '../../stores/authStore';
import type { LabHypothesis, LabHypothesisStatus } from '../../types';

interface LabModalProps {
  onClose: () => void;
}

export default function LabModal({ onClose }: LabModalProps) {
  const { profile } = useAuthStore();
  const lab = useLab();
  const isAdmin = profile?.role === 'admin';

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<LabHypothesisStatus | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showEntryForm, setShowEntryForm] = useState(false);
  const pendingSelectRef = useRef<string | null>(null);

  useEffect(() => {
    lab.fetchHypotheses(statusFilter ? { status: statusFilter } : {});
  }, [statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const selected = lab.hypotheses.find((h) => h.id === selectedId) ?? null;

  // 가설 선택 시 엔트리 + 코멘트 로드 (해제 시 클리어)
  useEffect(() => {
    if (selectedId) {
      lab.fetchEntries(selectedId);
      lab.fetchComments(selectedId);
    } else {
      lab.clearDetail();
    }
  }, [selectedId]); // eslint-disable-line react-hooks/exhaustive-deps

  // 첫 로드 시 첫 번째 가설 자동 선택 + 새 가설 생성 후 자동 선택
  useEffect(() => {
    if (pendingSelectRef.current) {
      const target = lab.hypotheses.find((h) => h.id === pendingSelectRef.current);
      if (target) {
        setSelectedId(target.id);
        pendingSelectRef.current = null;
        return;
      }
    }
    if (!selectedId && lab.hypotheses.length > 0) {
      setSelectedId(lab.hypotheses[0].id);
    }
  }, [lab.hypotheses, selectedId]);

  const handleSelect = useCallback((h: LabHypothesis) => {
    setSelectedId(h.id);
    setShowEntryForm(false);
  }, []);

  const handleCreated = useCallback((newId: string) => {
    setShowForm(false);
    pendingSelectRef.current = newId;
    lab.fetchHypotheses(statusFilter ? { status: statusFilter } : {});
  }, [statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDeleted = useCallback(() => {
    setSelectedId(null);
    setShowEntryForm(false);
    lab.fetchHypotheses(statusFilter ? { status: statusFilter } : {});
  }, [statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  // ESC 닫기 (내부 폼 → 모달 순서로 닫기)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showForm) setShowForm(false);
        else if (showEntryForm) setShowEntryForm(false);
        else onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, showForm, showEntryForm]);

  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={() => { if (!showForm && !showEntryForm) onClose(); }} />

      <div
        className="relative z-10 flex flex-col overflow-hidden rounded-2xl border border-white/[.08] bg-bg-primary shadow-2xl animate-[fadeIn_.2s_ease-out]"
        style={{ width: 960, maxWidth: '95vw', height: 680, maxHeight: '90vh' }}
      >
        {/* 헤더 */}
        <div className="flex shrink-0 items-center justify-between border-b border-white/[.06] px-5 py-3.5">
          <h2 className="flex items-center gap-2 text-base font-bold text-text-primary">
            <FlaskConical size={20} className="text-accent" />
            연구실
            <span className="text-[11px] font-normal text-text-muted">— 조직활성화 가설 &amp; 실험</span>
          </h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[.06] text-text-muted transition-colors hover:bg-white/[.12] hover:text-text-primary"
          >
            <X size={16} />
          </button>
        </div>

        {/* 바디 2-column */}
        <div className="flex flex-1 overflow-hidden">
          <LabHypothesisList
            hypotheses={lab.hypotheses}
            selectedId={selectedId}
            statusFilter={statusFilter}
            loading={lab.loading}
            isAdmin={isAdmin}
            onSelect={handleSelect}
            onFilterChange={setStatusFilter}
            onAddClick={() => setShowForm(true)}
          />

          {selected ? (
            <LabHypothesisDetail
              hypothesis={selected}
              entries={lab.entries}
              comments={lab.comments}
              commentProfiles={lab.commentProfiles}
              isAdmin={isAdmin}
              profileId={profile?.id ?? ''}
              loading={lab.detailLoading}
              onUpdateHypothesis={lab.updateHypothesis}
              onDeleteHypothesis={async (id) => { await lab.deleteHypothesis(id); handleDeleted(); }}
              onCreateEntry={lab.createEntry}
              onUpdateEntry={lab.updateEntry}
              onDeleteEntry={lab.deleteEntry}
              onCreateComment={lab.createComment}
              onUpdateComment={lab.updateComment}
              onDeleteComment={lab.deleteComment}
              showEntryForm={showEntryForm}
              onShowEntryForm={setShowEntryForm}
            />
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center text-text-muted">
              <FlaskConical size={48} className="mb-3 opacity-20" />
              <p className="text-sm">
                {lab.hypotheses.length === 0
                  ? isAdmin ? '첫 가설을 등록해보세요' : '아직 등록된 가설이 없습니다'
                  : '좌측에서 가설을 선택하세요'}
              </p>
            </div>
          )}
        </div>

        {/* 새 가설 폼 */}
        {showForm && profile && (
          <LabHypothesisForm
            authorId={profile.id}
            onSubmit={async (input) => {
              const result = await lab.createHypothesis(input);
              if (!result.error && result.data) handleCreated(result.data.id);
              return result;
            }}
            onClose={() => setShowForm(false)}
          />
        )}
      </div>
    </div>,
    document.body,
  );
}
