import { useCallback, useEffect } from "react";
import { useProductStore } from "../store";
import { useAppStore } from "../store";
import type {
  Product,
  Category,
  CreateProductRequest,
  UpdateProductRequest,
  SearchFilters,
  SearchProductsRequest,
} from "../types";
import { SUCCESS_MESSAGES } from "../utils/constants";

interface UseProductsReturn {
  // State
  products: Product[];
  selectedProduct: Product | null;
  filters: SearchFilters;
  searchQuery: string;
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  error: string | null;
  total: number;
  page: number;
  limit: number;

  // Actions
  fetchProducts: (params?: SearchProductsRequest) => Promise<void>;
  createProduct: (productData: CreateProductRequest) => Promise<void>;
  updateProduct: (
    id: string,
    productData: UpdateProductRequest
  ) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  searchProducts: (query: string, filters?: SearchFilters) => Promise<void>;
  selectProduct: (product: Product | null) => void;
  setFilters: (filters: SearchFilters) => void;
  clearFilters: () => void;
  setPage: (page: number) => void;
  clearError: () => void;
  getProduct: (id: string) => Promise<void>;
  fetchCategories: () => Promise<Category[]>;

  // Bulk operations
  updateMultipleProducts: (
    ids: string[],
    updates: Partial<Product>
  ) => Promise<void>;
}

export function useProducts(): UseProductsReturn {
  const productStore = useProductStore();
  const { showToast } = useAppStore();

  // Enhanced create product with success notification
  const createProduct = useCallback(
    async (productData: CreateProductRequest) => {
      try {
        await productStore.createProduct(productData);
        showToast(SUCCESS_MESSAGES.PRODUCT_CREATED, "success");
      } catch (error) {
        showToast(
          error instanceof Error ? error.message : "Không thể tạo sản phẩm",
          "error"
        );
        throw error;
      }
    },
    [productStore, showToast]
  );

  // Enhanced update product with success notification
  const updateProduct = useCallback(
    async (id: string, productData: UpdateProductRequest) => {
      try {
        await productStore.updateProduct(id, productData);
        showToast(SUCCESS_MESSAGES.PRODUCT_UPDATED, "success");
      } catch (error) {
        showToast(
          error instanceof Error
            ? error.message
            : "Không thể cập nhật sản phẩm",
          "error"
        );
        throw error;
      }
    },
    [productStore, showToast]
  );

  // Enhanced delete product with confirmation and success notification
  const deleteProduct = useCallback(
    async (id: string) => {
      try {
        await productStore.deleteProduct(id);
        showToast(SUCCESS_MESSAGES.PRODUCT_DELETED, "success");
      } catch (error) {
        showToast(
          error instanceof Error ? error.message : "Không thể xóa sản phẩm",
          "error"
        );
        throw error;
      }
    },
    [productStore, showToast]
  );

  // Enhanced bulk update with success notification
  const updateMultipleProducts = useCallback(
    async (ids: string[], updates: Partial<Product>) => {
      try {
        await productStore.updateMultipleProducts(ids, updates);
        showToast(`Updated ${ids.length} products sucessfully`, "success");
      } catch (error) {
        showToast(
          error instanceof Error ? error.message : "Can not update products",
          "error"
        );
        throw error;
      }
    },
    [productStore, showToast]
  );
  return {
    // State
    products: productStore.products,
    selectedProduct: productStore.selectedProduct,
    filters: productStore.filters,
    searchQuery: productStore.searchQuery,
    isLoading: productStore.isLoading,
    isCreating: productStore.isCreating,
    isUpdating: productStore.isUpdating,
    isDeleting: productStore.isDeleting,
    error: productStore.error,
    total: productStore.total,
    page: productStore.page,
    limit: productStore.limit,

    // Actions
    fetchProducts: productStore.fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    searchProducts: productStore.searchProducts,
    selectProduct: productStore.selectProduct,
    setFilters: productStore.setFilters,
    clearFilters: productStore.clearFilters,
    setPage: productStore.setPage,
    clearError: productStore.clearError,
    getProduct: productStore.getProduct,
    fetchCategories: productStore.fetchCategories,

    // Bulk operations
    updateMultipleProducts,
  };
}

// Specialized hook for product form operations
export function useProductForm(productId?: string) {
  const { selectedProduct, getProduct, isLoading, error } = useProducts();

  // Load product for editing
  useEffect(() => {
    if (productId && (!selectedProduct || selectedProduct.id !== productId)) {
      getProduct(productId).catch(console.error);
    }
  }, [productId, selectedProduct, getProduct]);

  return {
    product: selectedProduct,
    isLoading,
    error,
    isEditing: Boolean(productId),
  };
}

// Hook for product statistics
export function useProductStats() {
  const { products } = useProducts();

  const stats = {
    total: products.length,
    inStock: products.filter((p) => p.quantity > 0).length,
    outOfStock: products.filter((p) => p.quantity === 0).length,
    lowStock: products.filter((p) => p.quantity > 0 && p.quantity < 5).length,
    totalValue: products.reduce((sum, p) => sum + p.price * p.quantity, 0),
    averagePrice:
      products.length > 0
        ? products.reduce((sum, p) => sum + p.price, 0) / products.length
        : 0,
    categories: [...new Set(products.map((p) => p.category).filter(Boolean))]
      .length,
  };

  return stats;
}

// Hook for product categories
export function useProductCategories() {
  const { products, fetchCategories } = useProducts();

  // Extract categories from products
  const categoriesFromProducts = [
    ...new Set(products.map((p) => p.category).filter(Boolean)),
  ].sort();

  // You could also fetch categories from API if available
  const getCategories = useCallback(async () => {
    try {
      const categories = await fetchCategories();
      return categories.map((c) => c.name);
    } catch (error) {
      // Fallback to categories from products
      return categoriesFromProducts;
    }
  }, [fetchCategories, categoriesFromProducts]);

  return {
    categories: categoriesFromProducts,
    getCategories,
  };
}

// Hook for product search and filtering
export function useProductSearch() {
  const {
    searchQuery,
    filters,
    searchProducts,
    setFilters,
    clearFilters,
    products,
    total,
    isLoading,
  } = useProducts();

  const hasActiveFilters = Object.keys(filters).some((key) => {
    const value = filters[key as keyof SearchFilters];
    return value !== undefined && value !== null && value !== "";
  });

  const search = useCallback(
    (query: string, newFilters?: SearchFilters) => {
      searchProducts(query, newFilters || filters);
    },
    [searchProducts, filters]
  );

  const updateFilters = useCallback(
    (newFilters: Partial<SearchFilters>) => {
      const updatedFilters = { ...filters, ...newFilters };
      setFilters(updatedFilters);
      if (searchQuery || hasActiveFilters) {
        searchProducts(searchQuery, updatedFilters);
      }
    },
    [filters, setFilters, searchQuery, searchProducts, hasActiveFilters]
  );

  const clearSearch = useCallback(() => {
    clearFilters();
    searchProducts("", {});
  }, [clearFilters, searchProducts]);

  return {
    searchQuery,
    filters,
    hasActiveFilters,
    results: products,
    total,
    isLoading,
    search,
    updateFilters,
    clearSearch,
  };
}
