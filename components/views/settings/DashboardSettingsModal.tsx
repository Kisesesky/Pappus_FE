// components/views/settings/DashboardSettingsModal.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import Modal from '@/components/common/Modal';
import {
  Eye, EyeOff, GripVertical, Save, Upload, ChevronRight
} from 'lucide-react';
import clsx from 'clsx';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const BG_KEY = 'dashboard:prefs:bg';
const UPLOADED_BG_KEY = 'dashboard:prefs:uploaded-bg';
const WIDGETS_KEY = 'dashboard:prefs:widgets';

const colorChips = [
  '#e5e7eb', '#ede9fe', '#f5e1f9', '#fde6cf', '#fef9c3', '#d9eadb', '#dbeafe', '#c7c9de', '#544c5a', '#3b2f2a', '#19443f', '#1f2937'
];

const bgThumbs = [
  '/bg/purple.jpg', '/bg/pool.jpg', '/bg/desert.jpg', '/bg/cloud.jpg', '/bg/car.jpg'
];

type WidgetState = { id: string; label: string; description: string; visible: boolean };

const WIDGET_OPTIONS: WidgetState[] = [
  {
    id: 'projects',
    label: '프로젝트 현황',
    description: '주요 프로젝트의 진행률과 업데이트를 한눈에 확인합니다.',
    visible: true,
  },
  {
    id: 'issues',
    label: '이슈 집중',
    description: '우선순위 높은 이슈와 진행 상황을 모아 보여줍니다.',
    visible: true,
  },
  {
    id: 'myTasks',
    label: '내 작업',
    description: '나에게 배정된 작업과 마감일을 추적합니다.',
    visible: true,
  },
  {
    id: 'chatPulse',
    label: '채널 활동',
    description: '주요 채널의 최근 대화와 미읽은 메시지를 요약합니다.',
    visible: true,
  },
  {
    id: 'docs',
    label: 'Docs 업데이트',
    description: '문서 작성 현황과 최근 수정 내역을 살펴봅니다.',
    visible: true,
  },
  {
    id: 'calendar',
    label: '다가오는 일정',
    description: '다가오는 미팅과 일정 하이라이트를 보여줍니다.',
    visible: true,
  },
];

const WIDGET_OPTION_MAP = new Map(WIDGET_OPTIONS.map((item) => [item.id, item]));

const defaultWidgets: WidgetState[] = WIDGET_OPTIONS.map((item) => ({ ...item }));

function sanitizeWidgets(input: unknown): WidgetState[] {
  if (!Array.isArray(input)) return WIDGET_OPTIONS.map((item) => ({ ...item }));
  const result: WidgetState[] = [];
  const seen = new Set<string>();
  input.forEach((entry) => {
    if (!entry || typeof entry !== 'object') return;
    const id = (entry as { id?: string }).id;
    if (!id || seen.has(id) || !WIDGET_OPTION_MAP.has(id)) return;
    const base = WIDGET_OPTION_MAP.get(id)!;
    const visible =
      typeof (entry as { visible?: boolean }).visible === 'boolean'
        ? (entry as { visible?: boolean }).visible!
        : base.visible;
    result.push({ ...base, visible });
    seen.add(id);
  });
  WIDGET_OPTIONS.forEach((option) => {
    if (!seen.has(option.id)) result.push({ ...option });
  });
  return result;
}

type Props = { open: boolean; onClose: () => void };

