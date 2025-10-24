// components/views/dashboard/DashboardView.tsx
'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import {
  PanelsTopLeft, MessageSquare, CalendarDays, CheckCircle2, FolderKanban, Plus
} from 'lucide-react';
import clsx from 'clsx';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

export type DashboardProject = { id: string; name: string; color?: string; updatedAt?: string };
export type DashboardTask = { id: string; title: string; due?: string; status?: 'todo'|'doing'|'done' };
export type DashboardChat = { id: string; title: string; last?: string; date?: string };
export type DashboardEvent = { id: string; title: string; start: Date; end?: Date };

export type DashboardViewProps = {
  userName?: string;
  backgroundUrl?: string;
  projects?: DashboardProject[];
  tasks?: DashboardTask[];
  chats?: DashboardChat[];
  events?: DashboardEvent[];
};

const BG_KEY = 'dashboard:prefs:bg';
const UPLOADED_BG_KEY = 'dashboard:prefs:uploaded-bg';
const WIDGETS_KEY = 'dashboard:prefs:widgets';

type WidgetItem = { id: string; label: string; visible: boolean };

function GlassCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={clsx(
        'rounded-xl border border-white/10 bg-white/5 backdrop-blur-md shadow-sm',
        className
      )}
    >
      {children}
    </div>
  );
}

function MiniCalendar({ events }: { events: DashboardEvent[] }) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const first = new Date(year, month, 1);
  const startDay = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = Array.from({ length: 42 }, (_, i) => {
    const dayNum = i - startDay + 1;
    const inMonth = dayNum >= 1 && dayNum <= daysInMonth;
    const date = new Date(year, month, Math.max(1, Math.min(daysInMonth, dayNum)));
    const today =
      inMonth &&
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth();
    const hasEvent =
      inMonth &&
      events.some(
        (e) =>
          e.start.getFullYear() === date.getFullYear() &&
          e.start.getMonth() === date.getMonth() &&
          e.start.getDate() === date.getDate()
      );
    return (
      <div
        key={i}
        className={clsx(
          'h-9 w-9 flex items-center justify-center rounded-md text-xs',
          !inMonth && 'opacity-40',
          today && 'ring-1 ring-brand/60',
          hasEvent && !today && 'bg-brand/10'
        )}
      >
        {inMonth ? dayNum : ''}
      </div>
    );
  });

  return (
    <div>
      <div className="mb-2 text-sm font-medium">
        {year}년 {month + 1}월
      </div>
      <div className="grid grid-cols-7 gap-1">{cells}</div>
    </div>
  );
}

