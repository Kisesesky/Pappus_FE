// app/calendar/page.tsx
import { Suspense } from "react";
import CalendarView from "@/components/calendar/CalendarView";

export default function CalendarPage() {
  if (typeof window !== 'undefined') {
    (window as any).__FLOW_USERS__ = [
      { id: 'u-you', name: 'You' },
      { id: 'u-alice', name: 'Alice' },
      { id: 'u-bob', name: 'Bob' },
    ];
  }
  
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <CalendarView />
    </Suspense>
  );
}
