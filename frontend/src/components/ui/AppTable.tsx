import React from 'react';

export interface Column<T> {
  header: string | React.ReactNode;
  accessor?: keyof T;
  render?: (item: T) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
  width?: string;
}

interface AppTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string | number;
  emptyMessage?: string | React.ReactNode;
  onRowClick?: (item: T) => void;
}

export function AppTable<T>({
  columns,
  data,
  keyExtractor,
  emptyMessage = 'No records found.',
  onRowClick
}: AppTableProps<T>) {
  return (
    <div className="w-full overflow-x-auto rounded-lg border border-[var(--bkb-border)] bg-[var(--bkb-card-bg)]">
      <table className="w-full text-sm text-left border-collapse">
        <thead className="text-xs text-[var(--bkb-gray-400)] uppercase bg-[rgba(0,0,0,0.02)] border-b border-[var(--bkb-border)]">
          <tr>
            {columns.map((col, index) => (
              <th
                key={index}
                className="px-6 py-4 font-semibold whitespace-nowrap"
                style={{ 
                  textAlign: col.align || 'left',
                  width: col.width || 'auto'
                }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-12 text-center text-[var(--bkb-gray-400)]">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item, rowIndex) => (
              <tr
                key={keyExtractor(item)}
                onClick={() => onRowClick && onRowClick(item)}
                className={`
                  border-b border-[var(--bkb-border)] last:border-0 
                  transition-colors duration-150
                  ${onRowClick ? 'cursor-pointer hover:bg-[rgba(0,0,0,0.015)]' : 'hover:bg-[rgba(0,0,0,0.01)]'}
                `}
              >
                {columns.map((col, colIndex) => (
                  <td
                    key={colIndex}
                    className="px-6 py-4 text-[var(--bkb-text)]"
                    style={{ textAlign: col.align || 'left' }}
                  >
                    {col.render
                      ? col.render(item)
                      : col.accessor
                      ? (item[col.accessor] as React.ReactNode)
                      : null}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
