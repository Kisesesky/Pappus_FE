import {
  useState,
  useRef,
  useEffect,
  useCallback,
} from "react";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { GanttChart } from "./GanttChart";
import { GanttTask } from "../types/production";
import {
  Search,
  Calendar,
  ZoomIn,
  ZoomOut,
  ChevronsDown,
  ChevronsUp,
} from "lucide-react";

// Mock data for demonstration
const mockTasks: GanttTask[] = [
  {
    id: "JO25-001",
    name: "Set Hộp Scented Candles Coffee Crème_AUS (192mm x 106mm x 34mm)",
    code: "JO25.01",
    type: "JO",
    startDate: new Date("2025-02-20"),
    endDate: new Date("2025-03-08"),
    progress: 15,
    color: "#3b82f6",
    level: 0,
    isExpanded: true,
    children: [
      {
        id: "MO25-001",
        name: "Sleeve Scented Candles Coffee Crème_AUS (61mm x 287mm)",
        code: "MO25.01",
        type: "MO",
        startDate: new Date("2025-02-20"),
        endDate: new Date("2025-02-25"),
        progress: 65,
        parentId: "JO25-001",
        color: "#22c55e",
        level: 1,
        isExpanded: true,
        children: [
          {
            id: "JS25-001",
            name: "Cắt giấy Sleeve",
            code: "JS25.01",
            type: "JS",
            startDate: new Date("2025-02-18"),
            endDate: new Date("2025-02-18"),
            progress: 100,
            parentId: "MO25-001",
            color: "#94a3b8",
            level: 2,
          },
          {
            id: "JP25-001",
            name: "Pha mực Pantone 238",
            code: "JP25.01",
            type: "JP",
            startDate: new Date("2025-02-19"),
            endDate: new Date("2025-02-19"),
            progress: 100,
            parentId: "MO25-001",
            color: "#e91e63",
            level: 2,
          },
          {
            id: "WO25-001",
            name: "IN",
            code: "WO25.01",
            type: "WO",
            startDate: new Date("2025-02-20"),
            endDate: new Date("2025-02-21"),
            progress: 85,
            parentId: "MO25-001",
            color: "#8b5cf6",
            level: 2,
          },
          {
            id: "WO25-002",
            name: "Bồi",
            code: "WO25.02",
            type: "WO",
            startDate: new Date("2025-02-21"),
            endDate: new Date("2025-02-22"),
            progress: 50,
            parentId: "MO25-001",
            color: "#f59e0b",
            level: 2,
          },
          {
            id: "WO25-003",
            name: "Bế",
            code: "WO25.03",
            type: "WO",
            startDate: new Date("2025-02-22"),
            endDate: new Date("2025-02-23"),
            progress: 25,
            parentId: "MO25-001",
            color: "#ef4444",
            level: 2,
          },
          {
            id: "WO25-004",
            name: "Dán mép",
            code: "WO25.04",
            type: "WO",
            startDate: new Date("2025-02-24"),
            endDate: new Date("2025-02-25"),
            progress: 0,
            parentId: "MO25-001",
            color: "#06b6d4",
            level: 2,
          },
        ],
      },
      {
        id: "MO25-002",
        name: "Pad Hộp Scented Candles Coffee Crème_AUS (129mm x 213mm)",
        code: "MO25.02",
        type: "MO",
        startDate: new Date("2025-02-22"),
        endDate: new Date("2025-02-27"),
        progress: 35,
        parentId: "JO25-001",
        color: "#22c55e",
        level: 1,
        isExpanded: true,
        children: [
          {
            id: "JS25-002",
            name: "Cắt giấy Pad",
            code: "JS25.02",
            type: "JS",
            startDate: new Date("2025-02-20"),
            endDate: new Date("2025-02-20"),
            progress: 0,
            parentId: "MO25-002",
            color: "#94a3b8",
            level: 2,
          },
          {
            id: "JP25-002",
            name: "Pha mực Pantone 238",
            code: "JP25.01",
            type: "JP",
            startDate: new Date("2025-02-19"),
            endDate: new Date("2025-02-19"),
            progress: 0,
            parentId: "MO25-002",
            color: "#e91e63",
            level: 2,
          },
          {
            id: "WO25-005",
            name: "IN",
            code: "WO25.05",
            type: "WO",
            startDate: new Date("2025-02-22"),
            endDate: new Date("2025-02-23"),
            progress: 0,
            parentId: "MO25-002",
            color: "#8b5cf6",
            level: 2,
          },
          {
            id: "WO25-006",
            name: "Bồi",
            code: "WO25.06",
            type: "WO",
            startDate: new Date("2025-02-23"),
            endDate: new Date("2025-02-24"),
            progress: 0,
            parentId: "MO25-002",
            color: "#f59e0b",
            level: 2,
          },
          {
            id: "WO25-007",
            name: "Bế",
            code: "WO25.07",
            type: "WO",
            startDate: new Date("2025-02-25"),
            endDate: new Date("2025-02-26"),
            progress: 0,
            parentId: "MO25-002",
            color: "#ef4444",
            level: 2,
          },
          {
            id: "WO25-008",
            name: "Dán đáy",
            code: "WO25.08",
            type: "WO",
            startDate: new Date("2025-02-26"),
            endDate: new Date("2025-02-27"),
            progress: 0,
            parentId: "MO25-002",
            color: "#06b6d4",
            level: 2,
          },
        ],
      },
      {
        id: "MO25-003",
        name: "Nắp Hộp Scented Candles Coffee Crème_AUS (205mm x 292mm)",
        code: "MO25.03",
        type: "MO",
        startDate: new Date("2025-02-25"),
        endDate: new Date("2025-03-02"),
        progress: 0,
        parentId: "JO25-001",
        color: "#22c55e",
        level: 1,
        isExpanded: false,
        children: [
          {
            id: "JS25-003",
            name: "Cắt giấy Nắp",
            code: "JS25.03",
            type: "JS",
            startDate: new Date("2025-02-23"),
            endDate: new Date("2025-02-23"),
            progress: 0,
            parentId: "MO25-003",
            color: "#94a3b8",
            level: 2,
          },
          {
            id: "WO25-009",
            name: "IN",
            code: "WO25.09",
            type: "WO",
            startDate: new Date("2025-02-25"),
            endDate: new Date("2025-02-26"),
            progress: 0,
            parentId: "MO25-003",
            color: "#8b5cf6",
            level: 2,
          },
          {
            id: "WO25-010",
            name: "Bồi",
            code: "WO25.10",
            type: "WO",
            startDate: new Date("2025-02-26"),
            endDate: new Date("2025-02-27"),
            progress: 0,
            parentId: "MO25-003",
            color: "#f59e0b",
            level: 2,
          },
          {
            id: "WO25-011",
            name: "Bế",
            code: "WO25.11",
            type: "WO",
            startDate: new Date("2025-02-28"),
            endDate: new Date("2025-03-01"),
            progress: 0,
            parentId: "MO25-003",
            color: "#ef4444",
            level: 2,
          },
          {
            id: "WO25-012",
            name: "Dán đáy",
            code: "WO25.12",
            type: "WO",
            startDate: new Date("2025-03-01"),
            endDate: new Date("2025-03-02"),
            progress: 0,
            parentId: "MO25-003",
            color: "#06b6d4",
            level: 2,
          },
        ],
      },
      {
        id: "MO25-004",
        name: "Đáy Hộp Scented Candles Coffee Crème_AUS (177mm x 264mm)",
        code: "MO25.04",
        type: "MO",
        startDate: new Date("2025-02-28"),
        endDate: new Date("2025-03-05"),
        progress: 0,
        parentId: "JO25-001",
        color: "#22c55e",
        level: 1,
        isExpanded: false,
        children: [
          {
            id: "JS25-004",
            name: "Cắt giấy Đáy",
            code: "JS25.04",
            type: "JS",
            startDate: new Date("2025-02-26"),
            endDate: new Date("2025-02-26"),
            progress: 0,
            parentId: "MO25-004",
            color: "#94a3b8",
            level: 2,
          },
          {
            id: "WO25-013",
            name: "IN",
            code: "WO25.13",
            type: "WO",
            startDate: new Date("2025-02-28"),
            endDate: new Date("2025-03-01"),
            progress: 0,
            parentId: "MO25-004",
            color: "#8b5cf6",
            level: 2,
          },
          {
            id: "WO25-014",
            name: "Bồi",
            code: "WO25.14",
            type: "WO",
            startDate: new Date("2025-03-01"),
            endDate: new Date("2025-03-02"),
            progress: 0,
            parentId: "MO25-004",
            color: "#f59e0b",
            level: 2,
          },
          {
            id: "WO25-015",
            name: "Bế",
            code: "WO25.15",
            type: "WO",
            startDate: new Date("2025-03-03"),
            endDate: new Date("2025-03-04"),
            progress: 0,
            parentId: "MO25-004",
            color: "#ef4444",
            level: 2,
          },
          {
            id: "WO25-016",
            name: "Dán đáy",
            code: "WO25.16",
            type: "WO",
            startDate: new Date("2025-03-04"),
            endDate: new Date("2025-03-05"),
            progress: 0,
            parentId: "MO25-004",
            color: "#06b6d4",
            level: 2,
          },
        ],
      },
      {
        id: "WO25-017",
        name: "Dán mép Set",
        code: "WO25.17",
        type: "WO",
        startDate: new Date("2025-03-06"),
        endDate: new Date("2025-03-07"),
        progress: 0,
        parentId: "JO25-001",
        color: "#a855f7",
        level: 1,
      },
      {
        id: "WO25-018",
        name: "Đóng gói",
        code: "WO25.18",
        type: "WO",
        startDate: new Date("2025-03-07"),
        endDate: new Date("2025-03-08"),
        progress: 0,
        parentId: "JO25-001",
        color: "#10b981",
        level: 1,
      },
    ],
  },
];

