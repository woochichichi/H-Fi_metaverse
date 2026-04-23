import { Inbox } from 'lucide-react';

interface Props {
  icon?: React.ComponentType<{ size?: number; color?: string }>;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export default function EmptyState({ icon: Icon = Inbox, title, description, action }: Props) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '56px 24px',
        textAlign: 'center',
        gap: 10,
      }}
    >
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: 'var(--w-radius-lg)',
          background: 'var(--w-surface-2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--w-text-muted)',
        }}
      >
        <Icon size={22} />
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--w-text)' }}>{title}</div>
      {description && <div style={{ fontSize: 13, color: 'var(--w-text-muted)' }}>{description}</div>}
      {action && <div style={{ marginTop: 8 }}>{action}</div>}
    </div>
  );
}
