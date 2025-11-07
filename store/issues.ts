import { create } from "zustand";
import {
  kanbanProductionStats,
  kanbanProductionRisks,
  kanbanJobSheets,
  kanbanPaintQueue,
  kanbanSubcontracts,
  kanbanMachines,
  kanbanResourceAlerts,
  kanbanWorkflowNodes,
  kanbanHumanResources,
  kanbanResourceLoads,
  kanbanWorkflowAlerts,
  kanbanWorkflowHistory,
  kanbanReminders,
} from "@mocks/kanban";
import {
  EntityState,
  JobSheet,
  PaintJob,
  ProductionRisk,
  ResourceAlert,
  HumanResource,
  ResourceLoadEntry,
  Subcontract,
  SummaryStat,
  TabConfig,
  TabKey,
  TimelineFilter,
  VendorFilter,
  Machine,
  WorkflowNode,
  WorkflowAlert,
  WorkflowHistoryEntry,
  Reminder,
  LiveAnnouncement,
  RealtimeStatus,
  WorkflowStatus,
} from "@/types/issues";
import { CalendarDays, LayoutDashboard, Palette, Scissors, Users } from "lucide-react";

type FilterPanel = "timeline" | "subcontract" | null;

type CreateJobSheetPayload = Pick<JobSheet, "code" | "name" | "start" | "end" | "status">;

type WorkflowState = {
  nodes: EntityState<WorkflowNode>;
  rootIds: string[];
  expanded: Record<string, boolean>;
};

type KanbanState = {
  tabs: TabConfig[];
  activeTab: TabKey;
  productionStats: SummaryStat[];
  workflow: WorkflowState;
  risks: EntityState<ProductionRisk>;
  jobSheets: EntityState<JobSheet>;
  paintQueue: EntityState<PaintJob>;
  subcontracts: EntityState<Subcontract>;
  machines: EntityState<Machine>;
  resourceAlerts: EntityState<ResourceAlert>;
  humanResources: EntityState<HumanResource>;
  resourceLoads: ResourceLoadEntry[];
  workflowAlerts: EntityState<WorkflowAlert>;
  workflowHistory: WorkflowHistoryEntry[];
  reminders: Reminder[];
  realtime: { status: RealtimeStatus; lastEventAt?: string };
  announcements: LiveAnnouncement[];
  filters: {
    timeline: TimelineFilter;
    vendor: VendorFilter;
  };
  ui: {
    filterPanel: FilterPanel;
    jobSheetDialogOpen: boolean;
  };
  setActiveTab: (tab: TabKey) => void;
  openFilterPanel: (panel: Exclude<FilterPanel, null>) => void;
  closeFilterPanel: () => void;
  setTimelineFilter: (filter: TimelineFilter) => void;
  setVendorFilter: (filter: VendorFilter) => void;
  openJobSheetDialog: () => void;
  closeJobSheetDialog: () => void;
  createJobSheet: (payload: CreateJobSheetPayload) => void;
  toggleWorkflowNode: (id: string) => void;
  initRealtime: () => void;
  emitWorkflowUpdate: (payload: WorkflowUpdatePayload) => void;
  pushAnnouncement: (message: string) => void;
  clearAnnouncement: (id: string) => void;
};

const toEntityState = <T extends { id: string }>(items: T[]): EntityState<T> => ({
  byId: items.reduce<Record<string, T>>((acc, item) => {
    acc[item.id] = item;
    return acc;
  }, {}),
  allIds: items.map((item) => item.id),
});

type WorkflowUpdatePayload = {
  nodeId: string;
  progress?: number;
  status?: WorkflowStatus;
  message?: string;
  author?: string;
  lastUpdatedIso?: string;
};

type RealtimeEnvelope = {
  type: "workflow:update";
  payload: WorkflowUpdatePayload;
  sourceId?: string;
};

type SetStateFn = (
  partial:
    | KanbanState
    | Partial<KanbanState>
    | ((state: KanbanState) => KanbanState | Partial<KanbanState>)
    | ((state: KanbanState) => void),
  replace?: boolean,
) => void;

const REALTIME_CHANNEL = "fd.kanban.realtime";
let realtimeChannel: BroadcastChannel | null = null;
let realtimeBound = false;
const runtimeId =
  typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `runtime-${Math.random().toString(36).slice(2)}`;

const ensureRealtimeChannel = () => {
  if (typeof window === "undefined") return null;
  if (!realtimeChannel) {
    realtimeChannel = new BroadcastChannel(REALTIME_CHANNEL);
  }
  return realtimeChannel;
};

