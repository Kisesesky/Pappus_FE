'use client';

import { useMemo, useState } from 'react';
import {
  addDays,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  isSameDay,
  format,
  parseISO,
  isWithinInterval,
  isAfter,
} from 'date-fns';
import { ko } from 'date-fns/locale';
import { Plus, RefreshCcw } from 'lucide-react';
import { cn as clsx } from '@/lib/utils';

type Provider = 'google' | 'outlook' | 'internal';
type ViewMode = 'month' | 'week' | 'day';

type EventItem = {
  id: string;
  provider: Provider;
  calendarId: string;
  title: string;
  start?: string; // ISO
  end?: string; // ISO
  date?: string; // YYYY-MM-DD
  allDay?: boolean;
  color?: string;
  canEdit?: boolean;
};

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];

const DEMO_EVENTS: EventItem[] = [
  { id: 'e1', provider: 'google', calendarId: 'primary', title: '전체 회의', date: '2025-10-02', allDay: true, color: '#1a73e8', canEdit: true },
  { id: 'e2', provider: 'google', calendarId: 'primary', title: '클라이언트 미팅', start: '2025-10-02T10:30:00', end: '2025-10-02T11:00:00', color: '#1a73e8', canEdit: true },
  { id: 'e3', provider: 'outlook', calendarId: 'team', title: '디자인 리뷰', start: '2025-10-10T14:00:00', end: '2025-10-10T15:00:00', color: '#2563eb', canEdit: false },
  { id: 'e4', provider: 'internal', calendarId: 'ops', title: '릴리즈 준비', date: '2025-10-10', allDay: true, color: '#10b981', canEdit: true },
  { id: 'e5', provider: 'google', calendarId: 'primary', title: 'OKR 점검', start: '2025-10-10T09:00:00', end: '2025-10-10T10:00:00', color: '#1a73e8', canEdit: true },
  { id: 'e6', provider: 'internal', calendarId: 'ops', title: '운영 미팅', start: '2025-10-18T16:00:00', end: '2025-10-18T17:30:00', color: '#10b981', canEdit: true },
  { id: 'e7', provider: 'outlook', calendarId: 'team', title: '팀 디너', start: '2025-10-18T19:00:00', end: '2025-10-18T21:00:00', color: '#2563eb', canEdit: false },
  { id: 'e8', provider: 'internal', calendarId: 'ops', title: '캘린더 QA', start: '2025-10-05T13:00:00', end: '2025-10-05T14:00:00', color: '#10b981', canEdit: true },
];

const DEMO_CALENDARS = [
  { key: 'google:primary', name: 'Google 기본', color: '#1a73e8', visible: true },
  { key: 'outlook:team', name: 'Outlook 팀', color: '#2563eb', visible: true },
  { key: 'internal:ops', name: 'Flowdash Ops', color: '#10b981', visible: true },
];

const toKey = (date: Date) => format(date, 'yyyy-MM-dd');

function parseEventStart(ev: EventItem): Date | null {
  if (ev.start) return parseISO(ev.start);
  if (ev.date) return parseISO(`${ev.date}T00:00:00`);
  return null;
}

function parseEventEnd(ev: EventItem): Date | null {
  if (ev.end) return parseISO(ev.end);
  if (ev.date) return parseISO(`${ev.date}T23:59:00`);
  return null;
}

function eventMatchesDay(ev: EventItem, day: Date) {
  if (ev.allDay || ev.date) {
    return toKey(day) === (ev.date ?? (ev.start ? format(parseISO(ev.start), 'yyyy-MM-dd') : ''));
  }
  if (!ev.start || !ev.end) return false;
  const start = parseISO(ev.start);
  const end = parseISO(ev.end);
  return isSameDay(start, day) || isWithinInterval(day, { start, end });
}

type PositionedEvent = {
  ev: EventItem;
  top: number;
  height: number;
  left: number;
  width: number;
};

