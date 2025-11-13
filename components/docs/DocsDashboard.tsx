'use client';

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ElementType } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarClock,
  Clock3,
  FolderPlus,
  LayoutGrid,
  List,
  MoreHorizontal,
  Search,
  Star,
  Upload,
  Users,
} from "lucide-react";
import clsx from "clsx";
import {
  DocMeta,
  addDocMeta,
  generateDocId,
  nextUntitledName,
  persistDocCollection,
  readDocCollection,
  removeDocMeta,
  updateDocMeta,
} from "@/lib/docs";

type FilterKey = "all" | "starred" | "shared" | "recent";

const FILTERS: { key: FilterKey; label: string; icon: ElementType; hint: string }[] = [
  { key: "all", label: "전체 문서", icon: LayoutGrid, hint: "모든 문서를 표시" },
  { key: "starred", label: "중요", icon: Star, hint: "별 표시한 문서" },
  { key: "shared", label: "공유됨", icon: Users, hint: "동료와 공유된 문서" },
  { key: "recent", label: "최근 수정", icon: Clock3, hint: "최근 24시간 내 수정" },
];

const MENU_ATTR = { "data-doc-menu": "true" } as const;

export default function DocsDashboard() {
  const router = useRouter();
  const [docs, setDocs] = useState<DocMeta[]>(() => readDocCollection());
  const [filter, setFilter] = useState<FilterKey>("all");
  const [query, setQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [menuFor, setMenuFor] = useState<string | null>(null);

  useEffect(() => {
    const sync = () => setDocs(readDocCollection());
    sync();
    const handler = () => sync();
    window.addEventListener("docs:meta-updated", handler);
    return () => window.removeEventListener("docs:meta-updated", handler);
  }, []);

  useEffect(() => {
    if (!menuFor) return;
    const onDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target?.closest('[data-doc-menu="true"]')) {
        setMenuFor(null);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [menuFor]);

  const recentDocs = useMemo(() => {
    return docs
      .slice()
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 6);
  }, [docs]);

  const filteredDocs = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return docs
      .filter((doc) => {
        if (filter === "starred" && !doc.starred) return false;
        if (filter === "shared" && !doc.sharedWith) return false;
        if (filter === "recent") {
          const twentyFourHours = 24 * 60 * 60 * 1000;
          if (Date.now() - new Date(doc.updatedAt).getTime() > twentyFourHours) return false;
        }
        if (!normalized) return true;
        const haystack = `${doc.title} ${doc.description ?? ""} ${(doc.tags || []).join(" ")}`.toLowerCase();
        return haystack.includes(normalized);
      })
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [docs, filter, query]);

  const applyCollection = useCallback((updater: (prev: DocMeta[]) => DocMeta[]) => {
    setDocs((prev) => {
      const next = updater(prev);
      persistDocCollection(next);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("docs:meta-updated", { detail: { action: "update" } }));
      }
      return next;
    });
  }, []);

  const handleCreateDoc = () => {
    const id = generateDocId();
    const nextDoc: DocMeta = {
      id,
      title: nextUntitledName(docs),
      owner: "나",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      location: "내 드라이브",
      description: "새 Flowdash 문서",
      color: pickColor(docs.length),
      icon: "📄",
      starred: false,
      sharedWith: 0,
    };
    const created = addDocMeta(nextDoc);
    setDocs((prev) => [created, ...prev.filter((doc) => doc.id !== created.id)]);
    openDoc(created.id);
  };

  const openDoc = (id: string) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("fd.docs.active", id);
    }
    updateDocMeta(id, { lastOpenedAt: new Date().toISOString() });
    router.push(`/docs/${id}`);
  };

  const handleDuplicate = (doc: DocMeta) => {
    const duplicated: DocMeta = {
      ...doc,
      id: generateDocId(),
      title: `${doc.title} 사본`,
      starred: false,
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      lastOpenedAt: undefined,
    };
    const created = addDocMeta(duplicated);
    setDocs((prev) => [created, ...prev]);
  };

  const handleRename = (doc: DocMeta) => {
    const name = window.prompt("문서 이름을 입력하세요", doc.title);
    if (!name) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    applyCollection((list) => list.map((item) => (item.id === doc.id ? { ...item, title: trimmed } : item)));
  };

  const handleToggleStar = (doc: DocMeta) => {
    applyCollection((list) => list.map((item) => (item.id === doc.id ? { ...item, starred: !item.starred } : item)));
  };

  const handleDelete = (doc: DocMeta) => {
    if (!window.confirm(`"${doc.title}" 문서를 휴지통으로 이동할까요?`)) return;
    removeDocMeta(doc.id);
    setDocs((prev) => prev.filter((item) => item.id !== doc.id));
  };

  const heroDescription = useMemo(() => {
    if (!docs.length) return "새로운 Flowdash 문서를 바로 만들어보세요.";
    const latest = docs
      .slice()
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0];
    return `${relativeTime(latest.updatedAt)}에 "${latest.title}"을(를) 수정했습니다.`;
  }, [docs]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 p-4 sm:p-6">
      <section className="rounded-3xl border border-border bg-panel/80 p-6 shadow-panel">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted">Docs</p>
            <h1 className="text-2xl font-semibold leading-tight">문서 홈</h1>
            <p className="text-sm text-muted">{heroDescription}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium shadow-sm transition hover:bg-subtle/80"
              onClick={handleCreateDoc}
            >
              <FolderPlus size={16} /> 새 문서
            </button>
            <button className="inline-flex items-center gap-2 rounded-full border border-dashed px-4 py-2 text-sm text-muted hover:border-border">
              <Upload size={16} /> 업로드
            </button>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {FILTERS.map((item) => {
            const Icon = item.icon;
            const active = filter === item.key;
            return (
              <button
                key={item.key}
                className={clsx(
                  "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition",
                  active ? "border-foreground bg-foreground text-background" : "border-border text-muted hover:text-foreground"
                )}
                title={item.hint}
                onClick={() => setFilter(item.key)}
              >
                <Icon size={14} />
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex flex-col gap-2 rounded-2xl border border-border bg-background/50 p-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-2.5 text-muted" size={16} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="문서 제목, 설명, 태그 검색"
              className="w-full rounded-xl border border-border bg-panel/40 pl-10 pr-3 py-2 text-sm outline-none focus:border-foreground"
            />
          </div>
          <div className="flex items-center gap-2 text-xs text-muted">
            <CalendarClock size={14} />
            {docs.length}개의 문서
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted">빠른 액세스</h2>
          <button className="text-xs text-muted hover:text-foreground" onClick={() => setFilter("recent")}>
            최근 문서만 보기
          </button>
        </div>
        {recentDocs.length ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {recentDocs.map((doc) => (
              <button
                key={doc.id}
                className="group flex flex-col rounded-2xl border border-border bg-panel/70 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-foreground/60"
                onClick={() => openDoc(doc.id)}
              >
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-2xl text-xl"
                  style={{ backgroundColor: doc.color || "var(--border)" }}
                >
                  {doc.icon || "📄"}
                </div>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{doc.title}</p>
                    <p className="text-xs text-muted">{doc.description || doc.location}</p>
                  </div>
                  <button
                    className="rounded-full border border-transparent p-1 text-muted transition hover:border-border hover:text-yellow-500"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleToggleStar(doc);
                    }}
                  >
                    <Star size={16} fill={doc.starred ? "currentColor" : "none"} />
                  </button>
                </div>
                <div className="mt-4 flex items-center justify-between text-xs text-muted">
                  <span>{relativeTime(doc.updatedAt)}</span>
                  {doc.sharedWith ? <span>{doc.sharedWith}명과 공유됨</span> : <span>개인 문서</span>}
                </div>
              </button>
            ))}
          </div>
        ) : (
          <EmptyState label="아직 빠른 액세스 문서가 없습니다." />
        )}
      </section>

      <section className="flex flex-1 flex-col rounded-3xl border border-border bg-panel/70 shadow-panel">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="text-sm font-semibold">내 드라이브</div>
          <div className="flex items-center gap-2">
            <button
              className={clsx(
                "rounded-full border px-3 py-1 text-xs",
                viewMode === "grid" ? "border-foreground bg-foreground text-background" : "border-border text-muted"
              )}
              onClick={() => setViewMode("grid")}
            >
              <LayoutGrid size={14} />
            </button>
            <button
              className={clsx(
                "rounded-full border px-3 py-1 text-xs",
                viewMode === "list" ? "border-foreground bg-foreground text-background" : "border-border text-muted"
              )}
              onClick={() => setViewMode("list")}
            >
              <List size={14} />
            </button>
          </div>
        </div>

        {viewMode === "grid" ? (
          filteredDocs.length ? (
            <div className="grid flex-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredDocs.map((doc) => (
                <button
                  key={doc.id}
                  className="group flex flex-col rounded-2xl border border-border bg-background/60 p-4 text-left transition hover:border-foreground/50 hover:shadow-lg"
                  onClick={() => openDoc(doc.id)}
                >
                  <DocHeader doc={doc} />
                  <p className="mt-3 line-clamp-2 text-sm text-muted">{doc.description || "설명이 없습니다."}</p>
                  <div className="mt-4 flex items-center justify-between text-xs text-muted">
                    <span>{relativeTime(doc.updatedAt)}</span>
                    <span>{doc.location}</span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <EmptyState label="조건에 맞는 문서가 없습니다." />
          )
        ) : (
          <div className="flex flex-1 flex-col">
            <div className="hidden border-b border-border px-4 py-2 text-xs uppercase tracking-wide text-muted sm:grid sm:grid-cols-[minmax(200px,2fr)_minmax(120px,1fr)_minmax(120px,1fr)_80px]">
              <span>제목</span>
              <span>소유자</span>
              <span>최근 수정</span>
              <span className="text-right">액션</span>
            </div>
            <div className="flex-1 divide-y divide-border/70">
              {filteredDocs.length ? (
                filteredDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className="group grid grid-cols-1 gap-3 px-4 py-3 transition hover:bg-subtle/40 sm:grid-cols-[minmax(200px,2fr)_minmax(120px,1fr)_minmax(120px,1fr)_80px]"
                  >
                    <button
                      className="flex min-w-0 items-center gap-3 text-left"
                      onClick={() => openDoc(doc.id)}
                    >
                      <DocHeader doc={doc} />
                    </button>
                    <div className="text-sm text-muted">{doc.owner}</div>
                    <div className="text-sm text-muted">{relativeTime(doc.updatedAt)}</div>
                    <div className="flex items-center justify-end gap-2" {...MENU_ATTR}>
                      <button
                        className={clsx(
                          "rounded-full border px-2 py-1 transition",
                          doc.starred ? "border-yellow-500 text-yellow-500" : "border-border text-muted hover:text-yellow-500"
                        )}
                        onClick={() => handleToggleStar(doc)}
                        title="중요 표시"
                      >
                        <Star size={14} fill={doc.starred ? "currentColor" : "none"} />
                      </button>
                      <div className="relative">
                        <button
                          className="rounded-full border border-border p-1 text-muted transition hover:text-foreground"
                          onClick={() => setMenuFor((prev) => (prev === doc.id ? null : doc.id))}
                          title="더보기"
                          {...MENU_ATTR}
                        >
                          <MoreHorizontal size={16} />
                        </button>
                        {menuFor === doc.id && (
                          <div
                            className="absolute right-0 top-8 z-20 w-40 rounded-xl border border-border bg-panel text-sm shadow-xl"
                            {...MENU_ATTR}
                          >
                            <button className="block w-full px-3 py-2 text-left hover:bg-subtle/60" onClick={() => { setMenuFor(null); handleRename(doc); }}>
                              이름 변경
                            </button>
                            <button className="block w-full px-3 py-2 text-left hover:bg-subtle/60" onClick={() => { setMenuFor(null); handleDuplicate(doc); }}>
                              복제
                            </button>
                            <button className="block w-full px-3 py-2 text-left text-red-500 hover:bg-red-500/10" onClick={() => { setMenuFor(null); handleDelete(doc); }}>
                              삭제
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState label="조건에 맞는 문서가 없습니다." />
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function DocHeader({ doc }: { doc: DocMeta }) {
  const location = doc.location || "내 드라이브";
  return (
    <div className="flex items-center gap-3">
      <div
        className="flex h-10 w-10 items-center justify-center rounded-2xl text-lg"
        style={{ backgroundColor: doc.color || "var(--border)" }}
      >
        {doc.icon || "📄"}
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium">{doc.title}</span>
          {doc.badge && <span className="rounded-full bg-subtle/70 px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted">{doc.badge}</span>}
        </div>
        <p className="text-xs text-muted">{location}</p>
      </div>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border px-6 py-10 text-sm text-muted">
      <p>{label}</p>
      <p className="text-xs">새 문서를 만들거나 필터를 조정해보세요.</p>
    </div>
  );
}

function relativeTime(iso: string) {
  const target = new Date(iso).getTime();
  const diff = Date.now() - target;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diff < minute) return "방금 전";
  if (diff < hour) return `${Math.floor(diff / minute)}분 전`;
  if (diff < day) return `${Math.floor(diff / hour)}시간 전`;
  if (diff < day * 7) return `${Math.floor(diff / day)}일 전`;
  return new Date(iso).toLocaleDateString();
}

const COLORS = ["#2563eb", "#0ea5e9", "#10b981", "#a855f7", "#f97316", "#facc15"];

function pickColor(seed: number) {
  return COLORS[seed % COLORS.length];
}
