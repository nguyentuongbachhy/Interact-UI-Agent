import { useState, useEffect } from "react";
import { Search, X, Filter, Calendar } from "lucide-react";
import { Button, Input } from "../ui";
import { useDebounce } from "../../hooks";

export interface NotificationFilterOptions {
  query?: string;
  type?: "all" | "info" | "success" | "warning" | "error" | "system";
  status?: "all" | "read" | "unread";
  dateRange?: "all" | "today" | "yesterday" | "week" | "month";
}

interface NotificationFiltersProps {
  filters: NotificationFilterOptions;
  onFiltersChange: (filters: NotificationFilterOptions) => void;
  onReset: () => void;
  totalCount?: number;
  filteredCount?: number;
}

const typeOptions = [
  { value: "all", label: "Tất cả loại", color: "gray" },
  { value: "info", label: "Thông tin", color: "blue" },
  { value: "success", label: "Thành công", color: "green" },
  { value: "warning", label: "Cảnh báo", color: "yellow" },
  { value: "error", label: "Lỗi", color: "red" },
  { value: "system", label: "Hệ thống", color: "purple" },
];

const statusOptions = [
  { value: "all", label: "Tất cả" },
  { value: "unread", label: "Chưa đọc" },
  { value: "read", label: "Đã đọc" },
];

const dateOptions = [
  { value: "all", label: "Tất cả thời gian" },
  { value: "today", label: "Hôm nay" },
  { value: "yesterday", label: "Hôm qua" },
  { value: "week", label: "Tuần này" },
  { value: "month", label: "Tháng này" },
];

export function NotificationFilters({
  filters,
  onFiltersChange,
  onReset,
  totalCount = 0,
  filteredCount = 0,
}: NotificationFiltersProps) {
  const [searchQuery, setSearchQuery] = useState(filters.query || "");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const debouncedQuery = useDebounce(searchQuery, 300);

  useEffect(() => {
    if (debouncedQuery !== filters.query) {
      onFiltersChange({ ...filters, query: debouncedQuery });
    }
  }, [debouncedQuery]);

  const hasActiveFilters =
    filters.query ||
    (filters.type && filters.type !== "all") ||
    (filters.status && filters.status !== "all") ||
    (filters.dateRange && filters.dateRange !== "all");

  const handleFilterChange = (
    key: keyof NotificationFilterOptions,
    value: any
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearSearch = () => {
    setSearchQuery("");
    onFiltersChange({ ...filters, query: "" });
  };

  const getTypeColorClass = (type: string) => {
    const typeConfig = typeOptions.find((option) => option.value === type);
    const color = typeConfig?.color || "gray";

    return {
      gray: "bg-gray-100 text-gray-800 border-gray-200",
      blue: "bg-blue-100 text-blue-800 border-blue-200",
      green: "bg-green-100 text-green-800 border-green-200",
      yellow: "bg-yellow-100 text-yellow-800 border-yellow-200",
      red: "bg-red-100 text-red-800 border-red-200",
      purple: "bg-purple-100 text-purple-800 border-purple-200",
    }[color];
  };

  return (
    <div className="bg-white rounded-lg border p-4 space-y-4">
      {/* Search Bar */}
      <div className="flex items-center space-x-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm thông báo..."
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <Button
          variant={showAdvanced ? "primary" : "secondary"}
          size="sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center space-x-1"
        >
          <Filter className="w-4 h-4" />
          <span>Bộ lọc</span>
        </Button>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="text-red-600 hover:text-red-700"
          >
            <X className="w-4 h-4 mr-1" />
            Xóa bộ lọc
          </Button>
        )}
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
          {/* Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Loại thông báo
            </label>
            <select
              value={filters.type || "all"}
              onChange={(e) => handleFilterChange("type", e.target.value)}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {typeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Trạng thái
            </label>
            <select
              value={filters.status || "all"}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Thời gian
            </label>
            <select
              value={filters.dateRange || "all"}
              onChange={(e) => handleFilterChange("dateRange", e.target.value)}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {dateOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 pt-2 border-t">
          <span className="text-sm text-gray-600">Bộ lọc đang áp dụng:</span>

          {filters.query && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
              Tìm kiếm: "{filters.query}"
              <button
                onClick={() => handleFilterChange("query", "")}
                className="hover:text-blue-900"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.type && filters.type !== "all" && (
            <span
              className={`inline-flex items-center gap-1 px-2 py-1 text-sm rounded-full border ${getTypeColorClass(
                filters.type
              )}`}
            >
              {typeOptions.find((opt) => opt.value === filters.type)?.label}
              <button
                onClick={() => handleFilterChange("type", "all")}
                className="hover:opacity-70"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.status && filters.status !== "all" && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-800 text-sm rounded-full border border-gray-200">
              {statusOptions.find((opt) => opt.value === filters.status)?.label}
              <button
                onClick={() => handleFilterChange("status", "all")}
                className="hover:text-gray-900"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.dateRange && filters.dateRange !== "all" && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 text-sm rounded-full border border-purple-200">
              <Calendar className="w-3 h-3" />
              {
                dateOptions.find((opt) => opt.value === filters.dateRange)
                  ?.label
              }
              <button
                onClick={() => handleFilterChange("dateRange", "all")}
                className="hover:text-purple-900"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      )}

      {/* Results Summary */}
      {totalCount > 0 && (
        <div className="text-sm text-gray-600 pt-2 border-t">
          {hasActiveFilters ? (
            <>
              Hiển thị {filteredCount} / {totalCount} thông báo
            </>
          ) : (
            <>Tổng cộng {totalCount} thông báo</>
          )}
        </div>
      )}
    </div>
  );
}
