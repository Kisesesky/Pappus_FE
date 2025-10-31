import { useEffect, useMemo, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  isAfter,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ko } from "date-fns/locale";

import { COLOR_PALETTE, DEFAULT_CALENDARS, DEFAULT_EVENTS } from "@/lib/mocks/calendar";
import { persistStorage, readStorage, toDateKey } from "@/lib/calendar/utils";
import type { CalendarEvent, CalendarSource, EventDraft, ViewMode } from "@/types/calendar";

const CAL_STORAGE_KEY = "fd.calendar.calendars";
const EVENT_STORAGE_KEY = "fd.calendar.events";

const createDraft = (date: string, calendarId?: string): EventDraft => ({
  title: "",
  calendarId: calendarId ?? "",
  date,
  allDay: true,
  startTime: "09:00",
  endTime: "10:00",
  location: "",
  description: "",
});

export function useCalendarState(initialDate: Date, initialView: ViewMode) {
  const [current, setCurrent] = useState<Date>(initialDate);
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate);
  const [view, setView] = useState<ViewMode>(initialView);
  const [calendars, setCalendars] = useState<CalendarSource[]>(() =>
    readStorage(CAL_STORAGE_KEY, DEFAULT_CALENDARS),
  );
  const [events, setEvents] = useState<CalendarEvent[]>(() =>
    readStorage(EVENT_STORAGE_KEY, DEFAULT_EVENTS),
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [draft, setDraft] = useState<EventDraft>(() =>
    createDraft(toDateKey(initialDate), DEFAULT_CALENDARS[0]?.id),
  );
  const [showCalendarForm, setShowCalendarForm] = useState(false);
  const [newCalendarName, setNewCalendarName] = useState("");
  const [newCalendarColor, setNewCalendarColor] = useState<string>(COLOR_PALETTE[0] ?? "#0c66e4");

  useEffect(() => {
    persistStorage(CAL_STORAGE_KEY, calendars);
  }, [calendars]);

  useEffect(() => {
    persistStorage(EVENT_STORAGE_KEY, events);
  }, [events]);

  useEffect(() => {
    if (!calendars.some((calendar) => calendar.id === draft.calendarId)) {
      setDraft((prev) => createDraft(prev.date, calendars[0]?.id));
    }
  }, [calendars, draft.calendarId]);

  const calendarMap = useMemo(() => {
    const map = new Map<string, CalendarSource>();
    calendars.forEach((calendar) => map.set(calendar.id, calendar));
    return map;
  }, [calendars]);

  const filteredEvents = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    return events
      .filter((event) => calendarMap.get(event.calendarId)?.visible)
      .filter((event) => {
        if (!keyword) return true;
        const haystack = `${event.title} ${event.location ?? ""} ${event.description ?? ""}`.toLowerCase();
        return haystack.includes(keyword);
      })
      .sort((a, b) => parseISO(a.start).getTime() - parseISO(b.start).getTime());
  }, [events, calendarMap, searchTerm]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    filteredEvents.forEach((event) => {
      const key = toDateKey(parseISO(event.start));
      const list = map.get(key) ?? [];
      list.push(event);
      map.set(key, list);
    });
    return map;
  }, [filteredEvents]);

  const monthDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(current), { locale: ko });
    const end = endOfWeek(endOfMonth(current), { locale: ko });
    return eachDayOfInterval({ start, end });
  }, [current]);

  const upcomingEvents = useMemo(() => {
    const today = startOfDay(new Date());
    return filteredEvents.filter((event) => isAfter(parseISO(event.start), today)).slice(0, 6);
  }, [filteredEvents]);

  const goPrev = () => setCurrent((prev) => subMonths(prev, 1));
  const goNext = () => setCurrent((prev) => addMonths(prev, 1));
  const goToday = () => {
    const today = new Date();
    setCurrent(today);
    setSelectedDate(today);
  };

  const handleToggleCalendar = (id: string) => {
    setCalendars((prev) =>
      prev.map((calendar) =>
        calendar.id === id ? { ...calendar, visible: !calendar.visible } : calendar,
      ),
    );
  };

  const handleAddCalendar = () => {
    const name = newCalendarName.trim();
    if (!name) {
      setShowCalendarForm(false);
      setNewCalendarName("");
      return;
    }

    const id = `calendar-${Date.now()}`;
    const color =
      newCalendarColor || COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)] || "#0c66e4";

    setCalendars((prev) => [...prev, { id, name, color, visible: true }]);
    setNewCalendarName("");
    setShowCalendarForm(false);
    const nextIndex = (calendars.length + 1) % COLOR_PALETTE.length;
    setNewCalendarColor(COLOR_PALETTE[nextIndex] ?? COLOR_PALETTE[0] ?? "#0c66e4");
  };

  const openDrawer = (date: Date) => {
    const dateKey = toDateKey(date);
    const fallback = calendars.find((calendar) => calendar.visible)?.id ?? calendars[0]?.id ?? "";
    setDraft(createDraft(dateKey, fallback));
    setFormError(null);
    setDrawerOpen(true);
    setSelectedDate(date);
  };

  const handleCreateEvent = () => {
    if (!draft.title.trim()) {
      setFormError("제목을 입력해주세요.");
      return;
    }
    if (!draft.calendarId) {
      setFormError("캘린더를 선택해주세요.");
      return;
    }

    const start = draft.allDay ? `${draft.date}T00:00:00` : `${draft.date}T${draft.startTime}:00`;
    const end = draft.allDay ? `${draft.date}T23:59:00` : `${draft.date}T${draft.endTime}:00`;

    if (!draft.allDay && parseISO(end) <= parseISO(start)) {
      setFormError("종료 시간이 시작 시간 이후여야 합니다.");
      return;
    }

    const newEvent: CalendarEvent = {
      id: crypto.randomUUID?.() ?? `event-${Date.now()}`,
      calendarId: draft.calendarId,
      title: draft.title.trim(),
      start,
      end,
      allDay: draft.allDay,
      location: draft.location.trim() || undefined,
      description: draft.description.trim() || undefined,
    };

    setEvents((prev) => [...prev, newEvent]);
    setSelectedDate(parseISO(start));
    setDrawerOpen(false);
    setFormError(null);
  };

  const handleDeleteEvent = (id: string) => {
    setEvents((prev) => prev.filter((event) => event.id !== id));
  };

  return {
    current,
    selectedDate,
    setSelectedDate,
    view,
    setView,
    calendars,
    setCalendars,
    events,
    setEvents,
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
    filteredEvents,
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
  };
}
