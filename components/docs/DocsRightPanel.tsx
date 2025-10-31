// components/docs/DocsRightPanel.tsx
'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { Tabs } from '@/components/ui/Tabs';
import { useDocEditor } from '@/components/docs/DocEditorContext';

type OutlineItem = { id: string; level: number; text: string; pos: number };
type Version = { id: string; label: string; savedAt: string };

export default function DocsRightPanel() {
  const [tab, setTab] = useState<'outline' | 'history'>('outline');

  return (
    <div className="flex min-h-0 w-full flex-col">
      <div className="h-14 px-4 border-b border-border flex items-center font-semibold">
        {tab === 'outline' ? 'Outline' : 'History'}
      </div>

      <Tabs
        value={tab}
        onChange={(k) => setTab(k as any)}
        items={[
          { key: 'outline', label: '아웃라인' },
          { key: 'history', label: '히스토리' },
        ]}
      />

      <div className="p-3">
        {tab === 'outline' ? <OutlineView /> : <HistoryView />}
      </div>
    </div>
  );
}

/** -------- Outline -------- */
function OutlineView() {
  const editor = useDocEditor();
  const [items, setItems] = useState<OutlineItem[]>([]);

  // 에디터에서 헤딩 파싱
  useEffect(() => {
    if (!editor) return;

    const readHeadings = () => {
      const res: OutlineItem[] = [];
      const { doc } = editor.state;
      doc.descendants((node: any, pos: number) => {
        if (node.type.name === 'heading') {
          const level = node.attrs.level ?? 1;
          const text = node.textContent || '';
          const idAttr = node.attrs.id || `H_${level}_${pos}`;
          res.push({ id: idAttr, level, text, pos });
        }
      });
      setItems(res);
    };

    // 초기 1회 스캔
    readHeadings();

    // 변경 감지 → on/off 사용
    editor.on('transaction', readHeadings);
    return () => {
      editor.off('transaction', readHeadings);
    };
  }, [editor]);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <button
          className="text-xs px-2 py-1 rounded border border-border hover:bg-subtle/60"
          onClick={() => {
            if (!editor) return;
            // 즉시 재스캔
            const res: OutlineItem[] = [];
            const { doc } = editor.state;
            doc.descendants((node: any, pos: number) => {
              if (node.type.name === 'heading') {
                const level = node.attrs.level ?? 1;
                const text = node.textContent || '';
                const idAttr = node.attrs.id || `H_${level}_${pos}`;
                res.push({ id: idAttr, level, text, pos });
              }
            });
            setItems(res);
          }}
        >
          문서에서 동기화
        </button>
      </div>

      <ul className="mt-2 space-y-1">
        {items.length === 0 && <li className="text-sm text-muted px-2 py-1">헤딩이 없습니다.</li>}
        {items.map((i) => (
          <li key={`${i.id}-${i.pos}`} className="text-sm">
            <button
              className="w-full text-left rounded px-2 py-1 hover:bg-subtle/50"
              style={{ paddingLeft: `${(i.level - 1) * 12 + 8}px` }}
              onClick={() => {
                if (!editor) return;
                // 커서 이동
                editor.commands.focus(i.pos);
                // DOM 헤딩 id가 있으면 스크롤
                const el = document.querySelector(`[id="${CSS.escape(i.id)}"]`);
                if (el && 'scrollIntoView' in el) {
                  (el as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
              }}
              title={`이동: ${i.text}`}
            >
              {i.text}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** -------- History -------- */
function HistoryView() {
  const [versions] = useState<Version[]>([
    { id: 'V3', label: 'Auto Save', savedAt: new Date().toISOString() },
    { id: 'V2', label: 'Manual Save', savedAt: new Date(Date.now() - 1000 * 60 * 15).toISOString() },
    { id: 'V1', label: 'Initial', savedAt: new Date(Date.now() - 1000 * 60 * 60).toISOString() },
  ]);
  const [selected, setSelected] = useState<string>('V3');
  const current = useMemo(() => versions.find((v) => v.id === selected), [versions, selected]);

  return (
    <div className="space-y-3">
      <div className="text-xs text-muted">저장본 선택</div>
      <div className="space-y-1">
        {versions.map((v) => (
          <label key={v.id} className="flex items-center gap-2 rounded hover:bg-subtle/50 px-2 py-1">
            <input type="radio" name="doc-version" checked={selected === v.id} onChange={() => setSelected(v.id)} />
            <div className="flex-1">
              <div className="text-sm">{v.label}</div>
              <div className="text-xs text-muted">{new Date(v.savedAt).toLocaleString()}</div>
            </div>
          </label>
        ))}
      </div>

      <div className="flex items-center gap-2 pt-2 border-t border-border">
        <button
          className="text-xs px-2 py-1 rounded border border-border hover:bg-subtle/60"
          onClick={() => alert(`미리보기: ${current?.label} (mock)`)}
        >
          미리보기
        </button>
        <button
          className="text-xs px-2 py-1 rounded border border-border hover:bg-subtle/60"
          onClick={() => alert(`이 버전으로 복원: ${current?.label} (mock)`)}
        >
          이 버전으로 복원
        </button>
      </div>
    </div>
  );
}
