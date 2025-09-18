import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { ProductForm } from "../components/product";
import { Button } from "../components/ui";
import { useProductForm, useProducts, useProductCategories } from "../hooks";
import type { CreateProductRequest, UpdateProductRequest } from "../types";
import { ROUTES } from "../utils";

const ProductFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { product, isLoading, error, isEditing } = useProductForm(id);
  const { createProduct, updateProduct } = useProducts();
  const { categories } = useProductCategories();

  const handleSubmit = async (
    data: CreateProductRequest | UpdateProductRequest
  ) => {
    try {
      if (isEditing && id) {
        await updateProduct(id, data as UpdateProductRequest);
      } else {
        await createProduct(data as CreateProductRequest);
      }
      navigate(ROUTES.PRODUCTS);
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  const handleCancel = () => {
    navigate(ROUTES.PRODUCTS);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-medium text-red-600 mb-2">Lỗi</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={handleCancel} variant="secondary">
            Quay lại
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCancel}
          className="flex items-center"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? "Sửa sản phẩm" : "Thêm sản phẩm mới"}
          </h1>
          <p className="text-gray-600 mt-1">
            {isEditing
              ? "Cập nhật thông tin sản phẩm"
              : "Điền thông tin để tạo sản phẩm mới"}
          </p>
        </div>
      </div>

      {/* Form */}
      <ProductForm
        product={product ?? undefined}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        categories={categories.filter(
          (category): category is string => category !== undefined
        )}
        loading={false}
      />
    </div>
  );
};

export default ProductFormPage;
