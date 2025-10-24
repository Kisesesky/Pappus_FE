// components/views/calendar/CalendarView.tsx
'use client';
const days = ["일","월","화","수","목","금","토"];
export default function CalendarView() {
  return (
    <div className="h-full p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="text-lg font-semibold">2025년 10월</div>
        <div className="space-x-2">
          <button className="px-3 py-1.5 border border-border rounded-md">이전</button>
          <button className="px-3 py-1.5 border border-border rounded-md">다음</button>
          <button className="px-3 py-1.5 border border-border rounded-md bg-subtle/60">오늘</button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-2 text-xs text-muted mb-2">
        {days.map(d => <div key={d} className="text-center">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-2 auto-rows-[120px]">
        {Array.from({length: 35}).map((_,i)=> (
          <div key={i} className="border border-border rounded-md bg-subtle/20 p-2 text-xs">
            <div className="font-medium text-muted">{i+1 <= 31 ? i+1 : (i+1)-31}</div>
            <div className="mt-1 space-y-1">
              {({2:1, 10:1, 18:1}[i]) ? <div className="px-2 py-1 rounded bg-brand/20 border border-brand/40">회의</div> : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
