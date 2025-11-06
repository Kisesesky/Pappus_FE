import { useState } from 'react';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ProductionSchedule } from './ProductionSchedule';
import { JobSheetPlanning } from './JobSheetPlanning';
import { JobPainting } from './JobPainting';
import { SubcontractOrders } from './SubcontractOrders';
import { ResourceControl } from './ResourceControl';
import { CalendarDays, Scissors, Palette, Users, LayoutDashboard } from 'lucide-react';

export function MainLayout() {
  const [activeTab, setActiveTab] = useState('production-schedule');

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="border-b bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Production Planning</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Hệ thống quản lý lập kế hoạch và điều độ sản xuất
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span>0 completed</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span>0 in progress</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span>0 delayed</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="mx-6 mt-4 grid w-full grid-cols-5 bg-muted/30">
          <TabsTrigger value="production-schedule" className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4" />
            Production Schedule
          </TabsTrigger>
          <TabsTrigger value="job-sheet" className="flex items-center gap-2">
            <Scissors className="w-4 h-4" />
            Job Sheet Planning
          </TabsTrigger>
          <TabsTrigger value="job-painting" className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Job Painting
          </TabsTrigger>
          <TabsTrigger value="subcontract" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Subcontract Orders
          </TabsTrigger>
          <TabsTrigger value="resource-control" className="flex items-center gap-2">
            <LayoutDashboard className="w-4 h-4" />
            Resource Control
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 px-6 pb-6">
          <TabsContent value="production-schedule" className="h-full mt-4">
            <ProductionSchedule />
          </TabsContent>
          
          <TabsContent value="job-sheet" className="h-full mt-4">
            <JobSheetPlanning />
          </TabsContent>
          
          <TabsContent value="job-painting" className="h-full mt-4">
            <JobPainting />
          </TabsContent>
          
          <TabsContent value="subcontract" className="h-full mt-4">
            <SubcontractOrders />
          </TabsContent>
          
          <TabsContent value="resource-control" className="h-full mt-4">
            <ResourceControl />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}