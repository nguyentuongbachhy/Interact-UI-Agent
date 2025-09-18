import { apiService } from "./api";
import type {
  Product,
  CreateProductRequest,
  UpdateProductRequest,
  SearchProductsRequest,
  ProductsResponse,
  SearchFilters,
  Category,
} from "../types";

import { getValidationRule, getErrorMessage } from "../utils/constants";

class ProductService {
  // Product CRUD operations
  async getProducts(params?: SearchProductsRequest): Promise<ProductsResponse> {
    const queryParams = new URLSearchParams();

    if (params?.page) queryParams.append("page", String(params.page));
    if (params?.limit) queryParams.append("limit", String(params.limit));
    if (params?.query) queryParams.append("query", params.query);
    if (params?.sortBy) queryParams.append("sortBy", params.sortBy);
    if (params?.sortOrder) queryParams.append("sortOrder", params.sortOrder);

    // Add filters
    if (params?.filters) {
      const filters = params.filters;
      if (filters.category) queryParams.append("category", filters.category);
      if (filters.minPrice !== undefined)
        queryParams.append("minPrice", String(filters.minPrice));
      if (filters.maxPrice !== undefined)
        queryParams.append("maxPrice", String(filters.maxPrice));
      if (filters.inStock !== undefined)
        queryParams.append("inStock", String(filters.inStock));
    }

    const url = `/products${
      queryParams.toString() ? `?${queryParams.toString()}` : ""
    }`;
    const response = await apiService.get<ProductsResponse>(url);

    console.log("[productService] Response.data:", response.data);

    return response.data;
  }

  async getProduct(id: string): Promise<Product> {
    const response = await apiService.get<Product>(`/products/${id}`);
    return response.data;
  }

