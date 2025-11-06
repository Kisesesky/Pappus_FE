import { useState, useCallback } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Progress } from './ui/progress';
import { Machine } from '../types/production';
import { Settings, CheckCircle, Clock, AlertTriangle, Cpu } from 'lucide-react';

interface WorkOrderTask {
  id: string;
  name: string;
  code: string;
  operation: string;
  duration: number;
  startTime?: string;
  priority?: number;
  machineId?: string;
}

const operations = [
  'IN',
  'Bồi', 
  'Bế',
  'Cán phủ',
  'Dán mép',
  'Dán đáy', 
  'Mạ vàng',
  'Xỏ dây',
  'Đóng gói'
];

const mockMachines: { [key: string]: Machine[] } = {
  'IN': [
    {
      id: 'M001',
      name: 'Máy in offset Roland 700',
      operation: 'IN',
      capacity: 100,
      currentLoad: 85,
      status: 'busy'
    },
    {
      id: 'M002', 
      name: 'Máy in offset Heidelberg',
      operation: 'IN',
      capacity: 120,
      currentLoad: 45,
      status: 'available'
    }
  ],
  'Bồi': [
    {
      id: 'M003',
      name: 'Máy bồi tự động BT-01',
      operation: 'Bồi',
      capacity: 80,
      currentLoad: 75,
      status: 'busy'
    }
  ],
  'Bế': [
    {
      id: 'M004',
      name: 'Máy bế tự động BE-01', 
      operation: 'Bế',
      capacity: 90,
      currentLoad: 30,
      status: 'available'
    }
  ],
  'Dán đáy': [
    {
      id: 'M005',
      name: 'Máy dán đáy DD-01',
      operation: 'Dán đáy',
      capacity: 60,
      currentLoad: 55,
      status: 'available'
    }
  ]
};

const mockUnassignedTasks: WorkOrderTask[] = [
  {
    id: 'WO25-001',
    name: 'IN - MO25-03',
    code: 'MO25-03',
    operation: 'IN',
    duration: 8
  },
  {
    id: 'WO25-002', 
    name: 'Bế - MO25-01',
    code: 'MO25-01',
    operation: 'Bế',
    duration: 3
  },
  {
    id: 'WO25-003',
    name: 'Dán đáy - MO25-02', 
    code: 'MO25-02',
    operation: 'Dán đáy',
    duration: 2
  }
];

const mockAssignedTasks: { [key: string]: WorkOrderTask[] } = {
  'M001': [
    {
      id: 'WO25-004',
      name: 'IN - MO25-01',
      code: 'MO25-01', 
      operation: 'IN',
      duration: 8,
      startTime: '08:00',
      priority: 1,
      machineId: 'M001'
    },
    {
      id: 'WO25-005',
      name: 'IN - MO25-02',
      code: 'MO25-02',
      operation: 'IN', 
      duration: 6,
      startTime: '16:00',
      priority: 2,
      machineId: 'M001'
    }
  ],
  'M002': []
};

