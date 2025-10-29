'use client';

import { create } from 'zustand';
import { lsGet, lsSet } from '@/lib/persist';

export type WorksheetStatus = 'draft' | 'in-review' | 'done';

export type WorksheetColumnType = 'text' | 'number' | 'date' | 'select';

export type WorksheetColumn = {
  id: string;
  title: string;
  type: WorksheetColumnType;
  options?: string[];
  width?: number;
};

export type WorksheetCell = {
  columnId: string;
  value: string | number | null;
};

export type WorksheetRow = {
  id: string;
  cells: WorksheetCell[];
  assignee?: string;
  status?: WorksheetStatus;
  memo?: string;
  updatedAt: number;
};

export type Worksheet = {
  id: string;
  title: string;
  ownerName: string;
  updatedAt: number;
  status: WorksheetStatus;
  columns: WorksheetColumn[];
  rows: WorksheetRow[];
  tags?: string[];
  description?: string;
};

export type WorksheetMeta = Pick<Worksheet, 'id' | 'title' | 'ownerName' | 'updatedAt' | 'status'>;

type WorksheetStore = {
  worksheets: WorksheetMeta[];
  worksheetMap: Record<string, Worksheet>;
  activeWorksheetId: string | null;
  setActiveWorksheet: (id: string) => void;
  createWorksheet: (payload?: Partial<Pick<Worksheet, 'title' | 'ownerName' | 'description'>>) => string;
  duplicateWorksheet: (id: string) => string | null;
  deleteWorksheet: (id: string) => void;
  addRow: (worksheetId: string) => string | null;
  updateCell: (worksheetId: string, rowId: string, columnId: string, value: WorksheetCell['value']) => void;
  updateWorksheetTitle: (worksheetId: string, title: string) => void;
  setWorksheetStatus: (worksheetId: string, status: WorksheetStatus) => void;
  deleteRow: (worksheetId: string, rowId: string) => void;
};

const META_KEY = 'fd.worksheet.meta';
const DATA_KEY = 'fd.worksheet.data';
const ACTIVE_KEY = 'fd.worksheet.active';

function generateId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

function upsertMeta(list: WorksheetMeta[], next: WorksheetMeta): WorksheetMeta[] {
  const exists = list.findIndex((item) => item.id === next.id);
  if (exists === -1) {
    return [next, ...list].sort((a, b) => b.updatedAt - a.updatedAt);
  }
  const copy = [...list];
  copy[exists] = next;
  return copy.sort((a, b) => b.updatedAt - a.updatedAt);
}

const DEFAULT_WORKSHEETS: Worksheet[] = [
  {
    id: 'ws-001',
    title: 'Launch Checklist',
    ownerName: 'Alice',
    updatedAt: Date.now() - 1000 * 60 * 60 * 5,
    status: 'in-review',
    columns: [
      { id: 'col-title', title: 'Task', type: 'text' },
      { id: 'col-owner', title: 'Owner', type: 'text' },
      { id: 'col-status', title: 'Status', type: 'select', options: ['Pending', 'In Progress', 'Done'] },
      { id: 'col-due', title: 'Due Date', type: 'date' },
    ],
    rows: [
      {
        id: 'row-1',
        updatedAt: Date.now() - 1000 * 60 * 60 * 5,
        cells: [
          { columnId: 'col-title', value: 'QA sign-off' },
          { columnId: 'col-owner', value: 'Bob' },
          { columnId: 'col-status', value: 'In Progress' },
          { columnId: 'col-due', value: '2025-10-30' },
        ],
      },
      {
        id: 'row-2',
        updatedAt: Date.now() - 1000 * 60 * 60 * 8,
        cells: [
          { columnId: 'col-title', value: 'Release notes' },
          { columnId: 'col-owner', value: 'You' },
          { columnId: 'col-status', value: 'Pending' },
          { columnId: 'col-due', value: '2025-10-31' },
        ],
      },
    ],
    tags: ['launch', 'checklist'],
    description: 'Tasks to complete before the release freeze.',
  },
  {
    id: 'ws-002',
    title: 'Customer Success Plans',
    ownerName: 'Bob',
    updatedAt: Date.now() - 1000 * 60 * 60 * 24,
    status: 'done',
    columns: [
      { id: 'col-account', title: 'Account', type: 'text' },
      { id: 'col-owner', title: 'Owner', type: 'text' },
      { id: 'col-health', title: 'Health', type: 'select', options: ['Green', 'Yellow', 'Red'] },
      { id: 'col-renewal', title: 'Renewal', type: 'date' },
    ],
    rows: [
      {
        id: 'row-1',
        updatedAt: Date.now() - 1000 * 60 * 60 * 30,
        cells: [
          { columnId: 'col-account', value: 'Acme Inc.' },
          { columnId: 'col-owner', value: 'Alice' },
          { columnId: 'col-health', value: 'Green' },
          { columnId: 'col-renewal', value: '2025-12-01' },
        ],
      },
      {
        id: 'row-2',
        updatedAt: Date.now() - 1000 * 60 * 60 * 20,
        cells: [
          { columnId: 'col-account', value: 'Globex' },
          { columnId: 'col-owner', value: 'You' },
          { columnId: 'col-health', value: 'Yellow' },
          { columnId: 'col-renewal', value: '2026-01-12' },
        ],
      },
    ],
  },
  {
    id: 'ws-003',
    title: 'Experiment Tracker',
    ownerName: 'You',
    updatedAt: Date.now() - 1000 * 60 * 30,
    status: 'draft',
    columns: [
      { id: 'col-exp', title: 'Experiment', type: 'text' },
      { id: 'col-hypothesis', title: 'Hypothesis', type: 'text' },
      { id: 'col-result', title: 'Result', type: 'select', options: ['Pending', 'Positive', 'Negative'] },
      { id: 'col-created', title: 'Created', type: 'date' },
    ],
    rows: [],
  },
];