  async createProduct(productData: CreateProductRequest): Promise<Product> {
    try {
      const response = await apiService.post<Product>("/products", productData);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage("PRODUCT_CREATE_ERROR"));
    }
  }

  async updateProduct(
    id: string,
    productData: UpdateProductRequest
  ): Promise<Product> {
    try {
      const response = await apiService.put<Product>(
        `/products/${id}`,
        productData
      );
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage("PRODUCT_UPDATE_ERROR"));
    }
  }

  async deleteProduct(id: string): Promise<void> {
    try {
      await apiService.delete(`/products/${id}`);
    } catch (error) {
      throw new Error(getErrorMessage("PRODUCT_DELETE_ERROR"));
    }
  }

  // Search and filtering
  async searchProducts(
    query: string,
    filters?: SearchFilters
  ): Promise<ProductsResponse> {
    return this.getProducts({
      query,
      filters,
      page: 1, // Reset to first page for new search
    });
  }

  async getProductsByCategory(
    category: string,
    params?: Omit<SearchProductsRequest, "filters">
  ): Promise<ProductsResponse> {
    return this.getProducts({
      ...params,
      filters: { category },
    });
  }

  async getProductsInPriceRange(
    minPrice: number,
    maxPrice: number,
    params?: Omit<SearchProductsRequest, "filters">
  ): Promise<ProductsResponse> {
    return this.getProducts({
      ...params,
      filters: { minPrice, maxPrice },
    });
  }

  async getProductsInStock(
    params?: Omit<SearchProductsRequest, "filters">
  ): Promise<ProductsResponse> {
    return this.getProducts({
      ...params,
      filters: { inStock: true },
    });
  }

  async getOutOfStockProducts(
    params?: Omit<SearchProductsRequest, "filters">
  ): Promise<ProductsResponse> {
    return this.getProducts({
      ...params,
      filters: { inStock: false },
    });
  }

  // Bulk operations
  async updateMultipleProducts(
    ids: string[],
    updates: Partial<Product>
  ): Promise<Product[]> {
    const response = await apiService.put<Product[]>("/products/bulk-update", {
      ids,
      updates,
    });
    return response.data;
  }

  async bulkUpdateCategory(
    ids: string[],
    category: string
  ): Promise<Product[]> {
    return this.updateMultipleProducts(ids, { category });
  }

  async bulkUpdatePrice(
    ids: string[],
    priceMultiplier: number
  ): Promise<Product[]> {
    const response = await apiService.put<Product[]>(
      "/products/bulk-update-price",
      {
        ids,
        priceMultiplier,
      }
    );
    return response.data;
  }

  // Category management
  async getCategories(): Promise<Category[]> {
    const response = await apiService.get<Category[]>("/categories");
    return response.data;
  }

  async createCategory(
    category: Omit<Category, "id" | "productCount">
  ): Promise<Category> {
    const response = await apiService.post<Category>("/categories", category);
    return response.data;
  }

  async updateCategory(
    id: string,
    updates: Partial<Category>
  ): Promise<Category> {
    const response = await apiService.put<Category>(
      `/categories/${id}`,
      updates
    );
    return response.data;
  }

  async deleteCategory(id: string): Promise<void> {
    await apiService.delete(`/categories/${id}`);
  }

  // Statistics and analytics
  async getProductStats(): Promise<{
    total: number;
    inStock: number;
    outOfStock: number;
    totalValue: number;
    averagePrice: number;
    categoriesCount: number;
  }> {
    const response = await apiService.get("/products/stats");
    return response.data;
  }

  async getProductsByDateRange(
    startDate: Date,
    endDate: Date
  ): Promise<Product[]> {
    const queryParams = new URLSearchParams({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });

    const response = await apiService.get<Product[]>(
      `/products/by-date?${queryParams.toString()}`
    );
    return response.data;
  }

  async getTopSellingProducts(limit: number = 10): Promise<Product[]> {
    const response = await apiService.get<Product[]>(
      `/products/top-selling?limit=${limit}`
    );
    return response.data;
  }

  async getLowStockProducts(threshold: number = 5): Promise<Product[]> {
    const response = await apiService.get<Product[]>(
      `/products/low-stock?threshold=${threshold}`
    );
    return response.data;
  }

  // Import/Export
  async exportProducts(format: "csv" | "xlsx" = "csv"): Promise<Blob> {
    const response = await apiService.get(`/products/export?format=${format}`, {
      headers: {
        Accept:
          format === "csv"
            ? "text/csv"
            : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });

    // Note: This assumes the API returns binary data
    // You might need to adjust based on your actual API implementation
    return new Blob([response.data]);
  }

  async importProducts(
    file: File,
    options?: {
      skipDuplicates?: boolean;
      updateExisting?: boolean;
    }
  ): Promise<{
    imported: number;
    updated: number;
    skipped: number;
    errors: string[];
  }> {
    const formData = new FormData();
    formData.append("file", file);

    if (options?.skipDuplicates) {
      formData.append("skipDuplicates", "true");
    }
    if (options?.updateExisting) {
      formData.append("updateExisting", "true");
    }

    const response = await apiService.post("/products/import", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  }

  // Image upload
  async uploadProductImage(
    productId: string,
    file: File
  ): Promise<{ imageUrl: string }> {
    const formData = new FormData();
    formData.append("image", file);

    const response = await apiService.post<{ imageUrl: string }>(
      `/products/${productId}/image`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return response.data;
  }

  async deleteProductImage(productId: string): Promise<void> {
    await apiService.delete(`/products/${productId}/image`);
  }

  // Validation helpers
  validateProductData(data: CreateProductRequest | UpdateProductRequest): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if ("name" in data && (!data.name || data.name.trim().length === 0)) {
      errors.push(getValidationRule("PRODUCT_NAME", "REQUIRED"));
    }

    if ("price" in data && (data.price === undefined || data.price < 0)) {
      errors.push(getValidationRule("PRICE", "INVALID"));
    }

    if (
      "quantity" in data &&
      (data.quantity === undefined ||
        data.quantity < 0 ||
        !Number.isInteger(data.quantity))
    ) {
      errors.push(getValidationRule("QUANTITY", "INTEGER"));
    }

    if (
      "imageUrl" in data &&
      data.imageUrl &&
      !this.isValidUrl(data.imageUrl)
    ) {
      errors.push(getValidationRule("URL", "INVALID"));
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  // Utility methods
  formatProductForDisplay(product: Product): Product & {
    formattedPrice: string;
    stockStatus: "in-stock" | "low-stock" | "out-of-stock";
  } {
    return {
      ...product,
      formattedPrice: new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
      }).format(product.price),
      stockStatus:
        product.quantity === 0
          ? "out-of-stock"
          : product.quantity < 5
          ? "low-stock"
          : "in-stock",
    };
  }
}

// Export singleton instance
export const productService = new ProductService();
