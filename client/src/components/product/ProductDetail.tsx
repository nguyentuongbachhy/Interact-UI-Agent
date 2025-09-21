import { ProductGallery } from "./ProductGallery";
import { ProductInfo } from "./ProductInfo";
import type { Product } from "../../types";

interface ProductDetailProps {
  product: Product;
  onEdit?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
  loading?: boolean;
}

export function ProductDetail({
  product,
  onEdit,
  onDelete,
  showActions = true,
  loading = false,
}: ProductDetailProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-pulse">
        <div className="space-y-4">
          <div className="aspect-square bg-gray-200 rounded-lg" />
          <div className="flex gap-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="w-16 h-16 bg-gray-200 rounded-md" />
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <div className="h-8 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
          </div>

          <div className="h-24 bg-gray-200 rounded-lg" />

          <div className="space-y-3">
            <div className="h-6 bg-gray-200 rounded w-1/3" />
            <div className="h-20 bg-gray-200 rounded" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="h-32 bg-gray-200 rounded" />
            <div className="h-32 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  const productImages = product.imageUrl ? [product.imageUrl] : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="col-span-1 order-2 lg:order-1">
        <ProductGallery images={productImages} productName={product.name} />
      </div>

      <div className="col-span-1 order-1 lg:col-span-2 lg:order-2">
        <ProductInfo
          product={product}
          onEdit={onEdit}
          onDelete={onDelete}
          showActions={showActions}
        />
      </div>
    </div>
  );
}
