'use client';

import { create } from 'zustand';
import { lsGet, lsSet } from '@/lib/persist';
import type {
  WorksheetStatus,
  WorksheetColumnType,
  WorksheetColumn,
  WorksheetCell,
  WorksheetRow,
  Worksheet,
  WorksheetMeta,
} from '@/types/worksheet';
import {
  createDefaultWorksheets,
  createDefaultWorksheetMeta,
  createDefaultWorksheetMap,
} from '@/lib/mocks/worksheet';

export type {
  WorksheetStatus,
  WorksheetColumnType,
  WorksheetColumn,
  WorksheetCell,
  WorksheetRow,
  Worksheet,
  WorksheetMeta,
} from '@/types/worksheet';

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

const DEFAULT_WORKSHEETS = createDefaultWorksheets();
const DEFAULT_META = createDefaultWorksheetMeta(DEFAULT_WORKSHEETS);

const initialMeta = lsGet<WorksheetMeta[]>(META_KEY, DEFAULT_META);
const initialMap = lsGet<Record<string, Worksheet>>(
  DATA_KEY,
  createDefaultWorksheetMap(DEFAULT_WORKSHEETS),
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

