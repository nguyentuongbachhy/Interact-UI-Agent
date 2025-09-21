import { useState } from "react";
import {
  Grid,
  List,
  Download,
  Package,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button, Card, CardContent } from "../ui";
import { ProductItem } from "../product";
import type { Product } from "../../types";

interface SearchResult {
  products: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface SearchResultsProps {
  results: SearchResult | null;
  query: string;
  isLoading: boolean;
  onProductSelect?: (product: Product) => void;
  onProductEdit?: (product: Product) => void;
  onProductDelete?: (productId: string) => void;
  onExport?: () => void;
  onPageChange?: (page: number) => void;
  showActions?: boolean;
}

type ViewMode = "grid" | "list";
type SortOption = "name" | "price" | "quantity" | "createdAt";
type SortDirection = "asc" | "desc";

export function SearchResults({
  results,
  query,
  isLoading,
  onProductSelect,
  onProductEdit,
  onProductDelete,
  onExport,
  onPageChange,
  showActions = true,
}: SearchResultsProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortBy, setSortBy] = useState<SortOption>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Searching...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!results) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-12">
            <Package className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Start Your Search
            </h3>
            <p className="text-gray-600">
              Enter keywords or use filters to find products
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (results.products.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-12">
            <Package className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Results Found
            </h3>
            <p className="text-gray-600 mb-4">
              {query ? (
                <>
                  No products found for{" "}
                  <span className="font-medium">"{query}"</span>
                </>
              ) : (
                "No products match your filters"
              )}
            </p>
            <div className="space-y-2 text-sm text-gray-500">
              <p>Try:</p>
              <ul className="space-y-1">
                <li>• Using different keywords</li>
                <li>• Removing some filters</li>
                <li>• Checking for typos</li>
                <li>• Using more general terms</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Sort products
  const sortedProducts = [...results.products].sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (sortBy) {
      case "name":
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case "price":
        aValue = a.price;
        bValue = b.price;
        break;
      case "quantity":
        aValue = a.quantity;
        bValue = b.quantity;
        break;
      case "createdAt":
        aValue = new Date(a.createdAt).getTime();
        bValue = new Date(b.createdAt).getTime();
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
    if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  // const handleSort = (option: SortOption) => {
  //   if (sortBy === option) {
  //     setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
  //   } else {
  //     setSortBy(option);
  //     setSortDirection("asc");
  //   }
  // };

  const renderPagination = () => {
    if (results.totalPages <= 1) return null;

    const maxPages = 5;
    const startPage = Math.max(1, results.page - Math.floor(maxPages / 2));
    const endPage = Math.min(results.totalPages, startPage + maxPages - 1);

    return (
      <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 mt-6">
        <div className="flex flex-1 justify-between sm:hidden">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onPageChange?.(Math.max(1, results.page - 1))}
            disabled={results.page <= 1}
          >
            Previous
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              onPageChange?.(Math.min(results.totalPages, results.page + 1))
            }
            disabled={results.page >= results.totalPages}
          >
            Next
          </Button>
        </div>

        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Showing{" "}
              <span className="font-medium">
                {Math.min(
                  (results.page - 1) * results.limit + 1,
                  results.total
                )}
              </span>{" "}
              to{" "}
              <span className="font-medium">
                {Math.min(results.page * results.limit, results.total)}
              </span>{" "}
              of <span className="font-medium">{results.total}</span> results
            </p>
          </div>

          <div>
            <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onPageChange?.(Math.max(1, results.page - 1))}
                disabled={results.page <= 1}
                className="rounded-l-md"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              {Array.from({ length: endPage - startPage + 1 }, (_, i) => {
                const pageNum = startPage + i;
                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === results.page ? "primary" : "ghost"}
                    size="sm"
                    onClick={() => onPageChange?.(pageNum)}
                    className="rounded-none min-w-[40px]"
                  >
                    {pageNum}
                  </Button>
                );
              })}

              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  onPageChange?.(Math.min(results.totalPages, results.page + 1))
                }
                disabled={results.page >= results.totalPages}
                className="rounded-r-md"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </nav>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Results Header */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  {results.total} Results
                </h3>
                {query && (
                  <p className="text-sm text-gray-600">
                    for <span className="font-medium">"{query}"</span>
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {/* Sort Options */}
              <div className="flex items-center space-x-1">
                <span className="text-sm text-gray-600">Sort:</span>
                <select
                  value={`${sortBy}-${sortDirection}`}
                  onChange={(e) => {
                    const [field, direction] = e.target.value.split("-");
                    setSortBy(field as SortOption);
                    setSortDirection(direction as SortDirection);
                  }}
                  className="text-sm border border-gray-300 rounded px-2 py-1"
                >
                  <option value="name-asc">Name A-Z</option>
                  <option value="name-desc">Name Z-A</option>
                  <option value="price-asc">Price Low-High</option>
                  <option value="price-desc">Price High-Low</option>
                  <option value="quantity-desc">Stock High-Low</option>
                  <option value="createdAt-desc">Newest First</option>
                  <option value="createdAt-asc">Oldest First</option>
                </select>
              </div>

              {/* View Toggle */}
              <div className="flex rounded-md shadow-sm">
                <Button
                  variant={viewMode === "grid" ? "primary" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="rounded-r-none"
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "primary" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="rounded-l-none border-l-0"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>

              {/* Export Button */}
              {onExport && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onExport}
                  className="flex items-center"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Grid/List */}
      <div
        className={
          viewMode === "grid"
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            : "space-y-3"
        }
      >
        {sortedProducts.map((product) => (
          <ProductItem
            key={product.id}
            product={product}
            onEdit={onProductEdit}
            onDelete={onProductDelete}
            onSelect={onProductSelect}
            showActions={showActions}
          />
        ))}
      </div>

      {/* Pagination */}
      {renderPagination()}
    </div>
  );
}
