import type { CalendarEvent } from "@/types/calendar";

type DayEventPillProps = {
  event: CalendarEvent;
  color?: string;
  className?: string;
};

export function DayEventPill({ event, color, className }: DayEventPillProps) {
  return (
    <div
      className={`truncate rounded border border-transparent bg-background/90 px-1.5 py-0.5 text-[11px] ${className ?? ""}`}
      style={{ borderColor: color ?? "transparent" }}
    >
      <span className="align-middle font-medium text-foreground/80">{event.title}</span>
    </div>
  );
}
