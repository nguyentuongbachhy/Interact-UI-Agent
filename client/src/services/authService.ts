import { apiService } from "./api";
import type {
  User,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
} from "../types";

import { STORAGE_KEYS, getErrorMessage } from "../utils/constants";

class AuthService {
  // Authentication endpoints
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await apiService.post<AuthResponse>(
        "/auth/login",
        credentials
      );
      return response.data;
    } catch (error) {
      console.error("[authService] Login error:", error);
      throw new Error(getErrorMessage("LOGIN_ERROR"));
    }
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    try {
      const response = await apiService.post<AuthResponse>(
        "/auth/register",
        userData
      );
      return response.data;
    } catch (error) {
      console.error("[authService] Register error:", error);
      throw new Error(getErrorMessage("REGISTER_ERROR"));
    }
  }

  async logout(): Promise<void> {
    try {
      await apiService.post("/auth/logout");
    } catch (error) {
      // Even if logout fails on server, we clear local data
      console.error("Logout error:", error);
    } finally {
      this.clearLocalAuth();
    }
  }

  async refreshToken(): Promise<{ token: string; refreshToken: string }> {
    const refreshToken = this.getRefreshToken();

    if (!refreshToken) {
      throw new Error("No refresh token available");
    }

    const response = await apiService.post<{
      token: string;
      refreshToken: string;
    }>("/auth/refresh", { refreshToken });

    return response.data;
  }

  // Profile management
  async getProfile(): Promise<User> {
    const response = await apiService.get<User>("/auth/profile");
    return response.data;
  }

  async updateProfile(userData: Partial<User>): Promise<User> {
    const response = await apiService.put<User>("/auth/profile", userData);
    return response.data;
  }

  async changePassword(data: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<void> {
    await apiService.post("/auth/change-password", data);
  }

  async resetPassword(email: string): Promise<void> {
    await apiService.post("/auth/reset-password", { email });
  }

  async confirmPasswordReset(data: {
    token: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<void> {
    await apiService.post("/auth/confirm-reset-password", data);
  }

  // Avatar upload and management
  async uploadAvatar(file: File): Promise<{ avatarUrl: string }> {
    const formData = new FormData();
    formData.append("avatar", file);

    try {
      const response = await apiService.post<{ avatarUrl: string }>(
        "/auth/avatar",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("[authService] Upload avatar error:", error);
      throw new Error("Failed to upload avatar");
    }
  }

  async removeAvatar(): Promise<void> {
    try {
      await apiService.delete("/auth/avatar");
    } catch (error) {
      console.error("[authService] Remove avatar error:", error);
      throw new Error("Failed to remove avatar");
    }
  }

  // Email verification
  async sendEmailVerification(): Promise<void> {
    await apiService.post("/auth/send-verification");
  }

  async verifyEmail(token: string): Promise<void> {
    await apiService.post("/auth/verify-email", { token });
  }

  // Token management utilities
  getAuthToken(): string | null {
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

  getRefreshToken(): string | null {
    try {
      const authStorage = localStorage.getItem(STORAGE_KEYS.AUTH);
      if (authStorage) {
        const parsed = JSON.parse(authStorage);
        return parsed.state?.refreshToken || null;
      }
    } catch (error) {
      console.error("Error getting refresh token:", error);
    }
    return null;
  }

  getCurrentUser(): User | null {
    try {
      const authStorage = localStorage.getItem(STORAGE_KEYS.AUTH);
      if (authStorage) {
        const parsed = JSON.parse(authStorage);
        return parsed.state?.user || null;
      }
    } catch (error) {
      console.error("Error getting current user:", error);
    }
    return null;
  }

  isAuthenticated(): boolean {
    const token = this.getAuthToken();
    const user = this.getCurrentUser();

    if (!token || !user) {
      return false;
    }

    // Check if token is expired
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const currentTime = Math.floor(Date.now() / 1000);

      if (payload.exp < currentTime) {
        this.clearLocalAuth();
        return false;
      }

      return true;
    } catch (error) {
      console.error("Invalid token format:", error);
      this.clearLocalAuth();
      return false;
    }
  }

  clearLocalAuth(): void {
    localStorage.removeItem(STORAGE_KEYS.AUTH);
  }

  // Token validation
  validateToken(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp > currentTime;
    } catch (error) {
      return false;
    }
  }

  // Get token expiration time
  getTokenExpiration(token: string): Date | null {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return new Date(payload.exp * 1000);
    } catch (error) {
      return null;
    }
  }

  // Check if token expires soon (within 5 minutes)
  shouldRefreshToken(): boolean {
    const token = this.getAuthToken();

    if (!token) {
      return false;
    }

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      const expirationTime = payload.exp;

      // Refresh if token expires within 5 minutes
      return expirationTime - currentTime < 300;
    } catch (error) {
      return false;
    }
  }

  // Auto-refresh token if needed
  async autoRefreshToken(): Promise<void> {
    if (this.shouldRefreshToken()) {
      try {
        const tokens = await this.refreshToken();

        // Update localStorage
        const authStorage = localStorage.getItem(STORAGE_KEYS.AUTH);
        if (authStorage) {
          const parsed = JSON.parse(authStorage);
          parsed.state.token = tokens.token;
          parsed.state.refreshToken = tokens.refreshToken;
          localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(parsed));
        }
      } catch (error) {
        console.error("Auto refresh failed:", error);
        this.clearLocalAuth();
        throw error;
      }
    }
  }
}

// Export singleton instance
export const authService = new AuthService();
