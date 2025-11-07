"use client";

import { useKanban } from "@/store/issues";
import type {
  EntityState,
  JobSheet,
  Machine,
  PaintJob,
  ProductionRisk, RealtimeStatus, ResourceAlert,
  ResourceLoadEntry,
  Subcontract,
  SummaryStat,
  TimelineFilter,
  VendorFilter,
  WorkflowNode,
  WorkflowStatus
} from "@/types/issues";
import { AlertTriangle, CheckCircle, ChevronDown, ChevronRight, Clock, Filter, Palette, Plus, Settings, X } from "lucide-react";
import type { FormEvent } from "react";
import { Fragment, useEffect, useMemo, useState } from "react";

const JOB_PILL: Record<JobSheet["status"], string> = {
  planned: "bg-slate-200 text-slate-700",
  "in-progress": "bg-blue-100 text-blue-700",
  completed: "bg-emerald-100 text-emerald-700",
  delayed: "bg-rose-100 text-rose-700",
};

const PAINT_PILL: Record<PaintJob["status"], string> = {
  scheduled: "bg-slate-200 text-slate-700",
  mixing: "bg-sky-100 text-sky-700",
  ready: "bg-emerald-100 text-emerald-700",
};

const SUBCONTRACT_PILL: Record<Subcontract["status"], string> = {
  planned: "bg-slate-200 text-slate-700",
  "in-progress": "bg-blue-100 text-blue-700",
  delayed: "bg-rose-100 text-rose-700",
};

const MACHINE_PILL: Record<Machine["status"], string> = {
  available: "bg-emerald-100 text-emerald-700",
  busy: "bg-brand/10 text-brand",
};

const RISK_PILL: Record<ProductionRisk["severity"], string> = {
  high: "bg-rose-100 text-rose-700",
  medium: "bg-amber-100 text-amber-700",
  watch: "bg-slate-200 text-slate-700",
};

const WORKFLOW_STATUS_PILL: Record<WorkflowStatus, string> = {
  planned: "bg-slate-200 text-slate-700",
  "in-progress": "bg-brand/10 text-brand",
  "at-risk": "bg-amber-100 text-amber-700",
  blocked: "bg-rose-100 text-rose-700",
  done: "bg-emerald-100 text-emerald-700",
};

const WORKFLOW_BAR_COLOR: Record<WorkflowStatus, string> = {
  planned: "bg-slate-300",
  "in-progress": "bg-brand",
  "at-risk": "bg-amber-500",
  blocked: "bg-rose-500",
  done: "bg-emerald-500",
};

const TIMELINE_FILTER_LABELS: Record<TimelineFilter, string> = {
  all: "All statuses",
  planned: "Planned",
  "in-progress": "In progress",
  "at-risk": "At risk",
  blocked: "Blocked",
  done: "Done",
};

const VENDOR_FILTER_LABELS: Record<VendorFilter, string> = {
  all: "All vendors",
  planned: "Planned",
  "in-progress": "In progress",
  delayed: "Delayed",
};

const REALTIME_STATUS_DOT: Record<RealtimeStatus, string> = {
  idle: "bg-slate-300",
  connecting: "bg-amber-400 animate-pulse",
  connected: "bg-emerald-500",
  error: "bg-rose-500",
};

const ROW_HEIGHT = 52;
const DAY_CELL_WIDTH = 64;
const WORKFLOW_STATUSES: WorkflowStatus[] = ["planned", "in-progress", "at-risk", "blocked", "done"];

type WorkflowSnapshot = {
  nodes: EntityState<WorkflowNode>;
  rootIds: string[];
  expanded: Record<string, boolean>;
};

type WorkflowRow = WorkflowNode & {
  depth: number;
  hasChildren: boolean;
};

type TimelineRange = {
  start: number;
  end: number;
  totalDays: number;
};

const DAY_IN_MS = 1000 * 60 * 60 * 24;
const SHORT_DATE = new Intl.DateTimeFormat("en-US", { month: "short", day: "2-digit" });
const DATE_TIME = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