const DEFAULT_META: WorksheetMeta[] = DEFAULT_WORKSHEETS.map(({ id, title, ownerName, updatedAt, status }) => ({
  id,
  title,
  ownerName,
  updatedAt,
  status,
}));

const initialMeta = lsGet<WorksheetMeta[]>(META_KEY, DEFAULT_META);
const initialMap = lsGet<Record<string, Worksheet>>(
  DATA_KEY,
  DEFAULT_WORKSHEETS.reduce<Record<string, Worksheet>>((acc, worksheet) => {
    acc[worksheet.id] = worksheet;
    return acc;
  }, {}),
);
const initialActive = lsGet<string | null>(ACTIVE_KEY, initialMeta[0]?.id ?? null);

export const useWorksheet = create<WorksheetStore>((set, get) => ({
  worksheets: initialMeta,
  worksheetMap: initialMap,
  activeWorksheetId: initialActive,

  setActiveWorksheet: (id) => {
    set({ activeWorksheetId: id });
    lsSet(ACTIVE_KEY, id);
  },

  createWorksheet: (payload) => {
    const id = generateId('ws');
    const now = Date.now();
    const title = payload?.title?.trim() || 'Untitled Worksheet';
    const ownerName = payload?.ownerName?.trim() || 'You';
    const worksheet: Worksheet = {
      id,
      title,
      ownerName,
      updatedAt: now,
      status: 'draft',
      description: payload?.description,
      columns: [
        { id: `${id}-col-title`, title: 'Task', type: 'text' },
        { id: `${id}-col-owner`, title: 'Owner', type: 'text' },
        { id: `${id}-col-status`, title: 'Status', type: 'select', options: ['Pending', 'In Progress', 'Done'] },
        { id: `${id}-col-due`, title: 'Due Date', type: 'date' },
      ],
      rows: [],
    };
    const meta: WorksheetMeta = { id, title, ownerName, updatedAt: now, status: worksheet.status };

    set((state) => {
      const worksheets = upsertMeta(state.worksheets, meta);
      const worksheetMap = { ...state.worksheetMap, [id]: worksheet };
      lsSet(META_KEY, worksheets);
      lsSet(DATA_KEY, worksheetMap);
      lsSet(ACTIVE_KEY, id);
      return { worksheets, worksheetMap, activeWorksheetId: id };
    });

    return id;
  },

  duplicateWorksheet: (id) => {
    const source = get().worksheetMap[id];
    if (!source) return null;
    const cloneId = generateId('ws');
    const now = Date.now();
    const cloned: Worksheet = {
      ...source,
      id: cloneId,
      title: `${source.title} Copy`,
      updatedAt: now,
      rows: source.rows.map((row) => ({
        ...row,
        id: generateId('row'),
        updatedAt: now,
        cells: row.cells.map((cell) => ({ ...cell })),
      })),
    };
    const meta: WorksheetMeta = {
      id: cloneId,
      title: cloned.title,
      ownerName: cloned.ownerName,
      updatedAt: now,
      status: cloned.status,
    };
    set((state) => {
      const worksheets = upsertMeta(state.worksheets, meta);
      const worksheetMap = { ...state.worksheetMap, [cloneId]: cloned };
      lsSet(META_KEY, worksheets);
      lsSet(DATA_KEY, worksheetMap);
      return { worksheets, worksheetMap };
    });
    return cloneId;
  },

  deleteWorksheet: (id) => {
    set((state) => {
      const worksheets = state.worksheets.filter((item) => item.id !== id);
      const worksheetMap = { ...state.worksheetMap };
      delete worksheetMap[id];
      const activeWorksheetId =
        state.activeWorksheetId === id ? worksheets[0]?.id ?? null : state.activeWorksheetId;
      lsSet(META_KEY, worksheets);
      lsSet(DATA_KEY, worksheetMap);
      lsSet(ACTIVE_KEY, activeWorksheetId);
      return { worksheets, worksheetMap, activeWorksheetId };
    });
  },

  addRow: (worksheetId) => {
    const worksheet = get().worksheetMap[worksheetId];
    if (!worksheet) return null;
    const rowId = generateId('row');
    const now = Date.now();
    const row: WorksheetRow = {
      id: rowId,
      updatedAt: now,
      cells: worksheet.columns.map((column) => ({ columnId: column.id, value: null })),
    };

    set((state) => {
      const current = state.worksheetMap[worksheetId];
      if (!current) return state;
      const nextWorksheet: Worksheet = {
        ...current,
        updatedAt: now,
        rows: [...current.rows, row],
      };
      const worksheetMap = { ...state.worksheetMap, [worksheetId]: nextWorksheet };
      const meta = upsertMeta(
        state.worksheets.filter((item) => item.id !== worksheetId),
        {
          id: nextWorksheet.id,
          title: nextWorksheet.title,
          ownerName: nextWorksheet.ownerName,
          updatedAt: nextWorksheet.updatedAt,
          status: nextWorksheet.status,
        },
      );
      lsSet(META_KEY, meta);
      lsSet(DATA_KEY, worksheetMap);
      return { worksheetMap, worksheets: meta };
    });

    return rowId;
  },

  updateCell: (worksheetId, rowId, columnId, value) => {
    const worksheet = get().worksheetMap[worksheetId];
    if (!worksheet) return;

    set((state) => {
      const current = state.worksheetMap[worksheetId];
      if (!current) return state;
      const rows = current.rows.map((row) => {
        if (row.id !== rowId) return row;
        return {
          ...row,
          updatedAt: Date.now(),
          cells: row.cells.map((cell) =>
            cell.columnId === columnId ? { ...cell, value } : cell,
          ),
        };
      });
      const nextWorksheet: Worksheet = {
        ...current,
        rows,
        updatedAt: Date.now(),
      };
      const worksheetMap = { ...state.worksheetMap, [worksheetId]: nextWorksheet };
      const meta = upsertMeta(
        state.worksheets.filter((item) => item.id !== worksheetId),
        {
          id: nextWorksheet.id,
          title: nextWorksheet.title,
          ownerName: nextWorksheet.ownerName,
          updatedAt: nextWorksheet.updatedAt,
          status: nextWorksheet.status,
        },
      );
      lsSet(META_KEY, meta);
      lsSet(DATA_KEY, worksheetMap);
      return { worksheetMap, worksheets: meta };
    });
  },

  updateWorksheetTitle: (worksheetId, title) => {
    const trimmed = title.trim();
    if (!trimmed) return;
    set((state) => {
      const current = state.worksheetMap[worksheetId];
      if (!current) return state;
      const now = Date.now();
      const nextWorksheet: Worksheet = { ...current, title: trimmed, updatedAt: now };
      const worksheetMap = { ...state.worksheetMap, [worksheetId]: nextWorksheet };
      const meta = upsertMeta(
        state.worksheets.filter((item) => item.id !== worksheetId),
        {
          id: nextWorksheet.id,
          title: nextWorksheet.title,
          ownerName: nextWorksheet.ownerName,
          updatedAt: now,
          status: nextWorksheet.status,
        },
      );
      lsSet(META_KEY, meta);
      lsSet(DATA_KEY, worksheetMap);
      return { worksheetMap, worksheets: meta };
    });
  },

  setWorksheetStatus: (worksheetId, status) => {
    set((state) => {
      const current = state.worksheetMap[worksheetId];
      if (!current || current.status === status) return state;
      const now = Date.now();
      const nextWorksheet: Worksheet = { ...current, status, updatedAt: now };
      const worksheetMap = { ...state.worksheetMap, [worksheetId]: nextWorksheet };
      const meta = upsertMeta(
        state.worksheets.filter((item) => item.id !== worksheetId),
        {
          id: nextWorksheet.id,
          title: nextWorksheet.title,
          ownerName: nextWorksheet.ownerName,
          updatedAt: now,
          status: nextWorksheet.status,
        },
      );
      lsSet(META_KEY, meta);
      lsSet(DATA_KEY, worksheetMap);
      return { worksheetMap, worksheets: meta };
    });
  },

  deleteRow: (worksheetId, rowId) => {
    set((state) => {
      const current = state.worksheetMap[worksheetId];
      if (!current) return state;
      const rows = current.rows.filter((row) => row.id !== rowId);
      if (rows.length === current.rows.length) return state;
      const now = Date.now();
      const nextWorksheet: Worksheet = { ...current, rows, updatedAt: now };
      const worksheetMap = { ...state.worksheetMap, [worksheetId]: nextWorksheet };
      const meta = upsertMeta(
        state.worksheets.filter((item) => item.id !== worksheetId),
        {
          id: nextWorksheet.id,
          title: nextWorksheet.title,
          ownerName: nextWorksheet.ownerName,
          updatedAt: now,
          status: nextWorksheet.status,
        },
      );
      lsSet(META_KEY, meta);
      lsSet(DATA_KEY, worksheetMap);
      return { worksheetMap, worksheets: meta };
    });
  },
}));
