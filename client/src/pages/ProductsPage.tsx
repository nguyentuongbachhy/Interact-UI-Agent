import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { ProductList } from "../components/product";
import { Button } from "../components/ui";
import { useProducts } from "../hooks";
import { ROUTES } from "../utils";

const ProductsPage: React.FC = () => {
  const {
    products,
    fetchProducts,
    deleteProduct,
    isLoading,
    total,
    page,
    limit,
    setPage,
  } = useProducts();

  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  // Load products on mount
  useEffect(() => {
    // Only fetch if we don't have products yet
    if (products.length === 0) {
      fetchProducts();
    }
  }, []);

  const handleProductEdit = (product: any) => {
    // Navigate to edit page
    window.location.href = `/products/${product.id}/edit`;
  };

  const handleProductDelete = async (productId: string) => {
    try {
      await deleteProduct(productId);
    } catch (error) {
      console.error("Failed to delete product:", error);
    }
  };

  const handleProductSelect = (product: any) => {
    // Toggle product selection
    setSelectedProducts((prev) =>
      prev.includes(product.id)
        ? prev.filter((id) => id !== product.id)
        : [...prev, product.id]
    );
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Product</h1>
          <p className="text-gray-600 mt-1">Manage your product list</p>
        </div>
        <Link to={ROUTES.PRODUCT_NEW}>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add product
          </Button>
        </Link>
      </div>

      {/* Temporarily disable search for testing */}
      {/* <ProductSearch
        onSearch={handleSearch}
        categories={categories.filter(
          (category): category is string => category !== undefined
        )}
        placeholder="Tìm kiếm sản phẩm..."
        showFilters={true}
        defaultQuery={searchQuery}
        defaultFilters={filters}
      /> */}

      {/* Active Filters Summary */}
      {/* {hasActiveFilters && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Filter className="h-4 w-4 text-blue-600 mr-2" />
              <span className="text-sm font-medium text-blue-800">
                Đang áp dụng bộ lọc
              </span>
            </div>
            <button
              onClick={clearSearch}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Xóa tất cả
            </button>
          </div>
        </div>
      )} */}

      {/* Products List */}
      <ProductList
        products={products}
        loading={isLoading}
        onEdit={handleProductEdit}
        onDelete={handleProductDelete}
        onSelect={handleProductSelect}
        selectedProductId={
          selectedProducts.length === 1 ? selectedProducts[0] : undefined
        }
        showActions={true}
        title="Product list"
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={() => handlePageChange(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
              className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Show{" "}
                <span className="font-medium">
                  {Math.min((page - 1) * limit + 1, total)}
                </span>{" "}
                -{" "}
                <span className="font-medium">
                  {Math.min(page * limit, total)}
                </span>{" "}
                per <span className="font-medium">{total}</span> results
              </p>
            </div>
            <div>
              <nav
                className="isolate inline-flex -space-x-px rounded-md shadow-sm"
                aria-label="Pagination"
              >
                <button
                  onClick={() => handlePageChange(Math.max(1, page - 1))}
                  disabled={page <= 1}
                  className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Previous</span>
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>

                {/* Page numbers */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum =
                    Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
                  if (pageNum <= totalPages) {
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                          page === pageNum
                            ? "z-10 bg-blue-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                            : "text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  }
                  return null;
                })}

                <button
                  onClick={() =>
                    handlePageChange(Math.min(totalPages, page + 1))
                  }
                  disabled={page >= totalPages}
                  className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Next</span>
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Actions (if products selected) */}
      {selectedProducts.length > 0 && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white shadow-lg rounded-lg border border-gray-200 p-4">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-900">
              {selectedProducts.length} products selected
            </span>
            <div className="flex space-x-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedProducts([])}
              >
                Deselect
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  if (
                    confirm(
                      `Bạn có chắc muốn xóa ${selectedProducts.length} sản phẩm?`
                    )
                  ) {
                    // Handle bulk delete
                    console.log("Bulk delete:", selectedProducts);
                  }
                }}
              >
                Delete selected
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsPage;
