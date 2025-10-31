"use client";

import { format } from "date-fns";
import { ko } from "date-fns/locale";

import type { CalendarEvent, CalendarSource } from "@/types/calendar";
import { UpcomingEventCard } from "./UpcomingEventCard";

type AgendaViewProps = {
  selectedDate: Date;
  events: CalendarEvent[];
  calendarMap: Map<string, CalendarSource>;
  onRequestCreate: (date: Date) => void;
  onDeleteEvent: (id: string) => void;
};

export function AgendaView({
  selectedDate,
  events,
  calendarMap,
  onRequestCreate,
  onDeleteEvent,
}: AgendaViewProps) {
  return (
    <div className="rounded-xl border border-border bg-panel p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.08em] text-muted">선택한 날짜</div>
          <div className="mt-1 text-lg font-semibold text-foreground">
            {format(selectedDate, "yyyy년 M월 d일 (EEE)", { locale: ko })}
          </div>
        </div>
        <button
          type="button"
          onClick={() => onRequestCreate(selectedDate)}
          className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm transition hover:bg-subtle/60"
        >
          새 일정
        </button>
      </div>

      <div className="mt-4 space-y-3">
        {events.length === 0 ? (
          <div className="rounded-md border border-dashed border-border/60 bg-subtle/40 px-4 py-6 text-sm text-muted">
            등록된 일정이 없습니다. 새 일정을 추가해보세요.
          </div>
        ) : (
          events.map((event) => (
            <UpcomingEventCard
              key={event.id}
              event={event}
              calendarName={calendarMap.get(event.calendarId)?.name}
              color={calendarMap.get(event.calendarId)?.color}
              onDelete={onDeleteEvent}
            />
          ))
        )}
      </div>
    </div>
  );
}
