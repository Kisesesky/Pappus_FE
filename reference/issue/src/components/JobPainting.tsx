import { useState } from "react";
type CheckboxState = boolean | "indeterminate";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Badge } from "./ui/badge";
import { Calendar } from "./ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "./ui/dialog";
import { Separator } from "./ui/separator";
import { Checkbox } from "./ui/checkbox";
import {
  Search,
  Plus,
  Calendar as CalendarIcon,
  Filter,
  Palette,
  Factory,
} from "lucide-react";
import { JobPreparation } from "../types/production";

// Mock data for available MOs that don't have ink preparation yet
const mockAvailableMOs = [
  {
    id: "MO25-04",
    code: "MO25-04",
    name: "Nắp Hộp Premium Coffee",
    pantoneColors: ["Pantone 238", "Pantone 485"],
    scheduledDate: new Date("2025-02-25"),
    estimatedInkQuantity: 2.5, // kg mực cần cho MO này
  },
  {
    id: "MO25-05",
    code: "MO25-05",
    name: "Label Coffee Premium",
    pantoneColors: ["Pantone 238"],
    scheduledDate: new Date("2025-02-26"),
    estimatedInkQuantity: 1.8,
  },
  {
    id: "MO25-06",
    code: "MO25-06",
    name: "Box Insert Coffee",
    pantoneColors: ["Pantone 286"],
    scheduledDate: new Date("2025-02-28"),
    estimatedInkQuantity: 3.2,
  },
];

// Mock data for ink inventory
const mockInkInventory = [
  {
    id: "ink-001",
    code: "C-100",
    name: "Cyan 100%",
    type: "CMYK",
    stockQuantity: 25.5,
    unit: "kg",
    lastUpdated: new Date("2025-02-15"),
  },
  {
    id: "ink-002",
    code: "M-100",
    name: "Magenta 100%",
    type: "CMYK",
    stockQuantity: 18.3,
    unit: "kg",
    lastUpdated: new Date("2025-02-15"),
  },
  {
    id: "ink-003",
    code: "Y-100",
    name: "Yellow 100%",
    type: "CMYK",
    stockQuantity: 32.1,
    unit: "kg",
    lastUpdated: new Date("2025-02-15"),
  },
  {
    id: "ink-004",
    code: "K-100",
    name: "Black 100%",
    type: "CMYK",
    stockQuantity: 41.7,
    unit: "kg",
    lastUpdated: new Date("2025-02-15"),
  },
  {
    id: "ink-005",
    code: "PAN-238",
    name: "Pantone 238 (Premixed)",
    type: "Premixed",
    stockQuantity: 8.2,
    unit: "kg",
    lastUpdated: new Date("2025-02-14"),
  },
  {
    id: "ink-006",
    code: "PAN-485",
    name: "Pantone 485 (Premixed)",
    type: "Premixed",
    stockQuantity: 12.6,
    unit: "kg",
    lastUpdated: new Date("2025-02-14"),
  },
];

const mockJobPreparations: JobPreparation[] = [
  {
    id: "JP25-01",
    code: "JP25-01",
    name: "Pha mực Pantone 238",
    type: "JP",
    startDate: new Date("2025-02-21"),
    endDate: new Date("2025-02-21"),
    duration: 1,
    progress: 0,
    status: "planned",
    operation: "Pha mực",
    relatedMOIds: ["MO25-01", "MO25-02"],
    pantoneColor: "Pantone 238",
  },
  {
    id: "JP25-02",
    code: "JP25-02",
    name: "Pha mực Pantone 485",
    type: "JP",
    startDate: new Date("2025-02-23"),
    endDate: new Date("2025-02-23"),
    duration: 1,
    progress: 0,
    status: "planned",
    operation: "Pha mực",
    relatedMOIds: ["MO25-03"],
    pantoneColor: "Pantone 485",
  },
];

