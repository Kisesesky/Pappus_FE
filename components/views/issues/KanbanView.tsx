// components/views/issues/KanbanView.tsx
'use client';

import React, { useEffect, useMemo } from 'react';
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  DragEndEvent, UniqueIdentifier,
} from '@dnd-kit/core';
import {
  SortableContext, useSortable, arrayMove, verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDroppable } from '@dnd-kit/core';
import NewIssueDialog from '@/components/issues/NewIssueDialog';
import type { Issue, ChecklistItem } from '@/components/issues/IssueDetails';
import { lsGet, lsSet, debounce } from '@/lib/persist';
import SprintStats from '@/components/issues/SprintStats';
import { useHistory } from '@/lib/kanbanHistory';
import { Undo2, Redo2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

/** ---------- Types ---------- */
type CardT = {
  id: string;
  title: string;
  labels?: string[];
  due?: string;
  assignee?: string;
  points?: number;
  completedAt?: string; // YYYY-MM-DD
  checklist?: ChecklistItem[];
};
type ColumnKey = 'todo' | 'doing' | 'done';
type BoardT = Record<ColumnKey, CardT[]>;

/** ---------- LocalStorage ---------- */
const LS_KEY = 'fd.kanban.board';
const LS_SPRINT_DAYS = 'fd.kanban.sprintDays';
const saveBoard = debounce((b: BoardT) => lsSet(LS_KEY, b), 200);

/** ---------- Utils ---------- */
function initials(name?: string) {
  if (!name) return '?';
  return name.split(/\s+/).map(s => s[0]).join('').slice(0, 2).toUpperCase();
}
function todayStr() {
  const d = new Date();
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}
function checklistPercent(list?: ChecklistItem[]) {
  if (!list || list.length === 0) return 0;
  const done = list.filter(i => i.done).length;
  return Math.round((done / list.length) * 100);
}

/** ---------- UI bits ---------- */
function Label({ text }: { text: string }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 text-[10px] rounded-full border border-border bg-subtle/40">
      {text}
    </span>
  );
}

function Card(props: CardT & { onOpen: (id: string) => void }) {
  const { id, title, labels, due, assignee, points, checklist, onOpen } = props;
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style: React.CSSProperties = { transform: CSS.Transform.toString(transform), transition };
  const pct = checklistPercent(checklist);

  return (
    <button
      type="button"
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onOpen(id)}
      className="w-full text-left rounded-md border border-border bg-panel p-3 cursor-grab active:cursor-grabbing focus:outline-none focus:ring-1 focus:ring-brand/60"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm font-medium">{title}</div>
        <div className="flex items-center gap-1">
          {Number.isFinite(points) && (
            <span className="text-[10px] px-1.5 py-0.5 rounded border border-border bg-subtle/40">{points}</span>
          )}
          {pct > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded border border-border bg-subtle/40">{pct}%</span>
          )}
        </div>
      </div>
      {labels && labels.length > 0 && (
        <div className="flex gap-1 flex-wrap mt-2">
          {labels.map(l => (
            <Label key={l} text={l} />
          ))}
        </div>
      )}
      <div className="mt-2 flex items-center justify-between text-xs text-muted">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-subtle/60 border border-border flex items-center justify-center text-[10px]">
            {initials(assignee)}
          </div>
          <span>{assignee || 'Unassigned'}</span>
        </div>
        <div>{due ? `마감: ${due}` : ''}</div>
      </div>
    </button>
  );
}