export default function DashboardSettingsModal({ open, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<'all' | 'google'>('all');
  const [bgColor, setBgColor] = useState<string>(colorChips[0]);
  const [bgImage, setBgImage] = useState<string>(bgThumbs[0]);
  const [uploadedBg, setUploadedBg] = useState<string | undefined>();
  const [widgets, setWidgets] = useState<WidgetState[]>(() => defaultWidgets.map((item) => ({ ...item })));

  // 초기 로드 (localStorage)
  useEffect(() => {
    if (!open) return;
    const savedBg = localStorage.getItem(BG_KEY);
    const uploaded = localStorage.getItem(UPLOADED_BG_KEY);
    const ws = localStorage.getItem(WIDGETS_KEY);
    if (savedBg) setBgImage(savedBg);
    if (uploaded) setUploadedBg(uploaded);
    setWidgets(sanitizeWidgets(ws ? JSON.parse(ws) : undefined));
  }, [open]);

  const save = () => {
    // 배경: 이미지 우선 → 없으면 컬러값 저장(간단화)
    localStorage.setItem(BG_KEY, bgImage || bgColor);
    if (uploadedBg) localStorage.setItem(UPLOADED_BG_KEY, uploadedBg);
    localStorage.setItem(WIDGETS_KEY, JSON.stringify(widgets));
    window.dispatchEvent(new CustomEvent('dashboard:prefs:changed'));
    onClose();
  };

  // 업로드
  const onUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      setUploadedBg(url);
    };
    reader.readAsDataURL(f);
  };

  // DnD
  const onDragEnd = (result: any) => {
    if (!result.destination) return;
    const reordered = Array.from(widgets);
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);
    setWidgets(reordered);
  };

  const toggleWidget = (id: string) =>
    setWidgets((prev) => prev.map((w) => (w.id === id ? { ...w, visible: !w.visible } : w)));

  const backgroundPreview = useMemo(
    () => uploadedBg || bgImage,
    [uploadedBg, bgImage]
  );

  return (
    <Modal open={open} onClose={onClose} title="대시보드 설정" widthClass="max-w-5xl" className="overflow-hidden">
      {/* 상단 헤더 영역 */}
      <div className="h-14 bg-white border-b flex items-center px-6 justify-between">
        <h3 className="text-base font-semibold">위젯 설정</h3>
        <button onClick={save} className="inline-flex items-center gap-2 rounded-md bg-brand text-white px-3 py-2 text-sm hover:bg-brand/90">
          <Save size={16} /> 저장
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
        {/* 좌: 배경 설정 */}
        <section className="lg:col-span-1 p-6 border-r space-y-6">
          <div>
            <div className="text-sm font-medium mb-3">배경</div>
            {/* 색 칩 */}
            <div className="flex flex-wrap gap-2">
              {colorChips.map(c => (
                <button
                  key={c}
                  onClick={() => { setBgColor(c); setBgImage(''); }}
                  className={clsx('h-8 w-8 rounded-full border', bgColor === c && !bgImage ? 'ring-2 ring-brand' : 'border-zinc-200')}
                  style={{ backgroundColor: c }}
                  aria-label={`색 ${c}`}
                />
              ))}
            </div>

            {/* 이미지 썸네일 */}
            <div className="mt-4 grid grid-cols-3 gap-3">
              {bgThumbs.map(src => (
                <button
                  key={src}
                  onClick={() => setBgImage(src)}
                  className={clsx(
                    'h-16 w-full rounded-lg bg-cover bg-center border-2 transition',
                    bgImage === src ? 'border-brand' : 'border-transparent'
                  )}
                  style={{ backgroundImage: `url(${src})` }}
                />
              ))}
              {/* 업로드 */}
              <label className="h-16 w-full rounded-lg border border-dashed grid place-items-center text-xs text-zinc-500 cursor-pointer hover:bg-zinc-50">
                <Upload size={16} />
                <span className="mt-1">업로드</span>
                <input type="file" accept="image/*" className="hidden" onChange={onUpload} />
              </label>
            </div>

            {/* 갤러리 더보기 */}
            <button className="mt-3 inline-flex items-center gap-1 text-xs text-zinc-600 hover:text-zinc-900">
              갤러리 더보기 <ChevronRight size={14} />
            </button>

            {/* 선택 프리뷰 */}
            <div className="mt-4">
              <div className="text-xs text-muted mb-1">미리보기</div>
              <div
                className="h-24 w-full rounded-lg bg-cover bg-center border"
                style={{
                  backgroundImage: backgroundPreview ? `url(${backgroundPreview})` : 'none',
                  backgroundColor: !backgroundPreview ? bgColor : undefined,
                }}
              />
            </div>
          </div>
        </section>

        {/* 우: 위젯 탭 + 리스트 */}
        <section className="lg:col-span-2 p-6">
          {/* 탭바 */}
          <div className="flex items-center gap-6 border-b">
            <button
              onClick={() => setActiveTab('all')}
              className={clsx(
                'px-2 py-3 text-sm -mb-px border-b-2',
                activeTab === 'all' ? 'border-zinc-900 font-semibold' : 'border-transparent text-zinc-500'
              )}
            >
              전체 위젯
            </button>
            <button
              onClick={() => setActiveTab('google')}
              className={clsx(
                'px-2 py-3 text-sm -mb-px border-b-2 relative',
                activeTab === 'google' ? 'border-zinc-900 font-semibold' : 'border-transparent text-zinc-500'
              )}
            >
              Google 위젯
              <span className="absolute -right-5 -top-1 inline-flex h-5 min-w-[18px] items-center justify-center rounded-full bg-rose-500 text-[10px] font-semibold text-white">N</span>
            </button>
            <a className="ml-auto text-xs text-brand hover:underline cursor-pointer">의견 보내기</a>
          </div>

          {/* 리스트 (드래그 & 토글) + 우측은 카드 느낌으로 */}
          <div className="mt-4">
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="widgets">
                {(provided) => (
                  <ul ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
                    {widgets.map((w, i) => (
                      <Draggable key={w.id} draggableId={w.id} index={i}>
                        {(prov) => (
                          <li
                            ref={prov.innerRef}
                            {...prov.draggableProps}
                            {...prov.dragHandleProps}
                            className="flex items-center justify-between rounded-xl border bg-white px-4 py-3"
                          >
                            <div className="flex items-center gap-3">
                              <GripVertical size={16} className="text-zinc-400" />
                              <div>
                                <div className="text-sm font-medium">{w.label}</div>
                                <div className="text-xs text-zinc-500">{w.description}</div>
                              </div>
                            </div>
                            <button onClick={() => toggleWidget(w.id)} className="p-1">
                              {w.visible ? <Eye size={16} /> : <EyeOff size={16} className="text-zinc-400" />}
                            </button>
                          </li>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </ul>
                )}
              </Droppable>
            </DragDropContext>

            {/* 오른쪽 영역처럼 보이는 미니 프리뷰 (2열 카드 그리드) */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {widgets.filter(w => w.visible).slice(0, 4).map(w => (
                <div key={w.id} className="rounded-xl border bg-zinc-50 p-4">
                  <div className="h-4 w-24 rounded bg-zinc-200" />
                  <div className="mt-3 space-y-2">
                    <div className="h-3 w-full rounded bg-zinc-200" />
                    <div className="h-3 w-5/6 rounded bg-zinc-200" />
                    <div className="h-3 w-2/3 rounded bg-zinc-200" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </Modal>
  );
}
