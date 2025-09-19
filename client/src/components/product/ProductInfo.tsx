import {
  Edit,
  Trash2,
  Package,
  Calendar,
  Tag,
  Check,
  TriangleAlert,
  X,
} from "lucide-react";
import { Button } from "../ui";
import type { Product } from "../../types";
import { formatCurrency, formatDate } from "../../utils";

interface ProductInfoProps {
  product: Product;
  onEdit?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
}

export function ProductInfo({
  product,
  onEdit,
  onDelete,
  showActions = true,
}: ProductInfoProps) {
  const stockStatus =
    product.quantity === 0
      ? "out-of-stock"
      : product.quantity < 5
      ? "low-stock"
      : "in-stock";

  const stockStatusConfig = {
    "in-stock": {
      label: "In stock",
      className: "bg-green-100 text-green-800 border-green-200",
      icon: <Check className="w-4 h-4" />,
    },
    "low-stock": {
      label: "Low stock",
      className: "bg-yellow-100 text-yellow-800 border-yellow-200",
      icon: <TriangleAlert className="w-4 h-4" />,
    },
    "out-of-stock": {
      label: "Out of stock",
      className: "bg-red-100 text-red-800 border-red-200",
      icon: <X className="w-4 h-4" />,
    },
  };

  const currentStatus = stockStatusConfig[stockStatus];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {product.name}
          </h1>

          <div className="flex items-center gap-3 mb-4">
            {product.category && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200">
                <Tag className="w-3 h-3" />
                {product.category}
              </span>
            )}

            <span
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${currentStatus.className}`}
            >
              <span>{currentStatus.icon}</span>
              {currentStatus.label}
            </span>
          </div>
        </div>

        {showActions && (
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={onEdit}
              className="flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Edit
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={onDelete}
              className="flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </Button>
          </div>
        )}
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-100">
        <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          {formatCurrency(product.price)}
        </div>
        <div className="text-sm text-gray-600 mt-1">Retail price</div>
      </div>

      {product.description && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-900">Description</h3>
          <div className="prose prose-sm text-gray-700 bg-gray-50 rounded-lg p-4 border">
            <p className="leading-relaxed">{product.description}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Warehouse information
          </h3>
          <div className="bg-white rounded-lg border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 flex items-center gap-2">
                <Package className="w-4 h-4" />
                Inventory quantity
              </span>
              <span className="font-semibold text-gray-900">
                {product.quantity} products
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-600">Total price</span>
              <span className="font-semibold text-gray-900">
                {formatCurrency(product.price * product.quantity)}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Other Information
          </h3>
          <div className="bg-white rounded-lg border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Created at
              </span>
              <span className="text-sm text-gray-900">
                {formatDate(product.createdAt)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-600 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Latest updated at
              </span>
              <span className="text-sm text-gray-900">
                {formatDate(product.updatedAt)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
