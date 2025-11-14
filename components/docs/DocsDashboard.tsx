'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ElementType } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarClock, Clock3, FolderPlus, LayoutGrid, List as ListIcon, Star, Upload, Users } from 'lucide-react';

import {
  DOC_FOLDER_EVENT,
  DocFolder,
  DocMeta,
  addDocMeta,
  assignDocToFolder,
  createDocFolder,
  deleteDocFolder,
  generateDocId,
  nextUntitledName,
  persistDocCollection,
  readDocCollection,
  readDocFolders,
  removeDocMeta,
  updateDocFolder,
  updateDocMeta,
} from '@/lib/docs';
import { DocumentGrid } from '@/components/docs/note-drive/DocumentGrid';
import { DocumentTable, type SortKey } from '@/components/docs/note-drive/DocumentTable';
import { FolderGrid } from '@/components/docs/note-drive/FolderGrid';
import { FilterMenu } from '@/components/docs/note-drive/FilterMenu';
import { SortMenu } from '@/components/docs/note-drive/SortMenu';
import { CreateFolderModal } from '@/components/docs/note-drive/CreateFolderModal';
import { relativeTime } from '@/components/docs/note-drive/utils';

type FilterKey = 'all' | 'starred' | 'shared' | 'recent';

const FILTERS: { key: FilterKey; label: string; icon: ElementType; hint: string }[] = [
  { key: 'all', label: '전체 문서', icon: LayoutGrid, hint: '모든 문서' },
  { key: 'starred', label: '중요', icon: Star, hint: '즐겨찾기 문서' },
  { key: 'shared', label: '공유됨', icon: Users, hint: '공유 문서' },
  { key: 'recent', label: '최근 수정', icon: Clock3, hint: '24시간 이내 수정' },
];

const FILTER_CHIPS = [
  { id: 'type', label: '유형' },
  { id: 'person', label: '사람' },
  { id: 'modified', label: '수정 날짜' },
  { id: 'source', label: '출처' },
] as const;

const CHIP_OPTIONS: Record<(typeof FILTER_CHIPS)[number]['id'], { value: string; label: string }[]> = {
  type: [
    { value: 'all', label: '모든 유형' },
    { value: 'doc', label: '노트' },
    { value: 'template', label: '템플릿' },
  ],
  person: [
    { value: 'all', label: '모든 사람' },
    { value: 'mine', label: '내가 소유' },
    { value: 'shared', label: '공유됨' },
  ],
  modified: [
    { value: 'anytime', label: '전체 기간' },
    { value: '7days', label: '지난 7일' },
    { value: '30days', label: '지난 30일' },
  ],
  source: [
    { value: 'all', label: '모든 출처' },
    { value: 'workspace', label: '워크스페이스' },
    { value: 'imported', label: '가져온 문서' },
  ],
};