const appendAnnouncement = (announcements: LiveAnnouncement[], message: string): LiveAnnouncement[] => {
  const entry: LiveAnnouncement = { id: `announce-${Date.now()}`, message, timestamp: new Date().toISOString() };
  const merged = [...announcements, entry];
  return merged.length > 5 ? merged.slice(merged.length - 5) : merged;
};

const patchWorkflowState = (
  workflow: WorkflowState,
  payload: WorkflowUpdatePayload,
): { workflow: WorkflowState; previous?: WorkflowNode; updated?: WorkflowNode } => {
  const node = workflow.nodes.byId[payload.nodeId];
  if (!node) return { workflow };
  const updated: WorkflowNode = {
    ...node,
    progress: payload.progress ?? node.progress,
    status: payload.status ?? node.status,
    lastUpdatedIso: payload.lastUpdatedIso ?? new Date().toISOString(),
  };
  const nextWorkflow: WorkflowState = {
    ...workflow,
    nodes: {
      ...workflow.nodes,
      byId: { ...workflow.nodes.byId, [payload.nodeId]: updated },
    },
  };
  return { workflow: nextWorkflow, previous: node, updated };
};

const buildHistoryEntry = (
  payload: WorkflowUpdatePayload,
  previous?: WorkflowNode,
  updated?: WorkflowNode,
): WorkflowHistoryEntry => {
  const timestamp = payload.lastUpdatedIso ?? new Date().toISOString();
  const summary = payload.message || `Updated ${updated?.title || payload.nodeId}`;
  const changes = [];
  if (previous && updated) {
    if (previous.status !== updated.status) {
      changes.push({ field: "status", from: previous.status, to: updated.status });
    }
    if (previous.progress !== updated.progress) {
      changes.push({ field: "progress", from: `${Math.round(previous.progress * 100)}%`, to: `${Math.round(updated.progress * 100)}%` });
    }
  }
  return {
    id: `hist-${Date.now()}`,
    nodeId: payload.nodeId,
    author: payload.author || "System",
    timestamp,
    summary,
    changes: changes.length ? changes : undefined,
  };
};

const addHistoryEntry = (history: WorkflowHistoryEntry[], entry: WorkflowHistoryEntry) => [entry, ...history].slice(0, 30);

const handleRealtimeEnvelope = (message: RealtimeEnvelope, setState: SetStateFn) => {
  if (message.type !== "workflow:update") return;
  setState((state) => {
    const result = patchWorkflowState(state.workflow, { ...message.payload, lastUpdatedIso: message.payload.lastUpdatedIso });
    if (!result.updated || result.workflow === state.workflow) {
      return state;
    }
    const entry = buildHistoryEntry(message.payload, result.previous, result.updated);
    return {
      workflow: result.workflow,
      workflowHistory: addHistoryEntry(state.workflowHistory, entry),
      realtime: { status: "connected", lastEventAt: entry.timestamp },
      announcements: appendAnnouncement(state.announcements, entry.summary),
    };
  });
};

const bindRealtimeChannel = (setState: SetStateFn) => {
  if (realtimeBound) return;
  const channel = ensureRealtimeChannel();
  if (!channel) return;
  channel.onmessage = (event) => {
    const data = event.data as RealtimeEnvelope & { sourceId?: string };
    if (!data || data.sourceId === runtimeId) return;
    handleRealtimeEnvelope(data, setState);
  };
  realtimeBound = true;
};

const productionStats = kanbanProductionStats;
const initialRisks = kanbanProductionRisks;
const initialJobSheets = kanbanJobSheets;
const initialPaintQueue = kanbanPaintQueue;
const initialSubcontracts = kanbanSubcontracts;
const initialMachines = kanbanMachines;
const initialAlerts = kanbanResourceAlerts;
const humanResources = kanbanHumanResources;
const resourceLoads = kanbanResourceLoads;
const workflowNodes = kanbanWorkflowNodes;
const workflowAlerts = kanbanWorkflowAlerts;
const workflowHistory = kanbanWorkflowHistory;
const reminders = kanbanReminders;

const tabs: TabConfig[] = [
  {
    id: "production",
    label: "Production Schedule",
    description: "Order progress and risk overview.",
    icon: CalendarDays,
  },
  {
    id: "jobSheet",
    label: "Job Sheet Planning",
    description: "Daily cutting sheets and status.",
    icon: Scissors,
  },
  {
    id: "painting",
    label: "Job Painting",
    description: "Ink preparation queue and stock.",
    icon: Palette,
  },
  {
    id: "subcontract",
    label: "Subcontract Orders",
    description: "External vendors and deadlines.",
    icon: Users,
  },
  {
    id: "resource",
    label: "Resource Control",
    description: "Machine load and alerts.",
    icon: LayoutDashboard,
  },
];

