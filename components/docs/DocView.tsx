// components/docs/DocView.tsx
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
  Bold,
  Italic,
  Code,
  List,
  ListOrdered,
  CheckSquare,
  Plus,
  Table as TableIcon,
  Rows,
  Columns,
  Trash2,
  LayoutPanelTop,
  LayoutPanelLeft,
  File as FileIcon,
  Image as ImageIcon,
  History as HistoryIcon,
  Save,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Droplet,
  Palette,
  Info,
  AlertTriangle,
  Timer,
  GitBranch,
  Type as TypeIcon,
  CheckCircle2,
  LayoutDashboard,
  Database,
  Cloud,
  Sparkles,
  Plug,
} from "lucide-react";
import { Node as TiptapNode, mergeAttributes } from "@tiptap/core";

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

const PRESENCE_CHANNEL = "fd.docs.presence.v1";

type DocPresencePeer = { id: string; name: string; color: string; ts: number };
type DocTemplateId = "meeting-notes" | "project-brief" | "retro";
type DocTemplateDescriptor = { id: DocTemplateId; name: string; description: string; content: string };
type EmbedKind = "github" | "figma" | "drive";

const DOC_TEMPLATES: DocTemplateDescriptor[] = [
  {
    id: "meeting-notes",
    name: "미팅 노트",
    description: "Agenda, 논의 내용, 액션 아이템을 빠르게 정리",
    content: `<h1>📝 회의 제목</h1>
<h2 id="agenda">📌 Agenda</h2>
<ul>
  <li>논의할 주제 1</li>
  <li>논의할 주제 2</li>
</ul>
<h2 id="discussion">🗣️ Discussion</h2>
<p>논의 내용을 요약합니다.</p>
<h2 id="decisions">✅ 결정 사항</h2>
<ul>
  <li>결정 1</li>
  <li>결정 2</li>
</ul>
<h2 id="actions">🚀 Action Items</h2>
<ul>
  <li>[ ] 담당자 - 작업 내용</li>
  <li>[ ] 담당자 - 작업 내용</li>
</ul>`,
  },
  {
    id: "project-brief",
    name: "프로젝트 브리프",
    description: "목표, KPI, 타임라인을 한눈에",
    content: `<h1>📦 프로젝트 이름</h1>
<div class="doc-callout doc-callout-info">
  <span class="doc-callout-icon">ℹ️</span>
  <div>
    <div class="doc-callout-heading">핵심 목표</div>
    <div class="doc-callout-body">프로젝트의 가장 중요한 목적을 요약하세요.</div>
  </div>
</div>
<h2 id="overview">개요</h2>
<p>프로젝트 배경과 해결하려는 문제를 설명합니다.</p>
<h2 id="kpi">핵심 KPI</h2>
<ul>
  <li>KPI 1</li>
  <li>KPI 2</li>
</ul>
<h2 id="timeline">타임라인</h2>
<div class="doc-timeline">
  <div class="doc-timeline-row">
    <div class="doc-timeline-dot"></div>
    <div>
      <div class="doc-timeline-title">마일스톤 1</div>
      <div class="doc-timeline-desc">설명을 입력하세요.</div>
      <div class="doc-timeline-date">2024-01-01</div>
    </div>
  </div>
  <div class="doc-timeline-row">
    <div class="doc-timeline-dot"></div>
    <div>
      <div class="doc-timeline-title">마일스톤 2</div>
      <div class="doc-timeline-desc">설명을 입력하세요.</div>
      <div class="doc-timeline-date">2024-02-01</div>
    </div>
  </div>
</div>`,
  },
  {
    id: "retro",
    name: "스프린트 회고",
    description: "잘된 점/아쉬운 점/실행 계획",
    content: `<h1>🔄 스프린트 회고</h1>
<h2 id="went-well">😀 잘된 점</h2>
<ul>
  <li>사례 1</li>
  <li>사례 2</li>
</ul>
<h2 id="improve">😅 아쉬웠던 점</h2>
<ul>
  <li>개선 포인트 1</li>
  <li>개선 포인트 2</li>
</ul>
<h2 id="actions-retro">🚀 다음 액션</h2>
<div class="doc-board">
  <div class="doc-board-column">
    <div class="doc-board-column-title">TODO</div>
    <div class="doc-board-card">액션 아이템을 작성하세요</div>
  </div>
  <div class="doc-board-column">
    <div class="doc-board-column-title">DOING</div>
    <div class="doc-board-card doc-board-card-muted">진행 중인 작업</div>
  </div>
  <div class="doc-board-column">
    <div class="doc-board-column-title">DONE</div>
    <div class="doc-board-card doc-board-card-muted">완료된 작업</div>
  </div>
</div>`,
  },
];