export default function DashboardView({
  userName = '사용자',
  backgroundUrl,
  projects = [],
  tasks = [],
  chats = [],
  events = [],
}: DashboardViewProps) {
  // =============================
  // 상태 관리
  // =============================
  const [bg, setBg] = useState<string | undefined>(backgroundUrl);
  const [uploadedBg, setUploadedBg] = useState<string | undefined>();
  const [widgets, setWidgets] = useState<WidgetItem[]>([
    { id: 'projects', label: '내 프로젝트', visible: true },
    { id: 'tasks', label: '내가 담당중인 업무', visible: true },
    { id: 'chats', label: '채팅방', visible: true },
    { id: 'calendar', label: '일정', visible: true },
  ]);

  // =============================
  // 로컬 저장소 불러오기
  // =============================
  useEffect(() => {
    const apply = () => {
      const storedBg = localStorage.getItem(BG_KEY);
      const uploaded = localStorage.getItem(UPLOADED_BG_KEY);
      const savedWidgets = localStorage.getItem(WIDGETS_KEY);

      if (storedBg) setBg(storedBg);
      if (uploaded) setUploadedBg(uploaded);
      if (savedWidgets) setWidgets(JSON.parse(savedWidgets));
    };
    apply();
    window.addEventListener('dashboard:prefs:changed', apply);
    return () => window.removeEventListener('dashboard:prefs:changed', apply);
  }, []);

  // =============================
  // 드래그앤드롭 (위젯 순서)
  // =============================
  const onDragEnd = (result: any) => {
    if (!result.destination) return;
    const reordered = Array.from(widgets);
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);
    setWidgets(reordered);
    localStorage.setItem(WIDGETS_KEY, JSON.stringify(reordered));
  };

  // =============================
  // 시간별 인사말
  // =============================
  const greet = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return '좋은 아침입니다';
    if (h < 18) return '즐거운 오후입니다';
    return '편안한 저녁입니다';
  }, []);

  // =============================
  // 위젯별 컴포넌트
  // =============================
  const widgetComponents: Record<string, React.ReactNode> = {
    projects: (
      <GlassCard key="projects">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <div className="text-sm font-semibold">내 프로젝트</div>
        </div>
        <ul className="p-3 space-y-2">
          {projects.length === 0 ? (
            <li className="text-sm text-white/70 px-2 py-4 flex items-center gap-2">
              프로젝트가 없습니다.
              <button
                onClick={() => window.dispatchEvent(new Event('project:open-create'))}
                className="inline-flex items-center gap-1 rounded-md border border-white/15 bg-white/10 px-2 py-1 text-xs hover:bg-white/15"
              >
                <Plus size={14} /> 새 프로젝트 만들기
              </button>
            </li>
          ) : (
            projects.map((p) => (
              <li key={p.id} className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-white/5">
                <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: p.color ?? '#6366f1' }} />
                <span className="flex-1 truncate">{p.name}</span>
                {p.updatedAt && <span className="text-xs text-white/60">{p.updatedAt}</span>}
              </li>
            ))
          )}
        </ul>
      </GlassCard>
    ),
    tasks: (
      <GlassCard key="tasks">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <div className="text-sm font-semibold">내가 담당중인 업무</div>
        </div>
        <ul className="p-3 space-y-2">
          {tasks.length === 0 ? (
            <li className="text-sm text-white/70 px-2 py-4 flex items-center gap-2">
              업무가 없습니다.
              <button
                onClick={() => window.dispatchEvent(new Event('task:open-create'))}
                className="inline-flex items-center gap-1 rounded-md border border-white/15 bg-white/10 px-2 py-1 text-xs hover:bg-white/15"
              >
                <Plus size={14} /> 새 업무 만들기
              </button>
            </li>
          ) : (
            tasks.map((t) => (
              <li key={t.id} className="flex items-center gap-2 rounded-md px-2 py-2 hover:bg-white/5">
                <CheckCircle2
                  size={16}
                  className={clsx(
                    t.status === 'done' ? 'text-emerald-400' :
                    t.status === 'doing' ? 'text-amber-300' : 'text-white/60'
                  )}
                />
                <span className="flex-1 truncate">{t.title}</span>
                {t.due && <span className="text-xs text-white/60">{t.due}</span>}
              </li>
            ))
          )}
        </ul>
      </GlassCard>
    ),
    chats: (
      <GlassCard key="chats">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <div className="text-sm font-semibold">채팅방</div>
        </div>
        <ul className="p-3 space-y-2">
          {chats.length === 0 ? (
            <li className="text-sm text-white/70 px-2 py-4 flex items-center gap-2">
              채팅방이 없습니다.
              <button
                onClick={() => window.dispatchEvent(new Event('chat:open-create'))}
                className="inline-flex items-center gap-1 rounded-md border border-white/15 bg-white/10 px-2 py-1 text-xs hover:bg-white/15"
              >
                <Plus size={14} /> 새 채팅 시작하기
              </button>
            </li>
          ) : (
            chats.map((c) => (
              <li key={c.id} className="flex items-center gap-2 rounded-md px-2 py-2 hover:bg-white/5">
                <MessageSquare size={16} className="text-white/70" />
                <span className="flex-1 truncate">{c.title}</span>
                {c.date && <span className="text-xs text-white/60">{c.date}</span>}
              </li>
            ))
          )}
        </ul>
      </GlassCard>
    ),
    calendar: (
      <GlassCard key="calendar">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <div className="text-sm font-semibold">일정</div>
          <button
            onClick={() => window.dispatchEvent(new Event('calendar:open-create-event'))}
            className="text-xs inline-flex items-center gap-1 rounded-md border border-white/15 bg-white/10 px-2 py-1 hover:bg-white/15"
          >
            <Plus size={14} /> 새 일정 만들기
          </button>
        </div>
        <div className="p-4">
          <MiniCalendar events={events} />
        </div>
      </GlassCard>
    ),
  };

  // =============================
  // 렌더링
  // =============================
  return (
    <div className="relative h-full w-full">
      {/* 배경 */}
      <div
        className="absolute inset-0 -z-10 bg-cover bg-center"
        style={{
          backgroundImage:
            uploadedBg || (bg && !bg.startsWith('#'))
              ? `url(${uploadedBg ?? bg})`
              : undefined,
          backgroundColor: bg?.startsWith('#') ? bg : undefined,
        }}
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/30 to-black/60" />

      {/* 상단 헤더 */}
      <div className="p-6 flex items-center justify-between">
        <div>
          <div className="text-sm text-white/80">{greet}.</div>
          <h1 className="mt-1 flex items-center gap-2 text-2xl font-semibold">
            <PanelsTopLeft size={22} />
            대시보드
            <span className="text-base text-white/70">/ {userName}</span>
          </h1>
        </div>
        <button
          onClick={() => window.dispatchEvent(new Event('dashboard-settings:open'))}
          className="text-xs rounded-md border border-white/20 bg-white/10 px-3 py-1.5 hover:bg-white/20"
        >
          대시보드 설정
        </button>
      </div>

      {/* 위젯 렌더링 */}
      <div className="p-6 pt-0">
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="widgets">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="grid grid-cols-1 lg:grid-cols-2 gap-6"
              >
                {widgets.filter(w => w.visible).map((w, i) => (
                  <Draggable key={w.id} draggableId={w.id} index={i}>
                    {(prov) => (
                      <div
                        ref={prov.innerRef}
                        {...prov.draggableProps}
                        {...prov.dragHandleProps}
                        className="cursor-grab"
                      >
                        {widgetComponents[w.id]}
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>
    </div>
  );
}
