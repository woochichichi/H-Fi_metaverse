import { useState, useEffect, useCallback } from 'react';
import { Plus, X, Filter } from 'lucide-react';
import NoticeList from './NoticeList';
import NoticeForm from './NoticeForm';
import NoticeDetail from './NoticeDetail';
import { useNotices } from '../../hooks/useNotices';
import { useAuthStore } from '../../stores/authStore';
import { NOTICE_CATEGORIES } from '../../lib/constants';
import type { UrgencyLevel, NoticeCategory } from '../../lib/constants';
import type { Notice } from '../../types';

type ViewMode = 'list' | 'form' | 'detail';

interface NoticePanelProps {
  onClose?: () => void;
}

export default function NoticePanel({ onClose }: NoticePanelProps) {
  const { profile, user } = useAuthStore();
  const { notices, loading, error, readIds, fetchNotices, fetchMyReads } = useNotices();

  const [view, setView] = useState<ViewMode>('list');
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
  const [filterUrgency, setFilterUrgency] = useState<UrgencyLevel | null>(null);
  const [filterCategory, setFilterCategory] = useState<NoticeCategory | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const isLeader = profile?.role === 'admin' || profile?.role === 'director' || profile?.role === 'leader';

  const loadNotices = useCallback(() => {
    fetchNotices({
      urgency: filterUrgency,
      category: filterCategory,
    });
  }, [fetchNotices, filterUrgency, filterCategory]);

  useEffect(() => {
    loadNotices();
  }, [loadNotices]);

  // 읽음 상태 로드
  useEffect(() => {
    if (user) {
      fetchMyReads(user.id);
    }
  }, [user, fetchMyReads]);

  const handleSelect = (notice: Notice) => {
    setSelectedNotice(notice);
    setView('detail');
  };

  const handleBack = () => {
    setSelectedNotice(null);
    setView('list');
    loadNotices();
    if (user) fetchMyReads(user.id);
  };

  const handleCreated = () => {
    setView('list');
    loadNotices();
  };

  if (view === 'form') {
    return <NoticeForm onClose={handleBack} onCreated={handleCreated} />;
  }

  if (view === 'detail' && selectedNotice) {
    return <NoticeDetail notice={selectedNotice} onBack={handleBack} />;
  }

  const URGENCY_CHIPS: { value: UrgencyLevel | null; label: string }[] = [
    { value: null, label: '전체' },
    { value: '긴급', label: '🔴 긴급' },
    { value: '할일', label: '🟡 할일' },
    { value: '참고', label: '🔵 참고' },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* 헤더 */}
      <div className="flex items-center justify-between border-b border-white/[.06] px-4 py-3">
        <h2 className="font-heading text-base font-bold text-text-primary">📋 공지사항</h2>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
              showFilters ? 'bg-accent/20 text-accent' : 'text-text-muted hover:bg-white/10 hover:text-text-primary'
            }`}
            title="필터"
          >
            <Filter size={15} />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-white/10 hover:text-text-primary"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* 보드 설명 */}
      <div className="border-b border-white/[.06] bg-accent/[.04] px-4 py-2">
        <p className="text-[11px] leading-relaxed text-text-muted">
          <span className="font-semibold text-text-secondary">놓치면 안 되는 소식을 한눈에</span> — 팀 공지, 일정, 필독 안내를 시급성(긴급/할일/참고)별로 확인하세요. 중요한 공지는 알림으로 즉시 전달되며, 읽음 여부가 자동 추적됩니다.
        </p>
      </div>

      {/* 시급성 필터 (항상 표시) */}
      <div className="border-b border-white/[.06] px-4 py-2">
        <div className="flex gap-1">
          {URGENCY_CHIPS.map((chip) => (
            <button
              key={chip.label}
              onClick={() => setFilterUrgency(chip.value)}
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium transition-colors ${
                filterUrgency === chip.value
                  ? 'bg-accent text-white'
                  : 'bg-white/[.06] text-text-muted hover:bg-white/10'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* 카테고리 필터 (토글) */}
      {showFilters && (
        <div className="border-b border-white/[.06] px-4 py-2">
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => setFilterCategory(null)}
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium transition-colors ${
                !filterCategory ? 'bg-accent text-white' : 'bg-white/[.06] text-text-muted hover:bg-white/10'
              }`}
            >
              전체
            </button>
            {NOTICE_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(filterCategory === cat ? null : cat)}
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium transition-colors ${
                  filterCategory === cat ? 'bg-accent text-white' : 'bg-white/[.06] text-text-muted hover:bg-white/10'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 공지 목록 */}
      <div className="flex-1 overflow-y-auto p-4">
        <NoticeList
          notices={notices}
          loading={loading}
          error={error}
          readIds={readIds}
          onSelect={handleSelect}
          onRetry={loadNotices}
        />
      </div>

      {/* FAB: 새 공지 (리더만) */}
      {isLeader && (
        <button
          onClick={() => setView('form')}
          className="absolute bottom-6 right-6 flex h-12 w-12 items-center justify-center rounded-full bg-accent text-white shadow-lg transition-colors duration-200 hover:bg-accent/80"
          style={{ boxShadow: '0 4px 20px rgba(108,92,231,.4)' }}
          title="새 공지"
        >
          <Plus size={22} />
        </button>
      )}
    </div>
  );
}