const EMBED_META: Record<EmbedKind, { label: string; hint: string; icon: string; sample: string }> = {
  github: { label: "GitHub", hint: "Pull Request, Issue, Repo 링크를 붙여넣기", icon: "🐙", sample: "https://github.com/flowdash/example/pull/42" },
  figma: { label: "Figma", hint: "디자인 파일, 프로토타입 URL 임베드", icon: "🎨", sample: "https://www.figma.com/file/..." },
  drive: { label: "Google Drive", hint: "문서, 스프레드시트 공유 링크", icon: "☁️", sample: "https://drive.google.com/file/..." },
};

function colorFromId(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue} 70% 55%)`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* ────────────────────────────────────────────────────────────────────── */
/* 커스텀 노드: 첨부 블록                                                 */
/* ────────────────────────────────────────────────────────────────────── */
const Attachment = (TiptapNode as unknown as { create: typeof TiptapNode.create }).create({
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
  renderHTML({ HTMLAttributes }: { HTMLAttributes: Record<string, any> }) {
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
const UploadPlaceholder = (TiptapNode as unknown as { create: typeof TiptapNode.create }).create({
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
  renderHTML({ HTMLAttributes }: { HTMLAttributes: Record<string, any> }) {
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

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem("fd.docs.active");
    if (saved) setPageId(saved);
  }, []);
  const [slashOpen, setSlashOpen] = useState(false);
  const [slashPos, setSlashPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [histOpen, setHistOpen] = useState(false);
  const me = useMemo(() => ({ id: "u-you", name: "You", color: colorFromId("u-you") }), []);
  const [presenceMap, setPresenceMap] = useState<Record<string, DocPresencePeer>>({});
  const [templateOpen, setTemplateOpen] = useState(false);
  const [integrationOpen, setIntegrationOpen] = useState(false);
  const presenceChannelRef = useRef<BroadcastChannel | null>(null);
  const templateMenuRef = useRef<HTMLDivElement | null>(null);
  const integrationMenuRef = useRef<HTMLDivElement | null>(null);


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
  const pageTitle = useMemo(() => {
    const preset: Record<string, string> = {
      spec: "제품 스펙 문서",
      retro: "스프린트 회고",
      roadmap: "제품 로드맵",
    };
    const fallback = pageId ? pageId.charAt(0).toUpperCase() + pageId.slice(1) : "문서";
    return preset[pageId] ?? fallback;
  }, [pageId]);
useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("fd.docs.active", pageId);
    window.dispatchEvent(new CustomEvent("docs:active-page", { detail: { id: pageId } }));
  }, [pageId]);

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

  const peersList = useMemo(() => Object.values(presenceMap).sort((a, b) => a.name.localeCompare(b.name)), [presenceMap]);
  const peers = useMemo(() => peersList.filter((p) => Date.now() - p.ts < 15000), [peersList]);
  const others = useMemo(() => peers.filter((p) => p.id !== me.id), [peers, me.id]);
  const primaryPeers = useMemo(() => others.slice(0, 3), [others]);
  const overflowPeers = useMemo(() => Math.max(0, others.length - primaryPeers.length), [others, primaryPeers]);
  const myPresence = presenceMap[me.id];
  const fallbackMe = useMemo<DocPresencePeer>(() => ({
    id: me.id,
    name: me.name,
    color: me.color,
    ts: Date.now(),
  }), [me]);
  const activePeers = useMemo(() => {
    if (peers.length === 0) {
      return [myPresence ?? fallbackMe];
    }
    return peers;
  }, [peers, myPresence, fallbackMe]);
  const stackPeers = useMemo(() => {
    const base = myPresence ? [myPresence] : [fallbackMe];
    return [...base, ...primaryPeers];
  }, [myPresence, fallbackMe, primaryPeers]);
  const presenceSummary = others.length ? `${others.length}명 함께 작업 중` : "혼자 작업 중";
  const presenceTooltip = activePeers.map((p) => p.name).join(", ") || "협업자 없음";

  useEffect(() => {
    if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") return;
    const bc = new BroadcastChannel(PRESENCE_CHANNEL);
    presenceChannelRef.current = bc;
    const sendPing = () => {
      const payload = { type: "presence", docId: pageId, user: { ...me }, ts: Date.now() };
      bc.postMessage(payload);
      setPresenceMap((prev) => ({ ...prev, [me.id]: { ...me, ts: payload.ts } }));
    };
    const onMessage = (event: MessageEvent) => {
      const data: any = event.data || {};
      if (data.type !== "presence" || data.docId !== pageId || !data.user) return;
      setPresenceMap((prev) => ({
        ...prev,
        [data.user.id]: {
          id: data.user.id,
          name: data.user.name || "Collaborator",
          color: data.user.color || colorFromId(data.user.id),
          ts: data.ts || Date.now(),
        },
      }));
    };
    bc.addEventListener("message", onMessage);
    sendPing();
    const pingTimer = window.setInterval(sendPing, 4000);
    return () => {
      window.clearInterval(pingTimer);
      bc.removeEventListener("message", onMessage);
      bc.close();
      presenceChannelRef.current = null;
      setPresenceMap((prev) => {
        const next = { ...prev };
        delete next[me.id];
        return next;
      });
    };
  }, [pageId, me]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const cutoff = Date.now() - 15000;
      setPresenceMap((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((key) => {
          if (next[key].ts < cutoff) delete next[key];
        });
        return next;
      });
    }, 5000);
    return () => window.clearInterval(timer);
  }, []);


  useEffect(() => {
    if (!editor) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSlashOpen(false);
        setTemplateOpen(false);
        setIntegrationOpen(false);
      }
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [editor]);

  useEffect(() => {
    if (!templateOpen && !integrationOpen) return;
    const onDown = (event: MouseEvent) => {
      const target = event.target as globalThis.Node | null;
      if (templateOpen && templateMenuRef.current && target && !templateMenuRef.current.contains(target)) {
        setTemplateOpen(false);
      }
      if (integrationOpen && integrationMenuRef.current && target && !integrationMenuRef.current.contains(target)) {
        setIntegrationOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [templateOpen, integrationOpen]);

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

  type CalloutVariant = "info" | "success" | "warning" | "danger";

  const insertCallout = (variant: CalloutVariant) => {
    if (!editor) return;
    const meta: Record<CalloutVariant, { icon: string; title: string }> = {
      info: { icon: "ℹ️", title: "정보" },
      success: { icon: "✅", title: "성공" },
      warning: { icon: "⚠️", title: "주의" },
      danger: { icon: "⛔", title: "위험" },
    };
    const { icon, title } = meta[variant];
    const html = `<div class="doc-callout doc-callout-${variant}">
  <span class="doc-callout-icon">${icon}</span>
  <div>
    <div class="doc-callout-heading">${title} 콜아웃</div>
    <div class="doc-callout-body">메시지를 입력하세요.</div>
  </div>
