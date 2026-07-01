import { AppEmptyState } from './AppEmptyState';
import { LucideIcon } from 'lucide-react';

export interface Column<T> {
  header: string | React.ReactNode;
  accessor?: keyof T;
  render?: (item: T, index: number) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
  width?: string;
  className?: string;
}

interface AppTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T, index: number) => string | number;
  emptyTitle?: string;
  emptyMessage?: string | React.ReactNode;
  emptyIcon?: LucideIcon;
  onRowClick?: (item: T) => void;
  rowClassName?: (item: T) => string;
  loading?: boolean;
}

export function AppTable<T>({
  columns,
  data,
  keyExtractor,
  emptyTitle = 'No records found',
  emptyMessage = 'There are no records to display.',
  emptyIcon,
  onRowClick,
  rowClassName,
  loading = false
}: AppTableProps<T>) {
  if (loading) {
    return (
      <div className="flex justify-center py-20 bg-[var(--surface)] border border-[var(--border)] rounded-xl">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]"></div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl py-12">
        <AppEmptyState title={emptyTitle} description={emptyMessage as string} icon={emptyIcon} />
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
      <table className="w-full text-sm text-left border-collapse whitespace-nowrap">
        <thead className="bg-gray-50 dark:bg-slate-800/50">
          <tr className="border-b border-[var(--border)] text-[var(--text-secondary)] text-[11px] font-bold uppercase tracking-wider">
            {columns.map((col, index) => (
              <th
                key={index}
                className={`px-6 py-4 sticky top-0 bg-inherit z-10 ${col.className || ''}`}
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
        <tbody className="divide-y divide-[var(--border)]">
          {data.map((item, rowIndex) => (
            <tr
              key={keyExtractor(item, rowIndex)}
              onClick={() => onRowClick && onRowClick(item)}
              className={`
                transition-colors duration-150 group bg-inherit
                ${onRowClick ? 'cursor-pointer hover:bg-gray-50/50 dark:hover:bg-slate-800/50' : 'hover:bg-gray-50/50 dark:hover:bg-slate-800/50'}
                ${rowClassName ? rowClassName(item) : ''}
              `}
            >
              {columns.map((col, colIndex) => (
                <td
                  key={colIndex}
                  className="px-6 py-4 text-[var(--text-primary)]"
                  style={{ textAlign: col.align || 'left' }}
                >
                  {col.render
                    ? col.render(item, rowIndex)
                    : col.accessor
                    ? (item[col.accessor] as React.ReactNode)
                    : null}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
