"use client";

import { format, isSameDay, parseISO } from "date-fns";
import { ko } from "date-fns/locale";
import type { ChangeEvent } from "react";

import type { CalendarEvent, CalendarSource, EventDraft } from "@/types/calendar";

type CalendarDetailsPanelProps = {
  selectedDate: Date;
  events: CalendarEvent[];
  calendars: CalendarSource[];
  calendarMap: Map<string, CalendarSource>;
  draft: EventDraft;
  isFormOpen: boolean;
  formError: string | null;
  onChangeDraft: (patch: Partial<EventDraft>) => void;
  onRequestCreate: () => void;
  onCancelCreate: () => void;
  onSubmit: () => void;
  onDeleteEvent: (id: string) => void;
  onClose?: () => void;
};

const labelClass = "text-[11px] uppercase tracking-[0.08em] text-muted";

export function CalendarDetailsPanel({
  selectedDate,
  events,
  calendars,
  calendarMap,
  draft,
  isFormOpen,
  formError,
  onChangeDraft,
  onRequestCreate,
  onCancelCreate,
  onSubmit,
  onDeleteEvent,
  onClose,
}: CalendarDetailsPanelProps) {
  const handleChange =
    (key: keyof EventDraft) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const value =
        event.target.type === "checkbox"
          ? (event.target as HTMLInputElement).checked
          : event.target.value;
      onChangeDraft({ [key]: value } as Partial<EventDraft>);
    };

  const renderDuration = (event: CalendarEvent) => {
    const start = parseISO(event.start);
    const end = event.end ? parseISO(event.end) : start;

    if (event.allDay) {
      if (isSameDay(start, end)) {
        return "종일";
      }
      return `종일 · ${format(start, "M월 d일", { locale: ko })} ~ ${format(end, "M월 d일", { locale: ko })}`;
    }

    if (isSameDay(start, end)) {
      return `${format(start, "HH:mm")}` + (event.end ? ` ~ ${format(end, "HH:mm")}` : "");
    }

    return `${format(start, "M월 d일 HH:mm", { locale: ko })} ~ ${format(end, "M월 d일 HH:mm", {
      locale: ko,
    })}`;
  };

  const selectedLabel = format(selectedDate, "M월 d일 (EEE)", { locale: ko });

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-t-3xl border-t border-border bg-panel/80 lg:rounded-none lg:border-t-0 lg:border-l">
      <header className="flex items-start justify-between gap-3 border-b border-border px-4 py-4 lg:px-5 lg:py-5">
        <div>
          <div className="text-xs uppercase tracking-[0.08em] text-muted">선택한 날짜</div>
          <div className="mt-1 text-base font-semibold text-foreground">{selectedLabel}</div>
          <div className="text-xs text-muted">
            {events.length === 0 ? "등록된 일정이 없습니다." : `${events.length}개의 일정`}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRequestCreate}
            className="inline-flex items-center gap-2 rounded-md bg-brand px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-brand/90"
          >
            일정 추가
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-xs text-muted hover:bg-subtle/60"
            >
              닫기
            </button>
          )}
        </div>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4 pr-3 lg:px-5">
        {events.length === 0 ? (
          <div className="rounded-md border border-dashed border-border/60 bg-subtle/40 px-3 py-6 text-sm text-muted">
            오늘은 여유로운 하루네요. 새 일정을 추가해보세요.
          </div>
        ) : (
          events.map((event) => {
            const source = calendarMap.get(event.calendarId);
            return (
              <div
                key={event.id}
                className="rounded-lg border border-border/60 bg-background/90 p-3 text-sm shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full"
                      style={{ backgroundColor: source?.color ?? "#2563eb" }}
                    />
                    <div>
                      <div className="font-semibold text-foreground/90">{event.title}</div>
                      <div className="text-[11px] text-muted">{renderDuration(event)}</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDeleteEvent(event.id)}
                    className="rounded-md border border-border px-2 py-1 text-[11px] text-muted hover:bg-subtle/60"
                  >
                    삭제
                  </button>
                </div>
                {(event.location || event.description) && (
                  <div className="mt-2 space-y-1 text-xs text-muted">
                    {event.location && <div>장소: {event.location}</div>}
                    {event.description && <div className="leading-relaxed">{event.description}</div>}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {isFormOpen && (
        <div className="border-t border-border bg-panel px-4 py-4 lg:px-5">
          <div className="text-xs uppercase tracking-[0.08em] text-muted">새 일정</div>
          <div className="text-sm font-semibold text-foreground">{selectedLabel}</div>

          <div className="mt-3 space-y-3 max-h-[55vh] overflow-y-auto pr-1">
            <div className="space-y-1">
              <label className={labelClass}>제목</label>
              <input
                value={draft.title}
                onChange={handleChange("title")}
                className="w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
                placeholder="회의, 리뷰, 휴가 등"
              />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <label className={labelClass}>시작 날짜</label>
                <input
                  type="date"
                  value={draft.startDate}
                  onChange={handleChange("startDate")}
                  className="w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
                />
              </div>
              <div className="space-y-1">
                <label className={labelClass}>종료 날짜</label>
                <input
                  type="date"
                  value={draft.endDate}
                  onChange={handleChange("endDate")}
                  className="w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
                />
              </div>
            </div>

            <label className="inline-flex items-center gap-2 text-xs text-muted">
              <input
                type="checkbox"
                checked={draft.allDay}
                onChange={(event) => onChangeDraft({ allDay: event.target.checked })}
                className="size-4 accent-brand"
              />
              종일 일정
            </label>

            {!draft.allDay && (
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <label className={labelClass}>시작 시간</label>
                  <input
                    type="time"
                    value={draft.startTime}
                    onChange={handleChange("startTime")}
                    className="w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
                  />
                </div>
                <div className="space-y-1">
                  <label className={labelClass}>종료 시간</label>
                  <input
                    type="time"
                    value={draft.endTime}
                    onChange={handleChange("endTime")}
                    className="w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className={labelClass}>캘린더</label>
              <select
                value={draft.calendarId}
                onChange={handleChange("calendarId")}
                className="w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
              >
                {calendars.map((calendar) => (
                  <option key={calendar.id} value={calendar.id}>
                    {calendar.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className={labelClass}>장소</label>
              <input
                value={draft.location}
                onChange={handleChange("location")}
                className="w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
                placeholder="회의실, 화상 링크 등"
              />
            </div>

            <div className="space-y-1">
              <label className={labelClass}>메모</label>
              <textarea
                value={draft.description}
                onChange={handleChange("description")}
                rows={4}
                className="w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
                placeholder="참석자에게 공유할 내용을 입력하세요."
              />
            </div>
          </div>

          {formError && (
            <div className="mt-3 rounded-md border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-600">
              {formError}
            </div>
          )}

          <div className="mt-4 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onCancelCreate}
              className="rounded-md border border-border px-3 py-2 text-sm text-muted hover:bg-subtle/60"
            >
              취소
            </button>
            <button
              type="button"
              onClick={onSubmit}
              className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand/90"
            >
              저장
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
