// components/views/docs/DocView.tsx
'use client';

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import Image from "@tiptap/extension-image";
import { createLowlight } from "lowlight";
import html from "highlight.js/lib/languages/xml";
import js from "highlight.js/lib/languages/javascript";
import ts from "highlight.js/lib/languages/typescript";
import md from "highlight.js/lib/languages/markdown";

// Table (있으면 사용, 없으면 자동 비활성)
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";

import {
  Bold, Italic, Code, List, ListOrdered, CheckSquare, Plus, Table as TableIcon,
  Rows, Columns, Trash2, LayoutPanelTop, LayoutPanelLeft, File as FileIcon, Image as ImageIcon,
  History as HistoryIcon, Save, AlignLeft, AlignCenter, AlignRight, Droplet, Palette,
  Type as TypeIcon
} from "lucide-react";
import { Node, mergeAttributes } from "@tiptap/core";

// ✅ TipTap 컨텍스트: DocsRightPanel이 editor를 읽도록 공급
import { DocEditorProvider } from "@/components/docs/DocEditorContext";

/* =========================================================================
   타입 보강: 커스텀 커맨드(attachment, uploadPlaceholder) & table 명세
   ====================================================================== */
declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    attachment: {
      /** 첨부 블록 삽입 */
      insertAttachment: (attrs: { name: string; size: number; mime: string; href: string }) => ReturnType;
    };
    uploadPlaceholder: {
      /** 업로드 플레이스홀더 삽입 */
      insertUploadPh: (attrs: { id: string; kind: 'file' | 'image'; name: string; percent?: number }) => ReturnType;
      /** 업로드 플레이스홀더 진행률/이름 업데이트 */
      updateUploadPh: (attrs: Partial<{ id: string; percent: number; name: string }>) => ReturnType;
      /** 업로드 플레이스홀더 제거 */
      removeUploadPh: (id: string) => ReturnType;
    };
    table: {
      insertTable: (opts: { rows: number; cols: number; withHeaderRow?: boolean }) => ReturnType;
      addRowAfter: () => ReturnType;
      addColumnAfter: () => ReturnType;
      deleteRow: () => ReturnType;
      deleteColumn: () => ReturnType;
      deleteTable: () => ReturnType;
      toggleHeaderRow: () => ReturnType;
      toggleHeaderColumn: () => ReturnType;
      mergeCells: () => ReturnType;
      splitCell: () => ReturnType;
      mergeOrSplit: () => ReturnType;
    };
  }
}

/* ────────────────────────────────────────────────────────────────────── */
/* Lowlight 등록                                                          */
/* ────────────────────────────────────────────────────────────────────── */
const lowlight = createLowlight();
lowlight.register("html", html);
lowlight.register("js", js);
lowlight.register("ts", ts);
lowlight.register("md", md);

/* ────────────────────────────────────────────────────────────────────── */
/* LocalStorage 키                                                         */
/* ────────────────────────────────────────────────────────────────────── */
const LS_KEY = (id: string) => `fd.docs.content:${id}`;
const SNAPSHOTS_KEY = (id: string) => `fd.docs.snapshots:${id}`;

/* ────────────────────────────────────────────────────────────────────── */
/* 업로드·스냅샷 정책                                                     */
/* ────────────────────────────────────────────────────────────────────── */
const MAX_IMAGE_MB = 5;
const MAX_FILE_MB  = 20;
const INLINE_LIMIT = 1024 * 1024; // ≤1MB는 dataURL

const ALLOWED_IMAGE = ["image/png","image/jpeg","image/webp","image/gif","image/svg+xml"];
const ALLOWED_FILE  = [
  "application/pdf","text/plain","application/zip","application/x-zip-compressed",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation"
];

const AUTOSAVE_INTERVAL_MS = 60_000;   // 60초
const AUTOSAVE_MIN_DELTA   = 200;      // 200자 이상 변경
const SNAPSHOT_RETENTION    = 20;       // 최신 20개
const SNAPSHOT_RETENTION_DAYS = 30;     // 최근 30일

