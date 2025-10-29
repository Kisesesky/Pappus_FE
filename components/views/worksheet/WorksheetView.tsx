// components/views/worksheet/WorksheetView.tsx
'use client';

import React, { useMemo, useCallback } from "react";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { useWorksheet, WorksheetMeta, WorksheetStatus, WorksheetColumn } from "@/store/worksheet";

const STATUS_LABEL: Record<WorksheetStatus, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-slate-200 text-slate-700 dark:bg-slate-700/60 dark:text-slate-200" },
  "in-review": { label: "In Review", className: "bg-amber-100 text-amber-700 dark:bg-amber-700/30 dark:text-amber-200" },
  done: { label: "Done", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-700/30 dark:text-emerald-200" },
};

function formatRelative(ts: number) {
  try {
    return formatDistanceToNow(ts, { addSuffix: true, locale: ko });
  } catch {
    return new Date(ts).toLocaleDateString();
  }
}

function WorksheetTable({ rows, onOpen }: { rows: WorksheetMeta[]; onOpen: (id: string) => void }) {
  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/70 bg-subtle/40 py-16 text-sm text-muted">
        <p className="font-medium text-foreground/80">No worksheets yet</p>
        <p className="mt-1 text-xs">Create your first worksheet to centralize checklists, matrices, and more.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-panel/60 shadow">
      <table className="w-full border-collapse text-sm">
        <thead className="bg-subtle/50 text-muted">
          <tr className="text-left">
            <th className="px-4 py-2 font-medium">Title</th>
            <th className="px-4 py-2 font-medium">Owner</th>
            <th className="px-4 py-2 font-medium">Updated</th>
            <th className="px-4 py-2 font-medium">Status</th>
            <th className="px-4 py-2 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const badge = STATUS_LABEL[row.status];
            return (
              <tr key={row.id} className="border-t border-border/60 hover:bg-subtle/60">
                <td className="px-4 py-2">
                  <div className="font-medium text-foreground/90">{row.title}</div>
                  <div className="text-xs text-muted">{row.id}</div>
                </td>
                <td className="px-4 py-2">{row.ownerName}</td>
                <td className="px-4 py-2 text-muted">{formatRelative(row.updatedAt)}</td>
                <td className="px-4 py-2">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${badge.className}`}>
                    {badge.label}
                  </span>
                </td>
                <td className="px-4 py-2 text-right">
                  <button onClick={() => onOpen(row.id)} className="text-xs font-medium text-brand hover:underline">
                    Open
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function WorksheetView() {
  const {
    worksheets,
    activeWorksheetId,
    createWorksheet,
    setActiveWorksheet,
    duplicateWorksheet,
    deleteWorksheet,
    addRow,
    updateCell,
    updateWorksheetTitle,
    setWorksheetStatus,
    deleteRow,
  } = useWorksheet((state) => ({
    worksheets: state.worksheets,
    activeWorksheetId: state.activeWorksheetId,
    createWorksheet: state.createWorksheet,
    setActiveWorksheet: state.setActiveWorksheet,
    duplicateWorksheet: state.duplicateWorksheet,
    deleteWorksheet: state.deleteWorksheet,
    addRow: state.addRow,
    updateCell: state.updateCell,
    updateWorksheetTitle: state.updateWorksheetTitle,
    setWorksheetStatus: state.setWorksheetStatus,
    deleteRow: state.deleteRow,
  }));

  const activeWorksheet = useWorksheet((state) =>
    state.activeWorksheetId ? state.worksheetMap[state.activeWorksheetId] ?? null : null,
  );

  const sortedRows = useMemo(
    () => [...worksheets].sort((a, b) => b.updatedAt - a.updatedAt),
    [worksheets],
  );

  const handleCreate = () => {
    const id = createWorksheet();
    setActiveWorksheet(id);
  };

  const handleDuplicate = () => {
    if (!activeWorksheetId) return;
    const id = duplicateWorksheet(activeWorksheetId);
    if (id) setActiveWorksheet(id);
  };

  const handleDelete = () => {
    if (!activeWorksheetId) return;
    deleteWorksheet(activeWorksheetId);
  };

  const handleTitleChange = useCallback(
    (value: string) => {
      if (!activeWorksheet) return;
      updateWorksheetTitle(activeWorksheet.id, value);
    },
    [activeWorksheet, updateWorksheetTitle],
  );

  const handleStatusChange = useCallback(
    (value: WorksheetStatus) => {
      if (!activeWorksheet) return;
      setWorksheetStatus(activeWorksheet.id, value);
    },
    [activeWorksheet, setWorksheetStatus],
  );

  const handleCellChange = useCallback(
    (rowId: string, column: WorksheetColumn, raw: string) => {
      if (!activeWorksheet) return;
      let next: string | number | null = raw;
      if (column.type === 'number') {
        next = raw === '' ? null : Number(raw);
      }
      updateCell(activeWorksheet.id, rowId, column.id, next);
    },
    [activeWorksheet, updateCell],
  );

  const handleAddRow = () => {
    if (!activeWorksheet) return;
    addRow(activeWorksheet.id);
  };

  const handleDeleteRow = (rowId: string) => {
    if (!activeWorksheet) return;
    deleteRow(activeWorksheet.id, rowId);
  };

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between border-b border-border bg-panel/60 px-4 py-3 backdrop-blur">
        <div>
          <div className="text-xs uppercase tracking-wide text-muted">Worksheet</div>
          <h1 className="text-lg font-semibold leading-tight text-foreground">Worksheet Studio</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleCreate} className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-subtle/60">
            New Worksheet
          </button>
          <button
            onClick={handleDuplicate}
            disabled={!activeWorksheetId}
            className="rounded-md border border-border px-3 py-1.5 text-sm text-muted hover:bg-subtle/60 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Duplicate
          </button>
          <button className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-subtle/60">
            Template Gallery
          </button>
          <button
            onClick={handleDelete}
            disabled={!activeWorksheetId}
            className="rounded-md border border-border px-3 py-1.5 text-sm text-rose-500 hover:bg-rose-500/10 disabled:cursor-not-allowed disabled:text-muted"
          >
            Delete
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-auto px-4 py-6">
        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-foreground/90">Recently Updated</h2>
              <p className="text-xs text-muted">Organise workflows, checklists, and matrices in one collaborative view.</p>
            </div>
            <div className="flex gap-2">
              <input
                type="search"
                className="w-48 rounded-md border border-border bg-subtle/60 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-brand/60"
                placeholder="Search worksheets"
                disabled
              />
              <button className="rounded-md border border-border px-2 py-1 text-xs text-muted hover:bg-subtle/60" disabled>
                Filter
              </button>
            </div>
          </div>

          <WorksheetTable rows={sortedRows} onOpen={setActiveWorksheet} />
        </section>

        {activeWorksheet && (
          <section className="mt-8 grid gap-4 rounded-xl border border-border bg-panel/50 p-4 shadow-sm md:grid-cols-2">
            <div>
              <label className="text-xs uppercase tracking-wide text-muted">Worksheet title</label>
              <input
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-brand/60"
                value={activeWorksheet.title}
                onChange={(event) => handleTitleChange(event.target.value)}
              />
              <p className="mt-2 text-xs text-muted">
                Owned by {activeWorksheet.ownerName} · {formatRelative(activeWorksheet.updatedAt)}
              </p>
              {activeWorksheet.description && (
                <p className="mt-3 text-sm text-muted">{activeWorksheet.description}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg border border-border/80 bg-background/70 p-3">
                <div className="text-xs text-muted">Columns</div>
                <div className="text-lg font-semibold">{activeWorksheet.columns.length}</div>
              </div>
              <div className="rounded-lg border border-border/80 bg-background/70 p-3">
                <div className="text-xs text-muted">Rows</div>
                <div className="text-lg font-semibold">{activeWorksheet.rows.length}</div>
              </div>
              <div className="rounded-lg border border-border/80 bg-background/70 p-3">
                <div className="text-xs text-muted">Status</div>
                <select
                  value={activeWorksheet.status}
                  onChange={(event) => handleStatusChange(event.target.value as WorksheetStatus)}
                  className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-brand/60"
                >
                  <option value="draft">Draft</option>
                  <option value="in-review">In Review</option>
                  <option value="done">Done</option>
                </select>
              </div>
            </div>
          </section>
        )}

        {activeWorksheet && (
          <section className="mt-10 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground/90">Worksheet rows</h2>
              <button
                onClick={handleAddRow}
                className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-subtle/60"
              >
                Add row
              </button>
            </div>

            <div className="overflow-auto rounded-xl border border-border bg-panel/50 shadow">
              <table className="w-full min-w-[600px] border-collapse text-sm">
                <thead className="bg-subtle/50 text-muted">
                  <tr className="text-left">
                    {activeWorksheet.columns.map((column) => (
                      <th key={column.id} className="px-4 py-2 font-medium">
                        {column.title}
                      </th>
                    ))}
                    <th className="px-4 py-2 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {activeWorksheet.rows.length === 0 ? (
                    <tr>
                      <td colSpan={activeWorksheet.columns.length + 1} className="px-4 py-8 text-center text-xs text-muted">
                        No rows yet. Use “Add row” to start populating the worksheet.
                      </td>
                    </tr>
                  ) : (
                    activeWorksheet.rows.map((row) => (
                      <tr key={row.id} className="border-t border-border/60 hover:bg-subtle/60">
                        {activeWorksheet.columns.map((column) => {
                          const cell = row.cells.find((item) => item.columnId === column.id);
                          const value = cell?.value ?? '';
                          const inputType = column.type === 'number' ? 'number' : column.type === 'date' ? 'date' : 'text';
                          return (
                            <td key={column.id} className="px-4 py-2 align-top">
                              {column.type === 'select' && column.options ? (
                                <select
                                  value={typeof value === 'string' ? value : ''}
                                  onChange={(event) => handleCellChange(row.id, column, event.target.value)}
                                  className="w-full rounded-md border border-border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-brand/60"
                                >
                                  <option value="">-</option>
                                  {column.options.map((option) => (
                                    <option key={option} value={option}>
                                      {option}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <input
                                  type={inputType}
                                  value={typeof value === 'number' ? String(value) : (value as string)}
                                  onChange={(event) => handleCellChange(row.id, column, event.target.value)}
                                  className="w-full rounded-md border border-border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-brand/60"
                                />
                              )}
                            </td>
                          );
                        })}
                        <td className="px-4 py-2 text-right">
                          <button
                            onClick={() => handleDeleteRow(row.id)}
                            className="text-xs text-rose-500 hover:underline"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <section className="mt-10 grid gap-4 md:grid-cols-3">
          {[
            {
              title: 'Data Table',
              description: 'Structure product or operations data with sort, filter, and linkage.',
            },
            {
              title: 'Checklist',
              description: 'Collaborative task lists that stay in sync across the team.',
            },
            {
              title: 'Insight Board',
              description: 'Transform worksheet data into charts and KPI snapshots quickly.',
            },
          ].map((card) => (
            <article
              key={card.title}
              className="rounded-xl border border-border bg-panel/50 p-4 shadow-sm transition hover:border-brand/60 hover:shadow-md"
            >
              <h3 className="text-sm font-semibold text-foreground/90">{card.title}</h3>
              <p className="mt-2 text-xs text-muted">{card.description}</p>
              <button className="mt-4 text-xs font-medium text-brand hover:underline" disabled>
                Start from template →
              </button>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
