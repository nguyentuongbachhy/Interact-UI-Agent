import { Trash2, Edit, Package } from "lucide-react";
import { Button, Card, CardContent } from "../ui";
import type React from "react";

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  quantity: number;
  category?: string;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ProductItemProps {
  product: Product;
  onEdit?: (product: Product) => void;
  onDelete?: (productId: string) => void;
  onSelect?: (product: Product) => void;
  isSelected?: boolean;
  showActions?: boolean;
}

export function ProductItem({
  product,
  onEdit,
  onDelete,
  onSelect,
  isSelected = false,
  showActions = true,
}: ProductItemProps) {
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(product);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete product ${product.name}?`)) {
      onDelete?.(product.id);
    }
  };

  const handleClick = () => {
    onSelect?.(product);
  };

  return (
    <Card
      className={`group cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.02] border-0 shadow-sm bg-gradient-to-br from-white to-gray-50 ${
        isSelected
          ? "ring-2 ring-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 shadow-blue-200/50"
          : "hover:shadow-gray-200/80"
      }`}
      onClick={handleClick}
    >
      <CardContent className="p-3">
        <div className="flex flex-col h-full">
          {/* Action Buttons - Top Right */}
          {showActions && (
            <div className="flex justify-end gap-4 mt-3 opacity-0 group-hover:opacity-100 transition-all duration-300">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleEdit}
                className="h-7 w-7 p-0 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 border border-blue-200/50 hover:border-blue-300 transition-all duration-200"
                title="Chỉnh sửa"
              >
                <Edit className="w-6 h-6" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                className="h-7 w-7 p-0 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 hover:text-red-700 border border-red-200/50 hover:border-red-300 transition-all duration-200"
                title="Xóa"
              >
                <Trash2 className="w-6 h-6" />
              </Button>
            </div>
          )}

          {/* Product Image/Icon */}
          <div className="relative flex-shrink-0 mx-auto mb-2">
            {product.imageUrl ? (
              <div className="relative overflow-hidden rounded-xl">
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="p-1 w-full max-w-64 aspect-square object-cover transition-transform duration-300 group-hover:scale-100"
                />
                {/* <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300 rounded-xl" /> */}
              </div>
            ) : (
              <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center border border-gray-200/50 group-hover:from-gray-200 group-hover:to-gray-300 transition-all duration-300">
                <Package className="w-8 h-8 text-gray-500 group-hover:text-gray-600 transition-colors duration-300" />
              </div>
            )}

            {/* Quantity Badge */}
            <div className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs font-semibold px-1.5 py-0.5 rounded-full shadow-lg min-w-[20px] text-center">
              {product.quantity}
            </div>
          </div>

          {/* Product Details */}
          <div className="flex-1 flex flex-col justify-between text-start">
            {/* Title */}
            <h3
              className="font-bold text-base text-gray-900 group-hover:text-blue-600 transition-colors duration-300 mb-1 line-clamp-2 leading-tight"
              title={product.name}
            >
              {product.name}
            </h3>

            {/* Category */}
            {product.category && (
              <div className="mb-1">
                <span className="inline-block text-xs bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 px-2 py-0.5 rounded-full font-medium border border-blue-200/50">
                  {product.category}
                </span>
              </div>
            )}

            {/* Description */}
            {product.description && (
              <p
                className="text-xs text-gray-600 line-clamp-5 leading-relaxed mb-2 flex-1"
                title={product.description}
              >
                {product.description}
              </p>
            )}

            {/* Price */}
            <div className="mt-auto flex items-center justify-between">
              <div className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-1">
                {product.price.toLocaleString("vi-VN")}đ
              </div>

              {/* Update Info */}
              <div className="text-xs text-gray-400">
                <span>Cập nhật: </span>
                <span className="font-medium">
                  {new Date(product.createdAt ?? "").toLocaleDateString(
                    "vi-VN"
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
