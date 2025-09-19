export interface ApiResponse<T = any> {
  data: T;
  message: string;
  success: boolean;
}

export interface ApiError {
  message: string;
  code?: string;
  statusCode?: number;
  details?: any;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ApiConfig {
  baseURL: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
}

export interface RequestOptions {
  headers?: Record<string, string>;
  timeout?: number;
  retry?: boolean;
  cache?: boolean;
}

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

export interface ApiEndpoints {
  auth: {
    login: string;
    register: string;
    refresh: string;
    logout: string;
    profile: string;
    avatar: string;
    changePassword: string;
  };
  products: {
    list: string;
    create: string;
    get: (id: string) => string;
    update: (id: string) => string;
    delete: (id: string) => string;
    search: string;
  };
  categories: {
    list: string;
    create: string;
    get: (id: string) => string;
    update: (id: string) => string;
    delete: (id: string) => string;
  };
  notifications: {
    list: string;
    create: string;
    get: (id: string) => string;
    update: (id: string) => string;
    delete: (id: string) => string;
    markAsRead: (id: string) => string;
    markAllAsRead: string;
    unreadCount: string;
    bulkDelete: string;
    settings: string;
  };
}