</div><p></p>`;
    editor.chain().focus().insertContent(html).run();
  };

  const insertTimelineBlock = () => {
    if (!editor) return;
    const html = `<div class="doc-timeline">
  <div class="doc-timeline-row">
    <div class="doc-timeline-dot"></div>
    <div>
      <div class="doc-timeline-title">키 이벤트</div>
      <div class="doc-timeline-desc">내용을 채워 넣으세요.</div>
      <div class="doc-timeline-date">${new Date().toLocaleDateString()}</div>
    </div>
  </div>
  <div class="doc-timeline-row">
    <div class="doc-timeline-dot"></div>
    <div>
      <div class="doc-timeline-title">다음 단계</div>
      <div class="doc-timeline-desc">예정된 일정을 기록합니다.</div>
      <div class="doc-timeline-date">${new Date(Date.now() + 86400000).toLocaleDateString()}</div>
    </div>
  </div>
</div><p></p>`;
    editor.chain().focus().insertContent(html).run();
  };

  const insertKanbanBoard = () => {
    if (!editor) return;
    const html = `<div class="doc-board">
  <div class="doc-board-column">
    <div class="doc-board-column-title">Todo</div>
    <div class="doc-board-card">해야 할 작업을 등록하세요</div>
    <div class="doc-board-card doc-board-card-muted">+ 카드 추가</div>
  </div>
  <div class="doc-board-column">
    <div class="doc-board-column-title">In Progress</div>
    <div class="doc-board-card">진행 중 작업</div>
  </div>
  <div class="doc-board-column">
    <div class="doc-board-column-title">Done</div>
    <div class="doc-board-card doc-board-card-muted">완료 항목</div>
  </div>
</div><p></p>`;
    editor.chain().focus().insertContent(html).run();
  };

  const insertDatabaseView = () => {
    if (!editor) return;
    if (!hasTable) {
      alert("Table 확장이 설치되지 않았습니다. 패키지를 설치해 주세요.");
      return;
    }
    const html = `<table class="doc-database">
  <thead>
    <tr>
      <th>이름</th>
      <th>담당자</th>
      <th>상태</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>샘플 항목 A</td>
      <td>홍길동</td>
      <td>진행 중</td>
    </tr>
    <tr>
      <td>샘플 항목 B</td>
      <td>김영희</td>
      <td>대기</td>
    </tr>
  </tbody>
</table><p></p>`;
    editor.chain().focus().insertContent(html).run();
  };

  const insertEmbedCard = (kind: EmbedKind, url: string) => {
    if (!editor) return;
    const meta = EMBED_META[kind];
    if (!meta) return;
    const trimmed = url.trim();
    if (!trimmed) return;
    const safeUrl = escapeHtml(trimmed);
    const html = `<div class="doc-embed doc-embed-${kind}">
  <div class="doc-embed-icon">${meta.icon}</div>
  <div class="doc-embed-body">
    <div class="doc-embed-title">${meta.label} 링크</div>
    <a class="doc-embed-link" href="${safeUrl}" target="_blank" rel="noopener">${safeUrl}</a>
    <div class="doc-embed-hint">${meta.hint}</div>
  </div>
