interface Option<T extends string> {
  value: T | null;
  label: string;
}

interface Props<T extends string> {
  label?: string;
  value: T | null;
  onChange: (v: T | null) => void;
  options: Option<T>[];
}

export default function FilterBar<T extends string>({ label, value, onChange, options }: Props<T>) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
      {label && (
        <span style={{ fontSize: 12, color: 'var(--w-text-muted)', marginRight: 2 }}>{label}</span>
      )}
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.label}
            onClick={() => onChange(opt.value)}
            style={{
              padding: '5px 10px',
              fontSize: 12,
              fontWeight: 600,
              borderRadius: 999,
              background: active ? 'var(--w-accent)' : 'var(--w-surface-2)',
              color: active ? '#fff' : 'var(--w-text-soft)',
              cursor: 'pointer',
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