export default function DocsDashboard() {
  const router = useRouter();
  const [docs, setDocs] = useState<DocMeta[]>(() => readDocCollection());
  const [folders, setFolders] = useState<DocFolder[]>(() => readDocFolders());
  const [activeFolder, setActiveFolder] = useState<'all' | 'unfiled' | string>('all');
  const [filter, setFilter] = useState<FilterKey>('all');
  const [query, setQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [sortKey, setSortKey] = useState<SortKey>('title');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [chipSelections, setChipSelections] = useState<Record<string, string>>({
    type: CHIP_OPTIONS.type[0].value,
    person: CHIP_OPTIONS.person[0].value,
    modified: CHIP_OPTIONS.modified[0].value,
    source: CHIP_OPTIONS.source[0].value,
  });
  const [folderModalOpen, setFolderModalOpen] = useState(false);

  useEffect(() => {
    const sync = () => setDocs(readDocCollection());
    const handler = () => sync();
    window.addEventListener('docs:meta-updated', handler);
    sync();
    return () => window.removeEventListener('docs:meta-updated', handler);
  }, []);

  useEffect(() => {
    const sync = () => setFolders(readDocFolders());
    const handler = () => sync();
    window.addEventListener(DOC_FOLDER_EVENT, handler as EventListener);
    sync();
    return () => window.removeEventListener(DOC_FOLDER_EVENT, handler as EventListener);
  }, []);

  useEffect(() => {
    if (activeFolder === 'all' || activeFolder === 'unfiled') return;
    if (!folders.some((folder) => folder.id === activeFolder)) {
      setActiveFolder('all');
    }
  }, [folders, activeFolder]);

  const folderMap = useMemo(() => {
    const map = new Map<string, DocFolder>();
    folders.forEach((folder) => map.set(folder.id, folder));
    return map;
  }, [folders]);

  const docCountsByFolder = useMemo(() => {
    const counts = new Map<string, number>();
    docs.forEach((doc) => {
      const folderId = resolveFolderId(doc, folders);
      const key = folderId ?? 'unfiled';
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });
    return counts;
  }, [docs, folders]);

  const breadcrumbs = useMemo(() => {
    const trail = ['내 드라이브'];
    if (activeFolder === 'unfiled') {
      trail.push('미분류 노트');
    } else if (activeFolder !== 'all') {
      const target = folderMap.get(activeFolder);
      if (target) trail.push(target.name);
    }
    return trail;
  }, [activeFolder, folderMap]);

  const applyCollection = useCallback((updater: (list: DocMeta[]) => DocMeta[]) => {
    setDocs((prev) => {
      const next = updater(prev);
      persistDocCollection(next);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('docs:meta-updated', { detail: { action: 'update' } }));
      }
      return next;
    });
  }, []);

  const handleCreateDoc = () => {
    const id = generateDocId();
    const title = nextUntitledName(docs);
    const currentFolder =
      activeFolder !== 'all' && activeFolder !== 'unfiled' ? folderMap.get(activeFolder) : undefined;
    const doc: DocMeta = {
      id,
      title,
      owner: '나',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      description: '새 Flowdash 노트',
      color: pickColor(docs.length),
      icon: '📄',
      sharedWith: 0,
      folderId: currentFolder?.id,
      location: currentFolder ? `${currentFolder.name} / ${title}` : `내 드라이브 / ${title}`,
      fileSize: 200,
    };
    const created = addDocMeta(doc);
    setDocs((prev) => [created, ...prev.filter((item) => item.id !== created.id)]);
    router.push(`/docs/${created.id}`);
  };

  const handleDuplicate = (doc: DocMeta) => {
    const duplicated: DocMeta = {
      ...doc,
      id: generateDocId(),
      title: `${doc.title} 복제본`,
      starred: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastOpenedAt: undefined,
    };
    const created = addDocMeta(duplicated);
    setDocs((prev) => [created, ...prev]);
  };

  const handleRename = (doc: DocMeta) => {
    const name = window.prompt('문서 이름을 입력하세요', doc.title);
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

  const handleCreateFolder = (name: string) => {
    const created = createDocFolder(name);
    setFolders((prev) => (prev.some((folder) => folder.id === created.id) ? prev : [...prev, created]));
    setFolderModalOpen(false);
  };

  const handleRenameFolder = (folder: DocFolder) => {
    const name = window.prompt('폴더 이름을 입력하세요', folder.name);
    if (!name) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    const updated = updateDocFolder(folder.id, { name: trimmed });
    if (updated) {
      setFolders((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
    }
  };

  const handleDeleteFolder = (folder: DocFolder) => {
    if (!window.confirm(`"${folder.name}" 폴더를 삭제하고 문서를 미분류로 이동할까요?`)) return;
    deleteDocFolder(folder.id);
    setFolders((prev) => prev.filter((item) => item.id !== folder.id));
    if (activeFolder === folder.id) {
      setActiveFolder('all');
    }
  };

  const handleMoveDoc = (doc: DocMeta, folderId?: string) => {
    const updated = assignDocToFolder(doc.id, folderId);
    if (!updated) return;
    setDocs((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
  };

  const filteredDocs = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const modifiedFilter = chipSelections.modified;
    const peopleFilter = chipSelections.person;
    const typeFilter = chipSelections.type;
    const sourceFilter = chipSelections.source;
    return docs.filter((doc) => {
      if (activeFolder !== 'all') {
        const folderId = resolveFolderId(doc, folders);
        if (activeFolder === 'unfiled') {
          if (folderId) return false;
        } else if (folderId !== activeFolder) {
          return false;
        }
      }
      if (filter === 'starred' && !doc.starred) return false;
      if (filter === 'shared' && !doc.sharedWith) return false;
      if (filter === 'recent') {
        const limit = 24 * 60 * 60 * 1000;
        if (Date.now() - new Date(doc.updatedAt).getTime() > limit) return false;
      }
      if (peopleFilter === 'mine' && doc.owner !== '나') return false;
      if (peopleFilter === 'shared' && !doc.sharedWith) return false;
      if (modifiedFilter === '7days') {
        if (Date.now() - new Date(doc.updatedAt).getTime() > 7 * 24 * 60 * 60 * 1000) return false;
      }
      if (modifiedFilter === '30days') {
        if (Date.now() - new Date(doc.updatedAt).getTime() > 30 * 24 * 60 * 60 * 1000) return false;
      }
      if (typeFilter === 'template' && !(doc.tags || []).some((tag) => tag.toLowerCase().includes('template'))) {
        return false;
      }
      if (sourceFilter === 'imported' && !(doc.tags || []).some((tag) => tag.toLowerCase().includes('import'))) {
        return false;
      }
      if (!normalized) return true;
      const haystack = `${doc.title} ${doc.description ?? ''} ${(doc.tags || []).join(' ')}`.toLowerCase();
      return haystack.includes(normalized);
    });
  }, [docs, filter, query, activeFolder, folders, chipSelections]);

  const sortedDocs = useMemo(() => {
    return filteredDocs.slice().sort((a, b) => {
      let comparison = 0;
      if (sortKey === 'title') {
        comparison = a.title.localeCompare(b.title);
      } else if (sortKey === 'owner') {
        comparison = (a.owner || '').localeCompare(b.owner || '');
      } else if (sortKey === 'size') {
        comparison = (a.fileSize || 0) - (b.fileSize || 0);
      } else {
        comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      }
      return sortDir === 'asc' ? comparison : -comparison;
    });
  }, [filteredDocs, sortKey, sortDir]);

  const heroDescription = useMemo(() => {
    if (!docs.length) return '새 Flowdash 노트를 바로 작성해보세요.';
    const latest = docs
      .slice()
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0];
    return `${relativeTime(latest.updatedAt)}에 "${latest.title}"을 수정했습니다.`;
  }, [docs]);

  const handleFilterChange = (id: string, value: string) => {
    setChipSelections((prev) => ({ ...prev, [id]: value }));
  };

  const handleSortChange = (key: SortKey) => {
    setSortKey(key);
  };

  const toggleSortDir = () => {
    setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 p-4 sm:p-6">
      <CreateFolderModal
        open={folderModalOpen}
        onClose={() => setFolderModalOpen(false)}
        onSubmit={handleCreateFolder}
      />

      <section className="rounded-3xl border border-border bg-panel/70 shadow-panel">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div className="flex flex-wrap items-center gap-2 text-sm font-semibold">
            {breadcrumbs.map((crumb, index) => (
              <span key={`${crumb}-${index}`} className="flex items-center gap-2 text-muted">
                {index !== 0 && <span>›</span>}
                <span className={index === breadcrumbs.length - 1 ? 'text-foreground' : ''}>{crumb}</span>
              </span>
            ))}
          </div>
          <div className="text-xs text-muted">{heroDescription}</div>
        </div>
        <div className="flex flex-wrap items-center gap-2 border-t border-border/60 px-4 py-3">
          <button
            className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium shadow-sm transition hover:bg-subtle/80"
            onClick={handleCreateDoc}
          >
            <Star size={14} /> 새 노트
          </button>
          <button
            className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm shadow-sm transition hover:bg-subtle/80"
            onClick={() => setFolderModalOpen(true)}
          >
            <FolderPlus size={14} /> 새 폴더
          </button>
          <button className="inline-flex items-center gap-2 rounded-full border border-dashed px-4 py-2 text-sm text-muted hover:border-border">
            <Upload size={16} /> 업로드
          </button>
          <div className="ml-auto flex items-center gap-2">
            <FilterMenu selections={chipSelections} options={CHIP_OPTIONS} onChange={handleFilterChange} />
            <SortMenu sortKey={sortKey} sortDir={sortDir} onChange={handleSortChange} onToggleDir={toggleSortDir} />
            <button
              className={`rounded-full border px-3 py-1 text-xs ${viewMode === 'list' ? 'border-foreground bg-foreground text-background' : 'border-border text-muted'}`}
              onClick={() => setViewMode('list')}
            >
              <ListIcon size={14} />
            </button>
            <button
              className={`rounded-full border px-3 py-1 text-xs ${viewMode === 'grid' ? 'border-foreground bg-foreground text-background' : 'border-border text-muted'}`}
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid size={14} />
            </button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 border-t border-border/60 px-4 py-3 text-xs sm:text-sm">
          {FILTERS.map((item) => {
            const Icon = item.icon;
            const active = filter === item.key;
            return (
              <button
                key={item.key}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 transition ${
                  active ? 'border-foreground bg-foreground text-background' : 'border-border text-muted hover:text-foreground'
                }`}
                onClick={() => setFilter(item.key)}
                title={item.hint}
              >
                <Icon size={14} />
                {item.label}
              </button>
            );
          })}
          <div className="ml-auto flex items-center gap-2 text-xs text-muted">
            <CalendarClock size={14} />
            {sortedDocs.length}개의 항목
          </div>
        </div>
        <div className="border-t border-border/60 px-4 py-3">
          <div className="relative">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="제목, 설명, 태그 검색"
              className="w-full rounded-2xl border border-border bg-panel/40 px-3 py-2 text-sm outline-none focus:border-foreground"
            />
          </div>
        </div>
      </section>

      <FolderGrid
        folders={folders}
        counts={docCountsByFolder}
        totalCount={docs.length}
        unfiledCount={docCountsByFolder.get('unfiled') ?? 0}
        activeFolder={activeFolder}
        onSelect={setActiveFolder}
        onRename={handleRenameFolder}
        onDelete={handleDeleteFolder}
      />

      <section className="flex flex-1 flex-col rounded-3xl border border-border bg-panel/70 shadow-panel">
        {viewMode === 'grid' ? (
          <DocumentGrid
            docs={sortedDocs}
            onOpen={(doc) => router.push(`/docs/${doc.id}`)}
            onToggleStar={handleToggleStar}
          />
        ) : (
          <DocumentTable
            docs={sortedDocs}
            folders={folders}
            sortKey={sortKey}
            sortDir={sortDir}
            onSortChange={handleSortChange}
            onOpen={(doc) => router.push(`/docs/${doc.id}`)}
            onRename={handleRename}
            onDuplicate={handleDuplicate}
            onDelete={handleDelete}
            onToggleStar={handleToggleStar}
            onMove={handleMoveDoc}
          />
        )}
      </section>
    </div>
  );
}

const COLORS = ['#2563eb', '#0ea5e9', '#10b981', '#a855f7', '#f97316', '#facc15'];

function pickColor(seed: number) {
  return COLORS[seed % COLORS.length];
}

function resolveFolderId(doc: DocMeta, folders: DocFolder[]) {
  if (doc.folderId) return doc.folderId;
  const [primary] = (doc.location || '').split('/');
  const match = folders.find((folder) => folder.name === primary?.trim());
  return match?.id ?? null;
}