const initialWorkflow: WorkflowState = {
  nodes: toEntityState(workflowNodes),
  rootIds: workflowNodes.filter((node) => node.parentId === null).map((node) => node.id),
  expanded: workflowNodes.reduce<Record<string, boolean>>((acc, node) => {
    acc[node.id] = node.kind !== "task";
    return acc;
  }, {}),
};

export const useKanban = create<KanbanState>()((set, get) => ({
  tabs,
  activeTab: "production",
  productionStats,
  workflow: initialWorkflow,
  risks: toEntityState(initialRisks),
  jobSheets: toEntityState(initialJobSheets),
  paintQueue: toEntityState(initialPaintQueue),
  subcontracts: toEntityState(initialSubcontracts),
  machines: toEntityState(initialMachines),
  resourceAlerts: toEntityState(initialAlerts),
  humanResources: toEntityState(humanResources),
  resourceLoads,
  workflowAlerts: toEntityState(workflowAlerts),
  workflowHistory,
  reminders,
  realtime: { status: "idle" },
  announcements: [],
  filters: {
    timeline: "all",
    vendor: "all",
  },
  ui: {
    filterPanel: null,
    jobSheetDialogOpen: false,
  },
  setActiveTab: (tab) => set({ activeTab: tab }),
  openFilterPanel: (panel) =>
    set((state) => ({
      ui: { ...state.ui, filterPanel: panel },
    })),
  closeFilterPanel: () =>
    set((state) => ({
      ui: { ...state.ui, filterPanel: null },
    })),
  setTimelineFilter: (filter) =>
    set((state) => ({
      filters: { ...state.filters, timeline: filter },
      ui: { ...state.ui, filterPanel: null },
    })),
  setVendorFilter: (filter) =>
    set((state) => ({
      filters: { ...state.filters, vendor: filter },
      ui: { ...state.ui, filterPanel: null },
    })),
  openJobSheetDialog: () =>
    set((state) => ({
      ui: { ...state.ui, jobSheetDialogOpen: true },
    })),
  closeJobSheetDialog: () =>
    set((state) => ({
      ui: { ...state.ui, jobSheetDialogOpen: false },
    })),
  createJobSheet: (payload) =>
    set((state) => {
      const fallbackCode = `JS${(state.jobSheets.allIds.length + 1).toString().padStart(2, "0")}`;
      const baseCode = payload.code.trim() || fallbackCode;
      const id = state.jobSheets.byId[baseCode] ? `${baseCode}-${Date.now()}` : baseCode;
      const entry: JobSheet = {
        id,
        code: baseCode,
        name: payload.name,
        start: payload.start,
        end: payload.end,
        status: payload.status,
      };

      return {
        jobSheets: {
          byId: { ...state.jobSheets.byId, [id]: entry },
          allIds: [id, ...state.jobSheets.allIds.filter((existing) => existing !== id)],
        },
        ui: { ...state.ui, jobSheetDialogOpen: false },
      };
    }),
  toggleWorkflowNode: (id) =>
    set((state) => ({
      workflow: {
        ...state.workflow,
        expanded: { ...state.workflow.expanded, [id]: !state.workflow.expanded[id] },
      },
    })),
  initRealtime: () => {
    if (typeof window === "undefined") return;
    const status = get().realtime.status;
    if (status === "connected") return;
    set((state) => ({ realtime: { ...state.realtime, status: "connecting" } }));
    const channel = ensureRealtimeChannel();
    if (!channel) {
      set({ realtime: { status: "error" } });
      return;
    }
    bindRealtimeChannel(set as SetStateFn);
    set((state) => ({ realtime: { ...state.realtime, status: "connected", lastEventAt: state.realtime.lastEventAt } }));
  },
  emitWorkflowUpdate: (payload) => {
    const stampedPayload = { ...payload, lastUpdatedIso: new Date().toISOString() };
    set((state) => {
      const result = patchWorkflowState(state.workflow, stampedPayload);
      if (!result.updated) {
        return state;
      }
      const entry = buildHistoryEntry(stampedPayload, result.previous, result.updated);
      return {
        workflow: result.workflow,
        workflowHistory: addHistoryEntry(state.workflowHistory, entry),
        realtime: { status: "connected", lastEventAt: entry.timestamp },
        announcements: appendAnnouncement(state.announcements, entry.summary),
      };
    });
    const channel = ensureRealtimeChannel();
    channel?.postMessage({ type: "workflow:update", payload: stampedPayload, sourceId: runtimeId });
  },
  pushAnnouncement: (message) =>
    set((state) => ({
      announcements: appendAnnouncement(state.announcements, message),
    })),
  clearAnnouncement: (id) =>
    set((state) => ({
      announcements: state.announcements.filter((announcement) => announcement.id !== id),
    })),
}));
