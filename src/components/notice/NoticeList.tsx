import { useState, useEffect } from 'react';
import { Pin, Paperclip, RefreshCw } from 'lucide-react';
import UrgencyBadge from '../common/UrgencyBadge';
import LoadMore from '../common/LoadMore';
import { formatRelativeTime } from '../../lib/utils';
import type { Notice } from '../../types';

const CATEGORY_CONFIG: Record<string, { color: string; bg: string }> = {
  '일반': { color: '#94a3b8', bg: 'rgba(148,163,184,.15)' },
  '이벤트': { color: '#f59e0b', bg: 'rgba(245,158,11,.15)' },
  '활동보고': { color: '#6C5CE7', bg: 'rgba(108,92,231,.15)' },
};

interface NoticeListProps {
  notices: Notice[];
  loading: boolean;
  error?: string | null;
  readIds: Set<string>;
  onSelect: (notice: Notice) => void;
  onRetry?: () => void;
}

function Skeleton() {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-white/[.06] bg-white/[.03] p-3 animate-pulse">
      <div className="flex justify-between">
        <div className="h-4 w-16 rounded-full bg-white/10" />
        <div className="h-4 w-12 rounded-full bg-white/10" />
      </div>
      <div className="h-4 w-3/4 rounded bg-white/10" />
      <div className="h-3 w-1/2 rounded bg-white/[.06]" />
    </div>
  );
}

const PAGE_SIZE = 20;

export default function NoticeList({ notices, loading, error, readIds, onSelect, onRetry }: NoticeListProps) {
  const [skeletonTimeout, setSkeletonTimeout] = useState(false);
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE);

  useEffect(() => {
    if (!loading) {
      setSkeletonTimeout(false);
      return;
    }
    const timer = setTimeout(() => setSkeletonTimeout(true), 10000);
    return () => clearTimeout(timer);
  }, [loading]);

  if (loading && skeletonTimeout) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <span className="text-3xl mb-2">⚠️</span>
        <p className="text-sm text-text-muted mb-3">로딩에 실패했습니다. 새로고침해주세요</p>
        {onRetry && (
          <button onClick={onRetry} className="flex items-center gap-1.5 rounded-lg bg-accent/20 px-3 py-1.5 text-xs font-medium text-accent transition-colors hover:bg-accent/30">
            <RefreshCw size={13} /> 새로고침
          </button>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <span className="text-3xl mb-2">⚠️</span>
        <p className="text-sm text-text-muted mb-3">{error}</p>
        {onRetry && (
          <button onClick={onRetry} className="flex items-center gap-1.5 rounded-lg bg-accent/20 px-3 py-1.5 text-xs font-medium text-accent transition-colors hover:bg-accent/30">
            <RefreshCw size={13} /> 새로고침
          </button>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} />
        ))}
      </div>
    );
  }

  if (notices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <span className="text-3xl mb-2">📋</span>
        <p className="text-sm text-text-muted">새 소식이 없어요</p>
      </div>
    );
  }

  const visible = notices.slice(0, displayCount);

  return (
    <div className="flex flex-col gap-2">
      {visible.map((notice) => {
        const isRead = readIds.has(notice.id);
        const catConfig = CATEGORY_CONFIG[notice.category] ?? CATEGORY_CONFIG['일반'];

        return (
          <button
            key={notice.id}
            onClick={() => onSelect(notice)}
            className={`relative flex w-full flex-col gap-2 rounded-xl border p-3 text-left transition-colors duration-200 hover:bg-white/[.06] ${
              isRead
                ? 'border-white/[.06] bg-white/[.02]'
                : 'border-accent/20 bg-white/[.04]'
            }`}
          >
            {/* 안읽음 dot */}
            {!isRead && (
              <span className="absolute left-1.5 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-accent" />
            )}

            {/* 상단: 시급성 + 카테고리 + 고정 */}
            <div className="flex items-center gap-1.5 pl-2">
              <UrgencyBadge urgency={notice.urgency} />
              <span
                className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium"
                style={{ color: catConfig.color, backgroundColor: catConfig.bg }}
              >
                {notice.category}
              </span>
              {notice.pinned && (
                <Pin size={12} className="text-warning" />
              )}
            </div>

            {/* 제목 */}
            <h3 className={`text-sm font-semibold line-clamp-1 pl-2 ${
              isRead ? 'text-text-secondary' : 'text-text-primary'
            }`}>
              {notice.title}
            </h3>

            {/* 하단: 메타 */}
            <div className="flex items-center gap-2 pl-2 text-[11px] text-text-muted">
              <span>{formatRelativeTime(notice.created_at)}</span>
              {notice.attachment_urls && notice.attachment_urls.length > 0 && (
                <>
                  <span>·</span>
                  <span className="flex items-center gap-0.5">
                    <Paperclip size={10} /> {notice.attachment_urls.length}
                  </span>
                </>
              )}
            </div>
          </button>
        );
      })}
      <LoadMore current={visible.length} total={notices.length} onLoadMore={() => setDisplayCount((c) => c + PAGE_SIZE)} />
    </div>
  );
}
