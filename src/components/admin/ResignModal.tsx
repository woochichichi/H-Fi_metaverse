import { createPortal } from 'react-dom';

interface ResignModalProps {
  userName: string;
  isResigned: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ResignModal({ userName, isResigned, onConfirm, onCancel }: ResignModalProps) {
  return createPortal(
    <>
      <div className="fixed inset-0 z-[300] bg-black/50" onClick={onCancel} />
      <div className="fixed left-1/2 top-1/2 z-[301] w-80 -translate-x-1/2 -translate-y-1/2 rounded-xl border border-white/[.08] bg-bg-secondary p-5 shadow-2xl">
        <h4 className="mb-3 text-sm font-bold text-text-primary">
          {isResigned ? '퇴사 복원 확인' : '퇴사 처리 확인'}
        </h4>
        {isResigned ? (
          <p className="mb-4 text-xs text-text-secondary">
            <strong>{userName}</strong>님의 퇴사 처리를 복원하시겠습니까?
            <br />
            <span className="text-text-muted">복원 후 다시 로그인할 수 있습니다.</span>
          </p>
        ) : (
          <div className="mb-4">
            <p className="mb-2 text-xs text-text-secondary">
              <strong>{userName}</strong>님을 퇴사 처리하시겠습니까?
            </p>
            <div className="rounded-lg bg-danger/10 px-3 py-2 text-[11px] text-danger">
              <p className="font-semibold">퇴사 처리 시:</p>
              <ul className="mt-1 list-inside list-disc space-y-0.5 text-danger/80">
                <li>즉시 로그인 차단</li>
                <li>맵/접속자 목록에서 숨김</li>
                <li>기존 게시글/데이터는 유지</li>
              </ul>
            </div>
          </div>
        )}
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-lg px-4 py-1.5 text-xs text-text-muted hover:bg-white/[.06]"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            className={`rounded-lg px-4 py-1.5 text-xs font-semibold text-white ${
              isResigned
                ? 'bg-success hover:bg-success/80'
                : 'bg-danger hover:bg-danger/80'
            }`}
          >
            {isResigned ? '복원' : '퇴사 처리'}
          </button>
        </div>
      </div>
    </>,
    document.body
  );
}
