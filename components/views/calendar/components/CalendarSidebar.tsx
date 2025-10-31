"use client";

import { CalendarPlus } from "lucide-react";

import { UpcomingEventCard } from "./UpcomingEventCard";
import type { CalendarEvent, CalendarSource } from "@/types/calendar";

type CalendarSidebarProps = {
  calendars: CalendarSource[];
  upcomingEvents: CalendarEvent[];
  calendarMap: Map<string, CalendarSource>;
  showCalendarForm: boolean;
  newCalendarName: string;
  newCalendarColor: string;
  onToggleCalendar: (id: string) => void;
  onRequestNewCalendar: () => void;
  onSubmitNewCalendar: () => void;
  onCancelNewCalendar: () => void;
  onChangeCalendarName: (value: string) => void;
  onChangeCalendarColor: (value: string) => void;
  onDeleteEvent: (id: string) => void;
};

export function CalendarSidebar({
  calendars,
  upcomingEvents,
  calendarMap,
  showCalendarForm,
  newCalendarName,
  newCalendarColor,
  onToggleCalendar,
  onRequestNewCalendar,
  onSubmitNewCalendar,
  onCancelNewCalendar,
  onChangeCalendarName,
  onChangeCalendarColor,
  onDeleteEvent,
}: CalendarSidebarProps) {
  return (
    <aside className="flex w-full flex-col gap-6 border-b border-border bg-panel/40 px-4 py-4 lg:h-auto lg:w-80 lg:flex-shrink-0 lg:border-b-0 lg:border-r">
      <section className="space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.08em] text-muted">
          <span>캘린더</span>
          <button
            type="button"
            onClick={onRequestNewCalendar}
            className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] text-muted hover:bg-subtle/60"
          >
            <CalendarPlus size={12} />
            추가
          </button>
        </div>
        <div className="space-y-2">
          {calendars.map((calendar) => (
            <label
              key={calendar.id}
              className="flex items-center gap-3 rounded-md border border-transparent px-2 py-1.5 text-sm transition hover:border-border/60"
            >
              <input
                type="checkbox"
                className="accent-brand"
                checked={calendar.visible}
                onChange={() => onToggleCalendar(calendar.id)}
              />
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: calendar.color }} />
              <span className="truncate text-foreground/80">{calendar.name}</span>
            </label>
          ))}
        </div>
        {showCalendarForm && (
          <form
            className="space-y-2 rounded-md border border-border bg-background p-3 text-xs"
            onSubmit={(event) => {
              event.preventDefault();
              onSubmitNewCalendar();
            }}
          >
            <div className="space-y-1">
              <label className="text-[11px] uppercase tracking-[0.08em] text-muted">이름</label>
              <input
                value={newCalendarName}
                onChange={(event) => onChangeCalendarName(event.target.value)}
                className="w-full rounded-md border border-border px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-brand/50"
                placeholder="예: 디자인 팀"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] uppercase tracking-[0.08em] text-muted">색상</label>
              <input
                type="color"
                value={newCalendarColor}
                onChange={(event) => onChangeCalendarColor(event.target.value)}
                className="h-10 w-full cursor-pointer rounded-md border border-border"
              />
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onCancelNewCalendar}
                className="rounded-md border border-border px-2 py-1 text-[11px] text-muted hover:bg-subtle/60"
              >
                취소
              </button>
              <button
                type="submit"
                className="rounded-md bg-brand px-2 py-1 text-[11px] font-semibold text-white hover:bg-brand/90"
              >
                저장
              </button>
            </div>
          </form>
        )}
      </section>

      <section className="space-y-3">
        <div className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
          다가오는 일정
        </div>
        <div className="max-h-[240px] space-y-2 overflow-y-auto pr-1">
          {upcomingEvents.length === 0 && (
            <div className="rounded-md border border-dashed border-border/60 bg-subtle/40 px-3 py-4 text-xs text-muted">
              표시할 일정이 없습니다.
            </div>
          )}
          {upcomingEvents.map((event) => (
            <UpcomingEventCard
              key={event.id}
              event={event}
              calendarName={calendarMap.get(event.calendarId)?.name}
              color={calendarMap.get(event.calendarId)?.color}
              onDelete={onDeleteEvent}
            />
          ))}
        </div>
      </section>
    </aside>
  );
}
