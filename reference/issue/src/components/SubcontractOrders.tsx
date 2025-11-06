import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Search, Plus, Filter, Building, Phone, Mail } from 'lucide-react';

interface SubcontractOrder {
  id: string;
  code: string;
  name: string;
  supplier: string;
  supplierContact: string;
  supplierPhone: string;
  operation: string;
  relatedMOId: string;
  startDate: Date;
  endDate: Date;
  status: 'planned' | 'sent' | 'in-progress' | 'completed' | 'delayed';
  cost: number;
  progress: number;
}

const mockSubcontractOrders: SubcontractOrder[] = [
  {
    id: 'SC25-01',
    code: 'SC25-01',
    name: 'Gia công mạ vàng',
    supplier: 'Công ty TNHH Mạ Vàng ABC',
    supplierContact: 'Nguyễn Văn A',
    supplierPhone: '0912345678',
    operation: 'Mạ vàng',
    relatedMOId: 'MO25-01',
    startDate: new Date('2025-02-25'),
    endDate: new Date('2025-02-27'),
    status: 'planned',
    cost: 5000000,
    progress: 0
  },
  {
    id: 'SC25-02',
    code: 'SC25-02',
    name: 'Gia công cắt laser',
    supplier: 'Xưởng Laser XYZ',
    supplierContact: 'Trần Thị B',
    supplierPhone: '0987654321',
    operation: 'Cắt laser',
    relatedMOId: 'MO25-02',
    startDate: new Date('2025-02-26'),
    endDate: new Date('2025-02-28'),
    status: 'sent',
    cost: 3000000,
    progress: 20
  }
];

export function SubcontractOrders() {
  const [subcontractOrders, setSubcontractOrders] = useState<SubcontractOrder[]>(mockSubcontractOrders);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterSupplier, setFilterSupplier] = useState<string>('all');

  const uniqueSuppliers = Array.from(new Set(subcontractOrders.map(so => so.supplier)));

  const filteredSubcontractOrders = subcontractOrders.filter(so => {
    const matchesSearch = so.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         so.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         so.supplier.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || so.status === filterStatus;
    const matchesSupplier = filterSupplier === 'all' || so.supplier === filterSupplier;
    return matchesSearch && matchesStatus && matchesSupplier;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'sent': return 'bg-yellow-100 text-yellow-800';
      case 'delayed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'planned': return 'Đã lên kế hoạch';
      case 'sent': return 'Đã gửi';
      case 'in-progress': return 'Đang thực hiện';
      case 'completed': return 'Hoàn thành';
      case 'delayed': return 'Trễ hạn';
      default: return status;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const handleCreateSubcontractOrder = () => {
    console.log('Create new subcontract order');
  };

  const totalCost = filteredSubcontractOrders.reduce((sum, so) => sum + so.cost, 0);

  return (
    <div className="flex flex-col h-full bg-card rounded-lg border">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b">
        <div>
          <h2 className="text-xl font-semibold">Subcontract Orders</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Quản lý lệnh gia công ngoài cho các công đoạn chuyên biệt
          </p>
        </div>
        <Button onClick={handleCreateSubcontractOrder} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Tạo lệnh gia công
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 p-6 border-b bg-muted/30">
        <div className="flex items-center gap-2 flex-1">
          <Search className="w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm lệnh gia công hoặc nhà cung cấp..."
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
            <SelectItem value="sent">Đã gửi</SelectItem>
            <SelectItem value="in-progress">Đang thực hiện</SelectItem>
            <SelectItem value="completed">Hoàn thành</SelectItem>
            <SelectItem value="delayed">Trễ hạn</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterSupplier} onValueChange={setFilterSupplier}>
          <SelectTrigger className="w-60">
            <Building className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Lọc theo nhà cung cấp" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả nhà cung cấp</SelectItem>
            {uniqueSuppliers.map(supplier => (
              <SelectItem key={supplier} value={supplier}>
                {supplier}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Statistics */}
      <div className="flex items-center gap-6 p-6 border-b bg-background">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Tổng số lệnh gia công:</span>
          <Badge variant="secondary">{filteredSubcontractOrders.length}</Badge>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-500"></div>
            <span>{filteredSubcontractOrders.filter(so => so.status === 'planned').length} đã lên kế hoạch</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span>{filteredSubcontractOrders.filter(so => so.status === 'sent').length} đã gửi</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span>{filteredSubcontractOrders.filter(so => so.status === 'in-progress').length} đang thực hiện</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span>{filteredSubcontractOrders.filter(so => so.status === 'completed').length} hoàn thành</span>
          </div>
        </div>
        <div className="ml-auto text-sm text-muted-foreground">
          Tổng chi phí: <span className="font-medium text-foreground">{formatCurrency(totalCost)}</span>
        </div>
      </div>

      {/* Data Table */}
      <div className="flex-1 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã lệnh</TableHead>
              <TableHead>Tên công việc</TableHead>
              <TableHead>Nhà cung cấp</TableHead>
              <TableHead>Liên hệ</TableHead>
              <TableHead>Công đoạn</TableHead>
              <TableHead>MO liên quan</TableHead>
              <TableHead>Thời gian</TableHead>
              <TableHead>Chi phí</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Tiến độ</TableHead>
              <TableHead>Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSubcontractOrders.map((subcontractOrder) => (
              <TableRow key={subcontractOrder.id} className="hover:bg-muted/50">
                <TableCell className="font-medium">{subcontractOrder.code}</TableCell>
                <TableCell>{subcontractOrder.name}</TableCell>
                <TableCell>
                  <div className="flex items-start gap-2">
                    <Building className="w-4 h-4 mt-0.5 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{subcontractOrder.supplier}</div>
                      <div className="text-xs text-muted-foreground">{subcontractOrder.supplierContact}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1 text-xs">
                      <Phone className="w-3 h-3" />
                      {subcontractOrder.supplierPhone}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{subcontractOrder.operation}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{subcontractOrder.relatedMOId}</Badge>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div>{subcontractOrder.startDate.toLocaleDateString('vi-VN')}</div>
                    <div className="text-muted-foreground">đến {subcontractOrder.endDate.toLocaleDateString('vi-VN')}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="font-medium">{formatCurrency(subcontractOrder.cost)}</span>
                </TableCell>
                <TableCell>
                  <Badge className={getStatusColor(subcontractOrder.status)}>
                    {getStatusText(subcontractOrder.status)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-2 bg-muted rounded-full">
                      <div 
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${subcontractOrder.progress}%` }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground">{subcontractOrder.progress}%</span>
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

        {filteredSubcontractOrders.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <p className="text-muted-foreground">Không tìm thấy lệnh gia công nào</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={handleCreateSubcontractOrder}
              >
                Tạo lệnh gia công đầu tiên
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}