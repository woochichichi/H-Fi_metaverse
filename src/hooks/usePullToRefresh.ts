import { useCallback, useEffect, useRef, useState } from 'react';

interface Options {
  /** 새로고침 트리거 임계치(px). 기본 72 */
  threshold?: number;
  /** 스와이프 당기는 저항 계수(0.3~1). 기본 0.5 — 토스·당근 수준의 묵직함 */
  resistance?: number;
  /** 한 번 트리거된 뒤 연속 트리거 방지 지연(ms). 기본 900 */
  cooldown?: number;
  /** 비활성화 플래그 (이미 로딩중 등) */
  disabled?: boolean;
}

interface Result {
  /** Pull 거리(px) — 시각적 인디케이터 렌더용 */
  pullDistance: number;
  /** 새로고침 중 여부 */
  isRefreshing: boolean;
  /** 트리거 임계치 초과 여부 (릴리스 시 실행 예정) */
  willTrigger: boolean;
  /** 스크롤 컨테이너에 연결할 ref */
  containerRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * 모바일 하향 스와이프 새로고침 (토스/당근 패턴).
 *
 * 사용:
 *   const { containerRef, pullDistance, isRefreshing } = usePullToRefresh(fetchData);
 *   <div ref={containerRef} className="overflow-y-auto">…</div>
 *
 * 주의:
 * - 컨테이너의 scrollTop === 0 일 때만 활성화 (중간 스크롤 상태에선 페이지 스크롤 유지)
 * - touchmove passive:false 필요 — 스크롤 방향 잠금
 */
export function usePullToRefresh(
  onRefresh: () => Promise<unknown> | unknown,
  options: Options = {},
): Result {
  const { threshold = 72, resistance = 0.5, cooldown = 900, disabled = false } = options;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef<number | null>(null);
  const lastTriggerAt = useRef<number>(0);

  const handleRefresh = useCallback(async () => {
    const now = Date.now();
    if (now - lastTriggerAt.current < cooldown) return;
    lastTriggerAt.current = now;
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      // 최소 400ms는 "새로고침 중" 상태 유지 — 너무 빨라 체감 안 되는 것 방지
      setTimeout(() => setIsRefreshing(false), 400);
    }
  }, [onRefresh, cooldown]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || disabled) return;

    const onTouchStart = (e: TouchEvent) => {
      if (el.scrollTop > 0 || isRefreshing) {
        startY.current = null;
        return;
      }
      startY.current = e.touches[0].clientY;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (startY.current == null || isRefreshing) return;
      const dy = e.touches[0].clientY - startY.current;
      if (dy <= 0) {
        setPullDistance(0);
        return;
      }
      // 저항: 당기는 양을 resistance 만큼 감쇠
      const resisted = dy * resistance;
      // 네이티브 스크롤 이벤트 억제 (고무줄 스크롤 방지)
      if (e.cancelable) e.preventDefault();
      setPullDistance(Math.min(resisted, threshold * 1.5));
    };

    const onTouchEnd = () => {
      if (startY.current == null) {
        setPullDistance(0);
        return;
      }
      const shouldTrigger = pullDistance >= threshold && !isRefreshing;
      setPullDistance(0);
      startY.current = null;
      if (shouldTrigger) {
        void handleRefresh();
      }
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    el.addEventListener('touchcancel', onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [disabled, isRefreshing, pullDistance, threshold, resistance, handleRefresh]);

  return {
    pullDistance,
    isRefreshing,
    willTrigger: pullDistance >= threshold,
    containerRef,
  };
}
