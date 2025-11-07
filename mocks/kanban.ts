import {
  HumanResource,
  JobSheet,
  Machine,
  PaintJob,
  ProductionRisk,
  Reminder,
  ResourceAlert,
  ResourceLoadEntry,
  Subcontract,
  SummaryStat,
  WorkflowAlert,
  WorkflowHistoryEntry,
  WorkflowNode,
} from "@/types/issues";

const MS_IN_DAY = 1000 * 60 * 60 * 24;

const durationInDays = (start: string, end: string) => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diff = Math.max(endDate.getTime() - startDate.getTime(), 0);
  return Math.max(1, Math.round(diff / MS_IN_DAY) + 1);
};

const createWorkflowNode = (node: Omit<WorkflowNode, "durationDays">): WorkflowNode => ({
  ...node,
  durationDays: durationInDays(node.startDate, node.endDate),
  assignments: node.assignments ?? [],
});

export const kanbanProductionStats: SummaryStat[] = [
  { id: "completion", title: "Completion", value: "62%", helper: "+4% vs last sprint" },
  { id: "active-orders", title: "Active orders", value: "5", helper: "3 priority items" },
  { id: "handoffs", title: "Handoffs this week", value: "4", helper: "QA + packing" },
];

export const kanbanProductionRisks: ProductionRisk[] = [
  { id: "risk-die-cut", title: "Die-cut delay", owner: "Floor lead", due: "02.27", severity: "high" },
  { id: "risk-ink", title: "Ink shortage (Pantone 238)", owner: "Ink room", due: "02.26", severity: "medium" },
];

export const kanbanJobSheets: JobSheet[] = [
  { id: "JS25-01", code: "JS25-01", name: "Cutting MO25-01", start: "02.20", end: "02.20", status: "completed" },
  { id: "JS25-05", code: "JS25-05", name: "Cutting MO25-05", start: "02.27", end: "02.27", status: "in-progress" },
  { id: "JS25-08", code: "JS25-08", name: "Cutting MO25-08", start: "02.25", end: "02.25", status: "delayed" },
];

export const kanbanPaintQueue: PaintJob[] = [
  { id: "paint-premium-lid", name: "Premium lid", schedule: "02.25", colors: ["Pantone 238", "Pantone 485"], status: "mixing" },
  { id: "paint-label-premium", name: "Label premium", schedule: "02.26", colors: ["Pantone 238"], status: "scheduled" },
  { id: "paint-sleeve-coffee", name: "Sleeve coffee", schedule: "Done", colors: ["Pantone 238"], status: "ready" },
];

export const kanbanSubcontracts: Subcontract[] = [
  { id: "SC25-01", code: "SC25-01", name: "Gold foil", vendor: "Golden Finish", period: "02.25 ~ 02.27", status: "planned" },
  { id: "SC25-02", code: "SC25-02", name: "Laser cutting", vendor: "Laser XYZ", period: "02.26 ~ 02.28", status: "in-progress" },
  { id: "SC25-03", code: "SC25-03", name: "Bag sewing", vendor: "Minh Long", period: "02.24 ~ 03.01", status: "delayed" },
];

export const kanbanMachines: Machine[] = [
  { id: "machine-offset-roland-700", name: "Offset Roland 700", operation: "Print", utilization: 0.85, status: "busy" },
  { id: "machine-die-cutter-be-01", name: "Die Cutter BE-01", operation: "Die cut", utilization: 0.3, status: "available" },
  { id: "machine-packing-line-pl-02", name: "Packing Line PL-02", operation: "Pack", utilization: 0.92, status: "busy" },
];

export const kanbanResourceAlerts: ResourceAlert[] = [
  {
    id: "alert-ink",
    title: "Pantone 238 shortage",
    detail: "Three ink jobs on hold, check ETA.",
    severity: "critical",
    relatedNodeId: "wf-task-calibration",
    dueDate: "2025-02-26",
  },
  {
    id: "alert-laser",
    title: "Laser outsource delay",
    detail: "SC25-03 pushed by one day.",
    severity: "warning",
    relatedNodeId: "wf-task-diecut",
  },
  {
    id: "alert-qa",
    title: "QA handoff window",
    detail: "MO25-001 / MO25-004 on Feb 27-28.",
    severity: "info",
    relatedNodeId: "wf-task-packaging",
  },
];

