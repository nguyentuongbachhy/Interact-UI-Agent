import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, AuthState, LoginRequest, RegisterRequest } from "../types";
import {
  getErrorMessage,
  STORAGE_KEYS,
  FEATURE_FLAGS,
} from "../utils/constants";
import { authService } from "../services";

interface AuthActions {
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => void;
  refreshAuthToken: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  checkAuthStatus: () => boolean;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // State
      user: null,
      token: null,
      refreshToken: null,
      isLoading: false,
      isAuthenticated: false,
      error: null,

      // Actions
      login: async (credentials: LoginRequest) => {
        set({ isLoading: true, error: null });

        try {
          const data = await authService.login(credentials);

          console.log(
            "[authStore] Data keys:",
            data ? Object.keys(data) : "null/undefined"
          );

          set({
            user: data.user,
            token: data.token,
            refreshToken: data.refreshToken,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          if (FEATURE_FLAGS.ENABLE_MCP) {
            try {
              const { connectMCPIfAuthenticated } = await import("./index");
              await connectMCPIfAuthenticated();
            } catch (mcpError) {
              console.error("Failed to connect MCP after login:", mcpError);
            }
          }
        } catch (error) {
          set({
            isLoading: false,
            error:
              error instanceof Error
                ? error.message
                : getErrorMessage("LOGIN_ERROR"),
          });
          throw error;
        }
      },

      register: async (userData: RegisterRequest) => {
        set({ isLoading: true, error: null });

        try {
          const data = await authService.register(userData);

          console.log(
            "[authStore] Data keys:",
            data ? Object.keys(data) : "null/undefined"
          );

          set({
            user: data.user,
            token: data.token,
            refreshToken: data.refreshToken,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          if (FEATURE_FLAGS.ENABLE_MCP) {
            try {
              const { connectMCPIfAuthenticated } = await import("./index");
              await connectMCPIfAuthenticated();
            } catch (mcpError) {
              console.error(
                "Failed to connect MCP after registration:",
                mcpError
              );
            }
          }
        } catch (error) {
          set({
            isLoading: false,
            error:
              error instanceof Error
                ? error.message
                : getErrorMessage("REGISTER_ERROR"),
          });
          throw error;
        }
      },

      logout: () => {
        import("./index").then(({ disconnectMCP }) => {
          disconnectMCP().catch(console.error);
        });

        import("../services").then(({ authService }) => {
          authService.logout();
        });

        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          error: null,
        });
      },

      refreshAuthToken: async () => {
        try {
          const tokens = await authService.refreshToken();

          set({
            token: tokens.token,
            refreshToken: tokens.refreshToken,
          });
        } catch (error) {
          console.error("Token refresh failed:", error);
          get().logout();
        }
      },

      updateUser: (userData: Partial<User>) => {
        const { user } = get();
        if (user) {
          set({
            user: { ...user, ...userData },
          });
        }
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      setError: (error: string | null) => {
        set({ error });
      },

      clearError: () => {
        set({ error: null });
      },

      checkAuthStatus: () => {
        const { token, user } = get();

        if (!token || !user) {
          return false;
        }

        try {
          const payload = JSON.parse(atob(token.split(".")[1]));
          const currentTime = Math.floor(Date.now() / 1000);

          if (payload.exp < currentTime) {
            get().logout();
            return false;
          }

          return true;
        } catch (error) {
          console.error("Invalid token format:", error);
          get().logout();
          return false;
        }
      },
    }),
    {
      name: STORAGE_KEYS.AUTH,
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
