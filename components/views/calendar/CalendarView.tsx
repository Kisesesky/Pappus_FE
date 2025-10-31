"use client";

import { COLOR_PALETTE } from "@/lib/mocks/calendar";
import { toDateKey } from "@/lib/calendar/utils";
import { useState } from "react";
import { useCalendarState } from "./hooks/useCalendarState";
import type { EventDraft, ViewMode } from "@/types/calendar";
import { CalendarHeader } from "./components/CalendarHeader";
import { CalendarMonthView } from "./components/CalendarMonthView";
import { AgendaView } from "./components/AgendaView";
import { CalendarDetailsPanel } from "./components/CalendarDetailsPanel";
import { CalendarCreateModal } from "./components/CalendarCreateModal";
import Drawer from "@/components/ui/Drawer";

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
    isFormOpen,
    setIsFormOpen,
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
    openForm,
    handleCreateEvent,
    handleDeleteEvent,
  } = useCalendarState(initialDate, initialView);

  const [detailsOpen, setDetailsOpen] = useState(false);

  const selectedKey = toDateKey(selectedDate);
  const selectedEvents = eventsByDate.get(selectedKey) ?? [];

  const handleChangeDraft = (patch: Partial<EventDraft>) => {
    setDraft((prev) => {
      const next = { ...prev, ...patch };
      if (patch.startDate && next.endDate < patch.startDate) {
        next.endDate = patch.startDate;
      }
      if (patch.endDate && patch.endDate < next.startDate) {
        next.endDate = next.startDate;
      }
      if (patch.allDay === true) {
        next.startTime = "";
        next.endTime = "";
      }
      if (patch.allDay === false) {
        next.startTime = next.startTime || "09:00";
        next.endTime = next.endTime || "10:00";
      }
      return next;
    });
    setFormError(null);
  };

  const handleRequestNewCalendar = () => {
    if (!showCalendarForm) {
      const nextColor =
        COLOR_PALETTE[calendars.length % COLOR_PALETTE.length] ?? COLOR_PALETTE[0] ?? "#0c66e4";
      setNewCalendarColor(nextColor);
      setNewCalendarName("");
    }
    setShowCalendarForm(true);
  };

  const handleCancelNewCalendar = () => {
    setShowCalendarForm(false);
    setNewCalendarName("");
    setNewCalendarColor(COLOR_PALETTE[0] ?? "#0c66e4");
  };

  const handleSelectDate = (date: Date) => {
    setSelectedDate(date);
    if (isFormOpen) {
      const key = toDateKey(date);
      setDraft((prev) => {
        const adjustedEnd = prev.endDate < key ? key : prev.endDate;
        return { ...prev, startDate: key, endDate: adjustedEnd };
      });
    }
  };

  const handleRequestDetails = (date?: Date) => {
    if (date) {
      setSelectedDate(date);
    }
    setDetailsOpen(true);
  };

  const handleOpenForm = (date: Date) => {
    setDetailsOpen(true);
    openForm(date);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setFormError(null);
  };

  const handleCloseDetails = () => {
    setDetailsOpen(false);
    setIsFormOpen(false);
    setFormError(null);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-background">
      <CalendarHeader
        current={current}
        view={view}
        searchTerm={searchTerm}
        calendars={calendars}
        calendarMap={calendarMap}
        upcomingEvents={upcomingEvents}
        onSearch={setSearchTerm}
        onPrev={goPrev}
        onNext={goNext}
        onToday={goToday}
        onChangeView={setView}
        onOpenCreate={() => handleOpenForm(selectedDate)}
        onToggleCalendar={handleToggleCalendar}
        onRequestNewCalendar={handleRequestNewCalendar}
        onDeleteEvent={handleDeleteEvent}
      />

      <div className="relative flex min-h-0 flex-1 flex-col">
        <section className="flex min-h-0 flex-col overflow-hidden px-4 py-4">
          <div className="flex-1 overflow-hidden">
            {view === "month" ? (
              <CalendarMonthView
                current={current}
                selectedDate={selectedDate}
                days={monthDays}
                eventsByDate={eventsByDate}
                calendarMap={calendarMap}
                maxVisible={MAX_VISIBLE_EVENTS_PER_DAY}
                onSelectDate={handleSelectDate}
                onRequestDetails={handleRequestDetails}
              />
            ) : (
              <AgendaView
                selectedDate={selectedDate}
                events={selectedEvents}
                calendarMap={calendarMap}
                onRequestCreate={handleOpenForm}
                onDeleteEvent={handleDeleteEvent}
              />
            )}
          </div>
        </section>

        {detailsOpen && (
          <div className="pointer-events-none hidden md:block">
            <div className="pointer-events-auto fixed bottom-6 right-6 top-[calc(64px+16px)] z-40 w-[360px]">
              <div className="h-full overflow-hidden rounded-2xl border border-border bg-panel shadow-2xl">
                <CalendarDetailsPanel
                  selectedDate={selectedDate}
                  events={selectedEvents}
                  calendars={calendars}
                  calendarMap={calendarMap}
                  draft={draft}
                  isFormOpen={isFormOpen}
                  formError={formError}
                  onChangeDraft={handleChangeDraft}
                  onRequestCreate={() => handleOpenForm(selectedDate)}
                  onCancelCreate={handleCloseForm}
                  onSubmit={handleCreateEvent}
                  onDeleteEvent={handleDeleteEvent}
                  onClose={handleCloseDetails}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <Drawer
        open={detailsOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleCloseDetails();
          }
        }}
        title="선택한 날짜"
        side="right"
        width={360}
      >
        <CalendarDetailsPanel
          selectedDate={selectedDate}
          events={selectedEvents}
          calendars={calendars}
          calendarMap={calendarMap}
          draft={draft}
          isFormOpen={isFormOpen}
          formError={formError}
          onChangeDraft={handleChangeDraft}
          onRequestCreate={() => handleOpenForm(selectedDate)}
          onCancelCreate={handleCloseForm}
          onSubmit={handleCreateEvent}
          onDeleteEvent={handleDeleteEvent}
          onClose={handleCloseDetails}
        />
      </Drawer>

      <CalendarCreateModal
        open={showCalendarForm}
        name={newCalendarName}
        color={newCalendarColor}
        onChangeName={setNewCalendarName}
        onChangeColor={setNewCalendarColor}
        onSubmit={handleAddCalendar}
        onCancel={handleCancelNewCalendar}
      />
    </div>
  );
}
