interface Crumb {
  label: string;
  badge?: {
    text: string;
    tone?: 'accent' | 'info' | 'muted' | 'critical' | 'todo';
  };
}

interface Props {
  crumbs: Crumb[];
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export default function PageHeader({ crumbs, title, description, actions }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--w-text-muted)' }}>
        {crumbs.map((c, i) => (
          <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            {i > 0 && <span style={{ color: 'var(--w-text-muted)' }}>/</span>}
            <span style={{ color: i === crumbs.length - 1 ? 'var(--w-text)' : 'var(--w-text-muted)' }}>
              {c.label}
            </span>
            {c.badge && (
              <span className={`w-badge w-badge-${c.badge.tone ?? 'muted'}`}>
                {c.badge.text}
              </span>
            )}
          </span>
        ))}
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--w-text)' }}>{title}</h1>
          {description && (
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--w-text-soft)' }}>{description}</p>
          )}
        </div>
        {actions && <div style={{ display: 'flex', gap: 8 }}>{actions}</div>}
      </div>
    </div>
  );
}
