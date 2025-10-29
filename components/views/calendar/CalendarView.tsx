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
      className: 'border-brand/20 bg-brand/5 text-brand',
    },
    {
      label: '오늘 미팅',
      value: meetingsToday,
      hint: isToday(current) ? '오늘 진행 예정' : '오늘 준비 상황',
      className: 'border-amber-400/30 bg-amber-100/15 text-amber-600',
    },
    {
      label: '내부 집중 시간',
      value: focusBlocks,
      hint: 'internal 캘린더 기반',
      className: 'border-emerald-400/30 bg-emerald-100/15 text-emerald-600',
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
    <div className="h-full overflow-y-auto p-6">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-6">
        <section className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-r from-sky-600/80 via-indigo-600/75 to-violet-600/70 p-6 text-white shadow-[0_25px_60px_rgba(15,23,42,0.45)]">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/25 blur-3xl" />
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-4">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-medium tracking-[0.24em]">
                FLOWDASH CALENDAR
              </span>
              <h1 className="text-3xl font-semibold leading-tight md:text-[34px]">
                팀 일정과 집중 시간을 한눈에 관리하세요
              </h1>
              <p className="max-w-xl text-sm text-white/80">
                Google · Outlook · Flowdash 내부 캘린더를 통합해서 확인하고, Sprint와 연동되는 주요 이벤트를 빠르게 조치할 수 있습니다.
              </p>
            </div>
            <div className="flex flex-col gap-3 rounded-2xl border border-white/25 bg-white/15 p-4 text-xs text-white/90 backdrop-blur">
              <div className="flex items-center justify-between gap-3">
                <button
                  onClick={goPrev}
                  className="rounded-full border border-white/40 px-3 py-1.5 text-sm hover:bg-white/20"
                >
                  이전
                </button>
                <div className="text-sm font-semibold">{viewLabel}</div>
                <button
                  onClick={goNext}
                  className="rounded-full border border-white/40 px-3 py-1.5 text-sm hover:bg-white/20"
                >
                  다음
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2 rounded-full border border-white/25 bg-white/15 p-1 text-xs">
                {(['month', 'week', 'day'] as ViewMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setView(mode)}
                    className={clsx(
                      'rounded-full px-3 py-1 font-medium transition',
                      view === mode ? 'bg-white text-slate-900 shadow' : 'text-white/80 hover:bg-white/10',
                    )}
                  >
                    {mode === 'month' ? '월' : mode === 'week' ? '주' : '일'}
                  </button>
                ))}
              </div>
              <div className="flex items-center justify-between gap-2">
                <button
                  onClick={goToday}
                  className="rounded-full border border-white/40 px-3 py-1.5 text-xs hover:bg-white/20"
                >
                  오늘로 이동
                </button>
                {(view === 'week' || view === 'day') && (
                  <label className="inline-flex items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      className="accent-white"
                      checked={showFullDay}
                      onChange={(event) => setShowFullDay(event.target.checked)}
                    />
                    24시간 보기
                  </label>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="grid gap-3 sm:grid-cols-3">
            {metrics.map((metric) => (
              <div
                key={metric.label}
                className={clsx(
                  'rounded-2xl px-4 py-3 text-sm shadow-inner backdrop-blur border',
                  metric.className,
                )}
              >
                <div className="text-xs uppercase tracking-wide opacity-80">{metric.label}</div>
                <div className="mt-1 text-2xl font-semibold">{metric.value}</div>
                <div className="text-xs opacity-70">{metric.hint}</div>
              </div>
            ))}
          </div>
          <div className="rounded-2xl border border-border bg-panel/70 p-4 shadow-sm">
            <div className="flex items-center justify-between text-sm font-semibold text-foreground">
              다가오는 일정
              <span className="text-xs text-muted">{upcomingEvents.length}건</span>
            </div>
            <div className="mt-3 space-y-2 text-xs text-muted">
              {upcomingEvents.length === 0 && (
                <div className="rounded-xl border border-dashed border-border/60 bg-accent/30 px-3 py-4 text-center text-sm">
                  예정된 일정이 없습니다.
                </div>
              )}
              {upcomingEvents.map(({ ev, start }) => (
                <div
                  key={ev.id}
                  className="flex items-start gap-3 rounded-xl border border-border/60 bg-background/80 px-3 py-2 shadow-sm transition hover:border-brand/40 hover:shadow-md"
                >
                  <span
                    className="mt-1 inline-block h-2 w-2 rounded-full"
                    style={{ background: ev.color ?? 'var(--border)' }}
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-foreground">{ev.title}</div>
                    <div className="text-xs text-muted">
                      {format(start, 'M월 d일 (EEE) HH:mm', { locale: ko })}
                    </div>
                    <div className="mt-1 inline-flex items-center gap-2 rounded-full border border-border/60 bg-accent/40 px-2 py-0.5 text-[11px]">
                      {ev.provider} / {ev.calendarId}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-3 rounded-3xl border border-border bg-panel/70 p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full max-w-sm">
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="일정 제목 검색"
                className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:ring-1 focus:ring-brand/50"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
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
                    'inline-flex items-center gap-2 rounded-full border px-3 py-1 transition',
                    calendar.visible
                      ? 'border-border bg-accent/80 text-foreground'
                      : 'border-border/60 text-muted opacity-70',
                  )}
                  style={{ borderColor: calendar.color }}
                >
                  <span className="inline-flex h-2 w-2 rounded-full" style={{ background: calendar.color }} />
                  {calendar.name}
                </button>
              ))}
            </div>
          </div>

          {(view === 'month' || view === 'week') && (
            <div className="grid grid-cols-7 gap-2 text-xs text-muted">
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
                      'flex h-[120px] flex-col gap-1 rounded-2xl border border-border/70 bg-background/70 p-2 text-xs transition hover:border-brand/30 hover:shadow-sm',
                      !isSameMonth(date, current) && 'opacity-50',
                      isToday(date) && 'border-brand/60 shadow-md',
                    )}
                    onClick={() => openDrawer(date)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(event) => event.key === 'Enter' && openDrawer(date)}
                  >
                    <div className="flex items-center justify-between text-muted">
                      <span className="font-medium text-foreground">{format(date, 'd')}</span>
                      {isToday(date) && (
                        <span className="rounded-full bg-brand/10 px-1.5 py-0.5 text-[10px] font-medium text-brand">
                          오늘
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col gap-1 overflow-hidden">
                      {visible.map((ev) => (
                        <div
                          key={ev.id}
                          className="truncate rounded-lg border px-2 py-1 text-[11px]"
                          style={{ borderColor: ev.color ?? 'var(--border)' }}
                        >
                          {ev.title}
                        </div>
                      ))}
                      {overflow > 0 && (
                        <div className="truncate rounded-lg border border-border/70 bg-accent/40 px-2 py-1 text-[11px] text-muted">
                          +{overflow}개 더보기
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {view === 'week' && (
            <div className="overflow-hidden rounded-2xl border border-border bg-background">
              <div className="grid grid-cols-[80px_repeat(7,1fr)] border-b border-border bg-accent/40 text-xs">
                <div className="px-3 py-2 text-muted">종일</div>
                {weekRange.map((date) => (
                  <div
                    key={toKey(date)}
                    className={clsx(
                      'px-3 py-2 text-sm font-medium',
                      isToday(date) && 'bg-brand/5 text-brand-foreground',
                    )}
                  >
                    {format(date, 'M/d (E)', { locale: ko })}
                    <div className="mt-1 flex flex-col gap-1 text-xs">
                      {eventsForDay(date)
                        .filter((ev) => ev.allDay || ev.date)
                        .slice(0, 2)
                        .map((ev) => (
                          <div
                            key={ev.id}
                            className="truncate rounded border px-2 py-0.5 text-[11px]"
                            style={{ borderColor: ev.color ?? 'var(--border)' }}
                          >
                            {ev.title}
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-[80px_repeat(7,1fr)] text-xs">
                {hours.map((hour) => (
                  <div key={`week-hour-${hour}`} className="contents">
                    <div className="border-b border-border px-3 py-3 text-muted">
                      {String(hour).padStart(2, '0')}:00
                    </div>
                    {weekRange.map((date) => {
                      const layout = weekLayouts.get(toKey(date)) ?? [];
                      const placed = layout.filter((item) => {
                        const start = parseEventStart(item.ev);
                        if (!start) return false;
                        return start.getHours() === hour;
                      });
                      return (
                        <div
                          key={`week-cell-${toKey(date)}-${hour}`}
                          className="relative border-b border-l border-border px-1 py-2"
                          onDoubleClick={() => openDrawer(date)}
                        >
                          {placed.map((item) => (
                            <div
                              key={item.ev.id}
                              className="absolute overflow-hidden rounded border bg-background/90 px-2 py-1 text-[11px] shadow-sm"
                              style={{
                                top: `${item.top}%`,
                                height: `${item.height}%`,
                                left: `${item.left}%`,
                                width: `calc(${item.width}% - 6px)`,
                                borderColor: item.ev.color ?? 'var(--border)',
                              }}
                              title={item.ev.title}
                            >
                              <div className="font-medium text-foreground">{item.ev.title}</div>
                              <div className="text-muted">{formatTimeRange(item.ev)}</div>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}

          {view === 'day' && (
            <div className="overflow-hidden rounded-2xl border border-border bg-background">
              <div className="px-4 py-3 text-sm font-semibold">
                {format(current, 'M월 d일 (EEE)', { locale: ko })}
              </div>
              <div className="grid grid-cols-[80px_1fr] text-xs">
                {hours.map((hour) => {
                  const placed = dayLayout.filter((item) => {
                    const start = parseEventStart(item.ev);
                    if (!start) return false;
                    return start.getHours() === hour;
                  });
                  return (
                    <div key={`day-hour-${hour}`} className="contents">
                      <div className="border-b border-border px-3 py-3 text-muted">
                        {String(hour).padStart(2, '0')}:00
                      </div>
                      <div
                        className="relative border-b border-l border-border px-2 py-2"
                        onDoubleClick={() => openDrawer(current)}
                      >
                        {placed.map((item) => (
                          <div
                            key={item.ev.id}
                            className="absolute overflow-hidden rounded border bg-background/90 px-2 py-1 text-[11px] shadow-sm"
                            style={{
                              top: `${item.top}%`,
                              height: `${item.height}%`,
                              left: `${item.left}%`,
                              width: `calc(${item.width}% - 6px)`,
                              borderColor: item.ev.color ?? 'var(--border)',
                            }}
                            title={item.ev.title}
                          >
                            <div className="font-medium text-foreground">{item.ev.title}</div>
                            <div className="text-muted">{formatTimeRange(item.ev)}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      </div>

      {drawerOpen && drawerDate && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
          <div className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-border bg-background shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div>
                <div className="text-sm font-semibold text-foreground">
                  {format(drawerDate, 'yyyy년 M월 d일 (EEE)', { locale: ko })}
                </div>
                <div className="text-xs text-muted">
                  {eventsByDate.get(toKey(drawerDate))?.length ?? 0}개의 일정
                </div>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="rounded-md border border-border px-2 py-1 text-xs hover:bg-accent/60"
              >
                닫기
              </button>
            </div>
            <div className="space-y-3 px-5 py-4">
              <div className="flex gap-2">
                <input
                  className="flex-1 rounded-md border border-border px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-brand/50"
                  placeholder="새 일정 제목 입력 후 Enter"
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      addQuickEvent((event.currentTarget as HTMLInputElement).value);
                      (event.currentTarget as HTMLInputElement).value = '';
                    }
                  }}
                />
                <button
                  className="rounded-md border border-border px-3 py-2 text-xs hover:bg-accent/60"
                  onClick={() => alert('상세 작성은 추후 지원 예정입니다.')}
                >
                  상세
                </button>
              </div>
              <div className="space-y-2">
                {(eventsByDate.get(toKey(drawerDate)) ?? []).map((ev) => (
                  <div
                    key={ev.id}
                    className="rounded-xl border border-border/60 bg-background/80 p-3 shadow-sm"
                    style={{ borderColor: ev.color ?? 'var(--border)' }}
                  >
                    <div className="text-sm font-semibold text-foreground">{ev.title}</div>
                    <div className="mt-1 text-xs text-muted">{formatTimeRange(ev)}</div>
                    <div className="mt-2 inline-flex items-center gap-2 text-[11px] text-muted">
                      <span className="rounded-full border border-border px-2 py-0.5">
                        {ev.provider} · {ev.calendarId}
                      </span>
                      {ev.canEdit === false && <span>읽기 전용</span>}
                    </div>
                    <div className="mt-3 flex items-center gap-3 text-[11px] text-brand">
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
                  <div className="rounded-xl border border-dashed border-border/70 bg-accent/40 p-4 text-sm text-muted">
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

