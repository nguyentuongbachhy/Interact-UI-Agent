import React from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Edit, Trash2, AlertCircle, RefreshCw } from "lucide-react";
import { ProductDetail } from "../components/product";
import { Button } from "../components/ui";
import { useProductDetail, useProducts } from "../hooks";
import { useAppStore } from "../store";
import { ROUTES } from "../utils";

const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useAppStore();
  const { deleteProduct } = useProducts();

  const { product, isLoading, error, refetch } = useProductDetail(id!);

  const handleBack = () => {
    navigate(ROUTES.PRODUCTS);
  };

  const handleEdit = () => {
    if (product) {
      navigate(`/products/${product.id}/edit`);
    }
  };

  const handleDelete = async () => {
    if (!product) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete product "${product.name}"?\nThis action cannot be undone.`
    );

    if (confirmed) {
      try {
        await deleteProduct(product.id);
        showToast("Product deleted successfully", "success");
        navigate(ROUTES.PRODUCTS);
      } catch (error) {
        console.error("Delete failed:", error);
      }
    }
  };

  const handleRetry = () => {
    refetch();
  };

  if (!id) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Invalid product ID
          </h2>
          <Button onClick={handleBack} variant="secondary">
            Back to list
          </Button>
        </div>
      </div>
    );
  }

  if (error && !isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Cannot load product
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <Button onClick={handleRetry} variant="primary">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try again
            </Button>
            <Button onClick={handleBack} variant="secondary">
              Back to list
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          {/* Breadcrumb */}
          <nav className="flex items-center space-x-2 text-sm text-gray-500">
            <Link
              to={ROUTES.HOME}
              className="hover:text-gray-700 transition-colors"
            >
              Home
            </Link>
            <span>/</span>
            <Link
              to={ROUTES.PRODUCTS}
              className="hover:text-gray-700 transition-colors"
            >
              Products
            </Link>
            <span>/</span>
            <span className="text-gray-900 font-medium">
              {isLoading ? "Loading..." : product?.name || "Details"}
            </span>
          </nav>

          {/* Back Button */}
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="flex items-center"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to list
            </Button>

            {product && !isLoading && (
              <div className="flex items-center space-x-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleEdit}
                  className="flex items-center"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleDelete}
                  className="flex items-center"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Refresh Button */}
        {!isLoading && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRetry}
            className="flex items-center"
            title="Reload"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Product Detail Content */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        {product ? (
          <ProductDetail
            product={product}
            onEdit={handleEdit}
            onDelete={handleDelete}
            showActions={false}
            loading={isLoading}
          />
        ) : (
          <ProductDetail
            product={{} as any}
            loading={isLoading}
            showActions={false}
          />
        )}
      </div>

      {/* Related Actions */}
      {product && !isLoading && (
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Other actions
          </h3>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate(ROUTES.PRODUCT_NEW)}
            >
              Add similar product
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                if (product.category) {
                  navigate(
                    `${ROUTES.PRODUCTS}?category=${encodeURIComponent(
                      product.category
                    )}`
                  );
                }
              }}
            >
              View products in same category
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate(ROUTES.PRODUCTS)}
            >
              All products
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetailPage;
