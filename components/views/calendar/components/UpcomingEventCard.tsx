"use client";

import { format, parseISO } from "date-fns";
import { Clock, MapPin, Trash } from "lucide-react";

import { formatEventTime } from "@/lib/calendar/utils";
import type { CalendarEvent } from "@/types/calendar";

type UpcomingEventCardProps = {
  event: CalendarEvent;
  calendarName?: string;
  color?: string;
  onDelete: (id: string) => void;
};

export function UpcomingEventCard({ event, calendarName, color, onDelete }: UpcomingEventCardProps) {
  return (
    <div className="rounded-md border border-border/60 bg-background px-3 py-2 text-sm shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color ?? "#2563eb" }} />
          <span className="font-medium text-foreground/90">{event.title}</span>
        </div>
        <button
          type="button"
          onClick={() => onDelete(event.id)}
          className="inline-flex items-center gap-1 rounded border border-border px-2 py-1 text-[11px] text-muted hover:bg-subtle/60"
        >
          <Trash size={12} />
          삭제
        </button>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted">
        <span className="inline-flex items-center gap-1">
          <Clock size={12} />
          {formatEventTime(event.start, event.end, event.allDay)}
        </span>
        {calendarName && <span>{calendarName}</span>}
        {!event.allDay && <span>{format(parseISO(event.start), "M월 d일 HH:mm")}</span>}
      </div>
      {event.location && (
        <div className="mt-2 inline-flex items-center gap-1 text-xs text-muted">
          <MapPin size={12} />
          <span>{event.location}</span>
        </div>
      )}
      {event.description && (
        <p className="mt-2 text-xs text-muted leading-relaxed">{event.description}</p>
      )}
    </div>
  );
}