export function ProductionSchedule() {
  const [tasks, setTasks] = useState<GanttTask[]>(mockTasks);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState("day");

  const handleTaskUpdate = useCallback(
    (updatedTask: GanttTask) => {
      setTasks((prevTasks) => {
        const updateTaskRecursively = (
          taskList: GanttTask[],
        ): GanttTask[] => {
          return taskList.map((task) => {
            if (task.id === updatedTask.id) {
              return { ...updatedTask };
            }
            if (task.children) {
              return {
                ...task,
                children: updateTaskRecursively(task.children),
              };
            }
            return task;
          });
        };
        return updateTaskRecursively(prevTasks);
      });
    },
    [],
  );

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 25, 300));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 25, 30));
  };

  const handleExpandAll = () => {
    setTasks((prevTasks) => {
      const expandAll = (
        taskList: GanttTask[],
      ): GanttTask[] => {
        return taskList.map((task) => ({
          ...task,
          isExpanded: true,
          children: task.children
            ? expandAll(task.children)
            : undefined,
        }));
      };
      return expandAll(prevTasks);
    });
  };

  const handleCollapseAll = () => {
    setTasks((prevTasks) => {
      const collapseAll = (
        taskList: GanttTask[],
      ): GanttTask[] => {
        return taskList.map((task) => ({
          ...task,
          isExpanded: false,
          children: task.children
            ? collapseAll(task.children)
            : undefined,
        }));
      };
      return collapseAll(prevTasks);
    });
  };

  return (
    <div className="flex flex-col h-full bg-card rounded-lg border">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b bg-muted/30 rounded-t-lg">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm lệnh sản xuất..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
            />
          </div>
          <Select value={viewMode} onValueChange={setViewMode}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Ngày</SelectItem>
              <SelectItem value="week">Tuần</SelectItem>
              <SelectItem value="month">Tháng</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Zoom: {zoomLevel}%</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomOut}
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomIn}
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExpandAll}
          >
            <ChevronsDown className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCollapseAll}
          >
            <ChevronsUp className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Status Summary */}
      <div className="flex items-center gap-6 px-4 py-3 border-b bg-background">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            Production Orders
          </span>
          <Badge variant="secondary">14 Items</Badge>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span>0 completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span>0 in progress</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span>0 delayed</span>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="w-4 h-4" />
          <span>28/02/2025</span>
        </div>
      </div>

      {/* Gantt Chart */}
      <div className="flex-1 overflow-hidden">
        <GanttChart
          tasks={tasks}
          onTaskUpdate={handleTaskUpdate}
          zoomLevel={zoomLevel}
          viewMode={viewMode}
        />
      </div>

      {/* Legend */}
      <div className="border-t bg-muted/30 p-4">
        <div className="flex items-center gap-6">
          <span className="text-sm font-medium">Legend</span>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-blue-500"></div>
              <span className="text-sm">Job Order (JO)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-500"></div>
              <span className="text-sm">
                Manufacturing Order (MO)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-purple-500"></div>
              <span className="text-sm">Work Order (WO)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gray-500"></div>
              <span className="text-sm">Job Sheet (JS)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-pink-500"></div>
              <span className="text-sm">Job Painting (JP)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}