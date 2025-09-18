export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  quantity: number;
  category?: string;
  imageUrl?: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProductRequest {
  name: string;
  description?: string;
  price: number;
  quantity: number;
  category?: string;
  imageUrl?: string;
}

export interface UpdateProductRequest extends Partial<CreateProductRequest> {}

export interface SearchFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
}

export interface SearchProductsRequest {
  query?: string;
  filters?: SearchFilters;
  page?: number;
  limit?: number;
  sortBy?: "name" | "price" | "quantity" | "createdAt" | "updatedAt";
  sortOrder?: "asc" | "desc";
}

export interface ProductsResponse {
  products: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ProductState {
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
  _hasInitialized?: boolean;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  productCount: number;
}
