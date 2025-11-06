"use client";

import { useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle,
  Clock,
  Factory,
  Filter,
  LayoutDashboard,
  Palette,
  Plus,
  Scissors,
  Settings,
  Users,
} from "lucide-react";

type TabKey = "production" | "jobSheet" | "painting" | "subcontract" | "resource";

type TabConfig = {
  id: TabKey;
  label: string;
  description: string;
  icon: LucideIcon;
};

const TABS: TabConfig[] = [
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

type SummaryStat = {
  title: string;
  value: string;
  helper: string;
};

const PRODUCTION_STATS: SummaryStat[] = [
  { title: "Completion", value: "62%", helper: "+4% vs last sprint" },
  { title: "Active orders", value: "5", helper: "3 priority items" },
  { title: "Handoffs this week", value: "4", helper: "QA + packing" },
];

type TimelineItem = {
  id: string;
  name: string;
  owner: string;
  start: string;
  end: string;
  progress: number;
  status: "In Progress" | "Complete" | "Risk";
};

const TIMELINE: TimelineItem[] = [
  {
    id: "JO25-001",
    name: "Gift Box Classic",
    owner: "Thien",
    start: "02.20",
    end: "03.08",
    progress: 0.6,
    status: "In Progress",
  },
  {
    id: "MO25-004",
    name: "Premium Lid",
    owner: "Lan",
    start: "02.25",
    end: "03.02",
    progress: 0.35,
    status: "Risk",
  },
  {
    id: "JO25-005",
    name: "New Year Bundle",
    owner: "Huy",
    start: "02.22",
    end: "03.10",
    progress: 0.9,
    status: "Complete",
  },
];

type ProductionRisk = {
  title: string;
  owner: string;
  due: string;
  severity: "high" | "medium" | "watch";
};

const PRODUCTION_RISKS: ProductionRisk[] = [
  { title: "Die-cut delay", owner: "Floor lead", due: "02.27", severity: "high" },
  { title: "Ink shortage (Pantone 238)", owner: "Ink room", due: "02.26", severity: "medium" },
];

type JobSheet = {
  code: string;
  name: string;
  start: string;
  end: string;
  status: "planned" | "in-progress" | "completed" | "delayed";
};

const JOB_SHEETS: JobSheet[] = [
  { code: "JS25-01", name: "Cutting MO25-01", start: "02.20", end: "02.20", status: "completed" },
  { code: "JS25-05", name: "Cutting MO25-05", start: "02.27", end: "02.27", status: "in-progress" },
  { code: "JS25-08", name: "Cutting MO25-08", start: "02.25", end: "02.25", status: "delayed" },
];

type PaintJob = {
  name: string;
  schedule: string;
  colors: string[];
  status: "scheduled" | "mixing" | "ready";
};

const PAINT_QUEUE: PaintJob[] = [
  { name: "Premium lid", schedule: "02.25", colors: ["Pantone 238", "Pantone 485"], status: "mixing" },
  { name: "Label premium", schedule: "02.26", colors: ["Pantone 238"], status: "scheduled" },
  { name: "Sleeve coffee", schedule: "Done", colors: ["Pantone 238"], status: "ready" },
];

type Subcontract = {
  code: string;
  name: string;
  vendor: string;
  period: string;
  status: "planned" | "in-progress" | "delayed";
};

const SUBCONTRACTS: Subcontract[] = [
  { code: "SC25-01", name: "Gold foil", vendor: "Golden Finish", period: "02.25 ~ 02.27", status: "planned" },
  { code: "SC25-02", name: "Laser cutting", vendor: "Laser XYZ", period: "02.26 ~ 02.28", status: "in-progress" },
  { code: "SC25-03", name: "Bag sewing", vendor: "Minh Long", period: "02.24 ~ 03.01", status: "delayed" },
];

type Machine = {
  name: string;
  operation: string;
  utilization: number;
  status: "available" | "busy";
};

const MACHINES: Machine[] = [
  { name: "Offset Roland 700", operation: "Print", utilization: 0.85, status: "busy" },
  { name: "Die Cutter BE-01", operation: "Die cut", utilization: 0.3, status: "available" },
  { name: "Packing Line PL-02", operation: "Pack", utilization: 0.92, status: "busy" },
];

type ResourceAlert = {
  title: string;
  detail: string;
  severity: "info" | "warning" | "critical";
};

const RESOURCE_ALERTS: ResourceAlert[] = [
  { title: "Pantone 238 shortage", detail: "Three ink jobs on hold, check ETA.", severity: "critical" },
  { title: "Laser outsource delay", detail: "SC25-03 pushed by one day.", severity: "warning" },
  { title: "QA handoff window", detail: "MO25-001 / MO25-004 on Feb 27-28.", severity: "info" },
];

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

export default function KanbanView() {
  const [activeTab, setActiveTab] = useState<TabKey>("production");

  const headerStats = useMemo(() => {
    const delayedOrders = SUBCONTRACTS.filter((item) => item.status === "delayed").length;
    const readyBatches = PAINT_QUEUE.filter((item) => item.status === "ready").length;
    const busyMachines = MACHINES.filter((item) => item.status === "busy").length;
    return [
      { label: "Delayed outsource", value: `${delayedOrders}`, tone: "warning" as const },
      { label: "Ready ink batches", value: `${readyBatches}`, tone: "info" as const },
      { label: "Busy machines", value: `${busyMachines}`, tone: "danger" as const },
    ];
  }, []);

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-background text-foreground">
      <header className="border-b border-border bg-panel px-6 py-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Production Planning</h1>
            <p className="mt-1 text-sm text-muted">
              A lightweight workspace that mirrors the reference gantt dashboard.
            </p>
          </div>
          <dl className="grid gap-3 text-xs sm:grid-cols-3">
            {headerStats.map((stat) => (
              <SummaryChip key={stat.label} {...stat} />
            ))}
          </dl>
        </div>
      </header>

      <nav className="border-b border-border bg-panel/80 px-6 py-3 backdrop-blur">
        <div className="mx-auto grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {TABS.map((tab) => {
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
      </nav>

      <main className="flex-1 overflow-auto bg-background px-6 py-6">
        <div className="mx-auto flex max-w-5xl flex-col gap-6">
          {activeTab === "production" && <ProductionView />}
          {activeTab === "jobSheet" && <JobSheetView />}
          {activeTab === "painting" && <PaintingView />}
          {activeTab === "subcontract" && <SubcontractView />}
          {activeTab === "resource" && <ResourceView />}
        </div>
      </main>
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
  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        {PRODUCTION_STATS.map((stat) => (
          <article key={stat.title} className="rounded-2xl border border-border bg-panel/90 p-4 shadow-sm">
            <p className="text-xs uppercase tracking-[0.12em] text-muted">{stat.title}</p>
            <p className="mt-2 text-2xl font-semibold">{stat.value}</p>
            <p className="mt-1 text-xs text-muted">{stat.helper}</p>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-border bg-panel/95 shadow-sm">
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold">Active timeline</h2>
            <p className="text-xs text-muted">Slim version of the reference gantt progress.</p>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-1 text-xs text-muted hover:bg-subtle/60"
          >
            <Filter size={12} />
            Filters
          </button>
        </div>
        <div className="divide-y divide-border/70">
          {TIMELINE.map((item) => (
            <article key={item.id} className="grid gap-3 px-4 py-4 md:grid-cols-[200px_1fr_120px]">
              <div>
                <p className="text-sm font-semibold">{item.name}</p>
                <p className="text-xs text-muted">{item.id}</p>
              </div>
              <div>
                <div className="flex items-center gap-3 text-xs text-muted">
                  <span>{item.start}</span>
                  <div className="relative h-2 flex-1 rounded-full bg-border">
                    <div
                      className={[
                        "absolute inset-y-0 left-0 rounded-full",
                        item.status === "Complete"
                          ? "bg-emerald-500"
                          : item.status === "Risk"
                            ? "bg-rose-500"
                            : "bg-brand",
                      ].join(" ")}
                      style={{ width: `${Math.round(item.progress * 100)}%` }}
                    />
                  </div>
                  <span>{item.end}</span>
                </div>
              </div>
              <div className="flex flex-col items-start gap-1 text-xs md:items-end">
                <span className="rounded-full bg-subtle px-2 py-1 text-[11px] font-semibold text-muted">
                  Owner: {item.owner}
                </span>
                <StatusBadge label={item.status} />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-panel/95 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Risk register</h3>
          <AlertTriangle size={14} className="text-rose-500" />
        </div>
        <div className="mt-4 space-y-3">
          {PRODUCTION_RISKS.map((risk) => (
            <div key={risk.title} className="rounded-xl border border-border/60 bg-background/60 p-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground">{risk.title}</span>
                <span className={["rounded-full px-2 py-0.5 text-[11px] font-semibold", RISK_PILL[risk.severity]].join(" ")}>
                  {risk.severity.toUpperCase()}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-muted">
                <span>Owner: {risk.owner}</span>
                <span>Due: {risk.due}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function JobSheetView() {
  return (
    <section className="rounded-2xl border border-border bg-panel/95 shadow-sm">
      <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
        <h2 className="text-sm font-semibold">Job sheet list</h2>
        <button
          type="button"
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
            {JOB_SHEETS.map((sheet) => (
              <tr key={sheet.code} className="bg-background/90">
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
          </tbody>
        </table>
      </div>
    </section>
  );
}

function PaintingView() {
  const stats = useMemo(
    () => ({
      mixing: PAINT_QUEUE.filter((job) => job.status === "mixing").length,
      ready: PAINT_QUEUE.filter((job) => job.status === "ready").length,
    }),
    [],
  );

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2">
        <InfoCard title="Mixing" value={`${stats.mixing}`} helper="In progress" />
        <InfoCard title="Ready" value={`${stats.ready}`} helper="Can feed presses" />
      </section>

      <section className="rounded-2xl border border-border bg-panel/95 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Ink queue</h2>
          <Palette size={14} className="text-muted" />
        </div>
        <div className="mt-4 space-y-3">
          {PAINT_QUEUE.map((job) => (
            <div key={job.name} className="rounded-xl border border-border/60 bg-background/60 p-4">
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
        </div>
      </section>
    </div>
  );
}

function SubcontractView() {
  return (
    <section className="rounded-2xl border border-border bg-panel/95 shadow-sm">
      <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
        <h2 className="text-sm font-semibold">Vendor timeline</h2>
        <button
          type="button"
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
            {SUBCONTRACTS.map((item) => (
              <tr key={item.code} className="bg-background/90">
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
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ResourceView() {
  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        {MACHINES.map((machine) => (
          <div key={machine.name} className="rounded-2xl border border-border bg-panel/95 p-4 shadow-sm">
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
          <h2 className="text-sm font-semibold">Alerts</h2>
          <Settings size={14} className="text-muted" />
        </div>
        <div className="mt-4 space-y-3">
          {RESOURCE_ALERTS.map((alert) => (
            <div key={alert.title} className="flex items-start gap-3 rounded-xl border border-border/60 bg-background/60 p-4 text-xs">
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

function StatusBadge({ label }: { label: TimelineItem["status"] }) {
  const tone =
    label === "Complete"
      ? "bg-emerald-100 text-emerald-700"
      : label === "Risk"
        ? "bg-rose-100 text-rose-700"
        : "bg-brand/10 text-brand";
  return (
    <span className={["inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold", tone].join(" ")}>
      {label}
    </span>
  );
}

function InfoCard({ title, value, helper }: SummaryStat) {
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
