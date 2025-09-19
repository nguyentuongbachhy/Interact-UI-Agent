import { useState } from "react";
import {
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Calendar,
  DollarSign,
  Package,
  Tag,
} from "lucide-react";
import { Button, Input, Card, CardContent } from "../ui";
import type { SearchFilters } from "../../types";

interface AdvancedFiltersProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  onReset: () => void;
  categories: string[];
  isExpanded?: boolean;
  onToggle?: () => void;
  showToggle?: boolean;
}

interface PriceRange {
  min: string;
  max: string;
}

interface StockRange {
  min: string;
  max: string;
}

export function AdvancedFilters({
  filters,
  onFiltersChange,
  onReset,
  categories,
  isExpanded = false,
  onToggle,
  showToggle = true,
}: AdvancedFiltersProps) {
  const [priceRange, setPriceRange] = useState<PriceRange>({
    min: filters.minPrice?.toString() || "",
    max: filters.maxPrice?.toString() || "",
  });

  const [stockRange, setStockRange] = useState<StockRange>({
    min: filters.minStock?.toString() || "",
    max: filters.maxStock?.toString() || "",
  });

  const hasActiveFilters = Object.keys(filters).some((key) => {
    const value = filters[key as keyof SearchFilters];
    return value !== undefined && value !== null && value !== "";
  });

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    const newFilters = { ...filters };

    if (value === "" || value === undefined || value === null) {
      delete newFilters[key];
    } else {
      newFilters[key] = value;
    }

    onFiltersChange(newFilters);
  };

  const handlePriceChange = (type: "min" | "max", value: string) => {
    const newPriceRange = { ...priceRange, [type]: value };
    setPriceRange(newPriceRange);

    const numValue = value === "" ? undefined : parseFloat(value);
    if (type === "min") {
      handleFilterChange("minPrice", numValue);
    } else {
      handleFilterChange("maxPrice", numValue);
    }
  };

  const handleStockChange = (type: "min" | "max", value: string) => {
    const newStockRange = { ...stockRange, [type]: value };
    setStockRange(newStockRange);

    const numValue = value === "" ? undefined : parseInt(value);
    if (type === "min") {
      handleFilterChange("minStock", numValue);
    } else {
      handleFilterChange("maxStock", numValue);
    }
  };

  const getStockStatusLabel = (status: boolean | undefined) => {
    if (status === true) return "In Stock";
    if (status === false) return "Out of Stock";
    return "All";
  };

  const filterSections = [
    {
      id: "category",
      title: "Category",
      icon: Tag,
      content: (
        <div>
          <select
            value={filters.category || ""}
            onChange={(e) =>
              handleFilterChange("category", e.target.value || undefined)
            }
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
      ),
    },
    {
      id: "price",
      title: "Price Range",
      icon: DollarSign,
      content: (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="number"
              placeholder="Min price"
              value={priceRange.min}
              onChange={(e) => handlePriceChange("min", e.target.value)}
              min="0"
              step="0.01"
            />
            <Input
              type="number"
              placeholder="Max price"
              value={priceRange.max}
              onChange={(e) => handlePriceChange("max", e.target.value)}
              min="0"
              step="0.01"
            />
          </div>
          <div className="text-xs text-gray-500">
            {priceRange.min && priceRange.max
              ? `₫${parseInt(priceRange.min).toLocaleString(
                  "vi-VN"
                )} - ₫${parseInt(priceRange.max).toLocaleString("vi-VN")}`
              : priceRange.min
              ? `From ₫${parseInt(priceRange.min).toLocaleString("vi-VN")}`
              : priceRange.max
              ? `Up to ₫${parseInt(priceRange.max).toLocaleString("vi-VN")}`
              : "All prices"}
          </div>
        </div>
      ),
    },
    {
      id: "stock",
      title: "Stock Status",
      icon: Package,
      content: (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Availability
            </label>
            <select
              value={
                filters.inStock === undefined
                  ? ""
                  : filters.inStock
                  ? "in-stock"
                  : "out-of-stock"
              }
              onChange={(e) => {
                const value = e.target.value;
                handleFilterChange(
                  "inStock",
                  value === "" ? undefined : value === "in-stock"
                );
              }}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All</option>
              <option value="in-stock">In Stock</option>
              <option value="out-of-stock">Out of Stock</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantity Range
            </label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                placeholder="Min qty"
                value={stockRange.min}
                onChange={(e) => handleStockChange("min", e.target.value)}
                min="0"
              />
              <Input
                type="number"
                placeholder="Max qty"
                value={stockRange.max}
                onChange={(e) => handleStockChange("max", e.target.value)}
                min="0"
              />
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "date",
      title: "Date Added",
      icon: Calendar,
      content: (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              From Date
            </label>
            <Input
              type="date"
              value={filters.dateFrom || ""}
              onChange={(e) =>
                handleFilterChange("dateFrom", e.target.value || undefined)
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              To Date
            </label>
            <Input
              type="date"
              value={filters.dateTo || ""}
              onChange={(e) =>
                handleFilterChange("dateTo", e.target.value || undefined)
              }
            />
          </div>
        </div>
      ),
    },
  ];

  // Active filters summary
  const getActiveFiltersCount = () => {
    return Object.keys(filters).filter((key) => {
      const value = filters[key as keyof SearchFilters];
      return value !== undefined && value !== null && value !== "";
    }).length;
  };

  const renderActiveFilters = () => {
    const activeFilters = [];

    if (filters.category) {
      activeFilters.push(
        <span
          key="category"
          className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
        >
          <Tag className="w-3 h-3" />
          {filters.category}
          <button
            onClick={() => handleFilterChange("category", undefined)}
            className="hover:text-blue-900"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      );
    }

    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      const priceText =
        filters.minPrice && filters.maxPrice
          ? `₫${filters.minPrice.toLocaleString()} - ₫${filters.maxPrice.toLocaleString()}`
          : filters.minPrice
          ? `From ₫${filters.minPrice.toLocaleString()}`
          : `Up to ₫${filters.maxPrice?.toLocaleString()}`;

      activeFilters.push(
        <span
          key="price"
          className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-sm rounded-full"
        >
          <DollarSign className="w-3 h-3" />
          {priceText}
          <button
            onClick={() => {
              handleFilterChange("minPrice", undefined);
              handleFilterChange("maxPrice", undefined);
              setPriceRange({ min: "", max: "" });
            }}
            className="hover:text-green-900"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      );
    }

    if (filters.inStock !== undefined) {
      activeFilters.push(
        <span
          key="stock"
          className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full"
        >
          <Package className="w-3 h-3" />
          {getStockStatusLabel(filters.inStock)}
          <button
            onClick={() => handleFilterChange("inStock", undefined)}
            className="hover:text-yellow-900"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      );
    }

    if (filters.dateFrom || filters.dateTo) {
      const dateText =
        filters.dateFrom && filters.dateTo
          ? `${filters.dateFrom} to ${filters.dateTo}`
          : filters.dateFrom
          ? `From ${filters.dateFrom}`
          : `Until ${filters.dateTo}`;

      activeFilters.push(
        <span
          key="date"
          className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 text-sm rounded-full"
        >
          <Calendar className="w-3 h-3" />
          {dateText}
          <button
            onClick={() => {
              handleFilterChange("dateFrom", undefined);
              handleFilterChange("dateTo", undefined);
            }}
            className="hover:text-purple-900"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      );
    }

    return activeFilters;
  };

  return (
    <Card>
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-600" />
            <h3 className="font-medium text-gray-900">
              Advanced Filters
              {getActiveFiltersCount() > 0 && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {getActiveFiltersCount()}
                </span>
              )}
            </h3>
          </div>

          <div className="flex items-center space-x-2">
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onReset}
                className="text-red-600 hover:text-red-700"
              >
                <RotateCcw className="w-4 h-4 mr-1" />
                Reset
              </Button>
            )}

            {showToggle && onToggle && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggle}
                className="flex items-center"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="w-4 h-4 mr-1" />
                    Collapse
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4 mr-1" />
                    Expand
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Active Filters */}
        {hasActiveFilters && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">{renderActiveFilters()}</div>
          </div>
        )}

        {/* Filter Sections */}
        {isExpanded && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filterSections.map((section) => (
              <div key={section.id} className="space-y-2">
                <div className="flex items-center space-x-2">
                  <section.icon className="w-4 h-4 text-gray-600" />
                  <h4 className="font-medium text-gray-900">{section.title}</h4>
                </div>
                {section.content}
              </div>
            ))}
          </div>
        )}

        {/* Quick Filters (always visible) */}
        {!isExpanded && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={filters.category || ""}
                onChange={(e) =>
                  handleFilterChange("category", e.target.value || undefined)
                }
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stock Status
              </label>
              <select
                value={
                  filters.inStock === undefined
                    ? ""
                    : filters.inStock
                    ? "in-stock"
                    : "out-of-stock"
                }
                onChange={(e) => {
                  const value = e.target.value;
                  handleFilterChange(
                    "inStock",
                    value === "" ? undefined : value === "in-stock"
                  );
                }}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All</option>
                <option value="in-stock">In Stock</option>
                <option value="out-of-stock">Out of Stock</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min Price
              </label>
              <Input
                type="number"
                placeholder="₫0"
                value={priceRange.min}
                onChange={(e) => handlePriceChange("min", e.target.value)}
                min="0"
                step="1000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Price
              </label>
              <Input
                type="number"
                placeholder="₫999,999"
                value={priceRange.max}
                onChange={(e) => handlePriceChange("max", e.target.value)}
                min="0"
                step="1000"
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
