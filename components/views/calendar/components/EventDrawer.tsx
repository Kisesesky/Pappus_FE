"use client";

import { format, parseISO } from "date-fns";
import { ko } from "date-fns/locale";
import type { ChangeEvent } from "react";
import type { CalendarSource, EventDraft } from "@/types/calendar";

type EventDrawerProps = {
  open: boolean;
  draft: EventDraft;
  calendars: CalendarSource[];
  formError: string | null;
  onClose: () => void;
  onChangeDraft: (patch: Partial<EventDraft>) => void;
  onSubmit: () => void;
};

export function EventDrawer({
  open,
  draft,
  calendars,
  formError,
  onClose,
  onChangeDraft,
  onSubmit,
}: EventDrawerProps) {
  if (!open) return null;

  const update =
    (key: keyof EventDraft) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const value =
        event.target.type === "checkbox"
          ? (event.target as HTMLInputElement).checked
          : event.target.value;
      onChangeDraft({ [key]: value } as Partial<EventDraft>);
    };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-t-3xl border border-border bg-panel p-6 shadow-2xl md:rounded-2xl">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.08em] text-muted">새 일정</div>
            <div className="text-lg font-semibold text-foreground">
              {format(parseISO(`${draft.date}T00:00:00`), "yyyy년 M월 d일 (EEE)", { locale: ko })}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-1 text-xs text-muted hover:bg-subtle/60"
          >
            닫기
          </button>
        </div>

        <div className="mt-4 max-h-[70vh] space-y-4 overflow-y-auto pr-1">
          <div className="space-y-2">
            <label className="text-xs text-muted">제목</label>
            <input
              value={draft.title}
              onChange={update("title")}
              className="w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
              placeholder="일정 제목을 입력하세요"
            />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs text-muted">날짜</label>
              <input
                type="date"
                value={draft.date}
                onChange={update("date")}
                className="w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-muted">캘린더</label>
              <select
                value={draft.calendarId}
                onChange={update("calendarId")}
                className="w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
              >
                {calendars.map((calendar) => (
                  <option key={calendar.id} value={calendar.id}>
                    {calendar.name}
                  </option>
                ))}
              </select>
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
              <div className="space-y-2">
                <label className="text-xs text-muted">시작 시간</label>
                <input
                  type="time"
                  value={draft.startTime}
                  onChange={update("startTime")}
                  className="w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-muted">종료 시간</label>
                <input
                  type="time"
                  value={draft.endTime}
                  onChange={update("endTime")}
                  className="w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs text-muted">장소</label>
            <input
              value={draft.location}
              onChange={update("location")}
              className="w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
              placeholder="회의실 또는 링크를 입력하세요"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs text-muted">메모</label>
            <textarea
              value={draft.description}
              onChange={update("description")}
              rows={4}
              className="w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
              placeholder="일정에 대한 메모를 적어주세요"
            />
          </div>

          {formError && (
            <div className="rounded-md border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-600">
              {formError}
            </div>
          )}

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-border px-4 py-2 text-sm text-muted hover:bg-subtle/60"
            >
              취소
            </button>
            <button
              type="button"
              onClick={onSubmit}
              className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand/90"
            >
              일정 추가
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
