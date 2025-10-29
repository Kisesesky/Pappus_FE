'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  UniqueIdentifier,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import clsx from 'clsx';
import {
  Undo2,
  Redo2,
  Search,
  Filter,
  X,
  AlertTriangle,
  Clock,
  ListChecks,
  Users,
} from 'lucide-react';
import NewIssueDialog from '@/components/issues/NewIssueDialog';
import type { ChecklistItem } from '@/components/issues/IssueDetails';
import { lsGet, lsSet, debounce } from '@/lib/persist';
import SprintStats from '@/components/issues/SprintStats';
import { useHistory } from '@/lib/kanbanHistory';
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

type DueState = 'none' | 'overdue' | 'today' | 'soon' | 'later';

/** ---------- LocalStorage ---------- */
const LS_KEY = 'fd.kanban.board';
const LS_SPRINT_DAYS = 'fd.kanban.sprintDays';
const saveBoard = debounce((b: BoardT) => lsSet(LS_KEY, b), 200);

/** ---------- Utils ---------- */
const DUE_SOON_DAYS = 2;

function initials(name?: string) {
  if (!name) return '?';
  return name
    .split(/\s+/)
    .map((s) => s[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function todayStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

function parseDate(date?: string) {
  if (!date) return null;
  const parsed = new Date(`${date}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function daysBetween(a: Date, b: Date) {
  const MS_DAY = 24 * 60 * 60 * 1000;
  return Math.floor((a.getTime() - b.getTime()) / MS_DAY);
}

function checklistPercent(list?: ChecklistItem[]) {
  if (!list || list.length === 0) return 0;
  const done = list.filter((item) => item.done).length;
  return Math.round((done / list.length) * 100);
}

function checklistCounts(list?: ChecklistItem[]) {
  if (!list || list.length === 0) return { done: 0, total: 0 };
  const done = list.filter((item) => item.done).length;
  return { done, total: list.length };
}

function getDueState(due?: string): DueState {
  const dueDate = parseDate(due);
  if (!dueDate) return 'none';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  dueDate.setHours(0, 0, 0, 0);
  const diff = daysBetween(dueDate, today);
  if (diff < 0) return 'overdue';
  if (diff === 0) return 'today';
  if (diff <= DUE_SOON_DAYS) return 'soon';
  return 'later';
}

function dueBadge(due?: string) {
  const state = getDueState(due);
  if (state === 'none') return { text: '', className: '' };
  const dueDate = parseDate(due)!;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = daysBetween(dueDate, today);

  if (state === 'overdue') {
    return {
      text: `지연 ${Math.abs(diff)}일`,
      className:
        'bg-rose-500/15 text-rose-500 border border-rose-500/30',
    };
  }
  if (state === 'today') {
    return {
      text: '오늘 마감',
      className: 'bg-amber-400/20 text-amber-600 border border-amber-400/40',
    };
  }
  if (state === 'soon') {
    return {
      text: `D-${diff}`,
      className: 'bg-amber-200/20 text-amber-600 border border-amber-200/40',
    };
  }
  return {
    text: `D-${diff}`,
    className: 'bg-slate-200/10 text-slate-500 border border-slate-200/40',
  };
}

function isChecklistIncomplete(card: CardT) {
  if (!card.checklist || card.checklist.length === 0) return false;
  return card.checklist.some((item) => !item.done);
}

function Label({ text, variant = 'default' }: { text: string; variant?: 'default' | 'alert' }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px]',
        variant === 'alert'
          ? 'border-rose-500/50 bg-rose-500/10 text-rose-500'
          : 'border-border bg-subtle/40 text-muted',
      )}
    >
      {variant === 'alert' && <AlertTriangle size={12} />}
      {text}
    </span>
  );
}

function Card(props: CardT & { onOpen: (id: string) => void }) {
  const { id, title, labels, due, assignee, points, checklist, onOpen } = props;
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style: React.CSSProperties = { transform: CSS.Transform.toString(transform), transition };
  const pct = checklistPercent(checklist);
  const { done, total } = checklistCounts(checklist);
  const dueInfo = dueBadge(due);
  const hasChecklist = Boolean(checklist && checklist.length > 0);

  return (
    <button
      type="button"
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onOpen(id)}
      className="w-full text-left rounded-xl border border-border bg-panel/90 p-3 shadow-sm transition hover:border-brand/40 hover:shadow-md focus:outline-none focus:ring-1 focus:ring-brand/60"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="text-sm font-semibold leading-snug text-foreground">{title}</div>
        <div className="flex items-center gap-1">
          {Number.isFinite(points) && (
            <span className="rounded-md bg-brand/10 px-2 py-0.5 text-[11px] font-medium text-brand">
              {points}
            </span>
          )}
          {hasChecklist && (
            <span
              className={clsx(
                'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px]',
                pct === 100 ? 'bg-emerald-500/15 text-emerald-600' : 'bg-slate-200/20 text-muted',
              )}
            >
              <ListChecks size={12} />
              {done}/{total}
            </span>
          )}
        </div>
      </div>

      {labels && labels.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {labels.map((label) => {
            const lower = label.toLowerCase();
            const variant = lower.includes('urgent') || lower.includes('block') ? 'alert' : 'default';
            return <Label key={label} text={label} variant={variant} />;
          })}
        </div>
      )}

      <div className="mt-3 flex items-center justify-between text-xs text-muted">
        <div className="flex items-center gap-2">
          <div className="grid h-7 w-7 place-items-center rounded-full bg-subtle/60 border border-border text-[11px] font-medium text-foreground/80">
            {initials(assignee)}
          </div>
          <span className="truncate max-w-[110px]">
            {assignee || 'Unassigned'}
          </span>
        </div>
        {dueInfo.text && (
          <span className={clsx('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px]', dueInfo.className)}>
            <Clock size={12} />
            {dueInfo.text}
          </span>
        )}
      </div>

      {hasChecklist && (
        <div className="mt-3 space-y-1">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-subtle/50">
            <div
              className={clsx(
                'h-full rounded-full transition-all',
                pct === 100 ? 'bg-emerald-500' : 'bg-brand/70',
              )}
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="text-[10px] text-muted">
            체크리스트 {pct}% 완료
          </div>
        </div>
      )}
    </button>
  );
}

type ColumnProps = {
  colKey: ColumnKey;
  label: string;
  items: CardT[];
  visibleItems: CardT[];
  hasActiveFilters: boolean;
  renderCard: (card: CardT) => React.ReactNode;
};

function Column({ colKey, label, items, visibleItems, hasActiveFilters, renderCard }: ColumnProps) {
  const droppableId = `col-${colKey}`;
  const { isOver, setNodeRef } = useDroppable({ id: droppableId });
  const totalPoints = items.reduce(
    (sum, card) => sum + (Number.isFinite(card.points) ? (card.points as number) : 0),
    0,
  );

  const visibleCount = visibleItems.length;
  const emptyMessage = hasActiveFilters ? '필터와 일치하는 이슈가 없습니다.' : '카드를 추가해보세요.';

  return (
    <div
      ref={setNodeRef}
      className={clsx(
        'flex w-full min-w-0 flex-col gap-3 rounded-2xl border border-border bg-subtle/40 p-4 transition',
        'md:flex-1 md:min-w-[280px]',
        isOver && 'ring-2 ring-brand/50',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-sm font-semibold text-foreground">{label}</div>
          <div className="text-xs text-muted">
            {visibleCount}/{items.length} · {totalPoints} pts
          </div>
        </div>
        <div
          className={clsx(
            'h-2 w-12 overflow-hidden rounded-full bg-subtle/60',
            colKey === 'done' && 'bg-emerald-500/20',
          )}
        >
          <div
            className={clsx(
              'h-full rounded-full',
              colKey === 'done' ? 'bg-emerald-500' : 'bg-brand/70',
            )}
            style={{
              width: `${Math.min(100, Math.max(6, (visibleCount / Math.max(items.length, 1)) * 100))}%`,
            }}
          />
        </div>
      </div>

      <SortableContext items={visibleItems.map((card) => card.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-3">
          {visibleItems.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/70 bg-subtle/30 p-4 text-center text-xs text-muted">
              {emptyMessage}
            </div>
          ) : (
            visibleItems.map((card) => <React.Fragment key={card.id}>{renderCard(card)}</React.Fragment>)
          )}
        </div>
      </SortableContext>
    </div>
  );
}

/** ---------- Main ---------- */
export default function KanbanView() {
  const router = useRouter();

  // fallback board
  const fallback: BoardT = useMemo(
    () => ({
      todo: [
        {
          id: 'ISSUE-1',
          title: '초기 세팅 마무리',
          labels: ['setup'],
          due: todayStr(),
          assignee: 'Alice',
          points: 3,
          checklist: [{ id: 'c1', text: '환경변수 정리', done: true }],
        },
        {
          id: 'ISSUE-2',
          title: '레이아웃 리팩터링',
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
          title: '채팅 입력창 컴포넌트 개선',
          labels: ['chat', 'urgent'],
          due: todayStr(),
          assignee: 'Carol',
          points: 5,
          checklist: [
            { id: 'c2', text: '이모지 피커 QA', done: false },
            { id: 'c3', text: '단축키 문서화', done: true },
          ],
        },
      ],
      done: [],
    }),
    [],
  );

  // dnd sensors
  const sensors = useSensors(useSensor(PointerSensor));

  // board history
  const hist = useHistory<BoardT>(lsGet<BoardT>(LS_KEY, fallback));
  const board = hist.state;

  useEffect(() => {
    saveBoard(board);
  }, [board]);

  const [sprintDays, setSprintDays] = useState<number>(() => Number(lsGet<number>(LS_SPRINT_DAYS, 7)) || 7);
  useEffect(() => {
    lsSet(LS_SPRINT_DAYS, sprintDays);
  }, [sprintDays]);

  const [searchTerm, setSearchTerm] = useState('');
  const [labelFilter, setLabelFilter] = useState<string | null>(null);
  const [assigneeFilter, setAssigneeFilter] = useState<string | null>(null);
  const [showOnlyOverdue, setShowOnlyOverdue] = useState(false);
  const [showChecklistOnly, setShowChecklistOnly] = useState(false);

  const allCards = useMemo(
    () => [...board.todo, ...board.doing, ...board.done],
    [board],
  );

  const uniqueLabels = useMemo(() => {
    const set = new Set<string>();
    allCards.forEach((card) => card.labels?.forEach((label) => set.add(label)));
    return Array.from(set).sort();
  }, [allCards]);

  const uniqueAssignees = useMemo(() => {
    const set = new Set<string>();
    allCards.forEach((card) => {
      if (card.assignee) set.add(card.assignee);
    });
    return Array.from(set).sort();
  }, [allCards]);

  const filteredBoard: BoardT = useMemo(
    () => {
      const filterFn = (card: CardT) => {
        if (searchTerm) {
          const keyword = searchTerm.toLowerCase();
          const haystack = [card.title, card.labels?.join(' ') ?? '', card.assignee ?? '']
            .join(' ')
            .toLowerCase();
          if (!haystack.includes(keyword)) return false;
        }
        if (labelFilter && !(card.labels || []).includes(labelFilter)) return false;
        if (assigneeFilter && (card.assignee || '').toLowerCase() !== assigneeFilter.toLowerCase()) return false;
        if (showOnlyOverdue && getDueState(card.due) !== 'overdue') return false;
        if (
          showChecklistOnly &&
          !(
            card.checklist &&
            card.checklist.length > 0 &&
            checklistPercent(card.checklist) < 100
          )
        ) {
          return false;
        }
        return true;
      };

      return {
        todo: board.todo.filter(filterFn),
        doing: board.doing.filter(filterFn),
        done: board.done.filter(filterFn),
      };
    },
    [board, searchTerm, labelFilter, assigneeFilter, showOnlyOverdue, showChecklistOnly],
  );

  const hasActiveFilters =
    Boolean(searchTerm) ||
    Boolean(labelFilter) ||
    Boolean(assigneeFilter) ||
    showOnlyOverdue ||
    showChecklistOnly;

  const findColumnOfCard = (cardId: UniqueIdentifier): ColumnKey | null => {
    const key = (Object.keys(board) as ColumnKey[]).find((k) => board[k].some((card) => card.id === cardId));
    return key ?? null;
  };

  const updateBoard = (next: BoardT, useCommit = true) => {
    if (useCommit) hist.commit(next);
    else hist.set(next);
  };

  const moveWithin = (fromCol: ColumnKey, activeId: string, overId: string) => {
    const col = board[fromCol];
    const oldIdx = col.findIndex((card) => card.id === activeId);
    const newIdx = col.findIndex((card) => card.id === overId);
    if (oldIdx === -1 || newIdx === -1) return;
    const next: BoardT = { ...board, [fromCol]: arrayMove(col, oldIdx, newIdx) };
    updateBoard(next);
  };

  const moveAcross = (fromCol: ColumnKey, toCol: ColumnKey, activeId: string, overId?: string) => {
    const fromArr = [...board[fromCol]];
    const toArr = [...board[toCol]];
    const movedIdx = fromArr.findIndex((card) => card.id === activeId);
    if (movedIdx === -1) return;
    const [moved] = fromArr.splice(movedIdx, 1);

    if (toCol === 'done' && !moved.completedAt) moved.completedAt = todayStr();
    if (fromCol === 'done' && toCol !== 'done') delete moved.completedAt;

    const insertIdx = overId ? toArr.findIndex((card) => card.id === overId) : -1;
    toArr.splice(insertIdx < 0 ? toArr.length : insertIdx, 0, moved);
    const next: BoardT = { ...board, [fromCol]: fromArr, [toCol]: toArr };
    updateBoard(next);
  };

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);
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
      const oldIdx = col.findIndex((card) => card.id === activeId);
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
    points?: number,
  ) => {
    const id = `ISSUE-${Math.floor(Math.random() * 9000 + 1000)}`;
    const next: BoardT = {
      ...board,
      [column]: [
        ...board[column],
        { id, title, labels, due, assignee, points, checklist: [] },
      ],
    };
    updateBoard(next);
  };

  const openIssue = (id: string) => {
    router.push(`/app/issues/${id}`);
  };

  // stats
  const totalPoints = allCards.reduce(
    (sum, card) => sum + (Number.isFinite(card.points) ? (card.points as number) : 0),
    0,
  );
  const donePoints = board.done.reduce(
    (sum, card) => sum + (Number.isFinite(card.points) ? (card.points as number) : 0),
    0,
  );
  const completedDates = board.done.map((card) => ({
    date: card.completedAt || todayStr(),
    points: Number.isFinite(card.points) ? (card.points as number) : 0,
  }));

  const overdueCount = allCards.filter((card) => getDueState(card.due) === 'overdue').length;
  const dueSoonCount = allCards.filter((card) => getDueState(card.due) === 'soon' || getDueState(card.due) === 'today').length;
  const checklistAttention = allCards.filter((card) => isChecklistIncomplete(card)).length;

  const hasMatches =
    filteredBoard.todo.length + filteredBoard.doing.length + filteredBoard.done.length > 0;

  const resetFilters = () => {
    setSearchTerm('');
    setLabelFilter(null);
    setAssigneeFilter(null);
    setShowOnlyOverdue(false);
    setShowChecklistOnly(false);
  };

  const metrics = [
    {
      label: '마감 임박',
      value: dueSoonCount,
      sub: '오늘/2일 이내 마감',
      className: 'bg-amber-500/10 border border-amber-500/20 text-amber-600',
    },
    {
      label: '지연 이슈',
      value: overdueCount,
      sub: '마감 기한 초과',
      className: 'bg-rose-500/10 border border-rose-500/20 text-rose-600',
    },
    {
      label: '체크리스트 진행 중',
      value: checklistAttention,
      sub: '완료 전 체크리스트 포함',
      className: 'bg-brand/10 border border-brand/20 text-brand',
    },
  ];

  return (
    <div className="h-full overflow-x-auto p-4">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-4">
        <div className="flex flex-col gap-4 rounded-3xl border border-border bg-panel/60 p-4 shadow-sm backdrop-blur">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-subtle/60 px-3 py-1 text-xs text-muted">
                <Filter size={12} />
                Flowdash Sprint Board
              </div>
              <div className="text-lg font-semibold text-foreground">
                프로젝트 이슈 관리
              </div>
              <p className="text-sm text-muted">
                진행 상황을 한눈에 확인하고, 마감이 임박한 업무를 빠르게 조치하세요.
              </p>
              {hasActiveFilters && (
                <div className="text-xs text-muted">
                  활성화된 필터가 있습니다. <button type="button" className="inline-flex items-center gap-1 text-brand hover:underline" onClick={resetFilters}><X size={12} /> 초기화</button>
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 rounded-full border border-border bg-subtle/50 px-3 py-1 text-xs text-muted">
                <span>스프린트 일수</span>
                <input
                  type="number"
                  min={3}
                  max={30}
                  value={sprintDays}
                  onChange={(event) => {
                    const val = Math.max(3, Math.min(30, Number(event.target.value) || 7));
                    setSprintDays(val);
                  }}
                  className="w-16 rounded border border-border bg-background px-2 py-1 text-xs"
                />
              </div>
              <button
                className={clsx(
                  'inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs transition',
                  hist.canUndo
                    ? 'border-border hover:bg-subtle/60'
                    : 'cursor-not-allowed border-border/60 text-muted opacity-60',
                )}
                onClick={() => hist.undo()}
                disabled={!hist.canUndo}
                title="Undo (Ctrl+Z)"
              >
                <Undo2 size={14} />
                Undo
              </button>
              <button
                className={clsx(
                  'inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs transition',
                  hist.canRedo
                    ? 'border-border hover:bg-subtle/60'
                    : 'cursor-not-allowed border-border/60 text-muted opacity-60',
                )}
                onClick={() => hist.redo()}
                disabled={!hist.canRedo}
                title="Redo (Ctrl+Shift+Z)"
              >
                <Redo2 size={14} />
                Redo
              </button>
              <NewIssueDialog onCreate={onCreate} />
            </div>
          </div>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="grid w-full gap-3 sm:grid-cols-3">
              {metrics.map((metric) => (
                <div
                  key={metric.label}
                  className={clsx(
                    'rounded-2xl px-4 py-3 text-sm shadow-inner',
                    metric.className,
                  )}
                >
                  <div className="text-xs uppercase tracking-wide text-muted/80">{metric.label}</div>
                  <div className="mt-1 text-2xl font-semibold">{metric.value}</div>
                  <div className="text-xs text-muted/80">{metric.sub}</div>
                </div>
              ))}
            </div>
            <div className="flex justify-end">
              <SprintStats
                totalPoints={totalPoints}
                donePoints={donePoints}
                completedDates={completedDates}
                days={sprintDays}
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 rounded-2xl border border-border bg-background/80 p-3">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative w-full max-w-sm">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="이슈 제목, 라벨, 담당자 검색"
                  className="h-9 w-full rounded-md border border-border bg-background pl-9 pr-3 text-sm outline-none focus:ring-1 focus:ring-brand/50"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                <button
                  type="button"
                  onClick={() => setShowOnlyOverdue((prev) => !prev)}
                  className={clsx(
                    'inline-flex items-center gap-1 rounded-full border px-3 py-1 transition',
                    showOnlyOverdue
                      ? 'border-rose-500/50 bg-rose-500/10 text-rose-600'
                      : 'border-border hover:bg-subtle/60',
                  )}
                >
                  <AlertTriangle size={12} />
                  마감 지연
                </button>
                <button
                  type="button"
                  onClick={() => setShowChecklistOnly((prev) => !prev)}
                  className={clsx(
                    'inline-flex items-center gap-1 rounded-full border px-3 py-1 transition',
                    showChecklistOnly
                      ? 'border-brand/50 bg-brand/10 text-brand'
                      : 'border-border hover:bg-subtle/60',
                  )}
                >
                  <ListChecks size={12} />
                  체크리스트 미완료
                </button>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="inline-flex items-center gap-1 text-brand hover:underline"
                  >
                    <X size={12} /> 필터 초기화
                  </button>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-2 text-xs">
              {uniqueLabels.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-muted">
                    <Filter size={12} /> 라벨
                  </span>
                  {uniqueLabels.map((label) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setLabelFilter((prev) => (prev === label ? null : label))}
                      className={clsx(
                        'rounded-full border px-3 py-1 transition',
                        labelFilter === label
                          ? 'border-brand/60 bg-brand/10 text-brand'
                          : 'border-border hover:bg-subtle/60 text-muted',
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
              {uniqueAssignees.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-muted">
                    <Users size={12} /> 담당자
                  </span>
                  {uniqueAssignees.map((name) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setAssigneeFilter((prev) => (prev === name ? null : name))}
                      className={clsx(
                        'inline-flex items-center gap-2 rounded-full border px-3 py-1 transition',
                        assigneeFilter === name
                          ? 'border-brand/60 bg-brand/10 text-brand'
                          : 'border-border hover:bg-subtle/60 text-muted',
                      )}
                    >
                      <span className="grid h-5 w-5 place-items-center rounded-full bg-subtle/70 text-[10px] font-semibold text-muted">
                        {initials(name)}
                      </span>
                      {name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <div className="flex flex-col gap-4 md:flex-row md:items-start">
            <Column
              colKey="todo"
              label="To Do"
              items={board.todo}
              visibleItems={filteredBoard.todo}
              hasActiveFilters={hasActiveFilters}
              renderCard={(card) => <Card {...card} onOpen={openIssue} />}
            />
            <Column
              colKey="doing"
              label="In Progress"
              items={board.doing}
              visibleItems={filteredBoard.doing}
              hasActiveFilters={hasActiveFilters}
              renderCard={(card) => <Card {...card} onOpen={openIssue} />}
            />
            <Column
              colKey="done"
              label="Done"
              items={board.done}
              visibleItems={filteredBoard.done}
              hasActiveFilters={hasActiveFilters}
              renderCard={(card) => <Card {...card} onOpen={openIssue} />}
            />
          </div>
        </DndContext>

        {!hasMatches && (
          <div className="rounded-2xl border border-dashed border-border/60 bg-subtle/40 px-6 py-8 text-center text-sm text-muted">
            조건에 맞는 이슈가 없습니다. 필터를 조정하거나 새 이슈를 생성해보세요.
          </div>
        )}
      </div>
    </div>
  );
}
