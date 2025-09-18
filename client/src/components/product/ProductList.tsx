import { useState } from "react";
import { Plus, Grid, List } from "lucide-react";
import { ProductItem, type Product } from "./ProductItem";
import { Button } from "../ui";

interface ProductListProps {
  products: Product[];
  loading?: boolean;
  onEdit?: (product: Product) => void;
  onDelete?: (productId: string) => void;
  onAdd?: () => void;
  onSelect?: (product: Product) => void;
  selectedProductId?: string;
  showActions?: boolean;
  title?: string;
}

export function ProductList({
  products,
  loading = false,
  onEdit,
  onDelete,
  onAdd,
  onSelect,
  selectedProductId,
  showActions = true,
  title = "List of products",
}: ProductListProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 h-32 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>

        <div className="flex items-center gap-2">
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

          {onAdd && (
            <Button onClick={onAdd} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add New Product
            </Button>
          )}
        </div>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No products available
          </h3>
          <p className="text-gray-500 mb-4">
            Get started by adding your first product
          </p>
          {onAdd && (
            <Button onClick={onAdd}>
              <Plus className="w-4 h-4 mr-2" />
              Add New Product
            </Button>
          )}
        </div>
      ) : (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
              : "space-y-3"
          }
        >
          {products.map((product) => (
            <ProductItem
              key={product.id}
              product={product}
              onEdit={onEdit}
              onDelete={onDelete}
              onSelect={onSelect}
              isSelected={product.id === selectedProductId}
              showActions={showActions}
            />
          ))}
        </div>
      )}

      {products.length > 0 && (
        <div className="text-sm text-gray-500 text-center pt-4">
          Show {products.length} product(s)
        </div>
      )}
    </div>
  );
}