export default function KanbanView() {
  const { tabs, activeTab, setActiveTab, subcontracts, paintQueue, machines, initRealtime, realtime, announcements } = useKanban((state) => ({
    tabs: state.tabs,
    activeTab: state.activeTab,
    setActiveTab: state.setActiveTab,
    subcontracts: state.subcontracts,
    paintQueue: state.paintQueue,
    machines: state.machines,
    initRealtime: state.initRealtime,
    realtime: state.realtime,
    announcements: state.announcements,
  }));

  useEffect(() => {
    initRealtime();
  }, [initRealtime]);

  const headerStats = useMemo(() => {
    const delayedOrders = entityToList(subcontracts).filter((item) => item.status === "delayed").length;
    const readyBatches = entityToList(paintQueue).filter((job) => job.status === "ready").length;
    const busyMachines = entityToList(machines).filter((machine) => machine.status === "busy").length;

    return [
      { label: "Delayed outsource", value: `${delayedOrders}`, tone: "warning" as const },
      { label: "Ready ink batches", value: `${readyBatches}`, tone: "info" as const },
      { label: "Busy machines", value: `${busyMachines}`, tone: "danger" as const },
    ];
  }, [machines, paintQueue, subcontracts]);

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-background text-foreground">
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {announcements.slice(-1).map((item) => (
          <span key={item.id}>{item.message}</span>
        ))}
      </div>
      <header className="border-b border-border bg-panel px-4 py-6 sm:px-8">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Production Planning</h1>
            <p className="mt-1 text-sm text-muted">A lightweight workspace that mirrors the reference gantt dashboard.</p>
          </div>
          <div className="flex flex-col items-start gap-3 text-xs text-muted sm:items-end">
            <dl className="grid gap-3 text-xs sm:grid-cols-3 lg:grid-cols-6">
              {headerStats.map((stat) => (
                <SummaryChip key={stat.label} {...stat} />
              ))}
            </dl>
            <div className="flex items-center gap-2" role="status" aria-live="polite">
              <span className={["h-2 w-2 rounded-full", REALTIME_STATUS_DOT[realtime.status]].join(" ")} />
              <span>
                {realtimeStatusLabel(realtime.status)}
                {realtime.lastEventAt ? ` · ${formatDateTime(realtime.lastEventAt)}` : ""}
              </span>
            </div>
          </div>
        </div>
      </header>

      <nav className="border-b border-border bg-panel/80 py-3 backdrop-blur">
        <div className="mx-auto w-full max-w-5xl overflow-x-auto px-4 sm:px-6">
          <div className="grid min-w-[340px] gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={[
                    "flex items-center justify-between rounded-xl border px-4 py-3 text-left transition",
                    isActive
                      ? "border-brand/60 bg-brand/10 text-brand shadow-sm"
                      : "border-border bg-background/70 text-muted hover:border-brand/40 hover:text-foreground",
                  ].join(" ")}
                >
                  <div>
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <Icon size={16} />
                      {tab.label}
                    </div>
                    <p className="mt-1 text-xs text-muted">{tab.description}</p>
                  </div>
                  <div className="pl-3 text-xs text-muted">&gt;</div>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      <main className="flex-1 overflow-auto bg-background px-4 py-6 sm:px-6">
        <div className="mx-auto flex max-w-5xl flex-col gap-6">
          {activeTab === "production" && <ProductionView />}
          {activeTab === "jobSheet" && <JobSheetView />}
          {activeTab === "painting" && <PaintingView />}
          {activeTab === "subcontract" && <SubcontractView />}
          {activeTab === "resource" && <ResourceView />}
        </div>
      </main>

      <FilterPanel />
      <JobSheetDialog />
    </div>
  );
}

function SummaryChip({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "warning" | "info" | "danger";
}) {
  const classes: Record<typeof tone, string> = {
    warning: "border-amber-400 bg-amber-100/70 text-amber-800",
    info: "border-sky-400 bg-sky-100/70 text-sky-800",
    danger: "border-rose-400 bg-rose-100/70 text-rose-800",
  };

  return (
    <div className={["rounded-lg border px-3 py-2", classes[tone]].join(" ")}>
      <dt className="font-medium">{label}</dt>
      <dd className="mt-1 text-sm font-semibold">{value}</dd>
    </div>
  );
}