function layoutTimedEvents(events: EventItem[], day: Date): PositionedEvent[] {
  const timed = events
    .filter((ev) => !ev.allDay && ev.start && ev.end && eventMatchesDay(ev, day))
    .map((ev) => ({ ev, start: parseISO(ev.start!), end: parseISO(ev.end!) }))
    .sort((a, b) => a.start.getTime() - b.start.getTime() || a.end.getTime() - b.end.getTime());

  const columns: typeof timed[] = [];
  timed.forEach((item) => {
    let placedIndex = -1;
    for (let c = 0; c < columns.length; c++) {
      if (columns[c][columns[c].length - 1].end <= item.start) {
        placedIndex = c;
        break;
      }
    }
    if (placedIndex === -1) {
      columns.push([item]);
    } else {
      columns[placedIndex].push(item);
    }
  });

  const minsInDay = 24 * 60;
  const positioned: PositionedEvent[] = [];

  columns.forEach((col, colIndex) => {
    const colWidth = 100 / columns.length;
    col.forEach((cell) => {
      const startMin = cell.start.getHours() * 60 + cell.start.getMinutes();
      const endMin = cell.end.getHours() * 60 + cell.end.getMinutes();
      positioned.push({
        ev: cell.ev,
        top: (startMin / minsInDay) * 100,
        height: Math.max(3, ((endMin - startMin) / minsInDay) * 100),
        left: colIndex * colWidth,
        width: colWidth,
      });
    });
  });

  return positioned;
}

function formatTimeRange(ev: EventItem) {
  if (ev.allDay || ev.date) return '종일';
  if (!ev.start || !ev.end) return '시간 미정';
  return `${ev.start.slice(11, 16)} ~ ${ev.end.slice(11, 16)}`;
}

