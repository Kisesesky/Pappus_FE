export interface BaseOrder {
  id: string;
  code: string;
  name: string;
  startDate: Date;
  endDate: Date;
  duration: number;
  progress: number;
  status: 'planned' | 'in-progress' | 'completed' | 'delayed';
  color?: string;
}

export interface WorkOrder extends BaseOrder {
  type: 'WO';
  operation: string; // IN, Bồi, Bế, Dán đáy, Đóng gói, etc.
  parentId: string; // MO or JO id
  machineId?: string;
  sequence: number;
}

export interface ManufacturingOrder extends BaseOrder {
  type: 'MO';
  parentId?: string; // JO id if it's a child MO
  workOrders: WorkOrder[];
  hasInkingOperation: boolean;
  pantoneColor?: string;
}

export interface JobOrder extends BaseOrder {
  type: 'JO';
  manufacturingOrders: ManufacturingOrder[];
  workOrders: WorkOrder[]; // For JO specific operations like Dán mép, Đóng gói
}

export interface JobSheet extends BaseOrder {
  type: 'JS';
  relatedMOId: string;
  operation: 'Cắt';
}

export interface JobPreparation extends BaseOrder {
  type: 'JP';
  relatedMOIds: string[];
  pantoneColor: string;
  operation: 'Pha mực';
}

export type ProductionOrder = JobOrder | ManufacturingOrder | WorkOrder | JobSheet | JobPreparation;

export interface Machine {
  id: string;
  name: string;
  operation: string;
  capacity: number;
  currentLoad: number;
  status: 'available' | 'busy' | 'maintenance';
}

export interface GanttTask {
  id: string;
  name: string;
  code: string;
  type: 'MO' | 'JO' | 'WO' | 'JS' | 'JP';
  startDate: Date;
  endDate: Date;
  progress: number;
  parentId?: string;
  children?: GanttTask[];
  color: string;
  isExpanded?: boolean;
  level: number;
}