</div><p></p>`;
    editor.chain().focus().insertContent(html).run();
  };

  const applyTemplate = (id: DocTemplateId) => {
    if (!editor) return;
    const template = DOC_TEMPLATES.find((tpl) => tpl.id === id);
    if (!template) return;
    editor.chain().focus().insertContent(`${template.content}<p></p>`).run();
    setTemplateOpen(false);
  };

  const promptIntegration = (kind: EmbedKind) => {
    const meta = EMBED_META[kind];
    if (!meta) return;
    const url = window.prompt(`${meta.label} 링크를 입력하세요`, meta.sample) || "";
    if (url.trim()) {
      insertEmbedCard(kind, url);
    }
    setIntegrationOpen(false);
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
      case "callout-info": insertCallout("info"); break;
      case "callout-success": insertCallout("success"); break;
      case "callout-warning": insertCallout("warning"); break;
      case "callout-danger": insertCallout("danger"); break;
      case "timeline": insertTimelineBlock(); break;
      case "kanban": insertKanbanBoard(); break;
      case "database": insertDatabaseView(); break;
      case "embed-github": { const url = window.prompt("GitHub URL", "https://github.com/"); if (url) insertEmbedCard("github", url); break; }
      case "embed-figma": { const url = window.prompt("Figma URL", "https://www.figma.com/file/"); if (url) insertEmbedCard("figma", url); break; }
      case "embed-drive": { const url = window.prompt("Google Drive URL", "https://drive.google.com/file/"); if (url) insertEmbedCard("drive", url); break; }
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
      <div className="flex min-h-0 flex-1 flex-col">
      <div className="h-14 px-3 sm:px-4 border-b border-border flex items-center justify-between bg-panel/70 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <div>
              <div className="text-xs uppercase tracking-[0.08em] text-muted">문서</div>
              <div className="text-base font-semibold leading-snug">{pageTitle}</div>
            </div>
            <div className="flex items-center gap-2">
              <div className="doc-presence-stack" title={presenceTooltip}>
                {stackPeers.map((peer) => (
                  <span
                    key={peer.id}
                    className="doc-presence-badge"
                    style={{ backgroundColor: peer.color }}
                    title={peer.name}
                  >
                    {(peer.name || "??").slice(0, 2).toUpperCase()}
                  </span>
                ))}
                {overflowPeers > 0 && <span className="doc-presence-more">+{overflowPeers}</span>}
              </div>
              <div className="text-xs text-muted">{presenceSummary}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative" ref={templateMenuRef}>
              <button
                className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded border border-border hover:bg-accent/60"
                onClick={() => setTemplateOpen((prev) => !prev)}
              >
                <Sparkles size={14}/> 템플릿
              </button>
              {templateOpen && (
                <div className="doc-menu">
                  <div className="doc-menu-header">페이지 템플릿</div>
                  {DOC_TEMPLATES.map((tpl) => (
                    <button key={tpl.id} className="doc-menu-item" onClick={() => applyTemplate(tpl.id)}>
                      <div className="doc-menu-item-title">{tpl.name}</div>
                      <div className="doc-menu-item-desc">{tpl.description}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="relative" ref={integrationMenuRef}>
              <button
                className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded border border-border hover:bg-accent/60"
                onClick={() => setIntegrationOpen((prev) => !prev)}
              >
                <Plug size={14}/> 연동
              </button>
              {integrationOpen && (
                <div className="doc-menu">
                  <div className="doc-menu-header">외부 연동</div>
                  {(Object.keys(EMBED_META) as EmbedKind[]).map((key) => {
                    const meta = EMBED_META[key];
                    return (
                      <button key={key} className="doc-menu-item" onClick={() => promptIntegration(key)}>
                        <span className="doc-menu-icon">{meta.icon}</span>
                        <div>
                          <div className="doc-menu-item-title">{meta.label}</div>
                          <div className="doc-menu-item-desc">{meta.hint}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <button
              className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded border border-border hover:bg-accent/60"
              onClick={manualSaveSnapshot}
              title="현재 문서를 스냅샷으로 저장"
            >
              <Save size={14}/> 저장
            </button>
            <button
              className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded border border-border hover:bg-accent/60"
              onClick={() => setHistOpen(true)}
              title="버전 히스토리"
            >
              <HistoryIcon size={14}/> 히스토리
            </button>
          </div>
        </div>

        {/* 상단 툴바 */}
        <div className="px-4 pt-3">
          <div className="inline-flex items-center gap-1 rounded-md border border-border bg-panel p-1">
            <button className="p-1 rounded hover:bg-accent/60" onClick={()=> editor?.chain().focus().toggleBold().run()} title="굵게"><Bold size={14}/></button>
            <button className="p-1 rounded hover:bg-accent/60" onClick={()=> editor?.chain().focus().toggleItalic().run()} title="기울임"><Italic size={14}/></button>
            <button className="p-1 rounded hover:bg-accent/60" onClick={()=> editor?.chain().focus().toggleCode().run()} title="인라인 코드"><Code size={14}/></button>
            <button className="p-1 rounded hover:bg-accent/60" onClick={()=> editor?.chain().focus().toggleBulletList().run()} title="글머리 목록"><List size={14}/></button>
            <button className="p-1 rounded hover:bg-accent/60" onClick={()=> editor?.chain().focus().toggleOrderedList().run()} title="번호 목록"><ListOrdered size={14}/></button>
            <button className="p-1 rounded hover:bg-accent/60" onClick={()=> editor?.chain().focus().toggleTaskList().run()} title="체크리스트"><CheckSquare size={14}/></button>
            <button className="p-1 rounded hover:bg-accent/60" onClick={()=> editor?.chain().focus().toggleCodeBlock().run()} title="코드 블록"><Plus size={14}/></button>
            <button className="p-1 rounded hover:bg-accent/60" onClick={()=> imgInputRef.current?.click()} title="이미지 삽입"><ImageIcon size={14}/></button>
            <button className="p-1 rounded hover:bg-accent/60" onClick={()=> fileInputRef.current?.click()} title="파일 첨부"><FileIcon size={14}/></button>

            {/* 표 삽입 */}
            <button className={`p-1 rounded hover:bg-accent/60 ${!hasTable ? 'opacity-50 cursor-not-allowed':''}`}
                    onClick={()=> runCmd('table')} title="표 삽입(3×3)" disabled={!hasTable}>
              <TableIcon size={14}/>
            </button>

            {/* 표 컨트롤 */}
            <div className="mx-2 h-5 w-px bg-border" />
            <button className={`p-1 rounded ${inTable?'hover:bg-accent/60':'opacity-50 cursor-not-allowed'}`} disabled={!inTable}
                    onClick={()=> (editor as any).chain().focus().addRowAfter().run()} title="행 추가(아래)"><Rows size={14}/></button>
            <button className={`p-1 rounded ${inTable?'hover:bg-accent/60':'opacity-50 cursor-not-allowed'}`} disabled={!inTable}
                    onClick={()=> (editor as any).chain().focus().addColumnAfter().run()} title="열 추가(오른쪽)"><Columns size={14}/></button>
            <button className={`p-1 rounded ${inTable?'hover:bg-accent/60':'opacity-50 cursor-not-allowed'}`} disabled={!inTable}
                    onClick={()=> (editor as any).chain().focus().toggleHeaderRow().run()} title="헤더 행 토글"><LayoutPanelTop size={14}/></button>
            <button className={`p-1 rounded ${inTable?'hover:bg-accent/60':'opacity-50 cursor-not-allowed'}`} disabled={!inTable}
                    onClick={()=> (editor as any).chain().focus().toggleHeaderColumn().run()} title="헤더 열 토글"><LayoutPanelLeft size={14}/></button>
            <button className={`p-1 rounded ${inTable?'hover:bg-accent/60':'opacity-50 cursor-not-allowed'}`} disabled={!inTable}
                    onClick={()=> (editor as any).chain().focus().deleteRow().run()} title="행 삭제"><Rows size={14}/></button>
            <button className={`p-1 rounded ${inTable?'hover:bg-accent/60':'opacity-50 cursor-not-allowed'}`} disabled={!inTable}
                    onClick={()=> (editor as any).chain().focus().deleteColumn().run()} title="열 삭제"><Columns size={14}/></button>
            <button className={`p-1 rounded ${inTable?'hover:bg-accent/60':'opacity-50 cursor-not-allowed'}`} disabled={!inTable}
                    onClick={()=> (editor as any).chain().focus().deleteTable().run()} title="표 삭제"><Trash2 size={14}/></button>

            {/* 병합/분할 */}
            <div className="mx-2 h-5 w-px bg-border" />
            <button className={`px-2 py-1 text-[11px] rounded ${inTable?'hover:bg-accent/60':'opacity-50 cursor-not-allowed'}`} disabled={!inTable}
                    onClick={()=> (editor as any).chain().focus().mergeCells().run()} title="셀 병합">병합</button>
            <button className={`px-2 py-1 text-[11px] rounded ${inTable?'hover:bg-accent/60':'opacity-50 cursor-not-allowed'}`} disabled={!inTable}
                    onClick={()=> (editor as any).chain().focus().splitCell().run()} title="셀 분할">분할</button>
            <button className={`px-2 py-1 text-[11px] rounded ${inTable?'hover:bg-accent/60':'opacity-50 cursor-not-allowed'}`} disabled={!inTable}
                    onClick={()=> (editor as any).chain().focus().mergeOrSplit().run()} title="병합/분할 자동">자동</button>

            {/* 정렬/배경/텍스트색/Bold/폰트사이즈 */}
            <div className="mx-2 h-5 w-px bg-border" />
            <button className={`p-1 rounded ${inTable?'hover:bg-accent/60':'opacity-50 cursor-not-allowed'}`} disabled={!inTable}
                    onClick={()=> setCellStyle({ textAlign: 'left' })} title="셀 좌측 정렬"><AlignLeft size={14}/></button>
            <button className={`p-1 rounded ${inTable?'hover:bg-accent/60':'opacity-50 cursor-not-allowed'}`} disabled={!inTable}
                    onClick={()=> setCellStyle({ textAlign: 'center' })} title="셀 가운데 정렬"><AlignCenter size={14}/></button>
            <button className={`p-1 rounded ${inTable?'hover:bg-accent/60':'opacity-50 cursor-not-allowed'}`} disabled={!inTable}
                    onClick={()=> setCellStyle({ textAlign: 'right' })} title="셀 우측 정렬"><AlignRight size={14}/></button>

            <button className={`p-1 rounded ${inTable?'hover:bg-accent/60':'opacity-50 cursor-not-allowed'}`} disabled={!inTable}
                    onClick={()=> document.getElementById('cell-bg-color')?.dispatchEvent(new MouseEvent('click', { bubbles:true }))} title="셀 배경색"><Droplet size={14}/></button>
            <input id="cell-bg-color" type="color" hidden onChange={(e)=> setCellStyle({ backgroundColor: e.target.value })}/>

            <button className={`p-1 rounded ${inTable?'hover:bg-accent/60':'opacity-50 cursor-not-allowed'}`} disabled={!inTable}
                    onClick={()=> document.getElementById('cell-text-color')?.dispatchEvent(new MouseEvent('click', { bubbles:true }))} title="텍스트 색"><Palette size={14}/></button>
            <input id="cell-text-color" type="color" hidden onChange={(e)=> setCellStyle({ color: e.target.value })}/>

            <button className={`p-1 rounded ${inTable?'hover:bg-accent/60':'opacity-50 cursor-not-allowed'}`} disabled={!inTable}
                    onClick={()=> setCellStyle({ fontWeight: 'bold' })} title="셀 글자 굵게"><Bold size={14}/></button>

            <button className={`p-1 rounded ${inTable?'hover:bg-accent/60':'opacity-50 cursor-not-allowed'}`} disabled={!inTable}
                    onClick={()=> setCellStyle({ fontSizeDelta: +1 })} title="글자 크게"><TypeIcon size={14}/></button>
            <button className={`p-1 rounded rotate-180 ${inTable?'hover:bg-accent/60':'opacity-50 cursor-not-allowed'}`} disabled={!inTable}
                    onClick={()=> setCellStyle({ fontSizeDelta: -1 })} title="글자 작게"><TypeIcon size={14}/></button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 sm:p-6">
          <EditorContent editor={editor} />
        </div>

        {/* 숨은 파일 입력 */}
        <input ref={imgInputRef} type="file" accept={ALLOWED_IMAGE.join(',')} hidden onChange={onPickImage}/>
        <input ref={fileInputRef} type="file" hidden onChange={onPickFile}/>

        {/* 슬래시 명령 미니 메뉴 */}
        {slashOpen && (
          <div
            style={{ position: "fixed", left: slashPos.x, top: slashPos.y, zIndex: 40 }}
            className="doc-slash-menu rounded-md border border-border bg-panel shadow-panel text-sm"
            onMouseLeave={() => setSlashOpen(false)}
          >
            <div className="doc-slash-label">기본 블록</div>
            <button className="flex w-56 items-center gap-2 px-3 py-2 hover:bg-accent/60" onClick={()=> runCmd("todo")}><CheckSquare size={14}/> 체크리스트</button>
            <button className="flex w-56 items-center gap-2 px-3 py-2 hover:bg-accent/60" onClick={()=> runCmd("ul")}><List size={14}/> 글머리</button>
            <button className="flex w-56 items-center gap-2 px-3 py-2 hover:bg-accent/60" onClick={()=> runCmd("ol")}><ListOrdered size={14}/> 번호 목록</button>
            <button className="flex w-56 items-center gap-2 px-3 py-2 hover:bg-accent/60" onClick={()=> runCmd("code")}><Code size={14}/> 코드 블록</button>
            <button className={`flex w-56 items-center gap-2 px-3 py-2 hover:bg-accent/60 ${!hasTable?'opacity-50 cursor-not-allowed':''}`}
                    onClick={()=> runCmd("table")} disabled={!hasTable}><TableIcon size={14}/> 표 (3×3)</button>
            <button className="flex w-56 items-center gap-2 px-3 py-2 hover:bg-accent/60" onClick={()=> runCmd("image")}><ImageIcon size={14}/> 이미지</button>
            <button className="flex w-56 items-center gap-2 px-3 py-2 hover:bg-accent/60" onClick={()=> runCmd("file")}><FileIcon size={14}/> 파일</button>

            <div className="doc-slash-divider" />
            <div className="doc-slash-label">고급 블록</div>
            <button className="flex w-56 items-center gap-2 px-3 py-2 hover:bg-accent/60" onClick={()=> runCmd("callout-info")}><Info size={14}/> 정보 콜아웃</button>
            <button className="flex w-56 items-center gap-2 px-3 py-2 hover:bg-accent/60" onClick={()=> runCmd("callout-success")}><CheckCircle2 size={14}/> 성공 콜아웃</button>
            <button className="flex w-56 items-center gap-2 px-3 py-2 hover:bg-accent/60" onClick={()=> runCmd("callout-warning")}><AlertTriangle size={14}/> 경고 콜아웃</button>
            <button className="flex w-56 items-center gap-2 px-3 py-2 hover:bg-accent/60" onClick={()=> runCmd("callout-danger")}><AlertTriangle size={14}/> 위험 콜아웃</button>
            <button className="flex w-56 items-center gap-2 px-3 py-2 hover:bg-accent/60" onClick={()=> runCmd("timeline")}><Timer size={14}/> 타임라인</button>
            <button className="flex w-56 items-center gap-2 px-3 py-2 hover:bg-accent/60" onClick={()=> runCmd("kanban")}><LayoutDashboard size={14}/> 칸반 보드</button>
            <button className={`flex w-56 items-center gap-2 px-3 py-2 hover:bg-accent/60 ${!hasTable?'opacity-50 cursor-not-allowed':''}`}
                    onClick={()=> runCmd("database")} disabled={!hasTable}><Database size={14}/> 데이터 뷰</button>

            <div className="doc-slash-divider" />
            <div className="doc-slash-label">외부 연동</div>
            <button className="flex w-56 items-center gap-2 px-3 py-2 hover:bg-accent/60" onClick={()=> runCmd("embed-github")}><GitBranch size={14}/> GitHub 카드</button>
            <button className="flex w-56 items-center gap-2 px-3 py-2 hover:bg-accent/60" onClick={()=> runCmd("embed-figma")}><Palette size={14}/> Figma 임베드</button>
            <button className="flex w-56 items-center gap-2 px-3 py-2 hover:bg-accent/60" onClick={()=> runCmd("embed-drive")}><Cloud size={14}/> Drive 임베드</button>
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
                    <button className="text-xs px-2 py-1 rounded border border-border hover:bg-accent/60" onClick={()=> restoreSnapshot(snap)}>복원</button>
                    <button className="text-xs px-2 py-1 rounded border border-border hover:bg-accent/60" onClick={()=> deleteSnapshot(snap.id)}>삭제</button>
                  </div>
                ))}
              </div>
              <div className="mt-3 text-right">
                <button className="text-xs px-3 py-1 rounded border border-border hover:bg-accent/60" onClick={()=> setHistOpen(false)}>닫기</button>
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

          .doc-presence-stack { display:flex; align-items:center; gap:4px; }
          .doc-presence-badge { width:26px; height:26px; border-radius:999px; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:600; color:white; box-shadow:0 0 0 2px var(--background); }
          .doc-presence-more { min-width:26px; height:26px; border-radius:999px; background: color-mix(in oklab, var(--background) 80%, black 20%); color: white; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:600; box-shadow:0 0 0 2px var(--background); }

          .doc-menu { position:absolute; right:0; margin-top:8px; min-width:220px; border:1px solid var(--border); border-radius:12px; background: color-mix(in oklab, var(--background) 96%, black 4%); box-shadow:0 20px 40px rgba(0,0,0,0.18); padding:8px; z-index:45; display:flex; flex-direction:column; gap:4px; }
          .dark .doc-menu, :root.dark .doc-menu { background: color-mix(in oklab, var(--background) 92%, white 8%); box-shadow:0 16px 32px rgba(0,0,0,0.5); }
          .doc-menu-header { font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:0.08em; color: var(--muted-foreground); padding:4px 6px; }
          .doc-menu-item { display:flex; gap:10px; width:100%; text-align:left; padding:8px; border-radius:8px; border:none; background:transparent; cursor:pointer; }
          .doc-menu-item:hover { background: color-mix(in oklab, var(--background) 88%, black 12%); }
          .doc-menu-item-title { font-size:13px; font-weight:600; }
          .doc-menu-item-desc { font-size:12px; color: var(--muted-foreground); margin-top:2px; }
          .doc-menu-icon { width:28px; height:28px; border-radius:8px; background: color-mix(in oklab, var(--background) 88%, black 12%); display:flex; align-items:center; justify-content:center; font-size:15px; }

          .doc-slash-menu { width:244px; padding:6px 0; backdrop-filter:blur(12px); }
          .doc-slash-label { font-size:11px; text-transform:uppercase; letter-spacing:0.08em; color: var(--muted-foreground); padding:4px 16px; }
          .doc-slash-divider { height:1px; margin:6px 12px; background: color-mix(in oklab, var(--background) 80%, black 20%); opacity:0.4; }

          .doc-callout { display:flex; gap:12px; padding:12px 14px; border-radius:10px; border:1px solid transparent; margin:16px 0; align-items:flex-start; }
          .doc-callout-icon { font-size:18px; line-height:1; }
          .doc-callout-heading { font-weight:600; margin-bottom:4px; }
          .doc-callout-body { font-size:14px; color: var(--muted-foreground); }
          .doc-callout-info { background: rgba(37, 99, 235, 0.08); border-color: rgba(37, 99, 235, 0.3); }
          .doc-callout-success { background: rgba(16, 185, 129, 0.1); border-color: rgba(16, 185, 129, 0.3); }
          .doc-callout-warning { background: rgba(245, 158, 11, 0.12); border-color: rgba(245, 158, 11, 0.3); }
          .doc-callout-danger { background: rgba(239, 68, 68, 0.12); border-color: rgba(239, 68, 68, 0.32); }

          .doc-timeline { border-left:2px solid color-mix(in oklab, var(--background) 40%, black 60%); padding-left:22px; margin:16px 0; display:flex; flex-direction:column; gap:18px; }
          .doc-timeline-row { position:relative; }
          .doc-timeline-dot { position:absolute; left:-34px; top:4px; width:14px; height:14px; border-radius:999px; background: color-mix(in oklab, var(--background) 30%, black 70%); border:2px solid var(--background); box-shadow:0 0 0 2px color-mix(in oklab, var(--background) 40%, black 60%); }
          .doc-timeline-title { font-weight:600; }
          .doc-timeline-desc { font-size:13px; color: var(--muted-foreground); margin:3px 0; }
          .doc-timeline-date { font-size:12px; color: var(--muted-foreground); }

          .doc-board { display:flex; gap:16px; overflow-x:auto; padding:10px 0; margin:16px 0; }
          .doc-board-column { min-width:180px; background: color-mix(in oklab, var(--background) 92%, black 8%); border-radius:12px; border:1px solid var(--border); padding:12px; display:flex; flex-direction:column; gap:10px; }
          .doc-board-column-title { font-size:13px; font-weight:600; text-transform:uppercase; letter-spacing:0.05em; color: color-mix(in oklab, var(--background) 30%, black 70%); }
          .doc-board-card { padding:10px; background:white; border-radius:10px; border:1px solid var(--border); font-size:13px; box-shadow:0 4px 12px rgba(15,23,42,0.08); }
          .dark .doc-board-card, :root.dark .doc-board-card { background: color-mix(in oklab, var(--background) 92%, white 8%); }
          .doc-board-card-muted { opacity:0.7; font-style:italic; }

          .doc-database { width:100%; border-collapse:collapse; margin:16px 0; font-size:13px; background: color-mix(in oklab, var(--background) 98%, black 2%); border-radius:10px; overflow:hidden; }
          .doc-database th, .doc-database td { border:1px solid color-mix(in oklab, var(--background) 80%, black 20%); padding:8px 10px; text-align:left; }
          .doc-database thead { background: color-mix(in oklab, var(--background) 86%, black 14%); color: color-mix(in oklab, var(--background) 10%, black 90%); }

          .doc-embed { display:flex; gap:12px; align-items:center; padding:14px; border-radius:12px; border:1px solid var(--border); margin:14px 0; background: color-mix(in oklab, var(--background) 94%, black 6%); }
          .doc-embed-icon { width:40px; height:40px; border-radius:10px; background: color-mix(in oklab, var(--background) 88%, black 12%); display:flex; align-items:center; justify-content:center; font-size:20px; }
          .doc-embed-title { font-weight:600; font-size:14px; }
          .doc-embed-link { display:block; font-size:13px; color: inherit; text-decoration:none; word-break:break-all; margin-top:2px; }
          .doc-embed-link:hover { text-decoration:underline; }
          .doc-embed-hint { font-size:12px; color: var(--muted-foreground); margin-top:2px; }

          :root { --border: hsl(240 4% 16% / 0.18); --muted-foreground: hsl(240 5% 40%); --background: white; }
          .dark :root, :root.dark { --border: hsl(0 0% 100% / 0.14); --muted-foreground: hsl(240 5% 70%); --background: #0b0b0c; }
        `}</style>
      </div>
    </DocEditorProvider>
  );
}


