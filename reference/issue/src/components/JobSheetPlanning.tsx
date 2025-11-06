import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Search, Calendar as CalendarIcon, Filter } from 'lucide-react';
import { JobSheet } from '../types/production';

const mockJobSheets: JobSheet[] = [
  {
    id: 'JS25-01',
    code: 'JS25-01',
    name: 'Cắt giấy cho MO25-01',
    type: 'JS',
    startDate: new Date('2025-02-20'),
    endDate: new Date('2025-02-20'),
    duration: 1,
    progress: 0,
    status: 'planned',
    operation: 'Cắt',
    relatedMOId: 'MO25-01'
  },
  {
    id: 'JS25-02',
    code: 'JS25-02',
    name: 'Cắt giấy cho MO25-02',
    type: 'JS',
    startDate: new Date('2025-02-22'),
    endDate: new Date('2025-02-22'),
    duration: 1,
    progress: 0,
    status: 'planned',
    operation: 'Cắt',
    relatedMOId: 'MO25-02'
  }
];

export function JobSheetPlanning() {
  const [jobSheets, setJobSheets] = useState<JobSheet[]>(mockJobSheets);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<Date>();

  const filteredJobSheets = jobSheets.filter(js => {
    const matchesSearch = js.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         js.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || js.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'delayed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleCreateJobSheet = () => {
    // Logic to create new job sheet
    console.log('Create new job sheet');
  };

  return (
    <div className="flex flex-col h-full bg-card rounded-lg border">
      {/* Header */}
      <div className="p-6 border-b">
        <div>
          <h2 className="text-xl font-semibold">Job Sheet Planning</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Quản lý lệnh cắt giấy (JS) - Load theo ngày hoặc trạng thái
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 p-6 border-b bg-muted/30">
        <div className="flex items-center gap-2 flex-1">
          <Search className="w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm lệnh cắt..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </div>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Lọc theo trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            <SelectItem value="planned">Đã lên kế hoạch</SelectItem>
            <SelectItem value="in-progress">Đang thực hiện</SelectItem>
            <SelectItem value="completed">Hoàn thành</SelectItem>
            <SelectItem value="delayed">Trễ hạn</SelectItem>
          </SelectContent>
        </Select>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4" />
              {selectedDate ? selectedDate.toLocaleDateString('vi-VN') : 'Chọn ngày'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Statistics */}
      <div className="flex items-center gap-6 p-6 border-b bg-background">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Tổng số lệnh cắt:</span>
          <Badge variant="secondary">{filteredJobSheets.length}</Badge>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-500"></div>
            <span>{filteredJobSheets.filter(js => js.status === 'planned').length} đã lên kế hoạch</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span>{filteredJobSheets.filter(js => js.status === 'in-progress').length} đang thực hiện</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span>{filteredJobSheets.filter(js => js.status === 'completed').length} hoàn thành</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span>{filteredJobSheets.filter(js => js.status === 'delayed').length} trễ hạn</span>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="flex-1 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã lệnh</TableHead>
              <TableHead>Tên lệnh cắt</TableHead>
              <TableHead>MO liên quan</TableHead>
              <TableHead>Ngày bắt đầu</TableHead>
              <TableHead>Ngày kết thúc</TableHead>
              <TableHead>Thời gian (ngày)</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Tiến độ</TableHead>
              <TableHead>Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredJobSheets.map((jobSheet) => (
              <TableRow key={jobSheet.id} className="hover:bg-muted/50">
                <TableCell className="font-medium">{jobSheet.code}</TableCell>
                <TableCell>{jobSheet.name}</TableCell>
                <TableCell>
                  <Badge variant="outline">{jobSheet.relatedMOId}</Badge>
                </TableCell>
                <TableCell>{jobSheet.startDate.toLocaleDateString('vi-VN')}</TableCell>
                <TableCell>{jobSheet.endDate.toLocaleDateString('vi-VN')}</TableCell>
                <TableCell>{jobSheet.duration}</TableCell>
                <TableCell>
                  <Badge className={getStatusColor(jobSheet.status)}>
                    {jobSheet.status === 'planned' && 'Đã lên kế hoạch'}
                    {jobSheet.status === 'in-progress' && 'Đang thực hiện'}
                    {jobSheet.status === 'completed' && 'Hoàn thành'}
                    {jobSheet.status === 'delayed' && 'Trễ hạn'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-2 bg-muted rounded-full">
                      <div 
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${jobSheet.progress}%` }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground">{jobSheet.progress}%</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      Chỉnh sửa
                    </Button>
                    <Button variant="outline" size="sm">
                      Chi tiết
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {filteredJobSheets.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <p className="text-muted-foreground">Không tìm thấy lệnh cắt nào theo tiêu chí lọc</p>
              <p className="text-sm text-muted-foreground mt-2">Thử thay đổi bộ lọc ngày hoặc trạng thái</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}