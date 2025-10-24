// components/views/calendar/CalendarView.tsx
'use client';

import { useMemo, useState } from 'react';
import {
  addDays, addMonths, subMonths,
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isToday, isSameDay,
  format, parseISO, isWithinInterval
} from 'date-fns';
import { ko } from 'date-fns/locale';
import { cn as clsx } from '@/lib/utils';

type Provider = 'google'|'outlook'|'internal';
type ViewMode = 'month'|'week'|'day';

type EventItem = {
  id: string;
  provider: Provider;
  calendarId: string;
  title: string;
  start?: string;  // ISO
  end?: string;    // ISO
  date?: string;   // 종일용 YYYY-MM-DD
  allDay?: boolean;
  color?: string;
  canEdit?: boolean;
};

const DAY_NAMES = ['일','월','화','수','목','금','토'];

// 데모 데이터
const DEMO_EVENTS: EventItem[] = [
  { id:'e1', provider:'google',  calendarId:'primary', title:'주간 회의',     date:'2025-10-02', allDay:true,  color:'#1a73e8', canEdit:true },
  { id:'e2', provider:'google',  calendarId:'primary', title:'클라이언트 콜', start:'2025-10-02T10:30:00', end:'2025-10-02T11:00:00', color:'#1a73e8', canEdit:true },
  { id:'e3', provider:'outlook', calendarId:'team',    title:'디자인 리뷰',   start:'2025-10-10T14:00:00', end:'2025-10-10T15:00:00', color:'#2563eb', canEdit:false },
  { id:'e4', provider:'internal',calendarId:'ops',     title:'데모 준비',     date:'2025-10-10', allDay:true,  color:'#10b981', canEdit:true },
  { id:'e5', provider:'google',  calendarId:'primary', title:'런칭 체크',     start:'2025-10-10T09:00:00', end:'2025-10-10T10:00:00', color:'#1a73e8', canEdit:true },
  { id:'e6', provider:'internal',calendarId:'ops',     title:'재무 미팅',     start:'2025-10-18T16:00:00', end:'2025-10-18T17:30:00', color:'#10b981', canEdit:true },
  { id:'e7', provider:'outlook', calendarId:'team',    title:'저녁 자리',     start:'2025-10-18T19:00:00', end:'2025-10-18T21:00:00', color:'#2563eb', canEdit:false },
];

const DEMO_CALENDARS = [
  { key:'google:primary',   name:'Google 기본', color:'#1a73e8', visible:true },
  { key:'outlook:team',     name:'Outlook 팀',  color:'#2563eb', visible:true },
  { key:'internal:ops',     name:'사내용 OPS',  color:'#10b981', visible:true },
];

