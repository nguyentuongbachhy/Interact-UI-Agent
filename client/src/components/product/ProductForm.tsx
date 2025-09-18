import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Save, X } from "lucide-react";
import {
  Button,
  Input,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "../ui";
import type { Product } from "./ProductItem";

const productSchema = z.object({
  name: z.string().min(1, "Tên sản phẩm là bắt buộc"),
  description: z.string().optional(),
  price: z.number().min(0, "Giá phải lớn hơn hoặc bằng 0"),
  quantity: z.number().int().min(0, "Số lượng phải là số nguyên dương"),
  category: z.string().optional(),
  imageUrl: z
    .string()
    .url("URL hình ảnh không hợp lệ")
    .optional()
    .or(z.literal("")),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormProps {
  product?: Product;
  onSubmit: (data: ProductFormData) => Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
  error?: string;
  categories?: string[];
}

export function ProductForm({
  product,
  onSubmit,
  onCancel,
  loading = false,
  error,
  categories = [],
}: ProductFormProps) {
  const isEditing = Boolean(product);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: product
      ? {
          name: product.name,
          description: product.description || "",
          price: product.price,
          quantity: product.quantity,
          category: product.category || "",
          imageUrl: product.imageUrl || "",
        }
      : {
          name: "",
          description: "",
          price: 0,
          quantity: 0,
          category: "",
          imageUrl: "",
        },
  });

  const imageUrl = watch("imageUrl");

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>
          {isEditing ? "Sửa sản phẩm" : "Thêm sản phẩm mới"}
        </CardTitle>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Input
                {...register("name")}
                label="Tên sản phẩm *"
                placeholder="Nhập tên sản phẩm"
                error={errors.name?.message}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mô tả
              </label>
              <textarea
                {...register("description")}
                rows={3}
                className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Nhập mô tả sản phẩm"
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.description.message}
                </p>
              )}
            </div>

            <div>
              <Input
                {...register("price", { valueAsNumber: true })}
                type="number"
                step="0.01"
                label="Giá (VNĐ) *"
                placeholder="0"
                error={errors.price?.message}
              />
            </div>

            <div>
              <Input
                {...register("quantity", { valueAsNumber: true })}
                type="number"
                label="Số lượng *"
                placeholder="0"
                error={errors.quantity?.message}
              />
            </div>

            <div>
              {categories.length > 0 ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Danh mục
                  </label>
                  <select
                    {...register("category")}
                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Chọn danh mục</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <Input
                  {...register("category")}
                  label="Danh mục"
                  placeholder="Nhập danh mục"
                  error={errors.category?.message}
                />
              )}
            </div>

            <div>
              <Input
                {...register("imageUrl")}
                type="url"
                label="URL hình ảnh"
                placeholder="https://example.com/image.jpg"
                error={errors.imageUrl?.message}
              />
            </div>
          </div>

          {imageUrl && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Xem trước hình ảnh
              </label>
              <div className="w-32 h-32 border rounded-lg overflow-hidden">
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = "none";
                  }}
                />
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {error}
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-end gap-2">
          {onCancel && (
            <Button
              type="button"
              variant="ghost"
              onClick={onCancel}
              disabled={loading}
            >
              <X className="w-4 h-4 mr-2" />
              Hủy
            </Button>
          )}
          <Button type="submit" loading={loading} disabled={loading}>
            <Save className="w-4 h-4 mr-2" />
            {isEditing ? "Cập nhật" : "Thêm sản phẩm"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
