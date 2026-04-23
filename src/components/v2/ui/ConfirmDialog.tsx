import Modal from './Modal';

interface Props {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = '확인',
  cancelLabel = '취소',
  danger,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      width={440}
      footer={
        <>
          <button className="w-btn w-btn-ghost" onClick={onCancel}>{cancelLabel}</button>
          <button
            onClick={onConfirm}
            className="w-btn"
            style={{
              background: danger ? 'var(--w-danger)' : 'var(--w-accent)',
              color: '#fff',
            }}
          >
            {confirmLabel}
          </button>
        </>
      }
    >
      <p style={{ fontSize: 13, color: 'var(--w-text-soft)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
        {message}
      </p>
    </Modal>
  );
}
