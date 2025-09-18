import { create } from "zustand";
import { productService } from "../services";
import type {
  Product,
  ProductState,
  CreateProductRequest,
  UpdateProductRequest,
  SearchFilters,
  SearchProductsRequest,
  Category,
} from "../types";
import { getErrorMessage } from "../utils/constants";

interface ProductActions {
  // Product CRUD
  fetchProducts: (params?: SearchProductsRequest) => Promise<void>;
  createProduct: (productData: CreateProductRequest) => Promise<void>;
  updateProduct: (
    id: string,
    productData: UpdateProductRequest
  ) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  getProduct: (id: string) => Promise<void>;

  // Search & Filter
  searchProducts: (query: string, filters?: SearchFilters) => Promise<void>;
  setFilters: (filters: SearchFilters) => void;
  setSearchQuery: (query: string) => void;
  clearFilters: () => void;

  // Selection
  selectProduct: (product: Product | null) => void;

  // Pagination
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;

  // Loading states
  setLoading: (loading: boolean) => void;
  setCreating: (creating: boolean) => void;
  setUpdating: (updating: boolean) => void;
  setDeleting: (deleting: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;

  // Bulk operations
  updateMultipleProducts: (
    ids: string[],
    updates: Partial<Product>
  ) => Promise<void>;

  // Categories
  fetchCategories: () => Promise<Category[]>;
}

type ProductStore = ProductState & ProductActions;

export const useProductStore = create<ProductStore>((set, get) => ({
  // State
  products: [],
  selectedProduct: null,
  filters: {},
  searchQuery: "",
  isLoading: false,
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  error: null,
  total: 0,
  page: 1,
  limit: 12,

  // Actions
  fetchProducts: async (params?: SearchProductsRequest) => {
    const state = get();

    // Prevent multiple simultaneous calls
    if (state.isLoading) {
      return;
    }

    set({ isLoading: true, error: null });

    try {
      const { page, limit, filters, searchQuery } = get();

      const queryParams = params || {
        page,
        limit,
        query: searchQuery,
        filters,
      };

      console.log(
        "[productStore] Calling productService.getProducts with:",
        queryParams
      );
      const data = await productService.getProducts(queryParams);
      console.log(
        "[productStore] productService.getProducts completed, received:",
        data
      );

      console.log(
        "[productStore] Data keys:",
        data ? Object.keys(data) : "null"
      );
      console.log(
        "[productStore] Data.products length:",
        data?.products?.length
      );

      set({
        products: data.products || [],
        total: data.total || 0,
        page: data.page || 1,
        limit: data.limit || 12,
        isLoading: false,
      });
    } catch (error) {
      console.error("[productStore] fetchProducts error:", error);
      set({
        isLoading: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch products",
      });
    }
  },

  createProduct: async (productData: CreateProductRequest) => {
    set({ isCreating: true, error: null });

    try {
      const { productService } = await import("../services");
      const newProduct = await productService.createProduct(productData);

      set((state) => ({
        products: [newProduct, ...state.products],
        total: state.total + 1,
        isCreating: false,
      }));
    } catch (error) {
      set({
        isCreating: false,
        error:
          error instanceof Error
            ? error.message
            : getErrorMessage("PRODUCT_CREATE_ERROR"),
      });
      throw error;
    }
  },

  updateProduct: async (id: string, productData: UpdateProductRequest) => {
    set({ isUpdating: true, error: null });

    try {
      const { productService } = await import("../services");
      const updatedProduct = await productService.updateProduct(
        id,
        productData
      );

      set((state) => ({
        products: state.products.map((p) => (p.id === id ? updatedProduct : p)),
        selectedProduct:
          state.selectedProduct?.id === id
            ? updatedProduct
            : state.selectedProduct,
        isUpdating: false,
      }));
    } catch (error) {
      set({
        isUpdating: false,
        error:
          error instanceof Error
            ? error.message
            : getErrorMessage("PRODUCT_UPDATE_ERROR"),
      });
      throw error;
    }
  },

  deleteProduct: async (id: string) => {
    set({ isDeleting: true, error: null });

    try {
      const { productService } = await import("../services");
      await productService.deleteProduct(id);

      set((state) => ({
        products: state.products.filter((p) => p.id !== id),
        selectedProduct:
          state.selectedProduct?.id === id ? null : state.selectedProduct,
        total: state.total - 1,
        isDeleting: false,
      }));
    } catch (error) {
      set({
        isDeleting: false,
        error:
          error instanceof Error
            ? error.message
            : getErrorMessage("PRODUCT_DELETE_ERROR"),
      });
      throw error;
    }
  },

  getProduct: async (id: string) => {
    set({ isLoading: true, error: null });

    try {
      const { productService } = await import("../services");
      const product = await productService.getProduct(id);

      set({
        selectedProduct: product,
        isLoading: false,
      });
    } catch (error) {
      set({
        isLoading: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch product",
      });
    }
  },

  searchProducts: async (query: string, filters?: SearchFilters) => {
    set({ searchQuery: query });
    if (filters) {
      set({ filters });
    }

    const { productService } = await import("../services");

    try {
      const data = await productService.searchProducts(
        query,
        filters || get().filters
      );

      set({
        products: data.products,
        total: data.total,
        page: 1, // Reset to first page on new search
        isLoading: false,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : "Search failed",
      });
    }
  },

  setFilters: (filters: SearchFilters) => {
    set({ filters, page: 1 }); // Reset page when filters change
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
  },

  clearFilters: () => {
    set({ filters: {}, searchQuery: "", page: 1 });
  },

  selectProduct: (product: Product | null) => {
    set({ selectedProduct: product });
  },

  setPage: (page: number) => {
    set({ page });
    get().fetchProducts({ page });
  },

  setLimit: (limit: number) => {
    set({ limit, page: 1 });
    get().fetchProducts({ limit, page: 1 });
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  setCreating: (creating: boolean) => {
    set({ isCreating: creating });
  },

  setUpdating: (updating: boolean) => {
    set({ isUpdating: updating });
  },

  setDeleting: (deleting: boolean) => {
    set({ isDeleting: deleting });
  },

  setError: (error: string | null) => {
    set({ error });
  },

  clearError: () => {
    set({ error: null });
  },

  updateMultipleProducts: async (ids: string[], updates: Partial<Product>) => {
    set({ isUpdating: true, error: null });

    try {
      const { productService } = await import("../services");
      const updatedProducts = await productService.updateMultipleProducts(
        ids,
        updates
      );

      set((state) => ({
        products: state.products.map((p) => {
          const updated = updatedProducts.find((up: Product) => up.id === p.id);
          return updated || p;
        }),
        isUpdating: false,
      }));
    } catch (error) {
      set({
        isUpdating: false,
        error:
          error instanceof Error ? error.message : "Failed to update products",
      });
      throw error;
    }
  },

  fetchCategories: async () => {
    try {
      const { productService } = await import("../services");
      const categories = await productService.getCategories();
      return categories;
    } catch (error) {
      console.error("Failed to fetch categories:", error);
      return [];
    }
  },
}));
