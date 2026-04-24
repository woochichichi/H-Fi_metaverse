import { RefreshCw } from 'lucide-react';

interface Props {
  pullDistance: number;
  isRefreshing: boolean;
  willTrigger: boolean;
}

/**
 * 당겨서 새로고침 인디케이터 (토스/당근 스타일).
 * 컨테이너 상단에 absolute로 배치, pull 거리에 따라 회전·등장.
 */
export default function PullToRefreshIndicator({
  pullDistance,
  isRefreshing,
  willTrigger,
}: Props) {
  const visible = pullDistance > 4 || isRefreshing;
  if (!visible) return null;

  const progress = Math.min(pullDistance / 72, 1);
  const rotate = isRefreshing ? 0 : progress * 360;

  return (
    <div
      className="pointer-events-none absolute left-1/2 z-20 flex -translate-x-1/2 items-center justify-center rounded-full bg-accent/25 backdrop-blur-sm"
      style={{
        top: Math.max(8, pullDistance - 32),
        width: 36,
        height: 36,
        opacity: Math.min(progress + 0.2, 1),
        transition: isRefreshing ? 'opacity .2s' : 'none',
      }}
    >
      <RefreshCw
        size={16}
        className={`text-accent-light ${isRefreshing ? 'animate-spin' : ''}`}
        style={{
          transform: isRefreshing ? undefined : `rotate(${rotate}deg)`,
          color: willTrigger && !isRefreshing ? '#fff' : undefined,
        }}
      />
    </div>
  );
}
