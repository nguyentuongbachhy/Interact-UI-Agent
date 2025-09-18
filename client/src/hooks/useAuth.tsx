import { useCallback, useEffect } from "react";
import { useAuthStore } from "../store";
import { authService } from "../services";
import type { LoginRequest, RegisterRequest, User } from "../store";
import { getValidationRule } from "../utils/constants";

interface UseAuthReturn {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;

  login: (credentials: LoginRequest) => Promise<void>;
  register: (credentials: RegisterRequest) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  clearError: () => void;

  checkAuthStatus: () => boolean;
  refreshToken: () => Promise<void>;
  isTokenExpiringSoon: () => boolean;
}

export function useAuth(): UseAuthReturn {
  const {
    user,
    isLoading,
    isAuthenticated,
    error,
    login: storeLogin,
    register: storeRegister,
    logout: storeLogout,
    updateUser: storeUpdateUser,
    refreshAuthToken: storeRefreshToken,
    clearError: storeClearError,
    checkAuthStatus: storeCheckAuthStatus,
  } = useAuthStore();

  useEffect(() => {
    let refreshInterval: NodeJS.Timeout;

    if (isAuthenticated) {
      refreshInterval = setInterval(async () => {
        try {
          if (authService.shouldRefreshToken()) {
            await authService.autoRefreshToken();
          }
        } catch (error) {
          console.error("Auto token refresh failed:", error);
          storeLogout();
        }
      }, 5 * 60 * 100);
    }

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [isAuthenticated, storeLogout]);

  // Initialize auth state properly on mount
  useEffect(() => {
    const initializeAuth = async () => {
      // Check if we have valid auth tokens
      const hasValidAuth = authService.isAuthenticated();

      if (hasValidAuth) {
        try {
          const user = authService.getCurrentUser();
          const token = authService.getAuthToken();
          const refreshToken = authService.getRefreshToken();

          if (user && token && refreshToken) {
            console.log(
              "[useAuth] Found valid auth tokens, setting authenticated state"
            );
            useAuthStore.setState({
              user,
              token,
              refreshToken,
              isAuthenticated: true,
              isLoading: false,
            });
            return;
          }
        } catch (error) {
          console.error("Auth sync failed:", error);
          authService.clearLocalAuth();
        }
      }

      // If no valid auth, ensure we're not loading
      console.log("[useAuth] No valid auth found, setting not authenticated");
      useAuthStore.setState({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        token: null,
        refreshToken: null,
      });
    };

    // Only initialize on first mount
    if (!isAuthenticated && isLoading) {
      initializeAuth();
    }
  }, []); // Run only once on mount

  const login = useCallback(
    async (credentials: LoginRequest) => {
      try {
        if (!credentials.email || !credentials.password) {
          throw new Error("Email and Password are required");
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(credentials.email)) {
          throw new Error(getValidationRule("EMAIL", "INVALID"));
        }

        await storeLogin(credentials);
      } catch (error) {
        throw error;
      }
    },
    [storeLogin]
  );

  const register = useCallback(
    async (userData: RegisterRequest) => {
      try {
        if (!userData.email || !userData.password || !userData.name) {
          throw new Error("All fields are required");
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email)) {
          throw new Error(getValidationRule("EMAIL", "INVALID"));
        }

        if (userData.password.length < 6) {
          throw new Error(getValidationRule("PASSWORD", "MIN_LENGTH"));
        }

        if (userData.name.trim().length < 2) {
          throw new Error(getValidationRule("NAME", "MIN_LENGTH"));
        }

        await storeRegister(userData);
      } catch (error) {
        throw error;
      }
    },
    [storeRegister]
  );

  const logout = useCallback(() => {
    try {
      storeLogout();

      window.location.href = "/auth";
    } catch (error) {
      console.error("Logout error:", error);
      authService.clearLocalAuth();
      window.location.href = "/auth";
    }
  }, [storeLogout]);

  const updateUser = useCallback(
    (userData: Partial<User>) => {
      try {
        storeUpdateUser(userData);

        authService.updateProfile(userData).catch((error) => {
          console.error("Profile sync failed:", error);
        });
      } catch (error) {
        console.error("Update user failed:", error);
      }
    },
    [storeUpdateUser]
  );

  const isTokenExpiringSoon = useCallback((): boolean => {
    return authService.shouldRefreshToken();
  }, []);

  const refreshToken = useCallback(async () => {
    try {
      await storeRefreshToken();
    } catch (error) {
      console.error("Manual token refresh failed:", error);
      logout();
      throw error;
    }
  }, [storeRefreshToken, logout]);

  return {
    user,
    isLoading,
    isAuthenticated,
    error,

    login,
    register,
    logout,
    updateUser,
    clearError: storeClearError,

    checkAuthStatus: storeCheckAuthStatus,
    refreshToken,
    isTokenExpiringSoon,
  };
}

export function useAuthUser(): User | null {
  const { user } = useAuthStore();
  return user;
}

export function useAuthStatus(): {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
} {
  const { isAuthenticated, isLoading, error } = useAuthStore();
  return { isAuthenticated, isLoading, error };
}

// Hook for checking permissions/roles
export function usePermissions() {
  const { user } = useAuthStore();

  const hasPermission = useCallback(
    (_permission: string): boolean => {
      // Implement permission checking logic based on your user model
      // This is a placeholder implementation
      return true;
    },
    [user]
  );

  const hasRole = useCallback(
    (_role: string): boolean => {
      // Implement role checking logic
      return true;
    },
    [user]
  );

  const isAdmin = useCallback((): boolean => {
    // Check if user is admin
    return hasRole("admin");
  }, [hasRole]);

  return {
    hasPermission,
    hasRole,
    isAdmin,
  };
}
