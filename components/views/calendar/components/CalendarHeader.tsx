"use client";

import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { CalendarPlus, ChevronLeft, ChevronRight, Plus, Search } from "lucide-react";

import { cn } from "@/lib/utils";
import type { CalendarEvent, CalendarSource, ViewMode } from "@/types/calendar";
import { UpcomingEventCard } from "./UpcomingEventCard";

type CalendarHeaderProps = {
  current: Date;
  view: ViewMode;
  searchTerm: string;
  calendars: CalendarSource[];
  calendarMap: Map<string, CalendarSource>;
  upcomingEvents: CalendarEvent[];
  onSearch: (value: string) => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onChangeView: (mode: ViewMode) => void;
  onOpenCreate: () => void;
  onToggleCalendar: (id: string) => void;
  onRequestNewCalendar: () => void;
  onDeleteEvent: (id: string) => void;
};

export function CalendarHeader({
  current,
  view,
  searchTerm,
  calendars,
  calendarMap,
  upcomingEvents,
  onSearch,
  onPrev,
  onNext,
  onToday,
  onChangeView,
  onOpenCreate,
  onToggleCalendar,
  onRequestNewCalendar,
  onDeleteEvent,
}: CalendarHeaderProps) {
  return (
    <header className="flex flex-col gap-3 border-b border-border bg-panel/80 px-4 py-3 backdrop-blur-md">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-1 rounded-md border border-border bg-background p-1 shadow-sm">
            <button
              type="button"
              onClick={onPrev}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted hover:bg-subtle/60"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="px-3 text-base font-semibold text-foreground">
              {format(current, "yyyy.MM", { locale: ko })}
            </div>
            <button
              type="button"
              onClick={onNext}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted hover:bg-subtle/60"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <div className="flex items-center gap-2 rounded-md border border-border bg-background px-2 py-1 text-sm text-muted focus-within:ring-2 focus-within:ring-brand/40">
            <Search size={14} />
            <input
              value={searchTerm}
              onChange={(event) => onSearch(event.target.value)}
              placeholder="일정 검색"
              className="w-44 bg-transparent text-sm text-foreground focus:outline-none md:w-56"
            />
          </div>
          <button
            type="button"
            onClick={onToday}
            className="rounded-md border border-border px-3 py-1 text-sm font-medium text-foreground/80 transition hover:bg-subtle/60"
          >
            오늘
          </button>
          <div className="inline-flex items-center gap-1 rounded-md border border-border bg-background/80 p-1 text-xs font-medium shadow-sm">
            {(["month", "agenda"] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => onChangeView(mode)}
                className={cn(
                  "rounded-md px-3 py-1 capitalize transition",
                  view === mode ? "bg-brand text-white shadow-sm" : "text-muted hover:bg-subtle/60",
                )}
              >
                {mode}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={onOpenCreate}
            className="inline-flex items-center gap-2 rounded-md bg-brand px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand/90"
          >
            <Plus size={14} />
            새 일정
          </button>
        </div>
      </div>

      <section className="flex flex-col gap-3 rounded-xl border border-border/60 bg-background/80 p-3 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
            캘린더 표시
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {calendars.map((calendar) => (
            <label
              key={calendar.id}
              className="inline-flex items-center gap-2 rounded-md border border-border/50 bg-background px-3 py-1.5 text-sm transition hover:border-brand/40 hover:bg-subtle/60"
            >
              <input
                type="checkbox"
                className="accent-brand"
                checked={calendar.visible}
                onChange={() => onToggleCalendar(calendar.id)}
              />
              <span
                className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                style={{ backgroundColor: calendar.color }}
              />
              <span className="truncate text-foreground/80">{calendar.name}</span>
            </label>
          ))}
          <button
            type="button"
            onClick={onRequestNewCalendar}
            className="inline-flex items-center gap-1 rounded-md border border-dashed border-border/70 bg-transparent px-3 py-1.5 text-xs text-muted transition hover:border-brand hover:text-brand"
          >
            <CalendarPlus size={14} />
            새 캘린더
          </button>
        </div>

        <div className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
          다가오는 일정
        </div>
        <div className="max-h-36 space-y-1.5 overflow-y-auto pr-1">
          {upcomingEvents.length === 0 && (
            <div className="rounded-md border border-dashed border-border/60 bg-subtle/40 px-3 py-4 text-xs text-muted">
              예정된 일정이 없습니다.
            </div>
          )}
          {upcomingEvents.map((event) => (
            <UpcomingEventCard
              key={event.id}
              event={event}
              calendarName={calendarMap.get(event.calendarId)?.name}
              color={calendarMap.get(event.calendarId)?.color}
              onDelete={onDeleteEvent}
              compact
            />
          ))}
        </div>
      </section>
    </header>
  );
}
