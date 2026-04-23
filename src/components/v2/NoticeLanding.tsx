import { AlertTriangle, ArrowRight, CheckCheck } from 'lucide-react';
import type { Notice } from '../../types';
import { useAuthStore } from '../../stores/authStore';
import { useNotices } from '../../hooks/useNotices';
import { useState } from 'react';

interface Props {
  urgent: Notice[];
  onContinue: () => void;
  /** 읽음 처리가 끝나서 더 이상 긴급이 없을 때 부모가 호출되어 랜딩을 닫는다 */
  onAllRead: () => void;
}

/**
 * 미확인 긴급 공지가 있을 때만 노출되는 게이트 페이지.
 * 사용자는 개별 공지를 확인하거나, "나중에 읽기"로 대시보드로 바로 진입 가능(선택).
 * "모두 확인" 버튼으로 일괄 읽음 처리도 가능.
 */
export default function NoticeLanding({ urgent, onContinue, onAllRead }: Props) {
  const user = useAuthStore((s) => s.user);
  const { markAsRead } = useNotices();
  const [processing, setProcessing] = useState<string | null>(null);
  const [localRead, setLocalRead] = useState<Set<string>>(new Set());

  const visible = urgent.filter((n) => !localRead.has(n.id));

  const handleMark = async (noticeId: string) => {
    if (!user) return;
    setProcessing(noticeId);
    try {
      await markAsRead(noticeId, user.id);
      setLocalRead((prev) => {
        const next = new Set(prev);
        next.add(noticeId);
        if (urgent.every((n) => next.has(n.id))) {
          onAllRead();
        }
        return next;
      });
    } finally {
      setProcessing(null);
    }
  };

  const handleMarkAll = async () => {
    if (!user) return;
    setProcessing('__all__');
    try {
      await Promise.all(visible.map((n) => markAsRead(n.id, user.id)));
      onAllRead();
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div
      className="v2-dark"
      style={{
        minHeight: '100vh',
        background: 'var(--w-bg)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '56px 24px',
      }}
    >
      <div style={{ width: '100%', maxWidth: 720 }}>
        {/* 히어로 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--w-urgency-critical)' }}>
            <AlertTriangle size={18} />
            <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.02em' }}>
              확인하지 않은 긴급 공지가 있어요
            </span>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0, color: 'var(--w-text)' }}>
            업무 시작 전에 먼저 살펴볼 공지 {visible.length}건
          </h1>
          <p style={{ fontSize: 14, color: 'var(--w-text-soft)', margin: 0, lineHeight: 1.6 }}>
            이 페이지는 <b style={{ color: 'var(--w-text)' }}>미확인 긴급 공지가 있을 때만</b> 잠깐 노출됩니다.
            확인하거나 닫으면 바로 대시보드로 이동해요.
          </p>
        </div>

        {/* 공지 리스트 */}
        <div className="w-card" style={{ padding: 8, marginBottom: 20 }}>
          {visible.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--w-text-muted)', fontSize: 13 }}>
              모든 긴급 공지를 확인했습니다.
            </div>
          ) : (
            visible.map((n, i) => (
              <div
                key={n.id}
                style={{
                  padding: '14px 14px',
                  borderTop: i === 0 ? 'none' : '1px solid var(--w-border)',
                  display: 'flex',
                  gap: 14,
                  alignItems: 'flex-start',
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    flexShrink: 0,
                    borderRadius: 'var(--w-radius-sm)',
                    background: 'var(--w-urgency-critical-soft)',
                    color: 'var(--w-urgency-critical)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <AlertTriangle size={16} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <span className="w-badge w-badge-critical">긴급</span>
                    {n.category && <span className="w-badge w-badge-muted">{n.category}</span>}
                    {n.team && <span className="w-badge w-badge-muted">{n.team}</span>}
                  </div>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 600,
                      color: 'var(--w-text)',
                      marginBottom: 4,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {n.title}
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: 'var(--w-text-soft)',
                      lineHeight: 1.5,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {n.content}
                  </div>
                </div>
                <button
                  onClick={() => handleMark(n.id)}
                  disabled={processing === n.id}
                  className="w-btn w-btn-primary"
                  style={{ opacity: processing === n.id ? 0.6 : 1 }}
                >
                  <CheckCheck size={14} />
                  <span>확인</span>
                </button>
              </div>
            ))
          )}
        </div>

        {/* 액션 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <button
            onClick={onContinue}
            className="w-btn w-btn-ghost"
            title="나중에 읽고 대시보드로 이동"
          >
            <span>나중에 읽기</span>
            <ArrowRight size={14} />
          </button>
          {visible.length > 0 && (
            <button
              onClick={handleMarkAll}
              disabled={processing === '__all__'}
              className="w-btn w-btn-primary"
              style={{ opacity: processing === '__all__' ? 0.6 : 1 }}
            >
              <CheckCheck size={14} />
              <span>모두 확인하고 들어가기</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