export function JobPainting() {
  const [jobPreparations, setJobPreparations] = useState<
    JobPreparation[]
  >(mockJobPreparations);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] =
    useState<string>("all");
  const [filterColor, setFilterColor] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState<Date>();

  // Dialog states
  const [isCreateFromMOOpen, setIsCreateFromMOOpen] =
    useState(false);
  const [moSearchTerm, setMOSearchTerm] = useState("");
  const [selectedMOs, setSelectedMOs] = useState<string[]>([]);
  const [selectedPantoneColor, setSelectedPantoneColor] =
    useState("");
  const [selectedInks, setSelectedInks] = useState<string[]>(
    [],
  );
  const [inkQuantities, setInkQuantities] = useState<{
    [key: string]: number;
  }>({});
  const [newJobCode, setNewJobCode] = useState("JP25-03");

  // Calculate total estimated ink quantity for selected MOs
  const totalEstimatedInkQuantity = selectedMOs.reduce(
    (total, moId) => {
      const mo = mockAvailableMOs.find((m) => m.id === moId);
      return total + (mo?.estimatedInkQuantity || 0);
    },
    0,
  );

  const uniqueColors = Array.from(
    new Set(jobPreparations.map((jp) => jp.pantoneColor)),
  );

  const filteredAvailableMOs = mockAvailableMOs.filter((mo) => {
    const matchesSearch =
      mo.code
        .toLowerCase()
        .includes(moSearchTerm.toLowerCase()) ||
      mo.name
        .toLowerCase()
        .includes(moSearchTerm.toLowerCase()) ||
      mo.pantoneColors.some((color) =>
        color
          .toLowerCase()
          .includes(moSearchTerm.toLowerCase()),
      );
    return matchesSearch;
  });

  const handleMOSelection = (
    moId: string,
    checked: boolean,
  ) => {
    if (checked) {
      setSelectedMOs((prev) => [...prev, moId]);
    } else {
      setSelectedMOs((prev) =>
        prev.filter((id) => id !== moId),
      );
    }
  };

  const handleInkSelection = (
    inkId: string,
    checked: boolean,
  ) => {
    if (checked) {
      setSelectedInks((prev) => [...prev, inkId]);
    } else {
      setSelectedInks((prev) =>
        prev.filter((id) => id !== inkId),
      );
    }
  };

  const handleInkQuantityChange = (
    inkId: string,
    quantity: number,
  ) => {
    setInkQuantities((prev) => ({
      ...prev,
      [inkId]: quantity,
    }));
  };

  const resetCreateFromMODialog = () => {
    setMOSearchTerm("");
    setSelectedMOs([]);
    setSelectedPantoneColor("");
    setSelectedInks([]);
    setInkQuantities({});
    setNewJobCode("JP25-03");
  };

  const handleCreateFromMO = () => {
    // Logic to create new job preparation from selected MOs
    const selectedMOCodes = mockAvailableMOs
      .filter((mo) => selectedMOs.includes(mo.id))
      .map((mo) => mo.code);

    const newJobPreparation: JobPreparation = {
      id: newJobCode.replace(".", "-"),
      code: newJobCode,
      name: `Pha mực ${selectedPantoneColor}`,
      type: "JP",
      startDate: new Date(),
      endDate: new Date(),
      duration: 1,
      progress: 0,
      status: "planned",
      operation: "Pha mực",
      relatedMOIds: selectedMOCodes,
      pantoneColor: selectedPantoneColor,
    };

    // Add to jobPreparations state
    setJobPreparations((prev) => [...prev, newJobPreparation]);

    console.log("Created new JP:", newJobPreparation);
    console.log("Selected inks for formula:", selectedInks);

    setIsCreateFromMOOpen(false);
    resetCreateFromMODialog();
  };

  const getStockStatus = (quantity: number) => {
    if (quantity < 5) return "text-red-500";
    if (quantity < 15) return "text-yellow-500";
    return "text-green-500";
  };

  const filteredJobPreparations = jobPreparations.filter(
    (jp) => {
      const matchesSearch =
        jp.name
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        jp.code
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        jp.pantoneColor
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
      const matchesStatus =
        filterStatus === "all" || jp.status === filterStatus;
      const matchesColor =
        filterColor === "all" ||
        jp.pantoneColor === filterColor;
      return matchesSearch && matchesStatus && matchesColor;
    },
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "in-progress":
        return "bg-blue-100 text-blue-800";
      case "delayed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPantoneColorStyle = (pantoneColor: string) => {
    // Mock color mapping for Pantone colors
    const colorMap: { [key: string]: string } = {
      "Pantone 238": "#E91E63",
      "Pantone 485": "#F44336",
      "Pantone 286": "#2196F3",
      "Pantone 347": "#4CAF50",
    };
    return colorMap[pantoneColor] || "#9E9E9E";
  };

  const handleCreateJobPreparation = () => {
    console.log("Create new job preparation");
  };

  const handleBatchCreate = () => {
    console.log(
      "Create batch job preparation from selected MOs",
    );
  };

  return (
    <div className="flex flex-col h-full bg-card rounded-lg border">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b">
        <div>
          <h2 className="text-xl font-semibold">
            Job Painting Planning
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Quản lý lệnh pha mực (JP) cho các màu Pantone
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog
            open={isCreateFromMOOpen}
            onOpenChange={setIsCreateFromMOOpen}
          >
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="flex items-center gap-2"
              >
                <Factory className="w-4 h-4" />
                Tạo JP từ MO
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[500px] max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  Tạo lệnh pha mực từ MO
                </DialogTitle>
                <DialogDescription>
                  Chọn lệnh sản xuất MO chưa tạo lệnh pha mực và
                  màu Pantone cần pha
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Job Code Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Mã lệnh pha mực mới
                  </label>
                  <Input
                    value={newJobCode}
                    onChange={(e) =>
                      setNewJobCode(e.target.value)
                    }
                    placeholder="JP25-03"
                    className="w-48"
                  />
                </div>

                {/* Search and Select MOs */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">
                      1. Chọn lệnh sản xuất MO chưa tạo lệnh pha
                      mực
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <Search className="w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Tìm kiếm MO25-04, MO25-05 hoặc màu Pantone..."
                      value={moSearchTerm}
                      onChange={(e) =>
                        setMOSearchTerm(e.target.value)
                      }
                      className="max-w-md"
                    />
                  </div>

                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12"></TableHead>
                          <TableHead className="w-[100px]">
                            Mã MO
                          </TableHead>
                          <TableHead>
                            Tên lệnh sản xuất
                          </TableHead>
                          <TableHead>Màu Pantone cần</TableHead>
                          <TableHead>
                            Số lượng mực (kg)
                          </TableHead>
                          <TableHead>Ngày dự kiến</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredAvailableMOs.map((mo) => (
                          <TableRow key={mo.id}>
                            <TableCell>
                              <Checkbox
                                checked={selectedMOs.includes(
                                  mo.id,
                                )}
                                onCheckedChange={(checked: CheckboxState) =>
                                  handleMOSelection(
                                    mo.id,
                                    checked as boolean,
                                  )
                                }
                              />
                            </TableCell>
                            <TableCell className="font-medium">
                              {mo.code}
                            </TableCell>
                            <TableCell>{mo.name}</TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {mo.pantoneColors.map(
                                  (color) => (
                                    <Badge
                                      key={color}
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      <div className="flex items-center gap-1">
                                        <div
                                          className="w-2 h-2 rounded-full"
                                          style={{
                                            backgroundColor:
                                              getPantoneColorStyle(
                                                color,
                                              ),
                                          }}
                                        />
                                        {color}
                                      </div>
                                    </Badge>
                                  ),
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="font-medium text-primary">
                              {mo.estimatedInkQuantity} kg
                            </TableCell>
                            <TableCell>
                              {mo.scheduledDate.toLocaleDateString(
                                "vi-VN",
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                        {selectedMOs.length > 0 && (
                          <TableRow className="bg-muted/50 font-medium">
                            <TableCell></TableCell>
                            <TableCell
                              colSpan={3}
                              className="text-right"
                            >
                              Tổng số lượng mực cần pha:
                            </TableCell>
                            <TableCell className="font-bold text-primary text-lg">
                              {totalEstimatedInkQuantity.toFixed(
                                1,
                              )}{" "}
                              kg
                            </TableCell>
                            <TableCell></TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Select Pantone Color */}
                {selectedMOs.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="font-medium">
                      2. Chọn màu Pantone cần pha
                    </h3>
                    <Select
                      value={selectedPantoneColor}
                      onValueChange={setSelectedPantoneColor}
                    >
                      <SelectTrigger className="w-64">
                        <SelectValue placeholder="Chọn màu Pantone 238..." />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from(
                          new Set(
                            filteredAvailableMOs
                              .filter((mo) =>
                                selectedMOs.includes(mo.id),
                              )
                              .flatMap(
                                (mo) => mo.pantoneColors,
                              ),
                          ),
                        ).map((color) => (
                          <SelectItem key={color} value={color}>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{
                                  backgroundColor:
                                    getPantoneColorStyle(color),
                                }}
                              />
                              {color}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Select Ink Formula */}
                {selectedPantoneColor && (
                  <div className="space-y-4">
                    <h3 className="font-medium">
                      3. Chọn công thức pha mực
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Nhập số lượng mực cần sử dụng để tạo công
                      thức pha cho {selectedPantoneColor}
                    </p>

                    <div className="border rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Mã mực</TableHead>
                            <TableHead>Tên mực</TableHead>
                            <TableHead>Loại</TableHead>
                            <TableHead>Tồn kho</TableHead>
                            <TableHead className="w-32">
                              Số lượng cần (kg)
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {mockInkInventory.map((ink) => (
                            <TableRow key={ink.id}>
                              <TableCell className="font-medium">
                                {ink.code}
                              </TableCell>
                              <TableCell>{ink.name}</TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    ink.type === "CMYK"
                                      ? "secondary"
                                      : "outline"
                                  }
                                >
                                  {ink.type}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <span
                                  className={`${getStockStatus(ink.stockQuantity)}`}
                                >
                                  {ink.stockQuantity} {ink.unit}
                                </span>
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  placeholder="0.0"
                                  min="0"
                                  step="0.1"
                                  max={ink.stockQuantity}
                                  value={
                                    inkQuantities[ink.id] || ""
                                  }
                                  onChange={(e) =>
                                    handleInkQuantityChange(
                                      ink.id,
                                      parseFloat(
                                        e.target.value,
                                      ) || 0,
                                    )
                                  }
                                  className="w-full"
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}

                <Separator />

                {/* Action Buttons */}
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateFromMOOpen(false)}
                  >
                    Hủy
                  </Button>
                  <Button
                    onClick={handleCreateFromMO}
                    disabled={
                      !selectedMOs.length ||
                      !selectedPantoneColor ||
                      Object.values(inkQuantities).filter(
                        (q) => q > 0,
                      ).length === 0
                    }
                  >
                    Tạo lệnh pha mực
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button
            onClick={handleCreateJobPreparation}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Tạo lệnh pha mực
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 p-6 border-b bg-muted/30">
        <div className="flex items-center gap-2 flex-1">
          <Search className="w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm lệnh pha mực hoặc màu Pantone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </div>

        <Select
          value={filterStatus}
          onValueChange={setFilterStatus}
        >
          <SelectTrigger className="w-48">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Lọc theo trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              Tất cả trạng thái
            </SelectItem>
            <SelectItem value="planned">
              Đã lên kế hoạch
            </SelectItem>
            <SelectItem value="in-progress">
              Đang thực hiện
            </SelectItem>
            <SelectItem value="completed">
              Hoàn thành
            </SelectItem>
            <SelectItem value="delayed">Trễ hạn</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filterColor}
          onValueChange={setFilterColor}
        >
          <SelectTrigger className="w-48">
            <Palette className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Lọc theo màu" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả màu</SelectItem>
            {uniqueColors.map((color) => (
              <SelectItem key={color} value={color}>
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full border"
                    style={{
                      backgroundColor:
                        getPantoneColorStyle(color),
                    }}
                  />
                  {color}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="flex items-center gap-2"
            >
              <CalendarIcon className="w-4 h-4" />
              {selectedDate
                ? selectedDate.toLocaleDateString("vi-VN")
                : "Chọn ngày"}
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
          <span className="text-sm font-medium">
            Tổng số lệnh pha mực:
          </span>
          <Badge variant="secondary">
            {filteredJobPreparations.length}
          </Badge>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-500"></div>
            <span>
              {
                filteredJobPreparations.filter(
                  (jp) => jp.status === "planned",
                ).length
              }{" "}
              đã lên kế hoạch
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span>
              {
                filteredJobPreparations.filter(
                  (jp) => jp.status === "in-progress",
                ).length
              }{" "}
              đang pha
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span>
              {
                filteredJobPreparations.filter(
                  (jp) => jp.status === "completed",
                ).length
              }{" "}
              hoàn thành
            </span>
          </div>
        </div>
        <div className="ml-auto text-sm text-muted-foreground">
          {uniqueColors.length} màu Pantone khác nhau
        </div>
      </div>

      {/* Data Table */}
      <div className="flex-1 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã lệnh</TableHead>
              <TableHead>Tên lệnh pha mực</TableHead>
              <TableHead>Màu Pantone</TableHead>
              <TableHead>MO liên quan</TableHead>
              <TableHead>Ngày bắt đầu</TableHead>
              <TableHead>Ngày kết thúc</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Tiến độ</TableHead>
              <TableHead>Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredJobPreparations.map((jobPreparation) => (
              <TableRow
                key={jobPreparation.id}
                className="hover:bg-muted/50"
              >
                <TableCell className="font-medium">
                  {jobPreparation.code}
                </TableCell>
                <TableCell>{jobPreparation.name}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                      style={{
                        backgroundColor: getPantoneColorStyle(
                          jobPreparation.pantoneColor,
                        ),
                      }}
                    />
                    <span>{jobPreparation.pantoneColor}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {jobPreparation.relatedMOIds.map((moId) => (
                      <Badge
                        key={moId}
                        variant="outline"
                        className="text-xs"
                      >
                        {moId}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  {jobPreparation.startDate.toLocaleDateString(
                    "vi-VN",
                  )}
                </TableCell>
                <TableCell>
                  {jobPreparation.endDate.toLocaleDateString(
                    "vi-VN",
                  )}
                </TableCell>
                <TableCell>
                  <Badge
                    className={getStatusColor(
                      jobPreparation.status,
                    )}
                  >
                    {jobPreparation.status === "planned" &&
                      "Đã lên kế hoạch"}
                    {jobPreparation.status === "in-progress" &&
                      "Đang pha"}
                    {jobPreparation.status === "completed" &&
                      "Hoàn thành"}
                    {jobPreparation.status === "delayed" &&
                      "Trễ hạn"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-2 bg-muted rounded-full">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${jobPreparation.progress}%`,
                          backgroundColor: getPantoneColorStyle(
                            jobPreparation.pantoneColor,
                          ),
                        }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {jobPreparation.progress}%
                    </span>
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

        {filteredJobPreparations.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <p className="text-muted-foreground">
                Không tìm thấy lệnh pha mực nào
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={handleCreateJobPreparation}
              >
                Tạo lệnh pha mực đầu tiên
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