export const kanbanWorkflowNodes: WorkflowNode[] = [
  createWorkflowNode({
    id: "wf-initiative-holiday",
    parentId: null,
    kind: "initiative",
    title: "Holiday packaging sprint",
    owner: "PM team",
    startDate: "2025-02-17",
    endDate: "2025-03-14",
    progress: 0.55,
    status: "in-progress",
    dependencies: [],
    resourceLoad: 0.4,
    isCritical: true,
    assignments: [
      { id: "assign-init-1", assigneeId: "res-eunji", assigneeName: "Eunji Park", role: "PM", allocation: 0.5 },
      { id: "assign-init-2", assigneeId: "res-huy", assigneeName: "Huy Tran", role: "Coordinator", allocation: 0.3 },
    ],
  }),
  createWorkflowNode({
    id: "wf-phase-prepress",
    parentId: "wf-initiative-holiday",
    kind: "phase",
    title: "Pre-press readiness",
    owner: "Design ops",
    startDate: "2025-02-17",
    endDate: "2025-02-24",
    progress: 0.7,
    status: "in-progress",
    dependencies: [],
    resourceLoad: 0.6,
    assignments: [
      { id: "assign-prepress-1", assigneeId: "res-thien", assigneeName: "Thien Nguyen", role: "Design Lead", allocation: 0.7 },
    ],
  }),
  createWorkflowNode({
    id: "wf-task-dielines",
    parentId: "wf-phase-prepress",
    kind: "task",
    title: "Consolidate dielines",
    owner: "Thien",
    startDate: "2025-02-17",
    endDate: "2025-02-19",
    progress: 1,
    status: "done",
    dependencies: [],
    resourceLoad: 0.5,
    assignments: [
      { id: "assign-dielines-1", assigneeId: "res-thien", assigneeName: "Thien Nguyen", role: "Designer", allocation: 0.5 },
    ],
  }),
  createWorkflowNode({
    id: "wf-task-calibration",
    parentId: "wf-phase-prepress",
    kind: "task",
    title: "Press calibration",
    owner: "Lan",
    startDate: "2025-02-20",
    endDate: "2025-02-23",
    progress: 0.45,
    status: "at-risk",
    dependencies: ["wf-task-dielines"],
    resourceLoad: 0.8,
    isCritical: true,
    assignments: [
      { id: "assign-calib-1", assigneeId: "res-lan", assigneeName: "Lan Pham", role: "Process Eng", allocation: 0.8 },
      { id: "assign-calib-2", assigneeId: "res-ops", assigneeName: "Ops Crew", role: "Support", allocation: 0.3 },
    ],
    forecastEndDate: "2025-02-24",
    riskNote: "Ink room delivery delay",
  }),
  createWorkflowNode({
    id: "wf-phase-production",
    parentId: "wf-initiative-holiday",
    kind: "phase",
    title: "Production run",
    owner: "Floor lead",
    startDate: "2025-02-24",
    endDate: "2025-03-10",
    progress: 0.35,
    status: "planned",
    dependencies: ["wf-phase-prepress"],
    resourceLoad: 0.7,
    assignments: [
      { id: "assign-prod-1", assigneeId: "res-floor", assigneeName: "Floor Lead", role: "Supervisor", allocation: 0.6 },
      { id: "assign-prod-2", assigneeId: "res-ops", assigneeName: "Ops Crew", role: "Crew", allocation: 0.8 },
    ],
  }),
  createWorkflowNode({
    id: "wf-task-print",
    parentId: "wf-phase-production",
    kind: "task",
    title: "Four-color print",
    owner: "Press team",
    startDate: "2025-02-24",
    endDate: "2025-02-28",
    progress: 0.2,
    status: "planned",
    dependencies: ["wf-task-calibration"],
    resourceLoad: 0.9,
    isCritical: true,
    assignments: [{ id: "assign-print-1", assigneeId: "res-press", assigneeName: "Press Team", role: "Print", allocation: 0.9 }],
  }),
  createWorkflowNode({
    id: "wf-task-diecut",
    parentId: "wf-phase-production",
    kind: "task",
    title: "Die-cut + stripping",
    owner: "Ops crew",
    startDate: "2025-03-01",
    endDate: "2025-03-05",
    progress: 0,
    status: "planned",
    dependencies: ["wf-task-print"],
    resourceLoad: 0.7,
    assignments: [{ id: "assign-diecut-1", assigneeId: "res-ops", assigneeName: "Ops Crew", role: "Die-cut", allocation: 0.7 }],
  }),
  createWorkflowNode({
    id: "wf-task-packaging",
    parentId: "wf-phase-production",
    kind: "task",
    title: "Pilot packaging run",
    owner: "QA pod",
    startDate: "2025-03-03",
    endDate: "2025-03-08",
    progress: 0.15,
    status: "blocked",
    dependencies: ["wf-task-diecut"],
    resourceLoad: 0.5,
    assignments: [{ id: "assign-packaging-1", assigneeId: "res-qa", assigneeName: "QA Pod", role: "QA", allocation: 0.5 }],
    riskNote: "Waiting on die-cut QA",
  }),
  createWorkflowNode({
    id: "wf-milestone-pilot",
    parentId: "wf-initiative-holiday",
    kind: "milestone",
    title: "Pilot shipment ready",
    owner: "PM team",
    startDate: "2025-03-05",
    endDate: "2025-03-05",
    progress: 0,
    status: "planned",
    dependencies: ["wf-task-packaging"],
    resourceLoad: 0.2,
    milestone: true,
    assignments: [{ id: "assign-milestone", assigneeId: "res-eunji", assigneeName: "Eunji Park", role: "PM", allocation: 0.2 }],
  }),
];

