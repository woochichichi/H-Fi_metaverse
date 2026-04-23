import React from 'react';

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  width?: number | string;
  align?: 'left' | 'center' | 'right';
  render: (row: T, index: number) => React.ReactNode;
}

interface Props<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  empty?: React.ReactNode;
  loading?: boolean;
  rowClassName?: (row: T) => string | undefined;
}

/**
 * v2 대시보드용 데이터 테이블.
 * surface + 옅은 border, hover 시 surface-2로 강조.
 */
export default function DataTable<T>({ columns, rows, rowKey, empty, loading, rowClassName }: Props<T>) {
  if (loading) {
    return (
      <div
        style={{
          padding: 40,
          textAlign: 'center',
          fontSize: 13,
          color: 'var(--w-text-muted)',
        }}
      >
        불러오는 중...
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div
        style={{
          padding: 40,
          textAlign: 'center',
          fontSize: 13,
          color: 'var(--w-text-muted)',
        }}
      >
        {empty ?? '데이터가 없어요'}
      </div>
    );
  }

  return (
    <div style={{ overflow: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--w-border)', background: 'var(--w-surface-2)' }}>
            {columns.map((c) => (
              <th
                key={c.key}
                style={{
                  padding: '10px 12px',
                  textAlign: c.align ?? 'left',
                  fontWeight: 700,
                  color: 'var(--w-text-muted)',
                  fontSize: 11,
                  letterSpacing: '0.02em',
                  whiteSpace: 'nowrap',
                  width: c.width,
                }}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const extra = rowClassName?.(row);
            return (
              <tr
                key={rowKey(row)}
                className={extra}
                style={{
                  borderBottom: '1px solid var(--w-border)',
                  transition: 'background 0.1s ease',
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLTableRowElement).style.background = 'var(--w-surface-2)')}
                onMouseLeave={(e) => ((e.currentTarget as HTMLTableRowElement).style.background = 'transparent')}
              >
                {columns.map((c) => (
                  <td
                    key={c.key}
                    style={{
                      padding: '10px 12px',
                      textAlign: c.align ?? 'left',
                      color: 'var(--w-text)',
                      verticalAlign: 'middle',
                    }}
                  >
                    {c.render(row, i)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