export default function CalendarView({
  initialDate = new Date(2025, 9, 1),
  initialView = 'month',
  workStartHour = 9,
  workEndHour = 18,
}: {
  initialDate?: Date;
  initialView?: ViewMode;
  workStartHour?: number;
  workEndHour?: number;
}) {
  const [current, setCurrent] = useState(initialDate);
  const [view, setView] = useState<ViewMode>(initialView);
  const [showFullDay, setShowFullDay] = useState(false);
  const [calendars, setCalendars] = useState(DEMO_CALENDARS);
  const [events, setEvents] = useState<EventItem[]>(DEMO_EVENTS);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerDate, setDrawerDate] = useState<Date | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const visibleMap = useMemo(
    () => Object.fromEntries(calendars.map((c) => [c.key, c.visible])),
    [calendars],
  );

  const filteredEvents = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    return events.filter((ev) => {
      const visible = visibleMap[`${ev.provider}:${ev.calendarId}`] ?? true;
      if (!visible) return false;
      if (!keyword) return true;
      return ev.title.toLowerCase().includes(keyword);
    });
  }, [events, visibleMap, searchTerm]);

  const monthDays = useMemo(() => {
    const start = startOfMonth(current);
    const end = endOfMonth(current);
    const gridStart = startOfWeek(start, { locale: ko });
    const gridEnd = endOfWeek(end, { locale: ko });
    const all = eachDayOfInterval({ start: gridStart, end: gridEnd });
    if (all.length === 42) return all;
    if (all.length < 42) {
      const extra = 42 - all.length;
      const extend = eachDayOfInterval({ start: gridEnd, end: addDays(gridEnd, extra + 1) }).slice(1);
      return [...all, ...extend].slice(0, 42);
    }
    return all.slice(0, 42);
  }, [current]);

  const weekRange = useMemo(() => {
    const start = startOfWeek(current, { locale: ko });
    const end = endOfWeek(current, { locale: ko });
    return eachDayOfInterval({ start, end });
  }, [current]);

  const hours = useMemo(() => {
    const start = showFullDay ? 0 : workStartHour;
    const end = showFullDay ? 23 : workEndHour;
    const arr: number[] = [];
    for (let h = start; h <= end; h += 1) arr.push(h);
    return arr;
  }, [showFullDay, workStartHour, workEndHour]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, EventItem[]>();
    filteredEvents.forEach((ev) => {
      const key =
        ev.allDay || ev.date
          ? ev.date ?? (ev.start ? format(parseISO(ev.start), 'yyyy-MM-dd') : '')
          : ev.start
            ? format(parseISO(ev.start), 'yyyy-MM-dd')
            : '';
      if (!key) return;
      const list = map.get(key) ?? [];
      list.push(ev);
      map.set(key, list);
    });
    return map;
  }, [filteredEvents]);

  const now = new Date();
  const eventsForDay = (day: Date) => filteredEvents.filter((ev) => eventMatchesDay(ev, day));

  const upcomingEvents = useMemo(() => {
    const list = filteredEvents
      .map((ev) => ({ ev, start: parseEventStart(ev) }))
      .filter((item): item is { ev: EventItem; start: Date } => Boolean(item.start))
      .filter((item) => isAfter(item.start, addDays(now, -1)))
      .sort((a, b) => a.start.getTime() - b.start.getTime())
      .slice(0, 6);
    return list;
  }, [filteredEvents, now]);

  const weekLayouts = useMemo(() => {
    const map = new Map<string, PositionedEvent[]>();
    weekRange.forEach((date) => {
      map.set(toKey(date), layoutTimedEvents(filteredEvents, date));
    });
    return map;
  }, [filteredEvents, weekRange]);

  const dayLayout = useMemo(
    () => layoutTimedEvents(filteredEvents, current),
    [filteredEvents, current],
  );

  const firstHour = hours[0] ?? 0;
  const lastHour = hours[hours.length - 1] ?? 23;
  // Hour slot height (compressed slightly when 24시간 보기 활성화)
  const slotHeight = showFullDay ? 40 : 56;
  const timelineHeight = Math.max(hours.length, 1) * slotHeight;
  const visibleStartMinute = firstHour * 60;
  const visibleEndMinute = (lastHour + 1) * 60;
  const visibleMinutes = Math.max(visibleEndMinute - visibleStartMinute, 60);

  const positionEvent = (item: PositionedEvent) => {
    if (item.ev.allDay || item.ev.date) return null;
    const start = parseEventStart(item.ev);
    if (!start) return null;
    const endOriginal = parseEventEnd(item.ev);
    const fallbackEnd = new Date(start.getTime() + 30 * 60 * 1000);
    const end = endOriginal ?? fallbackEnd;

    let startMinutes = start.getHours() * 60 + start.getMinutes();
    let endMinutes = end.getHours() * 60 + end.getMinutes();
    if (endMinutes <= startMinutes) {
      endMinutes = startMinutes + 15;
    }

    if (endMinutes <= visibleStartMinute || startMinutes >= visibleEndMinute) {
      return null;
    }

    startMinutes = Math.max(startMinutes, visibleStartMinute);
    endMinutes = Math.max(startMinutes + 15, Math.min(endMinutes, visibleEndMinute));

    const top = ((startMinutes - visibleStartMinute) / visibleMinutes) * timelineHeight;
    const rawHeight = Math.max(
      slotHeight * 0.4,
      ((endMinutes - startMinutes) / visibleMinutes) * timelineHeight,
    );

    const maxHeight = Math.max(timelineHeight - top, slotHeight * 0.25);
    const height = Math.min(rawHeight, maxHeight);

    return { top, height };
  };

  const totalThisMonth = filteredEvents.filter((ev) => {
    const start = parseEventStart(ev);
    if (!start) return false;
    return start.getFullYear() === current.getFullYear() && start.getMonth() === current.getMonth();
  }).length;
  const meetingsToday = filteredEvents.filter((ev) => eventMatchesDay(ev, now)).length;
  const focusBlocks = filteredEvents.filter((ev) => ev.provider === 'internal').length;

  const goPrev = () => {
    if (view === 'month') setCurrent((prev) => subMonths(prev, 1));
    if (view === 'week') setCurrent((prev) => addDays(prev, -7));
    if (view === 'day') setCurrent((prev) => addDays(prev, -1));
  };
  const goNext = () => {
    if (view === 'month') setCurrent((prev) => addMonths(prev, 1));
    if (view === 'week') setCurrent((prev) => addDays(prev, 7));
    if (view === 'day') setCurrent((prev) => addDays(prev, 1));
  };
  const goToday = () => setCurrent(new Date());

  const openDrawer = (date: Date) => {
    setDrawerDate(date);
    setDrawerOpen(true);
  };

  const addQuickEvent = (title: string) => {
    if (!drawerDate || !title.trim()) return;
    const dateStr = toKey(drawerDate);
    const startIso = `${dateStr}T09:00:00`;
    const endIso = `${dateStr}T09:30:00`;
    const newEvent: EventItem = {
      id: `local:${Date.now()}`,
      provider: 'internal',
      calendarId: 'ops',
      title: title.trim(),
      start: startIso,
      end: endIso,
      color: '#10b981',
      canEdit: true,
    };
    setEvents((prev) => [newEvent, ...prev]);
  };

  const metrics = [
    {
      label: '이번 달 일정',
      value: totalThisMonth,
      hint: format(current, 'M월 일정 수', { locale: ko }),
      accent: '#0c66e4',
    },
    {
      label: '오늘 미팅',
      value: meetingsToday,
      hint: isToday(current) ? '오늘 진행 예정' : '오늘 준비 상황',
      accent: '#f2994a',
    },
    {
      label: '내부 집중 시간',
      value: focusBlocks,
      hint: 'internal 캘린더 기반',
      accent: '#36b37e',
    },
  ];

  const viewLabel =
    view === 'month'
      ? format(current, 'yyyy년 M월', { locale: ko })
      : view === 'week'
        ? `${format(weekRange[0], 'M월 d일', { locale: ko })} ~ ${format(
            weekRange[6],
            'M월 d일',
            { locale: ko },
          )}`
        : format(current, 'yyyy년 M월 d일 (EEE)', { locale: ko });

  return (
    <div className="h-full overflow-y-auto bg-[#f4f5f7] p-6">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-6">
        <section className="rounded-2xl border border-[#dfe1e6] bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-[#e9f2ff] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0c66e4]">
                Calendar Hub
              </span>
              <div>
                <h1 className="text-[28px] font-semibold leading-[1.3] text-[#172b4d]">
                  릴리즈와 팀 일정을 한 곳에서 조율하세요
                </h1>
                <p className="mt-2 max-w-xl text-sm text-[#5e6c84]">
                  Google, Outlook, Flowdash 내부 일정이 연결된 Atlassian 스타일 캘린더입니다. 스프린트, 회의, 집중 블록을 빠르게 확인하고 필요한 액션을 이어가세요.
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-4 rounded-2xl border border-[#dfe1e6] bg-[#f7f8fa] p-4 text-sm text-[#172b4d] shadow-inner">
              <div className="flex items-center justify-between gap-3">
                <button
                  onClick={goPrev}
                  className="inline-flex items-center rounded-lg border border-[#c1c7d0] bg-white px-3 py-1.5 text-sm font-medium text-[#172b4d] transition hover:bg-[#f4f5f7]"
                >
                  이전
                </button>
                <div className="flex-1 rounded-lg border border-[#c1c7d0] bg-white px-3 py-2 text-center text-sm font-semibold text-[#172b4d]">
                  {viewLabel}
                </div>
                <button
                  onClick={goNext}
                  className="inline-flex items-center rounded-lg border border-[#c1c7d0] bg-white px-3 py-1.5 text-sm font-medium text-[#172b4d] transition hover:bg-[#f4f5f7]"
                >
                  다음
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(['month', 'week', 'day'] as ViewMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setView(mode)}
                    className={clsx(
                      'rounded-lg px-3 py-1.5 text-sm font-medium transition',
                      view === mode ? 'bg-[#0c66e4] text-white shadow-sm' : 'text-[#5e6c84] hover:bg-[#f4f5f7]',
                    )}
                  >
                    {mode === 'month' ? '월간 보기' : mode === 'week' ? '주간 보기' : '일간 보기'}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[#5e6c84]">
                <button
                  onClick={goToday}
                  className="inline-flex items-center rounded-lg border border-[#c1c7d0] bg-white px-3 py-1.5 font-medium text-[#172b4d] transition hover:bg-[#f4f5f7]"
                >
                  오늘로 이동
                </button>
                {(view === 'week' || view === 'day') && (
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="size-4 accent-[#0c66e4]"
                      checked={showFullDay}
                      onChange={(event) => setShowFullDay(event.target.checked)}
                    />
                    24시간 보기
                  </label>
                )}
              </div>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button className="inline-flex items-center gap-2 rounded-lg bg-[#0c66e4] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0958c4]">
              <Plus className="h-4 w-4" />
              새 일정 만들기
            </button>
            <button className="inline-flex items-center gap-2 rounded-lg border border-[#c1c7d0] bg-white px-4 py-2 text-sm font-medium text-[#172b4d] transition hover:bg-[#f4f5f7]">
              <RefreshCcw className="h-4 w-4 text-[#0c66e4]" />
              캘린더 동기화
            </button>
            <span className="text-xs text-[#5e6c84]">
              Docs · Issues · Chat에 연결된 일정 상태가 자동으로 업데이트됩니다.
            </span>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="grid gap-3 sm:grid-cols-3">
            {metrics.map((metric) => (
              <div
                key={metric.label}
                className="rounded-xl border border-[#dfe1e6] bg-white p-4 shadow-sm"
              >
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#5e6c84]">
                  <span
                    className="inline-flex h-2 w-2 rounded-full"
                    style={{ backgroundColor: metric.accent }}
                  />
                  {metric.label}
                </div>
                <div className="mt-2 text-2xl font-semibold text-[#172b4d]">{metric.value}</div>
                <div className="text-xs text-[#5e6c84]">{metric.hint}</div>
              </div>
            ))}
          </div>
          <div className="rounded-2xl border border-[#dfe1e6] bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between text-sm font-semibold text-[#172b4d]">
              다가오는 일정
              <span className="text-xs text-[#5e6c84]">{upcomingEvents.length}건</span>
            </div>
            <div className="mt-3 space-y-2 text-xs text-[#5e6c84]">
              {upcomingEvents.length === 0 && (
                <div className="rounded-xl border border-dashed border-[#dfe1e6] bg-[#f7f8fa] px-3 py-4 text-center text-sm text-[#5e6c84]">
                  예정된 일정이 없습니다.
                </div>
              )}
              {upcomingEvents.map(({ ev, start }) => (
                <div
                  key={ev.id}
                  className="flex items-start gap-3 rounded-xl border border-[#dfe1e6] bg-[#f7f8fa] px-3 py-2 shadow-sm transition hover:border-[#0c66e4] hover:bg-white"
                >
                  <span
                    className="mt-1 inline-block h-2 w-2 rounded-full"
                    style={{ background: ev.color ?? 'var(--border)' }}
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-[#172b4d]">{ev.title}</div>
                    <div className="text-xs text-[#5e6c84]">
                      {format(start, 'M월 d일 (EEE) HH:mm', { locale: ko })}
                    </div>
                    <div className="mt-1 inline-flex items-center gap-2 rounded-full border border-[#c1c7d0] bg-white px-2 py-0.5 text-[11px] text-[#5e6c84]">
                      {ev.provider} / {ev.calendarId}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-4 rounded-2xl border border-[#dfe1e6] bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full max-w-md">
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="일정 · 팀원 · 키워드 검색"
                className="h-10 w-full rounded-lg border border-[#c1c7d0] bg-white px-4 text-sm text-[#172b4d] placeholder:text-[#a5adba] focus:ring-2 focus:ring-[#0c66e4]/40"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#5e6c84]">
              {calendars.map((calendar) => (
                <button
                  key={calendar.key}
                  onClick={() =>
                    setCalendars((prev) =>
                      prev.map((item) =>
                        item.key === calendar.key ? { ...item, visible: !item.visible } : item,
                      ),
                    )
                  }
                  className={clsx(
                    'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition',
                    calendar.visible
                      ? 'bg-[#deebff] text-[#0c66e4] shadow-sm'
                      : 'bg-white text-[#a5adba] hover:bg-[#f4f5f7]',
                  )}
                  style={{ borderColor: calendar.visible ? calendar.color : '#dfe1e6' }}
                >
                  <span className="inline-flex h-2 w-2 rounded-full" style={{ background: calendar.color }} />
                  {calendar.name}
                </button>
              ))}
            </div>
          </div>

          {(view === 'month' || view === 'week') && (
            <div className="grid grid-cols-7 gap-2 text-xs font-medium text-[#5e6c84]">
              {DAY_NAMES.map((name) => (
                <div key={name} className="text-center font-medium">
                  {name}
                </div>
              ))}
            </div>
          )}

          {view === 'month' && (
            <div className="grid grid-cols-7 gap-2">
              {monthDays.map((date) => {
                const key = toKey(date);
                const list = eventsByDate.get(key) ?? [];
                const visible = list.slice(0, 3);
                const overflow = Math.max(0, list.length - visible.length);
                return (
                  <div
                    key={key}
                    className={clsx(
                      'flex h-[120px] flex-col gap-1 rounded-xl border border-[#dfe1e6] bg-[#fdfdfd] p-2 text-xs text-[#5e6c84] transition hover:border-[#0c66e4] hover:shadow-sm',
                      !isSameMonth(date, current) && 'bg-white text-[#a5adba]',
                      isToday(date) && 'border-[#0c66e4] bg-[#deebff] shadow-[0_0_0_1px_rgba(12,102,228,0.35)]',
                    )}
                    onClick={() => openDrawer(date)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(event) => event.key === 'Enter' && openDrawer(date)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-[#172b4d]">{format(date, 'd')}</span>
                      {isToday(date) && (
                        <span className="rounded-full bg-[#0c66e4] px-1.5 py-0.5 text-[10px] font-medium text-white">
                          오늘
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col gap-1 overflow-hidden">
                      {visible.map((ev) => (
                        <div
                          key={ev.id}
                          className="truncate rounded-md border bg-white/80 px-2 py-1 text-[11px] text-[#172b4d]"
                          style={{ borderColor: ev.color ?? '#dfe1e6' }}
                        >
                          {ev.title}
                        </div>
                      ))}
                      {overflow > 0 && (
                        <div className="text-[11px] font-medium text-[#0c66e4]">+{overflow}개 더보기</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {view === 'week' && (
            <div className="overflow-hidden rounded-2xl border border-[#dfe1e6] bg-white">
              <div className="grid grid-cols-[80px_repeat(7,1fr)] border-b border-[#dfe1e6] bg-[#f7f8fa] text-xs text-[#5e6c84]">
                <div className="px-3 py-2 font-medium">시간</div>
                {weekRange.map((date) => (
                  <div
                    key={toKey(date)}
                    className={clsx(
                      'px-3 py-2 text-sm font-semibold',
                      isToday(date) ? 'text-[#0c66e4]' : 'text-[#172b4d]',
                    )}
                  >
                    {format(date, 'M/d (E)', { locale: ko })}
                    <div className="mt-1 flex flex-col gap-1 text-xs text-[#5e6c84]">
                      {eventsForDay(date)
                        .filter((ev) => ev.allDay || ev.date)
                        .slice(0, 2)
                        .map((ev) => (
                          <div
                            key={ev.id}
                            className="truncate rounded border border-[#dfe1e6] bg-white px-2 py-0.5"
                            style={{ borderColor: ev.color ?? '#dfe1e6' }}
                          >
                            {ev.title}
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-[80px_repeat(7,1fr)]">
                <div className="relative">
                  {hours.map((hour, index) => (
                    <div
                      key={`week-time-${hour}`}
                      className={clsx(
                        'flex items-start justify-end border-b border-[#dfe1e6] px-3 text-xs text-[#5e6c84]',
                        index === hours.length - 1 && 'border-b-0',
                      )}
                      style={{ height: `${slotHeight}px` }}
                    >
                      {String(hour).padStart(2, '0')}:00
                    </div>
                  ))}
                </div>
                {weekRange.map((date) => {
                  const dayKey = toKey(date);
                  const dayEvents = weekLayouts.get(dayKey) ?? [];
                  return (
                    <div
                      key={`week-column-${dayKey}`}
                      className="relative border-l border-[#dfe1e6]"
                      style={{ height: `${timelineHeight}px` }}
                      onDoubleClick={() => openDrawer(date)}
                    >
                      {hours.map((_, index) => {
                        if (index === hours.length - 1) return null;
                        return (
                          <div
                            key={`week-guideline-${dayKey}-${index}`}
                            className="pointer-events-none absolute left-0 right-0 border-b border-dashed border-[#ebecf0]"
                            style={{ top: `${(index + 1) * slotHeight}px` }}
                          />
                        );
                      })}
                      {dayEvents.map((item) => {
                        const placement = positionEvent(item);
                        if (!placement) return null;
                        return (
                          <div
                            key={item.ev.id}
                            className="absolute overflow-hidden rounded-md border bg-white px-2 py-1.5 text-[11px] text-[#172b4d] shadow-sm transition hover:border-[#0c66e4]"
                            style={{
                              top: `${placement.top}px`,
                              height: `${placement.height}px`,
                              left: `calc(${item.left}% + 4px)`,
                              width: `calc(${item.width}% - 8px)`,
                              borderColor: item.ev.color ?? '#dfe1e6',
                            }}
                            title={item.ev.title}
                          >
                            <div className="text-xs font-semibold">{item.ev.title}</div>
                            <div className="text-[11px] text-[#5e6c84]">{formatTimeRange(item.ev)}</div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {view === 'day' && (
            <div className="overflow-hidden rounded-2xl border border-[#dfe1e6] bg-white">
              <div className="px-4 py-3 text-sm font-semibold text-[#172b4d]">
                {format(current, 'M월 d일 (EEE)', { locale: ko })}
              </div>
              <div className="grid grid-cols-[80px_1fr]">
                <div className="relative">
                  {hours.map((hour, index) => (
                    <div
                      key={`day-time-${hour}`}
                      className={clsx(
                        'flex items-start justify-end border-b border-[#dfe1e6] px-3 text-xs text-[#5e6c84]',
                        index === hours.length - 1 && 'border-b-0',
                      )}
                      style={{ height: `${slotHeight}px` }}
                    >
                      {String(hour).padStart(2, '0')}:00
                    </div>
                  ))}
                </div>
                <div
                  className="relative border-l border-[#dfe1e6]"
                  style={{ height: `${timelineHeight}px` }}
                  onDoubleClick={() => openDrawer(current)}
                >
                  {hours.map((_, index) => {
                    if (index === hours.length - 1) return null;
                    return (
                      <div
                        key={`day-guideline-${index}`}
                        className="pointer-events-none absolute left-0 right-0 border-b border-dashed border-[#ebecf0]"
                        style={{ top: `${(index + 1) * slotHeight}px` }}
                      />
                    );
                  })}
                  {dayLayout.map((item) => {
                    const placement = positionEvent(item);
                    if (!placement) return null;
                    return (
                      <div
                        key={item.ev.id}
                        className="absolute overflow-hidden rounded-md border bg-white px-3 py-2 text-[11px] text-[#172b4d] shadow-sm transition hover:border-[#0c66e4]"
                        style={{
                          top: `${placement.top}px`,
                          height: `${placement.height}px`,
                          left: `calc(${item.left}% + 4px)`,
                          width: `calc(${item.width}% - 8px)`,
                          borderColor: item.ev.color ?? '#dfe1e6',
                        }}
                        title={item.ev.title}
                      >
                        <div className="text-xs font-semibold">{item.ev.title}</div>
                        <div className="text-[11px] text-[#5e6c84]">{formatTimeRange(item.ev)}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </section>
      </div>

      {drawerOpen && drawerDate && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-[#091e4214] backdrop-blur-[2px]" onClick={() => setDrawerOpen(false)} />
          <div className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-[#dfe1e6] bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-[#dfe1e6] px-5 py-4">
              <div>
                <div className="text-sm font-semibold text-[#172b4d]">
                  {format(drawerDate, 'yyyy년 M월 d일 (EEE)', { locale: ko })}
                </div>
                <div className="text-xs text-[#5e6c84]">
                  {eventsByDate.get(toKey(drawerDate))?.length ?? 0}개의 일정
                </div>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="rounded-md border border-[#c1c7d0] bg-white px-2 py-1 text-xs font-medium text-[#172b4d] hover:bg-[#f4f5f7]"
              >
                닫기
              </button>
            </div>
            <div className="space-y-3 px-5 py-4">
              <div className="flex gap-2">
                <input
                  className="flex-1 rounded-lg border border-[#c1c7d0] bg-white px-3 py-2 text-sm text-[#172b4d] placeholder:text-[#a5adba] focus:ring-2 focus:ring-[#0c66e4]/40"
                  placeholder="새 일정 제목 입력 후 Enter"
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      addQuickEvent((event.currentTarget as HTMLInputElement).value);
                      (event.currentTarget as HTMLInputElement).value = '';
                    }
                  }}
                />
                <button
                  className="rounded-lg border border-[#c1c7d0] bg-white px-3 py-2 text-xs font-medium text-[#172b4d] hover:bg-[#f4f5f7]"
                  onClick={() => alert('상세 작성은 추후 지원 예정입니다.')}
                >
                  상세
                </button>
              </div>
              <div className="space-y-2">
                {(eventsByDate.get(toKey(drawerDate)) ?? []).map((ev) => (
                  <div
                    key={ev.id}
                    className="rounded-xl border border-[#dfe1e6] bg-[#f7f8fa] p-3 shadow-sm"
                    style={{ borderColor: ev.color ?? '#dfe1e6' }}
                  >
                    <div className="text-sm font-semibold text-[#172b4d]">{ev.title}</div>
                    <div className="mt-1 text-xs text-[#5e6c84]">{formatTimeRange(ev)}</div>
                    <div className="mt-2 inline-flex items-center gap-2 text-[11px] text-[#5e6c84]">
                      <span className="rounded-full border border-[#c1c7d0] px-2 py-0.5 bg-white">
                        {ev.provider} · {ev.calendarId}
                      </span>
                      {ev.canEdit === false && <span>읽기 전용</span>}
                    </div>
                    <div className="mt-3 flex items-center gap-3 text-[11px] text-[#0c66e4]">
                      <button onClick={() => alert('Docs 링크로 이동')} className="hover:underline">
                        Docs 연결
                      </button>
                      <button onClick={() => alert('Chat 스레드 열기')} className="hover:underline">
                        Chat 열기
                      </button>
                      <button onClick={() => alert('Issue 생성')} className="hover:underline">
                        Issue 생성
                      </button>
                    </div>
                  </div>
                ))}
                {(eventsByDate.get(toKey(drawerDate)) ?? []).length === 0 && (
                  <div className="rounded-xl border border-dashed border-[#dfe1e6] bg-[#f7f8fa] p-4 text-sm text-[#5e6c84]">
                    아직 일정이 없습니다. 바로 추가해보세요.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

