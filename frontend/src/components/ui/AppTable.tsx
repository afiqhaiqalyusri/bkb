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
    <div className="w-full overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800 bg-[var(--bkb-card-bg)]">
      <table className="w-full text-sm text-left border-collapse">
        <thead className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
          <tr>
            {columns.map((col, index) => (
              <th
                key={index}
                className="px-6 py-4.5 font-bold whitespace-nowrap"
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
        <tbody className="divide-y divide-slate-50 dark:divide-slate-800/80">
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-14 text-center text-slate-400 dark:text-slate-500 font-medium">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item) => (
              <tr
                key={keyExtractor(item)}
                onClick={() => onRowClick && onRowClick(item)}
                className={`
                  transition-colors duration-150
                  ${onRowClick ? 'cursor-pointer hover:bg-slate-50/70 dark:hover:bg-slate-800/30' : 'hover:bg-slate-50/40 dark:hover:bg-slate-800/10'}
                `}
              >
                {columns.map((col, colIndex) => (
                  <td
                    key={colIndex}
                    className="px-6 py-4 text-slate-700 dark:text-slate-300 font-medium text-xs sm:text-sm"
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
