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
  folderId?: string;
  fileSize?: number;
};

export type DocFolder = {
  id: string;
  name: string;
  color?: string;
  icon?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
};

const DOC_META_EVENT = "docs:meta-updated";
export const DOC_FOLDER_EVENT = "docs:folder-updated";

export const DOC_COLLECTION_KEY = "fd.docs.collection";
export const DOC_CONTENT_PREFIX = "fd.docs.content:";
export const DOC_SNAPSHOT_PREFIX = "fd.docs.snapshots:";
export const DOC_FOLDER_KEY = "fd.docs.folders";
export const DOC_CONTENT_KEY = (id: string) => `${DOC_CONTENT_PREFIX}${id}`;
export const DOC_SNAPSHOT_KEY = (id: string) => `${DOC_SNAPSHOT_PREFIX}${id}`;

const isBrowser = () => typeof window !== "undefined";

const slugifyFolderName = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return `folder-${Math.random().toString(36).slice(2, 7)}`;
  const encoded = encodeURIComponent(trimmed.toLowerCase());
  const normalized = encoded
    .replace(/%/g, "-")
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "");
  return `folder-${normalized || Math.random().toString(36).slice(2, 7)}`;
};

const nowIso = () => new Date().toISOString();

const DEFAULT_FOLDERS: DocFolder[] = (() => {
  const base = new Map<string, DocFolder>();
  const ensure = (name: string, color?: string) => {
    const key = name.trim();
    if (!key || base.has(key)) return;
    base.set(key, {
      id: slugifyFolderName(key),
      name: key,
      color,
      icon: "📁",
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });
  };
  ensure("내 드라이브", "#0ea5e9");
  DOC_MOCKS.forEach((doc) => {
    const primary = doc.location?.split("/")?.[0]?.trim();
    if (primary) ensure(primary, doc.color);
  });
  return Array.from(base.values());
})();

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
  folderId: doc.folderId,
  fileSize: doc.fileSize,
});

const writeCollection = (list: DocMeta[]) => {
  if (!isBrowser()) return;
  window.localStorage.setItem(DOC_COLLECTION_KEY, JSON.stringify(list));
};

const writeFolders = (list: DocFolder[]) => {
  if (!isBrowser()) return;
  window.localStorage.setItem(DOC_FOLDER_KEY, JSON.stringify(list));
};

const stripFolderFromLocation = (location?: string) => {
  if (!location) return "";
  const parts = location.split("/");
  if (parts.length <= 1) return "";
  return parts.slice(1).join("/").trim();
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

export function readDocFolders(): DocFolder[] {
  if (!isBrowser()) return [...DEFAULT_FOLDERS];
  try {
    const raw = window.localStorage.getItem(DOC_FOLDER_KEY);
    if (!raw) {
      writeFolders(DEFAULT_FOLDERS);
      return [...DEFAULT_FOLDERS];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map((folder: DocFolder) => ({
        id: folder.id || slugifyFolderName(folder.name || "내 드라이브"),
        name: folder.name || "내 드라이브",
        color: folder.color,
        icon: folder.icon || "📁",
        description: folder.description,
        createdAt: folder.createdAt || nowIso(),
        updatedAt: folder.updatedAt || nowIso(),
      }));
    }
  } catch {
    // ignore parse errors
  }
  writeFolders(DEFAULT_FOLDERS);
  return [...DEFAULT_FOLDERS];
}

export function createDocFolder(name: string, color?: string, icon = "📁"): DocFolder {
  if (!isBrowser()) {
    return {
      id: slugifyFolderName(name),
      name,
      color,
      icon,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
  }
  const folders = readDocFolders();
  const trimmed = name.trim();
  if (!trimmed) return folders[0];
  const existing = folders.find((folder) => folder.name === trimmed);
  if (existing) return existing;
  const next: DocFolder = {
    id: slugifyFolderName(trimmed),
    name: trimmed,
    color: color || `hsl(${Math.floor(Math.random() * 360)} 70% 45%)`,
    icon,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  const updated = [...folders, next];
  writeFolders(updated);
  window.dispatchEvent(new CustomEvent(DOC_FOLDER_EVENT, { detail: { action: "add", folder: next } }));
  return next;
}

export function getDocFolderById(id: string): DocFolder | undefined {
  return readDocFolders().find((folder) => folder.id === id);
}

export function updateDocFolder(id: string, patch: Partial<DocFolder>): DocFolder | undefined {
  if (!isBrowser()) return undefined;
  const folders = readDocFolders();
  const index = folders.findIndex((folder) => folder.id === id);
  if (index === -1) return undefined;
  const updatedFolder: DocFolder = {
    ...folders[index],
    ...patch,
    id,
    updatedAt: nowIso(),
  };
  const next = [...folders];
  next[index] = updatedFolder;
  writeFolders(next);
  window.dispatchEvent(new CustomEvent(DOC_FOLDER_EVENT, { detail: { action: "update", folder: updatedFolder } }));
  return updatedFolder;
}

export function deleteDocFolder(id: string) {
  if (!isBrowser()) return;
  const folders = readDocFolders();
  const target = folders.find((folder) => folder.id === id);
  if (!target) return;
  const nextFolders = folders.filter((folder) => folder.id !== id);
  writeFolders(nextFolders);
  window.dispatchEvent(new CustomEvent(DOC_FOLDER_EVENT, { detail: { action: "delete", folderId: id } }));
  const docs = readDocCollection();
  docs.forEach((doc) => {
    if (doc.folderId === id) {
      const suffix = stripFolderFromLocation(doc.location);
      updateDocMeta(doc.id, {
        folderId: undefined,
        location: suffix || "내 드라이브",
      });
    }
  });
}

export function assignDocToFolder(docId: string, folderId?: string): DocMeta | undefined {
  const target = getDocMetaById(docId);
  if (!target) return undefined;
  const folder = folderId ? getDocFolderById(folderId) : undefined;
  const suffix = target.location ? target.location.split("/").slice(1).join("/").trim() : "";
  const nextLocation = folder ? `${folder.name}${suffix ? ` / ${suffix}` : ""}` : suffix || "내 드라이브";
  return updateDocMeta(docId, {
    folderId,
    location: nextLocation,
  });
}
