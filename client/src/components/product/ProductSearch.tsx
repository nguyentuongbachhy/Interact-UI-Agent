import { useState, useEffect, useMemo } from "react";
import { Search, X, SlidersHorizontal } from "lucide-react";
import { Input, Button, Card, CardContent } from "../ui";

export interface SearchFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
}

interface ProductSearchProps {
  onSearch: (query: string, filters: SearchFilters) => void;
  categories?: string[];
  placeholder?: string;
  showFilters?: boolean;
  defaultQuery?: string;
  defaultFilters?: SearchFilters;
}

export function ProductSearch({
  onSearch,
  categories = [],
  placeholder = "Search product...",
  showFilters = true,
  defaultQuery = "",
  defaultFilters = {},
}: ProductSearchProps) {
  const [query, setQuery] = useState(defaultQuery);
  const [filters, setFilters] = useState<SearchFilters>(defaultFilters);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    onSearch(debouncedQuery, filters);
  }, [debouncedQuery, filters, onSearch]);

  const hasActiveFilters = useMemo(() => {
    return (
      filters.category ||
      filters.minPrice !== undefined ||
      filters.maxPrice !== undefined ||
      filters.inStock !== undefined
    );
  }, [filters]);

  const clearFilters = () => {
    setFilters({});
  };

  const clearSearch = () => {
    setQuery("");
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="pl-10 pr-10"
          />
          {query && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {showFilters && (
          <Button
            variant={showFilterPanel ? "primary" : "secondary"}
            onClick={() => setShowFilterPanel(!showFilterPanel)}
            className="relative"
          >
            <SlidersHorizontal className="w-4 h-4" />
            {hasActiveFilters && (
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
            )}
          </Button>
        )}
      </div>

      {showFilterPanel && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900">Filter</h3>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Clear filter
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {categories.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Categories
                    </label>
                    <select
                      value={filters.category || ""}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          category: e.target.value || undefined,
                        }))
                      }
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All categories</option>
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price from
                  </label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={filters.minPrice || ""}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        minPrice: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      }))
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price up to
                  </label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={filters.maxPrice || ""}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        maxPrice: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      }))
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
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
                      setFilters((prev) => ({
                        ...prev,
                        inStock:
                          value === "" ? undefined : value === "in-stock",
                      }));
                    }}
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All</option>
                    <option value="in-stock">In Stock</option>
                    <option value="out-of-stock">Out of Stock</option>
                  </select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {filters.category && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
              Categories: {filters.category}
              <button
                onClick={() =>
                  setFilters((prev) => ({ ...prev, category: undefined }))
                }
                className="hover:text-blue-900"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filters.minPrice !== undefined && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-sm rounded-full">
              Từ: {filters.minPrice.toLocaleString("vi-VN")}đ
              <button
                onClick={() =>
                  setFilters((prev) => ({ ...prev, minPrice: undefined }))
                }
                className="hover:text-green-900"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filters.maxPrice !== undefined && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-sm rounded-full">
              To: {filters.maxPrice.toLocaleString("vi-VN")}đ
              <button
                onClick={() =>
                  setFilters((prev) => ({ ...prev, maxPrice: undefined }))
                }
                className="hover:text-green-900"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filters.inStock !== undefined && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full">
              {filters.inStock ? "Còn hàng" : "Hết hàng"}
              <button
                onClick={() =>
                  setFilters((prev) => ({ ...prev, inStock: undefined }))
                }
                className="hover:text-yellow-900"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
