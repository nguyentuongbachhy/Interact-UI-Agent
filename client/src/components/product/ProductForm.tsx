import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Save, X, Image, Package } from "lucide-react";
import {
  Button,
  Input,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "../ui";
import type { Product } from "../../types";

const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z.string().optional(),
  price: z.number().min(0, "Price must be greater than or equal to 0"),
  quantity: z.number().int().min(0, "Quantity must be a positive integer"),
  category: z.string().optional(),
  imageUrl: z.string().url("Invalid image URL").optional().or(z.literal("")),
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-2xl shadow-blue-500/10">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Package className="w-6 h-6" />
              </div>
              <CardTitle className="text-2xl font-bold">
                {isEditing ? "Edit Product" : "Add New Product"}
              </CardTitle>
            </div>
          </CardHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="h-full">
            <CardContent className="p-8 space-y-8">
              {/* Product Basic Info Section */}
              <div className="space-y-6">
                <div className="border-l-4 border-blue-500 pl-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-1">
                    Basic Information
                  </h3>
                  <p className="text-sm text-gray-600">
                    Enter detailed information about the product
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="lg:col-span-2">
                    <Input
                      {...register("name")}
                      label="Product Name"
                      placeholder="Enter product name"
                      error={errors.name?.message}
                      className="text-lg font-medium"
                      required
                    />
                  </div>

                  <div className="lg:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Product Description
                    </label>
                    <div className="relative">
                      <textarea
                        {...register("description")}
                        rows={4}
                        className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none"
                        placeholder="Detailed description of your product..."
                      />
                      <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                        Optional
                      </div>
                    </div>
                    {errors.description && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                        <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                        {errors.description.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Pricing & Inventory Section */}
              <div className="space-y-6">
                <div className="border-l-4 border-green-500 pl-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-1">
                    Price and Inventory
                  </h3>
                  <p className="text-sm text-gray-600">
                    Set selling price and inventory quantity
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="relative">
                    <Input
                      {...register("price", { valueAsNumber: true })}
                      type="number"
                      step="1000"
                      label="Selling Price"
                      placeholder="0"
                      error={errors.price?.message}
                      className="text-right font-semibold text-green-600 pr-16 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                      required
                    />
                    <div className="absolute right-4 top-8.5 text-sm text-gray-500 pointer-events-none">
                      VND
                    </div>
                  </div>

                  <div>
                    <Input
                      {...register("quantity", { valueAsNumber: true })}
                      type="number"
                      label="Inventory Quantity"
                      placeholder="0"
                      error={errors.quantity?.message}
                      className="text-right font-semibold [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Category & Image Section */}
              <div className="space-y-6">
                <div className="border-l-4 border-purple-500 pl-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-1">
                    Category and Image
                  </h3>
                  <p className="text-sm text-gray-600">
                    Categorize product and add illustration image
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    {categories.length > 0 ? (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Product Category
                        </label>
                        <select
                          {...register("category")}
                          className="w-full h-12 rounded-xl border-2 border-gray-200 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                        >
                          <option value="">Select category</option>
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
                        label="Product Category"
                        placeholder="Enter category"
                        error={errors.category?.message}
                      />
                    )}
                  </div>

                  <div>
                    <Input
                      {...register("imageUrl")}
                      type="url"
                      label="Image URL"
                      placeholder="https://example.com/image.jpg"
                      error={errors.imageUrl?.message}
                    />
                  </div>
                </div>

                {/* Image Preview */}
                {imageUrl && (
                  <div className="mt-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      <Image className="w-4 h-4 inline mr-2" />
                      Image Preview
                    </label>
                    <div className="relative group">
                      <div className="w-48 h-48 mx-auto lg:mx-0 border-2 border-dashed border-gray-300 rounded-2xl overflow-hidden bg-gray-50 group-hover:border-purple-400 transition-colors duration-200">
                        <img
                          src={imageUrl}
                          alt="Preview"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = "none";
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Error Display */}
              {error && (
                <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <X className="h-5 w-5 text-red-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-800 font-medium">
                        {error}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>

            <CardFooter className="bg-gray-50/50 px-8 py-6 rounded-b-lg border-t border-gray-100">
              <div className="flex justify-end gap-4 w-full">
                {onCancel && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={onCancel}
                    disabled={loading}
                    className="px-6 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-all duration-200"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                )}
                <Button
                  type="submit"
                  loading={loading}
                  disabled={loading}
                  className="px-8 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isEditing ? "Update Product" : "Add Product"}
                </Button>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
