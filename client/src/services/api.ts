import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  AxiosError,
} from "axios";
import type {
  ApiResponse,
  ApiError,
  ApiConfig,
  RequestOptions,
} from "../types";

import {
  API_CONFIG,
  STORAGE_KEYS,
  getErrorMessage,
  camelToSnake,
  snakeToCamel,
} from "../utils";

class ApiService {
  private instance: AxiosInstance;
  private config: ApiConfig;

  constructor(config?: Partial<ApiConfig>) {
    this.config = {
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      retryAttempts: API_CONFIG.RETRY_ATTEMPTS,
      retryDelay: API_CONFIG.RETRY_DELAY,
      ...config,
    };

    this.instance = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        "Content-Type": "application/json",
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor for auth token and case conversion
    this.instance.interceptors.request.use(
      (config) => {
        const token = this.getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Convert request data from camelCase to snake_case
        if (config.data) {
          config.data = camelToSnake(config.data);
        }

        // Convert URL params from camelCase to snake_case
        if (config.params) {
          config.params = camelToSnake(config.params);
        }

        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling and case conversion
    this.instance.interceptors.response.use(
      (response) => {
        // Convert response data from snake_case to camelCase
        if (response.data) {
          response.data = snakeToCamel(response.data);
        }
        return response;
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & {
          _retry?: boolean;
        };

        // Handle 401 Unauthorized
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            await this.refreshToken();
            const token = this.getAuthToken();
            if (token && originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return this.instance(originalRequest);
          } catch (refreshError) {
            this.handleAuthError();
            return Promise.reject(refreshError);
          }
        }

        // Convert error response data from snake_case to camelCase
        if (error.response?.data) {
          error.response.data = snakeToCamel(error.response.data);
        }

        return Promise.reject(this.formatError(error));
      }
    );
  }

  private getAuthToken(): string | null {
    try {
      const authStorage = localStorage.getItem(STORAGE_KEYS.AUTH);
      if (authStorage) {
        const parsed = JSON.parse(authStorage);
        return parsed.state?.token || null;
      }
    } catch (error) {
      console.error("Error getting auth token:", error);
    }
    return null;
  }

  private async refreshToken(): Promise<void> {
    try {
      const authStorage = localStorage.getItem(STORAGE_KEYS.AUTH);
      if (!authStorage) {
        throw new Error("No auth data");
      }

      const parsed = JSON.parse(authStorage);
      const refreshToken = parsed.state?.refreshToken;

      if (!refreshToken) {
        throw new Error("No refresh token");
      }

      // Convert to snake_case for server request
      const requestData = camelToSnake({
        refreshToken,
      });

      const response = await axios.post(
        `${this.config.baseURL}/auth/refresh`,
        requestData
      );

      // Response will be automatically converted to camelCase by interceptor
      const { token, refreshToken: newRefreshToken } = response.data;

      // Update localStorage
      parsed.state.token = token;
      parsed.state.refreshToken = newRefreshToken;
      localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(parsed));
    } catch (error) {
      throw error;
    }
  }

  private handleAuthError(): void {
    // Clear auth data
    localStorage.removeItem(STORAGE_KEYS.AUTH);

    // Redirect to login or dispatch logout action
    window.location.href = "/auth";
  }

  private formatError(error: AxiosError): ApiError {
    const apiError: ApiError = {
      message: getErrorMessage("SERVER_ERROR"),
      statusCode: error.response?.status,
    };

    if (error.response?.data) {
      const data = error.response.data as any;
      apiError.message = data.message || data.error || error.message;
      apiError.code = data.code;
      apiError.details = data.details;
    } else if (error.request) {
      apiError.message = getErrorMessage("NETWORK_ERROR");
    } else {
      apiError.message = error.message;
    }

    return apiError;
  }

  private async retry<T>(
    fn: () => Promise<T>,
    attempts: number = this.config.retryAttempts
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (attempts > 1) {
        await new Promise((resolve) =>
          setTimeout(resolve, this.config.retryDelay)
        );
        return this.retry(fn, attempts - 1);
      }
      throw error;
    }
  }

  // HTTP Methods
  async get<T = any>(
    url: string,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    const request = () =>
      this.instance.get<ApiResponse<T>>(url, {
        timeout: options?.timeout,
        headers: options?.headers,
      });

    if (options?.retry !== false) {
      const response = await this.retry(request);
      return response.data;
    }

    const response = await request();
    return response.data;
  }

  async post<T = any>(
    url: string,
    data?: any,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    const request = () =>
      this.instance.post<ApiResponse<T>>(url, data, {
        timeout: options?.timeout,
        headers: options?.headers,
      });

    if (options?.retry !== false) {
      const response = await this.retry(request);
      return response.data;
    }

    const response = await request();
    return response.data;
  }

  async put<T = any>(
    url: string,
    data?: any,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    const request = () =>
      this.instance.put<ApiResponse<T>>(url, data, {
        timeout: options?.timeout,
        headers: options?.headers,
      });

    if (options?.retry !== false) {
      const response = await this.retry(request);
      return response.data;
    }

    const response = await request();
    return response.data;
  }

  async delete<T = any>(
    url: string,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    const request = () =>
      this.instance.delete<ApiResponse<T>>(url, {
        timeout: options?.timeout,
        headers: options?.headers,
      });

    if (options?.retry !== false) {
      const response = await this.retry(request);
      return response.data;
    }

    const response = await request();
    return response.data;
  }

  async patch<T = any>(
    url: string,
    data?: any,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    const request = () =>
      this.instance.patch<ApiResponse<T>>(url, data, {
        timeout: options?.timeout,
        headers: options?.headers,
      });

    if (options?.retry !== false) {
      const response = await this.retry(request);
      return response.data;
    }

    const response = await request();
    return response.data;
  }

  // Utility methods
  setBaseURL(baseURL: string): void {
    this.config.baseURL = baseURL;
    this.instance.defaults.baseURL = baseURL;
  }

  setTimeout(timeout: number): void {
    this.config.timeout = timeout;
    this.instance.defaults.timeout = timeout;
  }

  setDefaultHeaders(headers: Record<string, string>): void {
    Object.assign(this.instance.defaults.headers, headers);
  }

  // Case conversion utilities (public access)
  convertToCamelCase<T = any>(data: any): T {
    return snakeToCamel(data);
  }

  convertToSnakeCase<T = any>(data: any): T {
    return camelToSnake(data);
  }
}

// Export singleton instance
export const apiService = new ApiService();

// Export class for custom instances
export { ApiService };