export const kanbanHumanResources: HumanResource[] = [
  { id: "res-eunji", name: "Eunji Park", role: "PM", capacityPerDay: 6, color: "#8B5CF6" },
  { id: "res-huy", name: "Huy Tran", role: "Coordinator", capacityPerDay: 7, color: "#EC4899" },
  { id: "res-thien", name: "Thien Nguyen", role: "Design Lead", capacityPerDay: 7, color: "#F97316" },
  { id: "res-lan", name: "Lan Pham", role: "Process Eng", capacityPerDay: 8, color: "#10B981" },
  { id: "res-ops", name: "Ops Crew", role: "Operations", capacityPerDay: 10, color: "#3B82F6" },
  { id: "res-floor", name: "Floor Lead", role: "Supervisor", capacityPerDay: 8, color: "#F59E0B" },
  { id: "res-press", name: "Press Team", role: "Print", capacityPerDay: 9, color: "#0EA5E9" },
  { id: "res-qa", name: "QA Pod", role: "QA", capacityPerDay: 6, color: "#84CC16" },
];

export const kanbanResourceLoads: ResourceLoadEntry[] = [
  { assigneeId: "res-thien", date: "2025-02-20", workload: 7 },
  { assigneeId: "res-thien", date: "2025-02-21", workload: 8 },
  { assigneeId: "res-lan", date: "2025-02-22", workload: 9 },
  { assigneeId: "res-ops", date: "2025-03-02", workload: 11 },
  { assigneeId: "res-ops", date: "2025-03-03", workload: 10 },
  { assigneeId: "res-qa", date: "2025-03-06", workload: 7 },
];

export const kanbanWorkflowAlerts: WorkflowAlert[] = [
  {
    id: "wf-alert-1",
    type: "overlap",
    nodeId: "wf-task-calibration",
    assigneeId: "res-lan",
    severity: "warning",
    description: "Lan Pham is overallocated (120%) on Feb 22.",
    timestamp: "2025-02-21T09:00:00Z",
  },
  {
    id: "wf-alert-2",
    type: "deadline",
    nodeId: "wf-task-packaging",
    severity: "critical",
    description: "Packaging run likely to slip by three days.",
    timestamp: "2025-03-02T12:00:00Z",
  },
];

export const kanbanWorkflowHistory: WorkflowHistoryEntry[] = [
  {
    id: "hist-1",
    nodeId: "wf-task-calibration",
    author: "Lan Pham",
    timestamp: "2025-02-20T08:00:00Z",
    summary: "Calibration shifted by +1 day due to ink delay.",
    changes: [
      { field: "endDate", from: "2025-02-22", to: "2025-02-23" },
      { field: "status", from: "planned", to: "at-risk" },
    ],
  },
  {
    id: "hist-2",
    nodeId: "wf-task-print",
    author: "Press team",
    timestamp: "2025-02-24T12:00:00Z",
    summary: "Print kickoff confirmed.",
    changes: [{ field: "status", from: "planned", to: "in-progress" }],
  },
  {
    id: "hist-3",
    nodeId: "wf-task-packaging",
    author: "QA pod",
    timestamp: "2025-03-01T09:30:00Z",
    summary: "Blocked awaiting die-cut QA samples.",
    changes: [{ field: "status", from: "planned", to: "blocked" }],
  },
];

export const kanbanReminders: Reminder[] = [
  {
    id: "rem-1",
    nodeId: "wf-milestone-pilot",
    dueDate: "2025-03-05",
    message: "Pilot shipment dry-run",
    status: "pending",
  },
  {
    id: "rem-2",
    nodeId: "wf-task-packaging",
    dueDate: "2025-03-04",
    message: "QA packaging review",
    status: "sent",
  },
];
