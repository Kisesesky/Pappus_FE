"use client";

import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { COLOR_PALETTE } from "@/lib/mocks/calendar";
import { toDateKey } from "@/lib/calendar/utils";
import { useCalendarState } from "./hooks/useCalendarState";
import type { EventDraft, ViewMode } from "@/types/calendar";
import { CalendarHeader } from "./components/CalendarHeader";
import { CalendarSidebar } from "./components/CalendarSidebar";
import { CalendarMonthView } from "./components/CalendarMonthView";
import { AgendaView } from "./components/AgendaView";
import { DayEventPill } from "./components/DayEventPill";
import { EventDrawer } from "./components/EventDrawer";

const MAX_VISIBLE_EVENTS_PER_DAY = 2;

export default function CalendarView({
  initialDate = new Date(),
  initialView = "month",
}: {
  initialDate?: Date;
  initialView?: ViewMode;
}) {
  const {
    current,
    selectedDate,
    setSelectedDate,
    view,
    setView,
    calendars,
    searchTerm,
    setSearchTerm,
    drawerOpen,
    setDrawerOpen,
    formError,
    setFormError,
    draft,
    setDraft,
    showCalendarForm,
    setShowCalendarForm,
    newCalendarName,
    setNewCalendarName,
    newCalendarColor,
    setNewCalendarColor,
    calendarMap,
    eventsByDate,
    monthDays,
    upcomingEvents,
    goPrev,
    goNext,
    goToday,
    handleToggleCalendar,
    handleAddCalendar,
    openDrawer,
    handleCreateEvent,
    handleDeleteEvent,
  } = useCalendarState(initialDate, initialView);

  const selectedKey = toDateKey(selectedDate);
  const selectedEvents = eventsByDate.get(selectedKey) ?? [];

  const handleChangeDraft = (patch: Partial<EventDraft>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
    setFormError(null);
  };

  const handleRequestNewCalendar = () => {
    setShowCalendarForm((prev) => {
      const next = !prev;
      if (next) {
        const nextColor =
          COLOR_PALETTE[calendars.length % COLOR_PALETTE.length] ?? COLOR_PALETTE[0] ?? "#0c66e4";
        setNewCalendarColor(nextColor);
      }
      return next;
    });
  };

  const handleCancelNewCalendar = () => {
    setShowCalendarForm(false);
    setNewCalendarName("");
    setNewCalendarColor(COLOR_PALETTE[0] ?? "#0c66e4");
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-background">
      <CalendarHeader
        current={current}
        view={view}
        searchTerm={searchTerm}
        onSearch={setSearchTerm}
        onPrev={goPrev}
        onNext={goNext}
        onToday={goToday}
        onChangeView={setView}
        onOpenCreate={() => openDrawer(selectedDate)}
      />

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <CalendarSidebar
          calendars={calendars}
          upcomingEvents={upcomingEvents}
          calendarMap={calendarMap}
          showCalendarForm={showCalendarForm}
          newCalendarName={newCalendarName}
          newCalendarColor={newCalendarColor}
          onToggleCalendar={handleToggleCalendar}
          onRequestNewCalendar={handleRequestNewCalendar}
          onSubmitNewCalendar={handleAddCalendar}
          onCancelNewCalendar={handleCancelNewCalendar}
          onChangeCalendarName={setNewCalendarName}
          onChangeCalendarColor={setNewCalendarColor}
          onDeleteEvent={handleDeleteEvent}
        />

        <section className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden px-4 py-4">
          <div className="flex-1 overflow-hidden">
            {view === "month" ? (
              <CalendarMonthView
                current={current}
                selectedDate={selectedDate}
                days={monthDays}
                eventsByDate={eventsByDate}
                calendarMap={calendarMap}
                maxVisible={MAX_VISIBLE_EVENTS_PER_DAY}
                onSelectDate={setSelectedDate}
                onOpenDrawer={openDrawer}
              />
            ) : (
              <AgendaView
                selectedDate={selectedDate}
                events={selectedEvents}
                calendarMap={calendarMap}
                onOpenDrawer={openDrawer}
                onDeleteEvent={handleDeleteEvent}
              />
            )}
          </div>

          <div className="min-h-[180px] rounded-xl border border-border bg-panel p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.08em] text-muted">선택한 날짜</div>
                <div className="mt-1 text-sm font-semibold text-foreground">
                  {format(selectedDate, "M월 d일 (EEE)", { locale: ko })}
                </div>
              </div>
              <button
                type="button"
                onClick={() => openDrawer(selectedDate)}
                className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-xs text-muted hover:bg-subtle/60"
              >
                일정 추가
              </button>
            </div>
            <div className="mt-3 space-y-3">
              {selectedEvents.length === 0 ? (
                <div className="rounded-md border border-dashed border-border/60 bg-subtle/40 px-3 py-6 text-sm text-muted">
                  선택한 날짜에 등록된 일정이 없습니다.
                </div>
              ) : (
                selectedEvents.map((event) => (
                  <DayEventPill
                    key={`selected-${event.id}`}
                    event={event}
                    color={calendarMap.get(event.calendarId)?.color}
                  />
                ))
              )}
            </div>
          </div>
        </section>
      </div>

      <EventDrawer
        open={drawerOpen}
        draft={draft}
        calendars={calendars}
        formError={formError}
        onClose={() => {
          setDrawerOpen(false);
          setFormError(null);
        }}
        onChangeDraft={handleChangeDraft}
        onSubmit={handleCreateEvent}
      />
    </div>
  );
}
