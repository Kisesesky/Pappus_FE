// lib/docs.ts
import { DOC_MOCKS } from "@/lib/mocks/docs";

export type DocMeta = {
  id: string;
  title: string;
  description?: string;
  owner: string;
  updatedAt: string;
  createdAt: string;
  location: string;
  starred?: boolean;
  sharedWith?: number;
  tags?: string[];
  badge?: string;
  color?: string;
  icon?: string;
  lastOpenedAt?: string;
};

const DOC_META_EVENT = "docs:meta-updated";

export const DOC_COLLECTION_KEY = "fd.docs.collection";
export const DOC_CONTENT_PREFIX = "fd.docs.content:";
export const DOC_SNAPSHOT_PREFIX = "fd.docs.snapshots:";
export const DOC_CONTENT_KEY = (id: string) => `${DOC_CONTENT_PREFIX}${id}`;
export const DOC_SNAPSHOT_KEY = (id: string) => `${DOC_SNAPSHOT_PREFIX}${id}`;

const isBrowser = () => typeof window !== "undefined";

const cloneDocs = (docs: DocMeta[]): DocMeta[] =>
  docs.map((doc) => ({ ...doc, tags: doc.tags ? [...doc.tags] : undefined }));

const normalizeDocMeta = (doc: DocMeta): DocMeta => ({
  id: doc.id || `doc-${Math.random().toString(36).slice(2, 7)}`,
  title: doc.title || "제목 없는 문서",
  description: doc.description || "",
  owner: doc.owner || "Flowdash",
  createdAt: doc.createdAt || new Date().toISOString(),
  updatedAt: doc.updatedAt || new Date().toISOString(),
  location: doc.location || "내 드라이브",
  starred: doc.starred ?? false,
  sharedWith: doc.sharedWith,
  tags: doc.tags ? [...doc.tags] : undefined,
  badge: doc.badge,
  color: doc.color,
  icon: doc.icon,
  lastOpenedAt: doc.lastOpenedAt,
});

const writeCollection = (list: DocMeta[]) => {
  if (!isBrowser()) return;
  window.localStorage.setItem(DOC_COLLECTION_KEY, JSON.stringify(list));
};

export function readDocCollection(): DocMeta[] {
  const fallback = cloneDocs(DOC_MOCKS);
  if (!isBrowser()) return fallback;
  try {
    const raw = window.localStorage.getItem(DOC_COLLECTION_KEY);
    if (!raw) {
      writeCollection(fallback);
      return fallback;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map((doc) => normalizeDocMeta(doc));
    }
  } catch {
    // ignore parse errors
  }
  writeCollection(fallback);
  return fallback;
}

export function persistDocCollection(list: DocMeta[]): DocMeta[] {
  const normalized = list.map((doc) => normalizeDocMeta(doc));
  writeCollection(normalized);
  return normalized;
}

export function addDocMeta(doc: DocMeta): DocMeta {
  if (!isBrowser()) return normalizeDocMeta(doc);
  const collection = readDocCollection();
  const nextDoc = normalizeDocMeta(doc);
  const filtered = collection.filter((item) => item.id !== nextDoc.id);
  const next = [nextDoc, ...filtered];
  writeCollection(next);
  window.dispatchEvent(
    new CustomEvent(DOC_META_EVENT, { detail: { action: "add", doc: nextDoc } })
  );
  return nextDoc;
}

export function updateDocMeta(id: string, patch: Partial<DocMeta>): DocMeta | undefined {
  if (!isBrowser()) return undefined;
  const collection = readDocCollection();
  const index = collection.findIndex((doc) => doc.id === id);
  if (index === -1) return undefined;
  const updated = normalizeDocMeta({ ...collection[index], ...patch, id });
  const next = [...collection];
  next[index] = updated;
  writeCollection(next);
  window.dispatchEvent(
    new CustomEvent(DOC_META_EVENT, { detail: { action: "update", doc: updated } })
  );
  return updated;
}

export function removeDocMeta(id: string) {
  if (!isBrowser()) return;
  const collection = readDocCollection();
  const next = collection.filter((doc) => doc.id !== id);
  writeCollection(next);
  window.localStorage.removeItem(DOC_CONTENT_KEY(id));
  window.localStorage.removeItem(DOC_SNAPSHOT_KEY(id));
  window.dispatchEvent(
    new CustomEvent(DOC_META_EVENT, { detail: { action: "delete", docId: id } })
  );
}

export function getDocMetaById(id: string): DocMeta | undefined {
  const collection = readDocCollection();
  return collection.find((doc) => doc.id === id);
}

export function getDocTitle(id: string): string {
  return getDocMetaById(id)?.title || id;
}

export function touchDocMeta(id: string, patch?: Partial<DocMeta>) {
  updateDocMeta(id, {
    updatedAt: new Date().toISOString(),
    ...patch,
  });
}

export function generateDocId() {
  return `doc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`;
}

export function nextUntitledName(existing: DocMeta[], prefix = "새 문서") {
  const existingNames = new Set(existing.map((doc) => doc.title));
  if (!existingNames.has(prefix)) return prefix;
  for (let i = 2; i < 1000; i += 1) {
    const candidate = `${prefix} ${i}`;
    if (!existingNames.has(candidate)) return candidate;
  }
  return `${prefix} ${Math.random().toString(36).slice(2, 5)}`;
}
