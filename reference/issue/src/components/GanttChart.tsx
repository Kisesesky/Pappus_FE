import { useState, useRef, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { GanttTask } from '../types/production';
import { ChevronRight, ChevronDown } from 'lucide-react';

interface GanttChartProps {
  tasks: GanttTask[];
  onTaskUpdate: (task: GanttTask) => void;
  zoomLevel: number;
  viewMode: string;
}

interface EditDialogState {
  isOpen: boolean;
  task: GanttTask | null;
}

interface DragState {
  isDragging: boolean;
  taskId: string | null;
  startX: number;
  initialLeft: number;
  dragType: 'move' | 'resize-left' | 'resize-right' | null;
}

export function GanttChart({ tasks, onTaskUpdate, zoomLevel, viewMode }: GanttChartProps) {
  const [editDialog, setEditDialog] = useState<EditDialogState>({ isOpen: false, task: null });
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    taskId: null,
    startX: 0,
    initialLeft: 0,
    dragType: null
  });
  const chartRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const taskListRef = useRef<HTMLDivElement>(null);
  
  // Generate timeline based on viewMode and zoom
  const generateTimeline = () => {
    const start = new Date('2025-02-15');
    const end = new Date('2025-03-15');
    const timeline = [];
    
    if (viewMode === 'day') {
      let current = new Date(start);
      while (current <= end) {
        timeline.push({
          date: new Date(current),
          label: current.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
        });
        current.setDate(current.getDate() + 1);
      }
    }
    
    return timeline;
  };

  const timeline = generateTimeline();
  const dayWidth = Math.max(30, (zoomLevel / 100) * 40);
  const ROW_HEIGHT = 48; // Consistent row height

  // Flatten tasks for display
  const flattenTasks = (taskList: GanttTask[], parentExpanded = true): GanttTask[] => {
    let flatTasks: GanttTask[] = [];
    
    taskList.forEach(task => {
      if (parentExpanded) {
        flatTasks.push(task);
      }
      
      if (task.children && task.isExpanded && parentExpanded) {
        flatTasks = [...flatTasks, ...flattenTasks(task.children, parentExpanded)];
      }
    });
    
    return flatTasks;
  };

  const flatTasks = flattenTasks(tasks);

  // Update task in the tree structure
  const updateTaskInTree = useCallback((taskList: GanttTask[], updatedTask: GanttTask): GanttTask[] => {
    return taskList.map(task => {
      if (task.id === updatedTask.id) {
        return updatedTask;
      }
      if (task.children) {
        return {
          ...task,
          children: updateTaskInTree(task.children, updatedTask)
        };
      }
      return task;
    });
  }, []);

  const toggleExpand = useCallback((taskId: string) => {
    const updateTaskExpansion = (taskList: GanttTask[]): GanttTask[] => {
      return taskList.map(task => {
        if (task.id === taskId) {
          return { ...task, isExpanded: !task.isExpanded };
        }
        if (task.children) {
          return { ...task, children: updateTaskExpansion(task.children) };
        }
        return task;
      });
    };
    
    const updatedTasks = updateTaskExpansion(tasks);
    // Call onTaskUpdate for each root task to update the parent component
    updatedTasks.forEach(task => onTaskUpdate(task));
  }, [tasks, onTaskUpdate]);

  // Handle task selection
  const handleTaskClick = useCallback((taskId: string) => {
    setSelectedTaskId(prev => prev === taskId ? null : taskId);
  }, []);

  const handleDoubleClick = useCallback((task: GanttTask) => {
    if (dragState.isDragging) return;
    setEditDialog({ isOpen: true, task });
    setEditStartDate(task.startDate.toISOString().split('T')[0]);
    setEditEndDate(task.endDate.toISOString().split('T')[0]);
  }, [dragState.isDragging]);

  const handleSaveEdit = useCallback(() => {
    if (!editDialog.task) return;
    
    const updatedTask: GanttTask = {
      ...editDialog.task,
      startDate: new Date(editStartDate),
      endDate: new Date(editEndDate)
    };
    
    onTaskUpdate(updatedTask);
    setEditDialog({ isOpen: false, task: null });
  }, [editDialog.task, editStartDate, editEndDate, onTaskUpdate]);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'JO': return 'bg-blue-500';
      case 'MO': return 'bg-green-500';
      case 'WO': return 'bg-purple-500';
      case 'JS': return 'bg-gray-500';
      case 'JP': return 'bg-pink-500';
      default: return 'bg-gray-400';
    }
  };

  const calculateTaskPosition = (startDate: Date, endDate: Date) => {
    const timelineStart = timeline[0]?.date || new Date();
    const daysDiff = Math.floor((startDate.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24));
    const duration = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    return {
      left: Math.max(0, daysDiff * dayWidth),
      width: Math.max(dayWidth, duration * dayWidth)
    };
  };

  const isWeekend = (date: Date) => {
    const day = date.getDay();
    return day === 0 || day === 6;
  };

  // Drag handlers
  const handleMouseDown = useCallback((e: React.MouseEvent, task: GanttTask) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const dragType = offsetX < 8 ? 'resize-left' : offsetX > rect.width - 8 ? 'resize-right' : 'move';
    
    setDragState({
      isDragging: true,
      taskId: task.id,
      startX: e.clientX,
      initialLeft: rect.left - (chartRef.current?.getBoundingClientRect().left || 0),
      dragType
    });
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragState.isDragging || !dragState.taskId) return;

    const deltaX = e.clientX - dragState.startX;
    const deltaDAys = Math.round(deltaX / dayWidth);
    
    if (deltaDAys === 0) return;

    const task = flatTasks.find(t => t.id === dragState.taskId);
    if (!task) return;

    let newStartDate = new Date(task.startDate);
    let newEndDate = new Date(task.endDate);

    if (dragState.dragType === 'move') {
      newStartDate.setDate(newStartDate.getDate() + deltaDAys);
      newEndDate.setDate(newEndDate.getDate() + deltaDAys);
    } else if (dragState.dragType === 'resize-left') {
      newStartDate.setDate(newStartDate.getDate() + deltaDAys);
      if (newStartDate >= newEndDate) {
        newStartDate = new Date(newEndDate);
        newStartDate.setDate(newStartDate.getDate() - 1);
      }
    } else if (dragState.dragType === 'resize-right') {
      newEndDate.setDate(newEndDate.getDate() + deltaDAys);
      if (newEndDate <= newStartDate) {
        newEndDate = new Date(newStartDate);
        newEndDate.setDate(newEndDate.getDate() + 1);
      }
    }

    const updatedTask: GanttTask = {
      ...task,
      startDate: newStartDate,
      endDate: newEndDate
    };

    onTaskUpdate(updatedTask);
    
    setDragState(prev => ({
      ...prev,
      startX: e.clientX
    }));
  }, [dragState, dayWidth, flatTasks, onTaskUpdate]);

  const handleMouseUp = useCallback(() => {
    setDragState({
      isDragging: false,
      taskId: null,
      startX: 0,
      initialLeft: 0,
      dragType: null
    });
  }, []);

  // Sync scroll between task list and gantt chart
  const handleTaskListScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (chartRef.current) {
      chartRef.current.scrollTop = (e.target as HTMLDivElement).scrollTop;
    }
  }, []);

  const handleChartScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (taskListRef.current) {
      taskListRef.current.scrollTop = (e.target as HTMLDivElement).scrollTop;
    }
    // Sync horizontal scroll with timeline
    if (timelineRef.current) {
      timelineRef.current.scrollLeft = (e.target as HTMLDivElement).scrollLeft;
    }
  }, []);

  useEffect(() => {
    if (dragState.isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = dragState.dragType === 'move' ? 'grabbing' : 'col-resize';
      document.body.style.userSelect = 'none';
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [dragState.isDragging, handleMouseMove, handleMouseUp, dragState.dragType]);

  return (
    <>
      <div className="flex h-full border rounded-lg overflow-hidden bg-card">
        {/* Task List Panel */}
        <div className="w-96 border-r bg-background flex flex-col">
          {/* Header */}
          <div className="h-16 border-b bg-muted/30 flex items-center px-4 flex-shrink-0">
            <h3 className="font-semibold">Task Name</h3>
          </div>
          
          {/* Task List */}
          <div 
            className="flex-1 overflow-y-auto overflow-x-hidden" 
            ref={taskListRef}
            onScroll={handleTaskListScroll}
          >
            {flatTasks.map((task, index) => (
              <div
                key={task.id}
                className={`flex items-center border-b hover:bg-muted/50 cursor-pointer group ${
                  selectedTaskId === task.id ? 'bg-primary/10 border-primary/20' : ''
                }`}
                style={{ 
                  height: `${ROW_HEIGHT}px`,
                  paddingLeft: `${16 + (task.level * 24)}px`,
                  paddingRight: '16px'
                }}
                onClick={() => handleTaskClick(task.id)}
                onDoubleClick={() => handleDoubleClick(task)}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {task.children && task.children.length > 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpand(task.id);
                      }}
                      className="p-1 hover:bg-muted rounded flex-shrink-0"
                    >
                      {task.isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>
                  )}
                  
                  {!task.children && (
                    <div className="w-6 flex-shrink-0" />
                  )}
                  
                  <div className={`w-3 h-3 rounded-full flex-shrink-0 ${getTypeColor(task.type)}`} />
                  
                  <div className="flex-1 min-w-0">
                    <div 
                      className="text-sm" 
                      title={`${task.type} - ${task.code} - ${task.name}`}
                    >
                      <span className="font-medium">{task.type} - {task.code}</span>
                      <div className="text-xs text-muted-foreground leading-tight break-words">
                        {task.name}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Gantt Chart Panel */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Timeline Header - Fixed, scrollable horizontally */}
          <div className="h-16 border-b bg-muted/30 flex-shrink-0 overflow-x-auto scrollbar-hide" ref={timelineRef}>
            <div 
              className="flex h-full"
              style={{ width: `${timeline.length * dayWidth}px` }}
            >
              {timeline.map((timePoint, index) => (
                <div
                  key={index}
                  className={`flex-shrink-0 border-r border-border/50 flex items-center justify-center text-xs ${
                    isWeekend(timePoint.date) ? 'bg-red-50 text-red-600' : ''
                  }`}
                  style={{ width: `${dayWidth}px` }}
                >
                  {timePoint.label}
                </div>
              ))}
            </div>
          </div>

          {/* Task Bars - Scrollable */}
          <div className="flex-1 overflow-auto" ref={chartRef} onScroll={handleChartScroll}>
            <div 
              className="relative"
              style={{ 
                width: `${timeline.length * dayWidth}px`,
                height: `${flatTasks.length * ROW_HEIGHT}px`
              }}
            >
              {/* Grid Lines */}
              {timeline.map((_, index) => (
                <div
                  key={index}
                  className={`absolute top-0 bottom-0 border-r border-border/30 ${
                    isWeekend(timeline[index]?.date) ? 'bg-red-50/50' : ''
                  }`}
                  style={{ left: `${index * dayWidth}px`, width: '1px' }}
                />
              ))}
              
              {/* Horizontal Grid Lines */}
              {flatTasks.map((_, index) => (
                <div
                  key={index}
                  className="absolute left-0 right-0 border-b border-border/30"
                  style={{ top: `${(index + 1) * ROW_HEIGHT}px`, height: '1px' }}
                />
              ))}

              {/* Task Bars */}
              {flatTasks.map((task, index) => {
                const position = calculateTaskPosition(task.startDate, task.endDate);
                const isDragging = dragState.taskId === task.id;
                const isSelected = selectedTaskId === task.id;
                
                return (
                  <div
                    key={task.id}
                    className={`absolute flex items-center h-8 rounded cursor-grab hover:opacity-80 transition-all ${
                      isDragging ? 'z-10 shadow-lg' : ''
                    } ${
                      isSelected ? 'ring-2 ring-primary ring-offset-2 z-20' : ''
                    }`}
                    style={{
                      top: `${index * ROW_HEIGHT + (ROW_HEIGHT - 32) / 2}px`, // Center the bar in the row
                      left: `${position.left}px`,
                      width: `${position.width}px`,
                      backgroundColor: task.color,
                      minWidth: '20px',
                      cursor: isDragging ? 'grabbing' : 'grab'
                    }}
                    onMouseDown={(e) => handleMouseDown(e, task)}
                    onDoubleClick={() => handleDoubleClick(task)}
                    onClick={() => handleTaskClick(task.id)}
                  >
                    {/* Resize handles */}
                    <div 
                      className="absolute left-0 top-0 bottom-0 w-2 cursor-col-resize opacity-0 hover:opacity-100 bg-white/20"
                      style={{ borderRadius: '4px 0 0 4px' }}
                    />
                    <div 
                      className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize opacity-0 hover:opacity-100 bg-white/20"
                      style={{ borderRadius: '0 4px 4px 0' }}
                    />
                    
                    <div className="px-2 text-xs text-white font-semibold flex items-center justify-center w-full">
                      {task.progress}%
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialog.isOpen} onOpenChange={(open) => {
        if (!open) setEditDialog({ isOpen: false, task: null });
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa thời gian</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="task-name">Tên lệnh</Label>
              <Input 
                id="task-name" 
                value={editDialog.task?.name || ''} 
                disabled 
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="start-date">Ngày bắt đầu</Label>
              <Input
                id="start-date"
                type="date"
                value={editStartDate}
                onChange={(e) => setEditStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date">Ngày kết thúc</Label>
              <Input
                id="end-date"
                type="date"
                value={editEndDate}
                onChange={(e) => setEditEndDate(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditDialog({ isOpen: false, task: null })}>
              Hủy
            </Button>
            <Button onClick={handleSaveEdit}>
              Lưu
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}