function Column({
  colKey,
  label,
  items,
  children,
}: {
  colKey: ColumnKey;
  label: string;
  items: CardT[];
  children: React.ReactNode;
}) {
  const droppableId = `col-${colKey}`;
  const { isOver, setNodeRef } = useDroppable({ id: droppableId });
  const count = items.length;
  const pointsSum = items.reduce((s, c) => s + (Number.isFinite(c.points) ? (c.points as number) : 0), 0);

  return (
    <div
      ref={setNodeRef}
      className={`min-w-[300px] rounded-lg p-3 border border-border bg-subtle/30 ${
        isOver ? 'ring-1 ring-brand/60' : ''
      }`}
    >
      <div className="font-semibold mb-3 flex items-center justify-between">
        <span>{label}</span>
        <span className="text-xs text-muted">
          {count} · {pointsSum} pts
        </span>
      </div>
      <SortableContext items={items.map(c => c.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {items.length === 0 && (
            <div className="rounded-md border border-dashed border-border/60 bg-subtle/20 p-4 text-xs text-muted">
              여기에 이슈를 드롭하세요
            </div>
          )}
          {children}
        </div>
      </SortableContext>
    </div>
  );
}

/** ---------- Main ---------- */
export default function KanbanView() {
  const router = useRouter();

  // 초기 보드 (fallback)
  const fallback: BoardT = useMemo(
    () => ({
      todo: [
        {
          id: 'ISSUE-1',
          title: '초기 설정',
          labels: ['setup'],
          due: '',
          assignee: 'Alice',
          points: 3,
          checklist: [],
        },
        {
          id: 'ISSUE-2',
          title: '레이아웃 구성',
          labels: ['ui', 'layout'],
          due: '',
          assignee: 'Bob',
          points: 2,
          checklist: [],
        },
      ],
      doing: [
        {
          id: 'ISSUE-3',
          title: '채팅 입력창 제작',
          labels: ['chat'],
          due: '',
          assignee: 'Alice',
          points: 5,
          checklist: [],
        },
      ],
      done: [],
    }),
    []
  );

  // dnd sensors
  const sensors = useSensors(useSensor(PointerSensor));

  // 히스토리 상태로 보드 관리
  const hist = useHistory<BoardT>(lsGet<BoardT>(LS_KEY, fallback));
  const board = hist.state;

  // 로컬 저장
  useEffect(() => {
    saveBoard(board);
  }, [board]);

  // 스프린트 일수
  const [sprintDays, setSprintDays] = React.useState<number>(() => Number(lsGet<number>(LS_SPRINT_DAYS, 7)) || 7);
  useEffect(() => {
    lsSet(LS_SPRINT_DAYS, sprintDays);
  }, [sprintDays]);

  const findColumnOfCard = (cardId: UniqueIdentifier): ColumnKey | null => {
    const key = (Object.keys(board) as ColumnKey[]).find(k => board[k].some(c => c.id === cardId));
    return key ?? null;
  };

  const updateBoard = (next: BoardT, useCommit = true) => {
    if (useCommit) hist.commit(next);
    else hist.set(next);
  };

  const moveWithin = (fromCol: ColumnKey, activeId: string, overId: string) => {
    const col = board[fromCol];
    const oldIdx = col.findIndex(c => c.id === activeId);
    const newIdx = col.findIndex(c => c.id === overId);
    if (oldIdx === -1 || newIdx === -1) return;
    const next: BoardT = { ...board, [fromCol]: arrayMove(col, oldIdx, newIdx) };
    updateBoard(next);
  };

  const moveAcross = (fromCol: ColumnKey, toCol: ColumnKey, activeId: string, overId?: string) => {
    const fromArr = [...board[fromCol]];
    const toArr = [...board[toCol]];
    const movedIdx = fromArr.findIndex(c => c.id === activeId);
    if (movedIdx === -1) return;
    const [moved] = fromArr.splice(movedIdx, 1);

    if (toCol === 'done' && !moved.completedAt) moved.completedAt = todayStr();
    if (fromCol === 'done' && toCol !== 'done') delete moved.completedAt;

    const insertIdx = overId ? toArr.findIndex(c => c.id === overId) : -1;
    toArr.splice(insertIdx < 0 ? toArr.length : insertIdx, 0, moved);
    const next: BoardT = { ...board, [fromCol]: fromArr, [toCol]: toArr };
    updateBoard(next);
  };

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over) return;
    const activeId = String(active.id),
      overId = String(over.id);
    const fromCol = findColumnOfCard(activeId);
    if (!fromCol) return;

    const isOverCard = !overId.startsWith('col-');
    if (isOverCard) {
      const toCol = findColumnOfCard(overId) ?? fromCol;
      if (fromCol === toCol) moveWithin(fromCol, activeId, overId);
      else moveAcross(fromCol, toCol, activeId, overId);
      return;
    }

    const toColKey = overId.replace('col-', '') as ColumnKey;
    if (!['todo', 'doing', 'done'].includes(toColKey)) return;
    if (fromCol === toColKey) {
      const col = board[fromCol];
      const oldIdx = col.findIndex(c => c.id === activeId);
      if (oldIdx === -1) return;
      const newCol = [...col];
      const [moved] = newCol.splice(oldIdx, 1);
      newCol.push(moved);
      const next: BoardT = { ...board, [fromCol]: newCol };
      updateBoard(next);
    } else {
      moveAcross(fromCol, toColKey, activeId);
    }
  };

  const onCreate = (
    title: string,
    column: ColumnKey,
    labels: string[],
    due?: string,
    assignee?: string,
    points?: number
  ) => {
    const id = `ISSUE-${Math.floor(Math.random() * 9000 + 1000)}`;
    const next: BoardT = {
      ...board,
      [column]: [...board[column], { id, title, labels, due, assignee, points, checklist: [] }],
    };
    updateBoard(next);
  };

  /** ✅ 라우팅으로 우측 패널 열기 (자체 패널 X) */
  const openIssue = (id: string) => {
    router.push(`/app/issues/${id}`);
  };

  // 통계
  const totalPoints = board.todo.concat(board.doing, board.done).reduce(
    (s, c) => s + (Number.isFinite(c.points) ? (c.points as number) : 0),
    0
  );
  const donePoints = board.done.reduce((s, c) => s + (Number.isFinite(c.points) ? (c.points as number) : 0), 0);
  const completedDates = board.done.map(c => ({
    date: c.completedAt || todayStr(),
    points: Number.isFinite(c.points) ? (c.points as number) : 0,
  }));

  return (
    // ✅ 내부 RightPanel(오른쪽 360px 컬럼) 제거 → 레이아웃의 우측 슬롯/Drawer가 담당
    <div className="h-full overflow-x-auto p-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="text-lg font-semibold">스프린트 보드</div>
          <div className="text-xs flex items-center gap-2">
            <span className="text-muted">기간(일)</span>
            <input
              type="number"
              min={3}
              max={30}
              value={sprintDays}
              onChange={e => {
                const val = Math.max(3, Math.min(30, Number(e.target.value) || 7));
                setSprintDays(val);
              }}
              className="w-16 bg-subtle/60 border border-border rounded px-2 py-1"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Undo/Redo */}
          <button
            className={`px-2 py-1 rounded border border-border text-xs ${
              hist.canUndo ? 'hover:bg-subtle/60' : 'opacity-50 cursor-not-allowed'
            }`}
            onClick={() => hist.undo()}
            disabled={!hist.canUndo}
            title="Undo (⌘/Ctrl+Z)"
          >
            <Undo2 size={14} />
          </button>
          <button
            className={`px-2 py-1 rounded border border-border text-xs ${
              hist.canRedo ? 'hover:bg-subtle/60' : 'opacity-50 cursor-not-allowed'
            }`}
            onClick={() => hist.redo()}
            disabled={!hist.canRedo}
            title="Redo (⌘/Ctrl+Shift+Z)"
          >
            <Redo2 size={14} />
          </button>

          <SprintStats
            totalPoints={totalPoints}
            donePoints={donePoints}
            completedDates={completedDates}
            days={sprintDays}
          />
          <NewIssueDialog onCreate={onCreate} />
        </div>
      </div>

      {/* 보드 */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <div className="flex gap-4 w-max min-w-[900px]">
          <Column colKey="todo" label="To Do" items={board.todo}>
            {board.todo.map(c => (
              <Card key={c.id} {...c} onOpen={openIssue} />
            ))}
          </Column>
          <Column colKey="doing" label="In Progress" items={board.doing}>
            {board.doing.map(c => (
              <Card key={c.id} {...c} onOpen={openIssue} />
            ))}
          </Column>
          <Column colKey="done" label="Done" items={board.done}>
            {board.done.map(c => (
              <Card key={c.id} {...c} onOpen={openIssue} />
            ))}
          </Column>
        </div>
      </DndContext>
    </div>
  );
}