/* ────────────────────────────────────────────────────────────────────── */
/* 커스텀 노드: 첨부 블록                                                 */
/* ────────────────────────────────────────────────────────────────────── */
const Attachment = Node.create({
  name: 'attachment',
  group: 'block',
  draggable: true,
  selectable: true,
  atom: true,
  addAttributes() {
    return {
      name: { default: '' },
      size: { default: 0 },
      mime: { default: '' },
      href: { default: '' }, // dataURL/Blob/URL
    };
  },
  parseHTML() { return [{ tag: 'div[data-type="attachment"]' }]; },
  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'attachment', class: 'attachment-block' }),
      ['a', { href: HTMLAttributes.href, download: HTMLAttributes.name, class: 'attachment-link' },
        ['span', { class: 'attachment-icon' }, '📎'],
        ['span', { class: 'attachment-name' }, HTMLAttributes.name || 'file'],
        ['span', { class: 'attachment-meta' }, formatBytes(Number(HTMLAttributes.size || 0))]
      ]
    ];
  },
  addCommands() {
    return {
      insertAttachment:
        (attrs: { name: string; size: number; mime: string; href: string }) =>
        ({ chain }: { chain: any }) => chain().insertContent({ type: this.name, attrs }).run(),
    };
  },
});

/* ────────────────────────────────────────────────────────────────────── */
/* 커스텀 노드: 업로드 플레이스홀더(인라인 진행률)                         */
/* ────────────────────────────────────────────────────────────────────── */
const UploadPlaceholder = Node.create({
  name: 'uploadPlaceholder',
  group: 'block',
  atom: true,
  draggable: true,
  selectable: true,
  addAttributes() {
    return {
      id: { default: '' },
      kind: { default: 'file' as 'file'|'image' },
      name: { default: '' },
      percent: { default: 0 },
    };
  },
  parseHTML() { return [{ tag: 'div[data-type="upload-ph"]' }]; },
  renderHTML({ HTMLAttributes }) {
    const pct = Number(HTMLAttributes.percent || 0);
    const kind = HTMLAttributes.kind === 'image' ? '🖼️' : '📎';
    return ['div', mergeAttributes(HTMLAttributes, {
      'data-type': 'upload-ph', class: 'upload-ph',
    } ),
      ['div', { class: 'upload-ph-row' },
        ['span', { class: 'upload-ph-kind' }, kind],
        ['span', { class: 'upload-ph-name' }, HTMLAttributes.name || 'uploading...'],
        ['span', { class: 'upload-ph-pct' }, `${pct}%`],
      ],
      ['div', { class: 'upload-ph-bar' },
        ['div', { class: 'upload-ph-bar-fill', style: `width:${pct}%` } ]
      ]
    ];
  },
  addCommands() {
    return {
      insertUploadPh:
        (attrs: { id: string; kind: 'file'|'image'; name: string; percent?: number }) =>
        ({ chain }: { chain: any }) => chain().insertContent({ type: this.name, attrs }).run(),
      updateUploadPh:
        (attrs: Partial<{ id: string; percent: number; name: string }>) =>
        ({ editor }: { editor: any }) => {
          const { state, view } = editor;
          const { tr } = state;
          let updated = false;
          state.doc.descendants((node: any, pos: number) => {
            if (node.type.name === 'uploadPlaceholder' && node.attrs.id === attrs.id) {
              const nextAttrs = { ...node.attrs, ...attrs };
              tr.setNodeMarkup(pos, undefined, nextAttrs as any);
              updated = true;
              return false;
            }
            return true;
          });
          if (updated) { view.dispatch(tr); return true; }
          return false;
        },
      removeUploadPh:
        (id: string) =>
        ({ editor }: { editor: any }) => {
          const { state, view } = editor;
          const { tr } = state;
          let removed = false;
          state.doc.descendants((node: any, pos: number) => {
            if (node.type.name === 'uploadPlaceholder' && node.attrs.id === id) {
              tr.delete(pos, pos + node.nodeSize);
              removed = true;
              return false;
            }
            return true;
          });
          if (removed) { view.dispatch(tr); return true; }
          return false;
        },
    };
  },
});

/* ────────────────────────────────────────────────────────────────────── */
/* 유틸                                                                   */
/* ────────────────────────────────────────────────────────────────────── */
function bytesToMB(n: number){ return n / (1024*1024); }
function formatBytes(bytes: number) {
  if (!bytes) return '0 B';
  const k = 1024, sizes = ['B','KB','MB','GB'];
  const i = Math.floor(Math.log(bytes)/Math.log(k));
  return `${(bytes/Math.pow(k,i)).toFixed(1)} ${sizes[i]}`;
}
function fileToDataUrl(file: File, onProgress?: (p:number)=>void): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    if (onProgress && fr.onprogress !== null) {
      fr.onprogress = (e) => { if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100)); };
    }
    fr.onerror = reject;
    fr.onload = () => resolve(String(fr.result));
    fr.readAsDataURL(file);
  });
}

