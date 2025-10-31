import { format, isToday } from "date-fns";

import { DAY_LABELS } from "@/lib/mocks/calendar";
import type { CalendarEvent, CalendarSource } from "@/types/calendar";
import { cn } from "@/lib/utils";
import { DayEventPill } from "./DayEventPill";

type CalendarMonthViewProps = {
  current: Date;
  selectedDate: Date;
  days: Date[];
  eventsByDate: Map<string, CalendarEvent[]>;
  calendarMap: Map<string, CalendarSource>;
  maxVisible?: number;
  onSelectDate: (date: Date) => void;
  onRequestDetails?: (date: Date) => void;
};

export function CalendarMonthView({
  current,
  selectedDate,
  days,
  eventsByDate,
  calendarMap,
  maxVisible = 2,
  onSelectDate,
  onRequestDetails,
}: CalendarMonthViewProps) {
  return (
    <div className="flex h-full flex-col rounded-xl border border-border bg-panel shadow-sm">
      <div className="grid grid-cols-7 border-b border-border bg-subtle/60 text-center text-xs font-semibold uppercase tracking-[0.08em]">
        {DAY_LABELS.map((label, idx) => (
          <div
            key={label}
            className={cn(
              "px-2 py-3",
              idx === 0 ? "text-rose-400" : idx === 6 ? "text-sky-400" : "text-muted",
            )}
          >
            {label}
          </div>
        ))}
      </div>

      <div className="grid flex-1 grid-cols-7 auto-rows-[minmax(50px,1fr)]">
        {days.map((date) => {
          const key = format(date, "yyyy-MM-dd");
          const dayEvents = eventsByDate.get(key) ?? [];
          const isCurrentMonth = format(date, "yyyy-MM") === format(current, "yyyy-MM");
          const isSelected = format(date, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd");
          const weekday = date.getDay();
          const dayColor =
            weekday === 0 ? "text-rose-400" : weekday === 6 ? "text-sky-400" : "text-foreground/80";

          return (
            <button
              key={key}
              type="button"
              onClick={() => {
                onSelectDate(date);
                onRequestDetails?.(date);
              }}
              className={cn(
                "relative flex h-full flex-col gap-1 border border-border/20 px-2 py-1 text-left transition hover:bg-subtle/50 focus-visible:ring-2 focus-visible:ring-brand/50",
                !isCurrentMonth && "bg-zinc-200/30 text-zinc-500 dark:bg-zinc-800/30 dark:text-zinc-500",
                isSelected && "border-brand/40 ring-2 ring-brand/40",
              )}
            >
              <div
                className={cn(
                  "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
                  isToday(date)
                    ? "bg-brand text-white"
                    : isSelected
                      ? "border border-brand text-brand"
                      : dayColor,
                )}
              >
                {date.getDate()}
              </div>

              <div className="space-y-1 text-[11px] leading-tight">
                {dayEvents.slice(0, maxVisible).map((event) => (
                  <DayEventPill
                    key={event.id}
                    event={event}
                    color={calendarMap.get(event.calendarId)?.color}
                  />
                ))}
                {dayEvents.length > maxVisible && (
                  <div className="text-[10px] text-brand">
                    +{dayEvents.length - maxVisible}개 더보기
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