function ProductionView() {
  const { productionStats, workflow, filters, openFilterPanel, toggleWorkflowNode, humanResources } = useKanban((state) => ({
    productionStats: state.productionStats,
    workflow: state.workflow,
    filters: state.filters,
    openFilterPanel: state.openFilterPanel,
    toggleWorkflowNode: state.toggleWorkflowNode,
    humanResources: state.humanResources,
  }));

  const humans = useMemo(() => entityToList(humanResources), [humanResources]);
  const humanColorMap = useMemo(
    () =>
      humans.reduce<Record<string, { name: string; color: string }>>((acc, person) => {
        acc[person.id] = { name: person.name, color: person.color };
        return acc;
      }, {}),
    [humans],
  );
  const workflowRows = useMemo(() => buildWorkflowRows(workflow, filters.timeline), [workflow, filters.timeline]);
  const timelineRange = useMemo(() => computeWorkflowRange(workflow), [workflow]);
  const timelineDays = useMemo(() => (timelineRange ? buildTimelineDays(timelineRange) : []), [timelineRange]);
  const timelineWidth = Math.max(timelineDays.length * DAY_CELL_WIDTH, 640);
  const [detailNodeId, setDetailNodeId] = useState<string | null>(null);
  const toggleDetail = (id: string) => setDetailNodeId((prev) => (prev === id ? null : id));

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {productionStats.map((stat) => (
          <article key={stat.id} className="rounded-2xl border border-border bg-panel/90 p-4 shadow-sm">
            <p className="text-xs uppercase tracking-[0.12em] text-muted">{stat.title}</p>
            <p className="mt-2 text-2xl font-semibold">{stat.value}</p>
            <p className="mt-1 text-xs text-muted">{stat.helper}</p>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-border bg-panel/95 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold">Production orders</h2>
            <p className="text-xs text-muted">Left shows the WBS list, right renders the aligned gantt bars.</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted">
            <span>{workflowRows.length} rows</span>
            <button
              type="button"
              onClick={() => openFilterPanel("timeline")}
              className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-1 text-xs text-muted hover:bg-subtle/60"
            >
              <Filter size={12} />
              Filters
            </button>
          </div>
        </div>

        <div className="grid gap-6 px-4 py-4 lg:grid-cols-[minmax(280px,340px)_1fr]">
          <div className="overflow-auto rounded-xl border border-border/60">
            <table className="min-w-full text-sm">
              <thead className="bg-background/80 text-xs uppercase tracking-[0.08em] text-muted">
                <tr>
                  <th className="px-4 py-3 text-left">Task</th>
                  <th className="px-4 py-3 text-left">Owner</th>
                  <th className="px-4 py-3 text-left">Load</th>
                  <th className="px-4 py-3 text-left">Progress</th>
                  <th className="px-4 py-3 text-left">Window</th>
                  <th className="px-4 py-3 text-left">Info</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/70 text-xs">
                {workflowRows.map((node) => {
                  const indent = node.depth * 16;
                  const isParent = node.hasChildren;
                  const isExpanded = workflow.expanded[node.id];
                  const loadPercent = Math.round(node.resourceLoad * 100);
                  const progressPercent = Math.round(node.progress * 100);
                  return (
                    <Fragment key={node.id}>
                      <tr style={{ height: ROW_HEIGHT }}>
                        <td className="px-4">
                          <div className="flex items-center gap-2" style={{ paddingLeft: indent }}>
                            {isParent ? (
                              <button
                                type="button"
                              onClick={() => toggleWorkflowNode(node.id)}
                              className="rounded-full border border-border p-1 text-muted hover:text-foreground"
                              aria-label={isExpanded ? "Collapse node" : "Expand node"}
                            >
                              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </button>
                          ) : (
                            <span className="h-1.5 w-1.5 rounded-full bg-border" />
                          )}
                          <div>
                            <p className="text-sm font-semibold text-foreground">{node.title}</p>
                            <p className="text-[11px] text-muted">{node.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 text-muted">{node.owner}</td>
                      <td className="px-4">
                        <span className="font-semibold text-foreground">{loadPercent}%</span>
                      </td>
                      <td className="px-4">
                        <span className="inline-flex items-center gap-2 text-muted">
                          <span>{progressPercent}%</span>
                          <span className="h-1.5 w-16 rounded-full bg-border" aria-hidden>
                            <span className="block h-full rounded-full bg-brand" style={{ width: `${Math.min(100, progressPercent)}%` }} />
                          </span>
                        </span>
                      </td>
                      <td className="px-4 text-muted">
                        {formatShortDate(node.startDate)} – {formatShortDate(node.endDate)}
                      </td>
                      <td className="px-4">
                        <button
                          type="button"
                          onClick={() => toggleDetail(node.id)}
                          className="rounded-md border border-border px-2 py-1 text-xs text-muted hover:text-foreground"
                        >
                          {detailNodeId === node.id ? "Hide info" : "Details"}
                        </button>
                      </td>
                      </tr>
                      {detailNodeId === node.id && (
                        <tr>
                          <td colSpan={6} className="bg-background/80 px-6 py-4">
                            <div className="space-y-3 text-[11px] text-muted">
                              <div className="flex flex-wrap items-center gap-2 text-xs">
                                <span className="font-semibold text-foreground">{node.title}</span>
                                <StatusBadge label={node.status} />
                                <span>
                                  {node.durationDays}d · {Math.round(node.progress * 100)}%
                                </span>
                              </div>
                              {node.assignments.length > 0 && (
                                <div className="space-y-2">
                                  <p className="text-[10px] uppercase tracking-[0.2em] text-muted">Assignments</p>
                                  <div className="flex flex-wrap gap-2">
                                    {node.assignments.map((assignment) => {
                                      const meta = humanColorMap[assignment.assigneeId];
                                      return (
                                        <span
                                          key={assignment.id}
                                          className="inline-flex items-center gap-2 rounded-full px-2 py-1 text-[11px] font-semibold text-white"
                                          style={{ backgroundColor: meta?.color || "#4B5563" }}
                                        >
                                          {meta?.name || assignment.assigneeName}
                                          <span className="text-[10px] font-normal">
                                            {assignment.role} · {Math.round(assignment.allocation * 100)}%
                                          </span>
                                        </span>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                              {node.dependencies.length > 0 && (
                                <div>
                                  <p className="text-[10px] uppercase tracking-[0.2em] text-muted">Dependencies</p>
                                  <div className="mt-1 flex flex-wrap gap-2">
                                    {node.dependencies.map((dep) => (
                                      <span key={dep} className="rounded border border-border/70 px-2 py-1 text-[11px]">
                                        {workflow.nodes.byId[dep]?.title || dep}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {node.riskNote && <p className="text-rose-500">Risk: {node.riskNote}</p>}
                              {node.forecastEndDate && <p>Forecast end → {formatShortDate(node.forecastEndDate)}</p>}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
                {!workflowRows.length && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-muted">
                      No rows match the current filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="overflow-auto rounded-xl border border-border/60 bg-background/50">
            {timelineRange ? (
              <div className="min-w-[640px]">
                <div className="sticky top-0 z-10 flex text-[11px] font-semibold text-muted">
                  {timelineDays.map((day) => (
                    <div key={day.ts} className="border-r border-border/40 px-2 py-2 text-center" style={{ width: DAY_CELL_WIDTH }}>
                      {day.label}
                    </div>
                  ))}
                </div>
                <div className="relative px-2 pb-4">
                  <div className="relative border-l border-border/60" style={{ height: ROW_HEIGHT * workflowRows.length, width: timelineWidth }}>
                    {timelineDays.map((day, index) => (
                      <div key={`${day.ts}-grid`} className="absolute top-0 bottom-0 border-r border-border/30" style={{ left: index * DAY_CELL_WIDTH }} />
                    ))}
                    {workflowRows.map((node, index) => {
                      const position = getBarPosition(timelineRange, node);
                      const top = index * ROW_HEIGHT + ROW_HEIGHT / 3;
                      const left = (position.offsetPercent / 100) * timelineWidth;
                      const barWidth = (position.widthPercent / 100) * timelineWidth;
                      const progressPercent = Math.round(node.progress * 100);
                      if (node.milestone) {
                        return (
                          <div key={`${node.id}-milestone`} className="absolute" style={{ top, left: left - 6 }}>
                            <div className="h-3 w-3 rotate-45 rounded-sm bg-brand shadow" />
                          </div>
                        );
                      }
                      return (
                        <div
                          key={node.id}
                          className={`absolute flex items-center justify-center rounded-full text-[11px] font-semibold text-white shadow-sm ${WORKFLOW_BAR_COLOR[node.status]}`}
                          style={{
                            top,
                            left,
                            width: Math.max(barWidth, 30),
                            height: 18,
                          }}
                        >
                          {progressPercent}%
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <p className="px-4 py-6 text-center text-xs text-muted">No timeline data available.</p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
function JobSheetView() {
  const { jobSheets, openJobSheetDialog } = useKanban((state) => ({
    jobSheets: state.jobSheets,
    openJobSheetDialog: state.openJobSheetDialog,
  }));
  const sheets = useMemo(() => entityToList(jobSheets), [jobSheets]);

  return (
    <section className="rounded-2xl border border-border bg-panel/95 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 px-4 py-3">
        <h2 className="text-sm font-semibold">Job sheet list</h2>
        <button
          type="button"
          onClick={openJobSheetDialog}
          className="inline-flex items-center gap-2 rounded-md bg-brand px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-brand/90"
        >
          <Plus size={14} />
          New sheet
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full table-auto text-sm">
          <thead className="border-b border-border/70 bg-background/70 text-xs uppercase tracking-[0.12em] text-muted">
            <tr>
              <th className="px-4 py-3 text-left">Code</th>
              <th className="px-4 py-3 text-left">Work</th>
              <th className="px-4 py-3 text-left">Start</th>
              <th className="px-4 py-3 text-left">End</th>
              <th className="px-4 py-3 text-left">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/70">
            {sheets.map((sheet) => (
              <tr key={sheet.id} className="bg-background/90">
                <td className="px-4 py-3 text-xs font-semibold text-muted">{sheet.code}</td>
                <td className="px-4 py-3 text-sm font-medium text-foreground">{sheet.name}</td>
                <td className="px-4 py-3 text-xs text-muted">{sheet.start}</td>
                <td className="px-4 py-3 text-xs text-muted">{sheet.end}</td>
                <td className="px-4 py-3">
                  <span className={["inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold", JOB_PILL[sheet.status]].join(" ")}>
                    {statusLabel(sheet.status)}
                  </span>
                </td>
              </tr>
            ))}
            {!sheets.length && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-xs text-muted">
                  No job sheets yet. Add one to kick off planning.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function PaintingView() {
  const { paintQueue } = useKanban((state) => ({
    paintQueue: state.paintQueue,
  }));
  const queue = useMemo(() => entityToList(paintQueue), [paintQueue]);
  const stats = useMemo(
    () => ({
      mixing: queue.filter((job) => job.status === "mixing").length,
      ready: queue.filter((job) => job.status === "ready").length,
    }),
    [queue],
  );

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2">
        <InfoCard title="Mixing" value={`${stats.mixing}`} helper="In progress" />
        <InfoCard title="Ready" value={`${stats.ready}`} helper="Can feed presses" />
      </section>

      <section className="rounded-2xl border border-border bg-panel/95 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Ink queue</h2>
          <Palette size={14} className="text-muted" />
        </div>
        <div className="mt-4 space-y-3">
          {queue.map((job) => (
            <div key={job.id} className="rounded-xl border border-border/60 bg-background/60 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm font-semibold text-foreground">
                <span>{job.name}</span>
                <span className={["rounded-full px-2 py-1 text-[11px] font-semibold", PAINT_PILL[job.status]].join(" ")}>
                  {paintLabel(job.status)}
                </span>
              </div>
              <p className="mt-2 text-xs text-muted">Schedule: {job.schedule}</p>
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                {job.colors.map((color) => (
                  <span key={color} className="rounded-full bg-brand/10 px-2 py-1 text-[11px] font-medium text-brand">
                    {color}
                  </span>
                ))}
              </div>
            </div>
          ))}
          {!queue.length && <p className="text-center text-xs text-muted">No ink jobs queued.</p>}
        </div>
      </section>
    </div>
  );
}

function SubcontractView() {
  const { subcontracts, filters, openFilterPanel } = useKanban((state) => ({
    subcontracts: state.subcontracts,
    filters: state.filters,
    openFilterPanel: state.openFilterPanel,
  }));
  const vendorItems = useMemo(() => {
    const items = entityToList(subcontracts);
    if (filters.vendor === "all") return items;
    return items.filter((item) => item.status === filters.vendor);
  }, [filters.vendor, subcontracts]);

  return (
    <section className="rounded-2xl border border-border bg-panel/95 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 px-4 py-3">
        <h2 className="text-sm font-semibold">Vendor timeline</h2>
        <button
          type="button"
          onClick={() => openFilterPanel("subcontract")}
          className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-1 text-xs text-muted hover:bg-subtle/60"
        >
          <Filter size={12} />
          Filters
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full table-auto text-sm">
          <thead className="border-b border-border/70 bg-background/70 text-xs uppercase tracking-[0.12em] text-muted">
            <tr>
              <th className="px-4 py-3 text-left">Code</th>
              <th className="px-4 py-3 text-left">Work</th>
              <th className="px-4 py-3 text-left">Vendor</th>
              <th className="px-4 py-3 text-left">Period</th>
              <th className="px-4 py-3 text-left">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/70">
            {vendorItems.map((item) => (
              <tr key={item.id} className="bg-background/90">
                <td className="px-4 py-3 text-xs font-semibold text-muted">{item.code}</td>
                <td className="px-4 py-3 text-sm font-medium text-foreground">{item.name}</td>
                <td className="px-4 py-3 text-xs text-muted">{item.vendor}</td>
                <td className="px-4 py-3 text-xs text-muted">{item.period}</td>
                <td className="px-4 py-3">
                  <span className={["inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold", SUBCONTRACT_PILL[item.status]].join(" ")}>
                    {subcontractLabel(item.status)}
                  </span>
                </td>
              </tr>
            ))}
            {!vendorItems.length && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-xs text-muted">
                  No subcontract orders match the selected filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ResourceView() {
  const { machines, resourceAlerts, humanResources, resourceLoads } = useKanban((state) => ({
    machines: state.machines,
    resourceAlerts: state.resourceAlerts,
    humanResources: state.humanResources,
    resourceLoads: state.resourceLoads,
  }));
  const machineList = useMemo(() => entityToList(machines), [machines]);
  const alerts = useMemo(() => entityToList(resourceAlerts), [resourceAlerts]);
  const humans = useMemo(() => entityToList(humanResources), [humanResources]);
  const loadMap = useMemo(() => groupLoadByAssignee(resourceLoads), [resourceLoads]);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        {machineList.map((machine) => (
          <div key={machine.id} className="rounded-2xl border border-border bg-panel/95 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">{machine.name}</p>
                <p className="text-xs text-muted">{machine.operation}</p>
              </div>
              <span className={["rounded-full px-2.5 py-1 text-[11px] font-semibold", MACHINE_PILL[machine.status]].join(" ")}>
                {machineLabel(machine.status)}
              </span>
            </div>
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-muted">
                <span>Utilisation</span>
                <span>{Math.round(machine.utilization * 100)}%</span>
              </div>
              <div className="mt-1 h-1.5 rounded-full bg-border">
                <div className="h-full rounded-full bg-brand" style={{ width: `${Math.round(machine.utilization * 100)}%` }} />
              </div>
            </div>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-border bg-panel/95 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Team load</h2>
          <Settings size={14} className="text-muted" />
        </div>
        <div className="mt-4 space-y-3">
          {humans.map((person) => {
            const entries = loadMap[person.id] || [];
            const peak = entries.reduce((max, entry) => Math.max(max, entry.workload / person.capacityPerDay), 0);
            const peakPercent = Math.round(peak * 100);
            const overloaded = peak > 1;
            return (
              <div key={person.id} className="rounded-2xl border border-border/70 bg-background/70 p-4">
                <div className="flex items-center justify-between text-sm font-semibold">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: person.color }} />
                    {person.name}
                    <span className="text-xs text-muted">{person.role}</span>
                  </div>
                  <span className={overloaded ? "text-rose-500" : "text-muted"}>{peakPercent}% max</span>
                </div>
                <div className="mt-3 h-1.5 rounded-full bg-border">
                  <div
                    className={`h-full rounded-full ${overloaded ? "bg-rose-500" : "bg-brand"}`}
                    style={{ width: `${Math.min(100, peakPercent)}%` }}
                  />
                </div>
                {entries.length > 0 && (
                  <p className="mt-2 text-xs text-muted">
                    Next spike: {entries[0].date} · {entries[0].workload.toFixed(1)}h
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-panel/95 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Alerts</h2>
          <Settings size={14} className="text-muted" />
        </div>
        <div className="mt-4 space-y-3">
          {alerts.map((alert) => (
            <div key={alert.id} className="flex items-start gap-3 rounded-xl border border-border/60 bg-background/60 p-4 text-xs">
              {alertIcon(alert.severity)}
              <div>
                <p className="font-semibold text-foreground">{alert.title}</p>
                <p className="mt-1 text-muted">{alert.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function FilterPanel() {
  const { ui, filters, closeFilterPanel, setTimelineFilter, setVendorFilter } = useKanban((state) => ({
    ui: state.ui,
    filters: state.filters,
    closeFilterPanel: state.closeFilterPanel,
    setTimelineFilter: state.setTimelineFilter,
    setVendorFilter: state.setVendorFilter,
  }));

  if (!ui.filterPanel) return null;
  const panelType = ui.filterPanel;
  const isTimeline = panelType === "timeline";
  const options = isTimeline
    ? (["all", "planned", "in-progress", "at-risk", "blocked", "done"] as TimelineFilter[])
    : (["all", "planned", "in-progress", "delayed"] as VendorFilter[]);
  const active = isTimeline ? filters.timeline : filters.vendor;

  const handleSelect = (value: TimelineFilter | VendorFilter) => {
    if (isTimeline) {
      setTimelineFilter(value as TimelineFilter);
    } else {
      setVendorFilter(value as VendorFilter);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 px-4 py-6 sm:items-center">
      <div className="w-full max-w-md rounded-2xl border border-border bg-panel p-5 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.12em] text-muted">Filters</p>
            <h3 className="text-sm font-semibold">{isTimeline ? "Production timeline" : "Vendor timeline"}</h3>
          </div>
          <button
            type="button"
            onClick={closeFilterPanel}
            className="rounded-full border border-border p-1 text-muted hover:text-foreground"
            aria-label="Close filter panel"
          >
            <X size={14} />
          </button>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {options.map((option) => {
            const isActive = option === active;
            const label = isTimeline
              ? timelineFilterLabel(option as TimelineFilter)
              : vendorFilterLabel(option as VendorFilter);
            return (
              <button
                key={option}
                type="button"
                onClick={() => handleSelect(option)}
                className={[
                  "rounded-xl border px-3 py-2 text-sm font-medium transition",
                  isActive ? "border-brand bg-brand/10 text-brand" : "border-border text-muted hover:text-foreground",
                ].join(" ")}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function JobSheetDialog() {
  const { ui, closeJobSheetDialog, createJobSheet } = useKanban((state) => ({
    ui: state.ui,
    closeJobSheetDialog: state.closeJobSheetDialog,
    createJobSheet: state.createJobSheet,
  }));
  const open = ui.jobSheetDialogOpen;
  const [form, setForm] = useState<{ code: string; name: string; start: string; end: string; status: JobSheet["status"] }>({
    code: "",
    name: "",
    start: "",
    end: "",
    status: "planned",
  });

  useEffect(() => {
    if (open) {
      setForm({
        code: "",
        name: "",
        start: "",
        end: "",
        status: "planned",
      });
    }
  }, [open]);

  if (!open) return null;

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.name.trim()) return;
    createJobSheet({
      code: form.code,
      name: form.name,
      start: form.start,
      end: form.end,
      status: form.status,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-4 py-6 sm:items-center">
      <form onSubmit={onSubmit} className="w-full max-w-md space-y-4 rounded-2xl border border-border bg-panel p-5 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.12em] text-muted">Add sheet</p>
            <h3 className="text-sm font-semibold">Create job sheet</h3>
          </div>
          <button
            type="button"
            onClick={closeJobSheetDialog}
            className="rounded-full border border-border p-1 text-muted hover:text-foreground"
            aria-label="Close job sheet dialog"
          >
            <X size={14} />
          </button>
        </div>

        <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-muted">
          Code
          <input
            value={form.code}
            onChange={(event) => updateField("code", event.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            placeholder="JS25-10"
            required
          />
        </label>

        <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-muted">
          Work
          <input
            value={form.name}
            onChange={(event) => updateField("name", event.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            placeholder="Cutting MO25-10"
            required
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-muted">
            Start
            <input
              value={form.start}
              onChange={(event) => updateField("start", event.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              placeholder="02.27"
              required
            />
          </label>
          <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-muted">
            End
            <input
              value={form.end}
              onChange={(event) => updateField("end", event.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              placeholder="02.27"
              required
            />
          </label>
        </div>

        <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-muted">
          Status
          <select
            value={form.status}
            onChange={(event) => updateField("status", event.target.value as JobSheet["status"])}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="planned">Planned</option>
            <option value="in-progress">In progress</option>
            <option value="completed">Completed</option>
            <option value="delayed">Delayed</option>
          </select>
        </label>

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={closeJobSheetDialog}
            className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-muted hover:text-foreground"
          >
            Cancel
          </button>
          <button type="submit" className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand/90">
            Save job sheet
          </button>
        </div>
      </form>
    </div>
  );
}

function entityToList<T extends { id: string }>(entity: EntityState<T>): T[] {
  return entity.allIds.map((id) => entity.byId[id]);
}

function StatusBadge({ label }: { label: WorkflowStatus }) {
  return (
    <span className={["inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold", WORKFLOW_STATUS_PILL[label]].join(" ")}>
      {timelineFilterLabel(label)}
    </span>
  );
}

function InfoCard({ title, value, helper }: Pick<SummaryStat, "title" | "value" | "helper">) {
  return (
    <article className="rounded-2xl border border-border bg-panel/95 p-4 shadow-sm">
      <p className="text-xs uppercase tracking-[0.12em] text-muted">{title}</p>
      <p className="mt-2 text-xl font-semibold">{value}</p>
      <p className="mt-1 text-xs text-muted">{helper}</p>
    </article>
  );
}

function statusLabel(status: JobSheet["status"]) {
  switch (status) {
    case "planned":
      return "Planned";
    case "in-progress":
      return "In progress";
    case "completed":
      return "Completed";
    case "delayed":
      return "Delayed";
    default:
      return status;
  }
}

function paintLabel(status: PaintJob["status"]) {
  switch (status) {
    case "scheduled":
      return "Scheduled";
    case "mixing":
      return "Mixing";
    case "ready":
      return "Ready";
    default:
      return status;
  }
}

function subcontractLabel(status: Subcontract["status"]) {
  switch (status) {
    case "planned":
      return "Planned";
    case "in-progress":
      return "In progress";
    case "delayed":
      return "Delayed";
    default:
      return status;
  }
}

function machineLabel(status: Machine["status"]) {
  return status === "available" ? "Available" : "Busy";
}

function alertIcon(severity: ResourceAlert["severity"]) {
  if (severity === "critical") {
    return <AlertTriangle size={16} className="mt-0.5 text-rose-500" />;
  }
  if (severity === "warning") {
    return <Clock size={16} className="mt-0.5 text-amber-600" />;
  }
  return <CheckCircle size={16} className="mt-0.5 text-emerald-500" />;
}

function buildWorkflowRows(workflow: WorkflowSnapshot, filter: TimelineFilter): WorkflowRow[] {
  const nodeMap = workflow.nodes.byId;
  const childrenMap = workflow.nodes.allIds.reduce<Record<string, string[]>>((acc, id) => {
    const parentId = nodeMap[id]?.parentId;
    if (parentId) {
      acc[parentId] = acc[parentId] ? [...acc[parentId], id] : [id];
    }
    return acc;
  }, {});

  const includeNode = (node: WorkflowNode) => filter === "all" || node.status === filter;

  const traverse = (ids: string[], depth = 0): WorkflowRow[] => {
    const rows: WorkflowRow[] = [];
    ids.forEach((id) => {
      const node = nodeMap[id];
      if (!node) return;
      const children = childrenMap[id] || [];
      const childRows = workflow.expanded[id] ? traverse(children, depth + 1) : [];
      const shouldRender = includeNode(node) || childRows.length > 0;
      if (!shouldRender) {
        rows.push(...childRows);
        return;
      }
      rows.push({ ...node, depth, hasChildren: children.length > 0 });
      rows.push(...childRows);
    });
    return rows;
  };

  return traverse(workflow.rootIds);
}

function computeWorkflowRange(workflow: WorkflowSnapshot): TimelineRange | null {
  if (!workflow.nodes.allIds.length) return null;
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;

  workflow.nodes.allIds.forEach((id) => {
    const node = workflow.nodes.byId[id];
    if (!node) return;
    const start = normalizeDate(node.startDate);
    const end = normalizeDate(node.endDate);
    if (start < min) min = start;
    if (end > max) max = end;
  });

  if (!Number.isFinite(min) || !Number.isFinite(max)) return null;
  const totalDays = Math.max(1, Math.round((max - min) / DAY_IN_MS) + 1);
  return { start: min, end: max, totalDays };
}

function getBarPosition(range: TimelineRange, node: WorkflowNode) {
  const start = normalizeDate(node.startDate);
  const end = normalizeDate(node.endDate);
  const offsetDays = Math.max(0, Math.round((start - range.start) / DAY_IN_MS));
  const durationDays = Math.max(1, Math.round((end - start) / DAY_IN_MS) + 1);
  const offsetPercent = Math.min(100, (offsetDays / range.totalDays) * 100);
  const baseWidth = (durationDays / range.totalDays) * 100;
  const minWidth = node.milestone ? 1 : 3;
  const widthPercent = Math.min(100 - offsetPercent, Math.max(baseWidth, minWidth));
  return { offsetPercent, widthPercent };
}

function normalizeDate(value: string) {
  const date = new Date(value);
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
}

function formatShortDate(value: string) {
  return SHORT_DATE.format(new Date(value));
}

function formatShortDateMs(value: number) {
  return SHORT_DATE.format(new Date(value));
}

function buildTimelineDays(range: TimelineRange) {
  const days: { ts: number; label: string }[] = [];
  for (let ts = range.start; ts <= range.end; ts += DAY_IN_MS) {
    days.push({ ts, label: SHORT_DATE.format(new Date(ts)) });
  }
  return days;
}

function groupLoadByAssignee(entries: ResourceLoadEntry[]) {
  const grouped = entries.reduce<Record<string, ResourceLoadEntry[]>>((acc, entry) => {
    acc[entry.assigneeId] = acc[entry.assigneeId] ? [...acc[entry.assigneeId], entry] : [entry];
    return acc;
  }, {});
  Object.keys(grouped).forEach((id) => {
    grouped[id] = grouped[id].sort((a, b) => a.date.localeCompare(b.date));
  });
  return grouped;
}

function timelineFilterLabel(filter: TimelineFilter) {
  return TIMELINE_FILTER_LABELS[filter];
}

function vendorFilterLabel(filter: VendorFilter) {
  return VENDOR_FILTER_LABELS[filter];
}

function formatDateTime(value: string) {
  return DATE_TIME.format(new Date(value));
}

function realtimeStatusLabel(status: RealtimeStatus) {
  switch (status) {
    case "connected":
      return "Realtime synced";
    case "connecting":
      return "Connecting…";
    case "error":
      return "Realtime error";
    case "idle":
    default:
      return "Realtime idle";
  }
}