export function ResourceControl() {
  const [selectedOperation, setSelectedOperation] = useState<string>('IN');
  const [unassignedTasks, setUnassignedTasks] = useState<WorkOrderTask[]>(mockUnassignedTasks);
  const [assignedTasks, setAssignedTasks] = useState<{ [key: string]: WorkOrderTask[] }>(mockAssignedTasks);
  const [draggedTask, setDraggedTask] = useState<string | null>(null);

  const machines = mockMachines[selectedOperation] || [];
  const filteredUnassignedTasks = unassignedTasks.filter(task => task.operation === selectedOperation);

  const handleDragStart = useCallback((e: React.DragEvent, taskId: string) => {
    setDraggedTask(taskId);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, machineId: string) => {
    e.preventDefault();
    if (!draggedTask) return;

    // Find the task being dragged
    const task = unassignedTasks.find(t => t.id === draggedTask) || 
                 Object.values(assignedTasks).flat().find(t => t.id === draggedTask);
    
    if (!task) return;

    // Remove from unassigned or previous machine
    setUnassignedTasks(prev => prev.filter(t => t.id !== draggedTask));
    setAssignedTasks(prev => {
      const newAssigned = { ...prev };
      Object.keys(newAssigned).forEach(key => {
        newAssigned[key] = newAssigned[key].filter(t => t.id !== draggedTask);
      });
      
      // Add to new machine
      if (!newAssigned[machineId]) {
        newAssigned[machineId] = [];
      }
      newAssigned[machineId].push({
        ...task,
        machineId,
        priority: newAssigned[machineId].length + 1
      });
      
      return newAssigned;
    });

    setDraggedTask(null);
  }, [draggedTask, unassignedTasks, assignedTasks]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'busy': return <Clock className="w-4 h-4 text-blue-500" />;
      case 'maintenance': return <Settings className="w-4 h-4 text-orange-500" />;
      default: return <AlertTriangle className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available': return 'Sẵn sàng';
      case 'busy': return 'Đang hoạt động';
      case 'maintenance': return 'Bảo trì';
      default: return 'Không xác định';
    }
  };

  const getCapacityColor = (currentLoad: number, capacity: number) => {
    const percentage = (currentLoad / capacity) * 100;
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500'; 
    return 'bg-green-500';
  };

  const getCapacityPercentage = (currentLoad: number, capacity: number) => {
    return Math.round((currentLoad / capacity) * 100);
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b bg-card">
        <div>
          <h2 className="text-xl font-semibold">Resource Control</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Kanban board để phân bổ nguồn lực máy móc và theo dõi capacity
          </p>
        </div>
        <Select value={selectedOperation} onValueChange={setSelectedOperation}>
          <SelectTrigger className="w-48">
            <Cpu className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Chọn công đoạn" />
          </SelectTrigger>
          <SelectContent>
            {operations.map(op => (
              <SelectItem key={op} value={op}>{op}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Unassigned Tasks */}
        <div className="w-80 border-r bg-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            <h3 className="font-semibold">Lệnh chưa phân bổ</h3>
          </div>
          
          <div className="space-y-3">
            {filteredUnassignedTasks.map(task => (
              <Card 
                key={task.id}
                draggable
                onDragStart={(e) => handleDragStart(e, task.id)}
                className="cursor-grab hover:cursor-grabbing hover:shadow-md transition-shadow border-orange-200 bg-orange-50"
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">{task.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {task.operation}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {task.code} • {task.duration}h
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {filteredUnassignedTasks.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                <p className="text-sm">Không có lệnh chưa phân bổ cho công đoạn {selectedOperation}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Machines */}
        <div className="flex-1 p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {machines.map(machine => (
              <Card 
                key={machine.id}
                className="h-fit"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, machine.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{machine.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        {getStatusIcon(machine.status)}
                        <span className="text-sm text-muted-foreground">
                          {getStatusText(machine.status)}
                        </span>
                      </div>
                    </div>
                    <Badge variant="secondary">{machine.operation}</Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Capacity */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Công suất:</span>
                      <span className="font-medium">
                        {machine.currentLoad}/{machine.capacity} ({getCapacityPercentage(machine.currentLoad, machine.capacity)}%)
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all ${getCapacityColor(machine.currentLoad, machine.capacity)}`}
                        style={{ width: `${Math.min(getCapacityPercentage(machine.currentLoad, machine.capacity), 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Assigned Tasks */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Lệnh đã phân bổ:</h4>
                    <div 
                      className="space-y-2 min-h-[120px] bg-muted/30 rounded-lg p-3 border-2 border-dashed border-muted-foreground/20"
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, machine.id)}
                    >
                      {(assignedTasks[machine.id] || []).map(task => (
                        <Card
                          key={task.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, task.id)}
                          className="cursor-grab hover:cursor-grabbing bg-blue-50 border-blue-200"
                        >
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-sm">{task.name}</span>
                              {task.priority && (
                                <Badge variant="outline" className="text-xs">
                                  #{task.priority}
                                </Badge>
                              )}
                            </div>
                            {task.startTime && (
                              <div className="text-xs text-muted-foreground">
                                {task.startTime} - {task.duration}h
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                      
                      {(!assignedTasks[machine.id] || assignedTasks[machine.id].length === 0) && (
                        <div className="text-center text-muted-foreground text-sm py-8">
                          Kéo thả lệnh vào đây
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Machine Controls */}
                  <div className="flex items-center gap-2 pt-2 border-t">
                    <Button variant="outline" size="sm" className="flex-1">
                      Chi tiết
                    </Button>
                    <Button variant="outline" size="sm">
                      <Settings className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {machines.length === 0 && (
            <div className="text-center text-muted-foreground py-12">
              <p>Không có máy móc cho công đoạn {selectedOperation}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}