/* ────────────────────────────────────────────────────────────────────── */
/* 컴포넌트                                                              */
/* ────────────────────────────────────────────────────────────────────── */
export default function DocView() {
  const [pageId, setPageId] = useState<string>("spec");
  const [slashOpen, setSlashOpen] = useState(false);
  const [slashPos, setSlashPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [histOpen, setHistOpen] = useState(false);

  // 파일 입력 ref
  const imgInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 자동 스냅샷 상태
  const lastAutoRef = useRef<{ ts: number; len: number }>({ ts: 0, len: 0 });

  useEffect(() => {
    const onChangePage = (e: Event) => {
      const { id } = (e as CustomEvent<{ id: string }>).detail;
      setPageId(id);
    };
    window.addEventListener("docs:change-page", onChangePage as any);
    return () => window.removeEventListener("docs:change-page", onChangePage as any);
  }, []);

  const content = useMemo(() => {
    if (typeof window === "undefined")
      return "<h1>문서 제목</h1><p>블록 기반 에디팅 시작!</p>";
    return (
      localStorage.getItem(LS_KEY(pageId)) ||
      "<h1>문서 제목</h1><p>블록 기반 에디팅 시작!</p>"
    );
  }, [pageId]);

  // 테이블 확장 존재 여부
  const hasTable = Boolean(Table && (Table as any).configure);

  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({ codeBlock: false }),
        Placeholder.configure({ placeholder: "여기에 입력하세요. '/'로 명령을 열 수 있어요." }),
        TaskList,
        TaskItem.configure({ nested: true }),
        CodeBlockLowlight.configure({ lowlight }),
        Image.configure({ HTMLAttributes: { class: 'rounded border border-border max-w-full' } }),
        Attachment,
        UploadPlaceholder,

        ...(hasTable
          ? [
              (Table as any).configure({ resizable: true }),
              TableRow,
              TableHeader,
              TableCell,
            ]
          : []),
      ],
      content,
      autofocus: "end",
      editorProps: {
        attributes: { class: "prose prose-sm dark:prose-invert max-w-none focus:outline-none" },
        handleTextInput: (view, from, _to, text) => {
          if (text === "/") {
            const rect = view.coordsAtPos(from);
            setSlashPos({ x: rect.left, y: rect.bottom + 6 });
            setSlashOpen(true);
          }
          return false;
        },
      },
      immediatelyRender: false,
      onUpdate({ editor }) {
        if (typeof window !== "undefined") {
          const html = editor.getHTML();
          localStorage.setItem(LS_KEY(pageId), html);
          // 자동 스냅샷 조건
          const now = Date.now();
          const len = html.length;
          const { ts: lastTs, len: lastLen } = lastAutoRef.current;
          if ((now - lastTs) >= AUTOSAVE_INTERVAL_MS && Math.abs(len - lastLen) >= AUTOSAVE_MIN_DELTA) {
            autoSnapshot(html);
            lastAutoRef.current = { ts: now, len };
          }
        }
      },
    },
    [pageId, hasTable]
  );

  useEffect(() => {
    if (!editor) return;
    const onEsc = (e: KeyboardEvent) => { if (e.key === "Escape") setSlashOpen(false); };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [editor]);

  /* ── 스냅샷(버전) ───────────────────────────────────────────── */
  type Snapshot = { id: string; ts: number; html: string; note: string };
  const loadSnapshots = (): Snapshot[] => {
    const raw = localStorage.getItem(SNAPSHOTS_KEY(pageId));
    const list: Snapshot[] = raw ? JSON.parse(raw) : [];
    // 날짜 기반 보존 + 개수 컷
    const cutoff = Date.now() - SNAPSHOT_RETENTION_DAYS * 24 * 60 * 60 * 1000;
    const pruned = list.filter(s => s.ts >= cutoff).slice(-SNAPSHOT_RETENTION);
    if (pruned.length !== list.length) {
      localStorage.setItem(SNAPSHOTS_KEY(pageId), JSON.stringify(pruned));
      return pruned;
    }
    return list.slice(-SNAPSHOT_RETENTION);
  };
  const saveSnapshots = (list: Snapshot[]) => {
    const cutoff = Date.now() - SNAPSHOT_RETENTION_DAYS * 24 * 60 * 60 * 1000;
    const pruned = list.filter(s => s.ts >= cutoff).slice(-SNAPSHOT_RETENTION);
    localStorage.setItem(SNAPSHOTS_KEY(pageId), JSON.stringify(pruned));
  };

  const manualSaveSnapshot = () => {
    if (!editor) return;
    const note = window.prompt("스냅샷 메모를 입력하세요 (선택)", "") || "";
    const list = loadSnapshots();
    const html = editor.getHTML();
    const snap: Snapshot = { id: crypto.randomUUID(), ts: Date.now(), html, note };
    saveSnapshots([...list, snap]);
    lastAutoRef.current = { ts: Date.now(), len: html.length };
    setHistOpen(true);
  };
  const autoSnapshot = (html: string) => {
    const list = loadSnapshots();
    const snap: Snapshot = { id: crypto.randomUUID(), ts: Date.now(), html, note: "[auto]" };
    saveSnapshots([...list, snap]);
  };
  const restoreSnapshot = (snap: Snapshot) => {
    editor?.commands.setContent(snap.html); // 불필요한 2번째 인자 제거(타입 충돌 방지)
    localStorage.setItem(LS_KEY(pageId), snap.html);
    lastAutoRef.current = { ts: Date.now(), len: snap.html.length };
    setHistOpen(false);
  };
  const deleteSnapshot = (id: string) => {
    const next = loadSnapshots().filter(s => s.id !== id);
    saveSnapshots(next);
  };

  /* ── 슬래시 명령 실행 ─────────────────────────────────────────── */
  const runCmd = async (id: string) => {
    if (!editor) return;
    setSlashOpen(false);
    switch (id) {
      case "todo": editor.chain().focus().toggleTaskList().run(); break;
      case "ul":   editor.chain().focus().toggleBulletList().run(); break;
      case "ol":   editor.chain().focus().toggleOrderedList().run(); break;
      case "code": editor.chain().focus().toggleCodeBlock().run(); break;
      case "table":
        if (hasTable) (editor as any).chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
        else alert("Table 확장이 설치되지 않았습니다. 패키지를 설치해 주세요.");
        break;
      case "image": imgInputRef.current?.click(); break;
      case "file":  fileInputRef.current?.click(); break;
    }
  };

  /* ── 업로드: 인라인 플레이스홀더 + 진행률 + 치환 ─────────────── */
  const onPickImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editor) return;
    const file = e.target.files?.[0]; e.target.value = "";
    if (!file) return;

    if (!ALLOWED_IMAGE.includes(file.type)) { alert(`허용되지 않는 이미지 형식입니다.\n허용: ${ALLOWED_IMAGE.join(', ')}`); return; }
    if (bytesToMB(file.size) > MAX_IMAGE_MB) { alert(`이미지 최대 용량 ${MAX_IMAGE_MB}MB를 초과했습니다.`); return; }

    const phId = crypto.randomUUID();
    (editor as any).commands.insertUploadPh({ id: phId, kind: 'image', name: file.name, percent: 0 });

    try {
      let url: string;
      if (file.size <= INLINE_LIMIT) {
        url = await fileToDataUrl(file, (p)=> (editor as any).commands.updateUploadPh({ id: phId, percent: p }));
      } else {
        url = URL.createObjectURL(file);
        (editor as any).commands.updateUploadPh({ id: phId, percent: 100 });
      }
      (editor as any).commands.removeUploadPh(phId);
      (editor as any).chain().focus().setImage({ src: url, alt: file.name }).run(); // any 캐스팅
    } catch {
      (editor as any).commands.updateUploadPh({ id: phId, name: `${file.name} (실패)` });
      setTimeout(()=> (editor as any).commands.removeUploadPh(phId), 1500);
    }
  };

  const onPickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editor) return;
    const file = e.target.files?.[0]; e.target.value = "";
    if (!file) return;

    if (ALLOWED_FILE.length && !ALLOWED_FILE.includes(file.type)) { alert(`허용되지 않는 파일 형식입니다.\n허용: ${ALLOWED_FILE.join(', ')}`); return; }
    if (bytesToMB(file.size) > MAX_FILE_MB) { alert(`파일 최대 용량 ${MAX_FILE_MB}MB를 초과했습니다.`); return; }

    const phId = crypto.randomUUID();
    (editor as any).commands.insertUploadPh({ id: phId, kind: 'file', name: file.name, percent: 0 });

    try {
      let href: string;
      if (file.size <= INLINE_LIMIT) {
        href = await fileToDataUrl(file, (p)=> (editor as any).commands.updateUploadPh({ id: phId, percent: p }));
      } else {
        href = URL.createObjectURL(file);
        (editor as any).commands.updateUploadPh({ id: phId, percent: 100 });
      }
      (editor as any).commands.removeUploadPh(phId);
      (editor as any).commands.insertAttachment({ name: file.name, size: file.size, mime: file.type || 'application/octet-stream', href });
    } catch {
      (editor as any).commands.updateUploadPh({ id: phId, name: `${file.name} (실패)` });
      setTimeout(()=> (editor as any).commands.removeUploadPh(phId), 1500);
    }
  };

  /* ── 표 셀 스타일(정렬/배경/텍스트색/Bold/폰트크기±) ─────────── */
  const inTable = !!editor?.isActive('table');

  const readStyleObj = () => {
    const attrs: any = editor?.getAttributes('tableCell') || {};
    const styleStr: string = attrs.style || '';
    const obj: Record<string,string> = {};
    styleStr.split(';').map(s=>s.trim()).filter(Boolean).forEach(s=>{
      const [k,...rest]=s.split(':'); if(!k||!rest.length) return;
      obj[k.trim()] = rest.join(':').trim();
    });
    return obj;
  };
  const setCellStyle = (patch: Partial<{ textAlign:'left'|'center'|'right'; backgroundColor:string; color:string; fontWeight:'bold'|'normal'; fontSizeDelta:number }>) => {
    if (!editor) return;
    const obj = readStyleObj();
    if (patch.textAlign) obj['text-align'] = patch.textAlign;
    if (typeof patch.backgroundColor === 'string') obj['background-color'] = patch.backgroundColor;
    if (typeof patch.color === 'string') obj['color'] = patch.color;
    if (patch.fontWeight) obj['font-weight'] = patch.fontWeight;
    if (typeof patch.fontSizeDelta === 'number') {
      const cur = obj['font-size'] ? parseFloat(obj['font-size']) : 14;
      const next = Math.max(10, Math.min(40, cur + patch.fontSizeDelta));
      obj['font-size'] = `${next}px`;
      if (!obj['line-height']) obj['line-height'] = '1.4';
    }
    const nextStyle = Object.entries(obj).map(([k,v])=>`${k}:${v}`).join('; ');
    editor?.commands.updateAttributes('tableCell', { style: nextStyle });
  };

  return (
    <DocEditorProvider editor={editor}>
      <div className="h-full flex flex-col">
        <div className="h-12 px-4 border-b border-border flex items-center justify-between">
          <div className="font-semibold">Docs</div>
          <div className="flex items-center gap-2">
            <button className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded border border-border hover:bg-subtle/60"
                    onClick={manualSaveSnapshot} title="현재 문서를 스냅샷으로 저장">
              <Save size={14}/> 저장
            </button>
            <button className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded border border-border hover:bg-subtle/60"
                    onClick={()=> setHistOpen(true)} title="버전 히스토리">
              <HistoryIcon size={14}/> 히스토리
            </button>
          </div>
        </div>

        {/* 상단 툴바 */}
        <div className="px-4 pt-3">
          <div className="inline-flex items-center gap-1 rounded-md border border-border bg-panel p-1">
            <button className="p-1 rounded hover:bg-subtle/60" onClick={()=> editor?.chain().focus().toggleBold().run()} title="굵게"><Bold size={14}/></button>
            <button className="p-1 rounded hover:bg-subtle/60" onClick={()=> editor?.chain().focus().toggleItalic().run()} title="기울임"><Italic size={14}/></button>
            <button className="p-1 rounded hover:bg-subtle/60" onClick={()=> editor?.chain().focus().toggleCode().run()} title="인라인 코드"><Code size={14}/></button>
            <button className="p-1 rounded hover:bg-subtle/60" onClick={()=> editor?.chain().focus().toggleBulletList().run()} title="글머리 목록"><List size={14}/></button>
            <button className="p-1 rounded hover:bg-subtle/60" onClick={()=> editor?.chain().focus().toggleOrderedList().run()} title="번호 목록"><ListOrdered size={14}/></button>
            <button className="p-1 rounded hover:bg-subtle/60" onClick={()=> editor?.chain().focus().toggleTaskList().run()} title="체크리스트"><CheckSquare size={14}/></button>
            <button className="p-1 rounded hover:bg-subtle/60" onClick={()=> editor?.chain().focus().toggleCodeBlock().run()} title="코드 블록"><Plus size={14}/></button>
            <button className="p-1 rounded hover:bg-subtle/60" onClick={()=> imgInputRef.current?.click()} title="이미지 삽입"><ImageIcon size={14}/></button>
            <button className="p-1 rounded hover:bg-subtle/60" onClick={()=> fileInputRef.current?.click()} title="파일 첨부"><FileIcon size={14}/></button>

            {/* 표 삽입 */}
            <button className={`p-1 rounded hover:bg-subtle/60 ${!hasTable ? 'opacity-50 cursor-not-allowed':''}`}
                    onClick={()=> runCmd('table')} title="표 삽입(3×3)" disabled={!hasTable}>
              <TableIcon size={14}/>
            </button>

            {/* 표 컨트롤 */}
            <div className="mx-2 h-5 w-px bg-border" />
            <button className={`p-1 rounded ${inTable?'hover:bg-subtle/60':'opacity-50 cursor-not-allowed'}`} disabled={!inTable}
                    onClick={()=> (editor as any).chain().focus().addRowAfter().run()} title="행 추가(아래)"><Rows size={14}/></button>
            <button className={`p-1 rounded ${inTable?'hover:bg-subtle/60':'opacity-50 cursor-not-allowed'}`} disabled={!inTable}
                    onClick={()=> (editor as any).chain().focus().addColumnAfter().run()} title="열 추가(오른쪽)"><Columns size={14}/></button>
            <button className={`p-1 rounded ${inTable?'hover:bg-subtle/60':'opacity-50 cursor-not-allowed'}`} disabled={!inTable}
                    onClick={()=> (editor as any).chain().focus().toggleHeaderRow().run()} title="헤더 행 토글"><LayoutPanelTop size={14}/></button>
            <button className={`p-1 rounded ${inTable?'hover:bg-subtle/60':'opacity-50 cursor-not-allowed'}`} disabled={!inTable}
                    onClick={()=> (editor as any).chain().focus().toggleHeaderColumn().run()} title="헤더 열 토글"><LayoutPanelLeft size={14}/></button>
            <button className={`p-1 rounded ${inTable?'hover:bg-subtle/60':'opacity-50 cursor-not-allowed'}`} disabled={!inTable}
                    onClick={()=> (editor as any).chain().focus().deleteRow().run()} title="행 삭제"><Rows size={14}/></button>
            <button className={`p-1 rounded ${inTable?'hover:bg-subtle/60':'opacity-50 cursor-not-allowed'}`} disabled={!inTable}
                    onClick={()=> (editor as any).chain().focus().deleteColumn().run()} title="열 삭제"><Columns size={14}/></button>
            <button className={`p-1 rounded ${inTable?'hover:bg-subtle/60':'opacity-50 cursor-not-allowed'}`} disabled={!inTable}
                    onClick={()=> (editor as any).chain().focus().deleteTable().run()} title="표 삭제"><Trash2 size={14}/></button>

            {/* 병합/분할 */}
            <div className="mx-2 h-5 w-px bg-border" />
            <button className={`px-2 py-1 text-[11px] rounded ${inTable?'hover:bg-subtle/60':'opacity-50 cursor-not-allowed'}`} disabled={!inTable}
                    onClick={()=> (editor as any).chain().focus().mergeCells().run()} title="셀 병합">병합</button>
            <button className={`px-2 py-1 text-[11px] rounded ${inTable?'hover:bg-subtle/60':'opacity-50 cursor-not-allowed'}`} disabled={!inTable}
                    onClick={()=> (editor as any).chain().focus().splitCell().run()} title="셀 분할">분할</button>
            <button className={`px-2 py-1 text-[11px] rounded ${inTable?'hover:bg-subtle/60':'opacity-50 cursor-not-allowed'}`} disabled={!inTable}
                    onClick={()=> (editor as any).chain().focus().mergeOrSplit().run()} title="병합/분할 자동">자동</button>

            {/* 정렬/배경/텍스트색/Bold/폰트사이즈 */}
            <div className="mx-2 h-5 w-px bg-border" />
            <button className={`p-1 rounded ${inTable?'hover:bg-subtle/60':'opacity-50 cursor-not-allowed'}`} disabled={!inTable}
                    onClick={()=> setCellStyle({ textAlign: 'left' })} title="셀 좌측 정렬"><AlignLeft size={14}/></button>
            <button className={`p-1 rounded ${inTable?'hover:bg-subtle/60':'opacity-50 cursor-not-allowed'}`} disabled={!inTable}
                    onClick={()=> setCellStyle({ textAlign: 'center' })} title="셀 가운데 정렬"><AlignCenter size={14}/></button>
            <button className={`p-1 rounded ${inTable?'hover:bg-subtle/60':'opacity-50 cursor-not-allowed'}`} disabled={!inTable}
                    onClick={()=> setCellStyle({ textAlign: 'right' })} title="셀 우측 정렬"><AlignRight size={14}/></button>

            <button className={`p-1 rounded ${inTable?'hover:bg-subtle/60':'opacity-50 cursor-not-allowed'}`} disabled={!inTable}
                    onClick={()=> document.getElementById('cell-bg-color')?.dispatchEvent(new MouseEvent('click', { bubbles:true }))} title="셀 배경색"><Droplet size={14}/></button>
            <input id="cell-bg-color" type="color" hidden onChange={(e)=> setCellStyle({ backgroundColor: e.target.value })}/>

            <button className={`p-1 rounded ${inTable?'hover:bg-subtle/60':'opacity-50 cursor-not-allowed'}`} disabled={!inTable}
                    onClick={()=> document.getElementById('cell-text-color')?.dispatchEvent(new MouseEvent('click', { bubbles:true }))} title="텍스트 색"><Palette size={14}/></button>
            <input id="cell-text-color" type="color" hidden onChange={(e)=> setCellStyle({ color: e.target.value })}/>

            <button className={`p-1 rounded ${inTable?'hover:bg-subtle/60':'opacity-50 cursor-not-allowed'}`} disabled={!inTable}
                    onClick={()=> setCellStyle({ fontWeight: 'bold' })} title="셀 글자 굵게"><Bold size={14}/></button>

            <button className={`p-1 rounded ${inTable?'hover:bg-subtle/60':'opacity-50 cursor-not-allowed'}`} disabled={!inTable}
                    onClick={()=> setCellStyle({ fontSizeDelta: +1 })} title="글자 크게"><TypeIcon size={14}/></button>
            <button className={`p-1 rounded rotate-180 ${inTable?'hover:bg-subtle/60':'opacity-50 cursor-not-allowed'}`} disabled={!inTable}
                    onClick={()=> setCellStyle({ fontSizeDelta: -1 })} title="글자 작게"><TypeIcon size={14}/></button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6">
          <EditorContent editor={editor} />
        </div>

        {/* 숨은 파일 입력 */}
        <input ref={imgInputRef} type="file" accept={ALLOWED_IMAGE.join(',')} hidden onChange={onPickImage}/>
        <input ref={fileInputRef} type="file" hidden onChange={onPickFile}/>

        {/* 슬래시 명령 미니 메뉴 */}
        {slashOpen && (
          <div
            style={{ position: "fixed", left: slashPos.x, top: slashPos.y, zIndex: 40 }}
            className="rounded-md border border-border bg-panel shadow-panel text-sm"
            onMouseLeave={() => setSlashOpen(false)}
          >
            <button className="flex w-56 items-center gap-2 px-3 py-2 hover:bg-subtle/60" onClick={()=> runCmd("todo")}><CheckSquare size={14}/> 체크리스트</button>
            <button className="flex w-56 items-center gap-2 px-3 py-2 hover:bg-subtle/60" onClick={()=> runCmd("ul")}><List size={14}/> 글머리</button>
            <button className="flex w-56 items-center gap-2 px-3 py-2 hover:bg-subtle/60" onClick={()=> runCmd("ol")}><ListOrdered size={14}/> 번호 목록</button>
            <button className="flex w-56 items-center gap-2 px-3 py-2 hover:bg-subtle/60" onClick={()=> runCmd("code")}><Code size={14}/> 코드 블록</button>
            <button className={`flex w-56 items-center gap-2 px-3 py-2 hover:bg-subtle/60 ${!hasTable?'opacity-50 cursor-not-allowed':''}`}
                    onClick={()=> runCmd("table")} disabled={!hasTable}><TableIcon size={14}/> 표 (3×3)</button>
            <button className="flex w-56 items-center gap-2 px-3 py-2 hover:bg-subtle/60" onClick={()=> runCmd("image")}><ImageIcon size={14}/> 이미지</button>
            <button className="flex w-56 items-center gap-2 px-3 py-2 hover:bg-subtle/60" onClick={()=> runCmd("file")}><FileIcon size={14}/> 파일</button>
          </div>
        )}

        {/* 버전 히스토리 모달 */}
        {histOpen && (
          <div className="fixed inset-0 z-40">
            <div className="absolute inset-0 bg-black/50" onClick={()=> setHistOpen(false)} />
            <div className="absolute left-1/2 top-24 -translate-x-1/2 w-[640px] rounded-xl border border-border bg-panel shadow-panel p-4">
              <div className="font-semibold mb-2">버전 히스토리</div>
              <div className="max-h-80 overflow-y-auto divide-y divide-border/60">
                {loadSnapshots().length === 0 && <div className="text-sm text-muted py-6 text-center">저장된 스냅샷이 없습니다.</div>}
                {loadSnapshots().slice().reverse().map(snap => (
                  <div key={snap.id} className="py-2 flex items-center gap-2">
                    <div className="flex-1">
                      <div className="text-xs text-muted">{new Date(snap.ts).toLocaleString()}</div>
                      {snap.note && <div className="text-sm">{snap.note}</div>}
                    </div>
                    <button className="text-xs px-2 py-1 rounded border border-border hover:bg-subtle/60" onClick={()=> restoreSnapshot(snap)}>복원</button>
                    <button className="text-xs px-2 py-1 rounded border border-border hover:bg-subtle/60" onClick={()=> deleteSnapshot(snap.id)}>삭제</button>
                  </div>
                ))}
              </div>
              <div className="mt-3 text-right">
                <button className="text-xs px-3 py-1 rounded border border-border hover:bg-subtle/60" onClick={()=> setHistOpen(false)}>닫기</button>
              </div>
            </div>
          </div>
        )}

        {/* 스타일 */}
        <style>{`
          .attachment-block {
            display:flex; align-items:center; padding:8px 10px; border:1px solid var(--border); border-radius:6px;
            background: color-mix(in oklab, var(--background) 92%, black 8%); margin: 8px 0;
          }
          .attachment-link { display:flex; align-items:center; text-decoration:none; gap:8px; }
          .attachment-icon { font-size:14px; }
          .attachment-name { font-weight:600; }
          .attachment-meta { color: var(--muted-foreground); font-size:12px; margin-left:8px; }

          .upload-ph { padding:8px 10px; border:1px dashed var(--border); border-radius:6px; margin:8px 0; background: color-mix(in oklab, var(--background) 96%, black 4%); }
          .upload-ph-row { display:flex; align-items:center; gap:8px; margin-bottom:6px; font-size:12px; }
          .upload-ph-kind { opacity:0.8; }
          .upload-ph-name { font-weight:600; }
          .upload-ph-pct { margin-left:auto; opacity:0.7; }
          .upload-ph-bar { height:6px; border-radius:999px; background: color-mix(in oklab, var(--background) 92%, black 8%); overflow:hidden; }
          .upload-ph-bar-fill { height:100%; background: currentColor; opacity:0.5; }

          :root { --border: hsl(240 4% 16% / 0.18); --muted-foreground: hsl(240 5% 40%); --background: white; }
          .dark :root, :root.dark { --border: hsl(0 0% 100% / 0.14); --muted-foreground: hsl(240 5% 70%); --background: #0b0b0c; }
        `}</style>
      </div>
    </DocEditorProvider>
  );
}
