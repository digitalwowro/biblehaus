interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyField: string;
  actions?: (item: T) => React.ReactNode;
  emptyMessage?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  keyField,
  actions,
  emptyMessage = "No data found.",
}: DataTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="flex min-h-[12rem] items-center justify-center rounded-2xl border border-dashed border-[var(--line-soft)] bg-[var(--surface-subtle)]/45 text-sm text-[var(--ink-subtle)]">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--line-soft)] bg-white">
      <table className="w-full">
        <thead>
          <tr className="border-b border-[var(--line-soft)] bg-[var(--surface-subtle)]/60">
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-5 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-subtle)]"
              >
                {col.header}
              </th>
            ))}
            {actions && (
              <th className="px-5 py-2.5 text-right text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-subtle)]">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr
              key={String(item[keyField])}
              className="border-b border-[var(--line-soft)] transition last:border-b-0 hover:bg-[var(--surface-subtle)]"
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className="px-5 py-3 text-sm text-[var(--ink-strong)]"
                >
                  {col.render
                    ? col.render(item)
                    : String(item[col.key] ?? "")}
                </td>
              ))}
              {actions && (
                <td className="px-5 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {actions(item)}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