export default function CalendarView({
  initialDate = new Date(2025, 9, 1),
  initialView = 'month',
  workStartHour = 9,
  workEndHour = 18,
}: {
  initialDate?: Date;
  initialView?: ViewMode;
  workStartHour?: number;
  workEndHour?: number;
}) {
  const [current, setCurrent] = useState(initialDate);
  const [view, setView] = useState<ViewMode>(initialView);
  const [workHours] = useState({ start: workStartHour, end: workEndHour });
  const [showOutsideHours, setShowOutsideHours] = useState(false); // ✅ 바깥시간 토글
  const [calToggles, setCalToggles] = useState(DEMO_CALENDARS);
  const [events, setEvents] = useState<EventItem[]>(DEMO_EVENTS);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerDate, setDrawerDate] = useState<Date | null>(null);

  const visibleMap = useMemo(()=>Object.fromEntries(calToggles.map(c=>[c.key, c.visible])),[calToggles]);

  const weekRange = useMemo(()=>{
    const start = startOfWeek(current, { locale: ko });
    const end = endOfWeek(current, { locale: ko });
    return eachDayOfInterval({ start, end });
  }, [current]);

  const monthDays = useMemo(()=>{
    const mStart = startOfMonth(current);
    const mEnd   = endOfMonth(current);
    const gStart = startOfWeek(mStart, { locale: ko });
    const gEnd   = endOfWeek(mEnd,   { locale: ko });
    let all = eachDayOfInterval({ start: gStart, end: gEnd });
    if (all.length < 42) {
      const extra = 42 - all.length;
      all = [...all, ...eachDayOfInterval({ start: gEnd, end: addDays(gEnd, extra) }).slice(1)];
    } else if (all.length > 42) {
      all = all.slice(0, 42);
    }
    return all;
  }, [current]);

  // ✅ 업무시간 압축/전체 보기
  const hours = useMemo(()=>{
    const start = showOutsideHours ? 0 : workHours.start;
    const end   = showOutsideHours ? 23 : workHours.end;
    const xs:number[] = [];
    for (let h = start; h <= end; h++) xs.push(h);
    return xs;
  }, [showOutsideHours, workHours]);

  const toKey = (d: Date) => format(d, 'yyyy-MM-dd');
  const now = new Date();
  const nowHour = now.getHours();
  const nowMin = now.getMinutes();

  const filtered = useMemo(()=>{
    return events.filter(ev => visibleMap[`${ev.provider}:${ev.calendarId}`] ?? true);
  }, [events, visibleMap]);

  const byDate = useMemo(()=>{
    const m = new Map<string, EventItem[]>();
    for (const ev of filtered) {
      const k = ev.allDay || ev.date
        ? (ev.date ?? (ev.start ? format(parseISO(ev.start), 'yyyy-MM-dd') : ''))
        : (ev.start ? format(parseISO(ev.start), 'yyyy-MM-dd') : '');
      if (!k) continue;
      const arr = m.get(k) ?? [];
      arr.push(ev);
      m.set(k, arr);
    }
    return m;
  }, [filtered]);

  function openDrawer(d: Date) { setDrawerDate(d); setDrawerOpen(true); }

  function quickAdd(title: string) {
    if (!drawerDate || !title.trim()) return;
    const dateStr = format(drawerDate, 'yyyy-MM-dd');
    const startIso = `${dateStr}T09:00:00`;
    const endIso   = `${dateStr}T09:30:00`;
    const newEv: EventItem = {
      id: `local:${Date.now()}`,
      provider:'internal',
      calendarId:'ops',
      title: title.trim(),
      start: startIso, end: endIso, color:'#10b981', canEdit:true
    };
    setEvents(prev => [newEv, ...prev]);
  }

  const goPrev = () => {
    if (view === 'month') setCurrent(d=>subMonths(d,1));
    if (view === 'week')  setCurrent(d=>addDays(d,-7));
    if (view === 'day')   setCurrent(d=>addDays(d,-1));
  };
  const goNext = () => {
    if (view === 'month') setCurrent(d=>addMonths(d,1));
    if (view === 'week')  setCurrent(d=>addDays(d,7));
    if (view === 'day')   setCurrent(d=>addDays(d,1));
  };
  const goToday = () => setCurrent(now);

  function eventMatchesDay(ev: EventItem, day: Date) {
    if (ev.allDay || ev.date) return toKey(day) === (ev.date ?? (ev.start ? format(parseISO(ev.start), 'yyyy-MM-dd') : ''));
    if (!ev.start || !ev.end) return false;
    const s = parseISO(ev.start), e = parseISO(ev.end);
    return isSameDay(s, day) || isWithinInterval(day, { start: s, end: e });
  }
  const eventsForDay = (day: Date) => filtered.filter(ev => eventMatchesDay(ev, day));

  // ── 겹침 레이아웃
  type Timed = { ev: EventItem; s: Date; e: Date };
  function layoutOverlaps(day: Date) {
    const timed: Timed[] = eventsForDay(day)
      .filter(ev => !ev.allDay && ev.start && ev.end)
      .map(ev => ({ ev, s: parseISO(ev.start!), e: parseISO(ev.end!) }))
      .sort((a,b)=> +a.s - +b.s || +a.e - +b.e);

    const chunks: Timed[][] = [];
    for (const item of timed) {
      const last = chunks[chunks.length-1];
      if (!last || last.every(x => x.e <= item.s)) chunks.push([item]);
      else last.push(item);
    }

    const placed: { ev: EventItem; top:number; height:number; left:number; width:number }[] = [];
    const minsInDay = 24*60;

    for (const chunk of chunks) {
      const cols: Timed[][] = [];
      for (const item of chunk) {
        let placedCol = -1;
        for (let c=0; c<cols.length; c++) {
          if (cols[c][cols[c].length-1].e <= item.s) { placedCol = c; break; }
        }
        if (placedCol === -1) { cols.push([item]); placedCol = cols.length-1; }
        else cols[placedCol].push(item);
      }
      const colCount = cols.length;

      for (let c=0; c<cols.length; c++) {
        for (const cell of cols[c]) {
          const startMin = cell.s.getHours()*60 + cell.s.getMinutes();
          const endMin   = cell.e.getHours()*60 + cell.e.getMinutes();
          const topPct   = (startMin / minsInDay) * 100;
          const hPct     = Math.max(2, ((endMin-startMin) / minsInDay) * 100);
          const leftPct  = (c / colCount) * 100;
          const widthPct = (1 / colCount) * 100;
          placed.push({
            ev: cell.ev,
            top: topPct,
            height: hPct,
            left: leftPct,
            width: widthPct - 0.8,
          });
        }
      }
    }
    return placed;
  }

  // ── 현재 시각 라인(week/day): 해당 시간 셀에 얇은 라인 표시
  function NowMarker({ day, hour }: { day: Date; hour: number }) {
    if (!isToday(day) || hour !== nowHour) return null;
    const y = (nowMin / 60) * 100; // 퍼센트
    return (
      <div
        aria-hidden
        className="absolute left-0 right-0 h-px bg-red-500/80"
        style={{ top: `calc(${y}% - 1px)` }}
        title="현재 시간"
      />
    );
  }

  // ── MonthCell: 유지보수 용이하게 컴포넌트화(타입 에러 방지)
  function MonthCell({ date }: { date: Date }) {
    const key = toKey(date);
    const list = byDate.get(key) ?? [];
    const visible = list.slice(0, 2);
    const overflow = Math.max(0, list.length - visible.length);
    const outMonth = !isSameMonth(date, current);
    const today = isToday(date);
    return (
      <div
        key={key}
        className={clsx(
          'border border-border rounded-md bg-subtle/20 p-2 text-xs flex flex-col cursor-pointer',
          'hover:border-foreground/25 hover:bg-subtle/30 transition-colors',
          outMonth && 'opacity-50',
          today && 'ring-2 ring-brand/40 ring-offset-1 ring-offset-background'
        )}
        onClick={()=>openDrawer(date)}
      >
        <div className="font-medium flex items-center justify-between text-muted">
          <span>{format(date, 'd')}</span>
          {today && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand/15 text-brand border border-brand/30">
              오늘
            </span>
          )}
        </div>
        <div className="mt-1 space-y-1 overflow-hidden">
          {visible.map(ev=>(
            <div
              key={ev.id}
              className="px-2 py-1 rounded border truncate hover:shadow-sm"
              style={{ borderColor: ev.color ?? 'var(--border)' }}
              title={ev.title}
            >
              {ev.title}
            </div>
          ))}
          {overflow>0 && (
            <div
              className="px-2 py-1 rounded border border-foreground/10 text-foreground/60 bg-foreground/5 hover:bg-foreground/10"
              onClick={(e)=>{ e.stopPropagation(); openDrawer(date); }}
            >
              +{overflow}개 더보기
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── 렌더
  return (
    <div className="h-full p-4 flex flex-col">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="text-lg font-semibold tracking-tight">
            {view==='month' && format(current,'yyyy년 M월',{locale:ko})}
            {view==='week'  && `${format(weekRange[0],'M월 d일',{locale:ko})} ~ ${format(weekRange[6],'M월 d일',{locale:ko})}`}
            {view==='day'   && format(current,'yyyy년 M월 d일 (EEE)',{locale:ko})}
          </div>
          <div className="ml-2 rounded-md border border-border p-0.5 text-xs">
            <button onClick={()=>setView('month')} className={clsx('px-2 py-1 rounded', view==='month' && 'bg-subtle/70')}>월</button>
            <button onClick={()=>setView('week')}  className={clsx('px-2 py-1 rounded', view==='week'  && 'bg-subtle/70')}>주</button>
            <button onClick={()=>setView('day')}   className={clsx('px-2 py-1 rounded', view==='day'   && 'bg-subtle/70')}>일</button>
          </div>
          {/* ✅ 바깥시간 토글 */}
          {(view === 'week' || view === 'day') && (
            <label className="ml-2 inline-flex items-center gap-2 text-xs cursor-pointer select-none">
              <input
                type="checkbox"
                className="accent-brand"
                checked={showOutsideHours}
                onChange={(e)=>setShowOutsideHours(e.target.checked)}
                aria-label="바깥시간 펼치기"
              />
              바깥시간 펼치기
            </label>
          )}
        </div>
        <div className="space-x-2">
          <button aria-label="이전" onClick={goPrev}  className="px-3 py-1.5 border border-border rounded-md hover:bg-subtle/60">이전</button>
          <button aria-label="다음" onClick={goNext}  className="px-3 py-1.5 border border-border rounded-md hover:bg-subtle/60">다음</button>
          <button aria-label="오늘" onClick={goToday} className="px-3 py-1.5 border border-border rounded-md bg-subtle/60 hover:bg-subtle/80">오늘</button>
        </div>
      </div>

      {/* 소스 토글 */}
      <div className="flex flex-wrap gap-2 mb-2">
        {calToggles.map(c=>(
          <button
            key={c.key}
            onClick={()=>setCalToggles(xs=>xs.map(x=>x.key===c.key ? {...x, visible:!x.visible} : x))}
            className={clsx('px-2 py-1 rounded border text-xs', c.visible ? 'bg-subtle/70' : 'opacity-60')}
            style={{ borderColor: c.color }}
            aria-pressed={c.visible}
            title={c.name}
          >
            <span className="inline-block w-2 h-2 rounded-full mr-1" style={{ background:c.color }} />
            {c.name}
          </button>
        ))}
      </div>

      {/* 요일 헤더 (월/주) */}
      {(view==='month'||view==='week') && (
        <div className="grid grid-cols-7 gap-2 text-xs text-muted mb-2">
          {DAY_NAMES.map(d=>(<div key={d} className="text-center">{d}</div>))}
        </div>
      )}

      {/* 월 뷰 */}
      {view==='month' && (
        <div className="grid grid-cols-7 gap-2 auto-rows-[120px]">
          {monthDays.map((d) => <MonthCell key={+d} date={d} />)}
        </div>
      )}

      {/* 주 뷰 */}
      {view==='week' && (
        <div className="border border-border rounded-md overflow-hidden">
          {/* 날짜 헤더 + 종일 레일 */}
          <div className="grid grid-cols-[60px_repeat(7,1fr)] text-xs bg-subtle/40 border-b border-border">
            <div className="p-2 text-muted">시간</div>
            {weekRange.map(d=>(
              <div key={toKey(d)} className={clsx('p-2 text-center', isToday(d) && 'bg-brand/5')}>
                <div className="font-medium">{format(d,'M/d (E)',{locale:ko})}</div>
                <div className="mt-1 flex flex-col gap-1">
                  {eventsForDay(d).filter(ev=>ev.allDay||ev.date).slice(0,3).map(ev=>(
                    <div key={ev.id} className="px-2 py-0.5 rounded border text-[11px] truncate hover:shadow-sm" style={{ borderColor: ev.color }}>
                      {ev.title} <span className="opacity-70">(종일)</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* 시간 그리드 */}
          <div className="grid grid-cols-[60px_repeat(7,1fr)] text-xs relative">
            {hours.map((h,idx)=>(
              <div key={`row-${h}-${idx}`} className="contents">
                <div className="p-2 border-b border-border text-muted sticky left-0 bg-background">
                  {String(h).padStart(2,'0')}:00
                </div>
                {weekRange.map(d=>{
                  const placed = layoutOverlaps(d);
                  const thisHourItems = placed.filter(p=>{
                    const startMin = (p.top/100) * 24 * 60;
                    return Math.floor(startMin/60) === h;
                  });
                  return (
                    <div key={`cell-${toKey(d)}-${h}`} className="p-1 border-b border-l border-border min-h-[44px] align-top relative">
                      {/* 현재 시각 라인 */}
                      <NowMarker day={d} hour={h} />
                      {/* 날짜 빠른 목록 버튼 */}
                      {idx===0 && (
                        <button
                          onClick={()=>openDrawer(d)}
                          className="absolute -top-6 right-1 text-[10px] underline opacity-70 hover:opacity-100"
                          title="해당 날짜 일정 목록"
                        >목록</button>
                      )}
                      {thisHourItems.map(p=>(
                        <div
                          key={p.ev.id}
                          className="absolute px-2 py-0.5 rounded border truncate bg-background hover:shadow-sm"
                          style={{
                            top:`${p.top}%`,
                            height:`${p.height}%`,
                            left:`${p.left}%`,
                            width:`calc(${p.width}% - 4px)`,
                            borderColor: p.ev.color ?? 'var(--border)'
                          }}
                          title={p.ev.title}
                        >
                          <span className="font-medium">{p.ev.title}</span>{' '}
                          {p.ev.start && p.ev.end && (
                            <span className="opacity-70">{p.ev.start.slice(11,16)}–{p.ev.end.slice(11,16)}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 일 뷰 */}
      {view==='day' && (
        <div className="border border-border rounded-md overflow-hidden">
          <div className={clsx('p-2 text-xs bg-subtle/40 border-b border-border', isToday(current) && 'bg-brand/5')}>
            <div className="font-medium">{format(current,'M월 d일 (E)',{locale:ko})}</div>
            <div className="mt-1 flex flex-col gap-1">
              {eventsForDay(current).filter(ev=>ev.allDay||ev.date).slice(0,5).map(ev=>(
                <div key={ev.id} className="px-2 py-0.5 rounded border text-[11px] truncate hover:shadow-sm" style={{ borderColor: ev.color }}>
                  {ev.title} <span className="opacity-70">(종일)</span>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-[80px_1fr] text-xs relative">
            {hours.map((h,idx)=>{
              const placed = layoutOverlaps(current).filter(p=>{
                const startMin = (p.top/100)*24*60;
                return Math.floor(startMin/60) === h;
              });
              return (
                <div key={`drow-${h}-${idx}`} className="contents">
                  <div className="p-2 border-b border-border text-muted sticky left-0 bg-background">{String(h).padStart(2,'0')}:00</div>
                  <div className="p-1 border-b border-l border-border min-h-[48px] relative">
                    <NowMarker day={current} hour={h} />
                    {idx===0 && (
                      <button onClick={()=>openDrawer(current)} className="absolute -top-6 right-1 text-[10px] underline opacity-70 hover:opacity-100">
                        목록
                      </button>
                    )}
                    {placed.map(p=>(
                      <div
                        key={p.ev.id}
                        className="absolute px-2 py-0.5 rounded border truncate bg-background hover:shadow-sm"
                        style={{
                          top:`${p.top}%`, height:`${p.height}%`,
                          left:`${p.left}%`, width:`calc(${p.width}% - 4px)`,
                          borderColor: p.ev.color ?? 'var(--border)'
                        }}
                        title={p.ev.title}
                      >
                        <span className="font-medium">{p.ev.title}</span>{' '}
                        {p.ev.start && p.ev.end && <span className="opacity-70">{p.ev.start.slice(11,16)}–{p.ev.end.slice(11,16)}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 우측 사이드패널 */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30" onClick={()=>setDrawerOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-full max-w-md bg-background border-l border-border shadow-xl flex flex-col">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="font-semibold">
                {drawerDate ? format(drawerDate,'yyyy년 M월 d일 (EEE)',{locale:ko}) : '날짜'}
              </div>
              <button onClick={()=>setDrawerOpen(false)} className="px-2 py-1 text-xs border rounded-md hover:bg-subtle/60">닫기</button>
            </div>
            <div className="p-4 space-y-2 overflow-auto">
              <div className="flex gap-2">
                <input
                  className="flex-1 px-2 py-1 border rounded-md text-sm"
                  placeholder="빠른 추가: 제목 입력 후 Enter"
                  onKeyDown={(e:any)=>{ if(e.key==='Enter'){ quickAdd(e.currentTarget.value); e.currentTarget.value=''; }}}
                />
                <button className="px-2 py-1 text-xs border rounded-md hover:bg-subtle/60" onClick={()=>alert('자세히 편집 자리표시자')}>자세히</button>
              </div>

              {drawerDate ? (
                (byDate.get(toKey(drawerDate)) ?? []).map(ev=>(
                  <div key={ev.id}
                    className={clsx('p-3 rounded-md border', ev.canEdit===false && 'opacity-60 hover:opacity-80')}
                    style={{ borderColor: ev.color ?? 'var(--border)' }}
                  >
                    <div className="text-sm font-medium">{ev.title}</div>
                    <div className="text-xs opacity-80 mt-1">
                      {ev.allDay||ev.date ? '종일' :
                        (ev.start && ev.end ? `${ev.start.slice(11,16)}–${ev.end.slice(11,16)}` : '시간 미정')}
                    </div>
                    <div className="mt-2 flex gap-2">
                      <button className="text-xs underline" onClick={()=>alert('Docs 연결')}>노트</button>
                      <button className="text-xs underline" onClick={()=>alert('Chat 연결')}>채팅</button>
                      <button className="text-xs underline" onClick={()=>alert('Issue 생성')}>액션</button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted">선택한 일정이 없습니다.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
