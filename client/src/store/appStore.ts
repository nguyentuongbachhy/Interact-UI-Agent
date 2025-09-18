import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Toast, ModalState, Theme, AppSettings, ViewMode } from "../types";
import { STORAGE_KEYS } from "../utils/constants";

interface AppState {
  // UI State
  sidebarOpen: boolean;
  viewMode: ViewMode;
  theme: Theme;
  settings: AppSettings;

  // Toast notifications
  toasts: Toast[];

  // Modal state
  modal: ModalState;

  // Loading states
  globalLoading: boolean;

  // Navigation
  currentPath: string;
}

interface AppActions {
  // Sidebar
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;

  // View mode
  setViewMode: (mode: ViewMode) => void;
  toggleViewMode: () => void;

  // Theme
  setTheme: (theme: Partial<Theme>) => void;
  toggleThemeMode: () => void;

  // Settings
  updateSettings: (settings: Partial<AppSettings>) => void;
  resetSettings: () => void;

  // Toast notifications
  showToast: (message: string, type?: Toast["type"], duration?: number) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;

  // Modal
  openModal: (
    title: string,
    component: React.ComponentType<any>,
    props?: any
  ) => void;
  closeModal: () => void;

  // Loading
  setGlobalLoading: (loading: boolean) => void;

  // Navigation
  setCurrentPath: (path: string) => void;
}

type AppStore = AppState & AppActions;

const defaultTheme: Theme = {
  mode: "light",
  primaryColor: "#3b82f6",
  accentColor: "#10b981",
};

const defaultSettings: AppSettings = {
  theme: defaultTheme,
  language: "vi",
  notifications: {
    browser: true,
    email: false,
    push: false,
  },
  preferences: {
    autoSave: true,
    showTutorial: true,
    defaultPageSize: 12,
  },
};

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // State
      sidebarOpen: true,
      viewMode: "grid",
      theme: defaultTheme,
      settings: defaultSettings,
      toasts: [],
      modal: {
        isOpen: false,
      },
      globalLoading: false,
      currentPath: "/",

      // Actions
      toggleSidebar: () => {
        set((state) => ({ sidebarOpen: !state.sidebarOpen }));
      },

      setSidebarOpen: (open: boolean) => {
        set({ sidebarOpen: open });
      },

      setViewMode: (mode: ViewMode) => {
        set({ viewMode: mode });
      },

      toggleViewMode: () => {
        set((state) => ({
          viewMode: state.viewMode === "grid" ? "list" : "grid",
        }));
      },

      setTheme: (theme: Partial<Theme>) => {
        set((state) => ({
          theme: { ...state.theme, ...theme },
          settings: {
            ...state.settings,
            theme: { ...state.settings.theme, ...theme },
          },
        }));
      },

      toggleThemeMode: () => {
        set((state: AppState & AppActions) => {
          const newMode: Theme["mode"] =
            state.theme.mode === "light" ? "dark" : "light";
          const newTheme: Theme = { ...state.theme, mode: newMode };

          return {
            theme: newTheme,
            settings: {
              ...state.settings,
              theme: newTheme,
            },
          };
        });
      },

      updateSettings: (newSettings: Partial<AppSettings>) => {
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        }));

        // Update theme if it changed
        if (newSettings.theme) {
          set((state) => ({
            theme: { ...state.theme, ...newSettings.theme },
          }));
        }
      },

      resetSettings: () => {
        set({
          settings: defaultSettings,
          theme: defaultTheme,
        });
      },

      showToast: (
        message: string,
        type: Toast["type"] = "info",
        duration?: number
      ) => {
        const id = `toast-${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 9)}`;
        const toast: Toast = {
          id,
          message,
          type,
          duration: duration || (type === "error" ? 5000 : 3000),
          timestamp: Date.now(),
        };

        set((state) => ({
          toasts: [...state.toasts, toast],
        }));

        // Auto remove toast after duration
        setTimeout(() => {
          get().removeToast(id);
        }, toast.duration);
      },

      removeToast: (id: string) => {
        set((state) => ({
          toasts: state.toasts.filter((toast) => toast.id !== id),
        }));
      },

      clearToasts: () => {
        set({ toasts: [] });
      },

      openModal: (
        title: string,
        component: React.ComponentType<any>,
        props?: any
      ) => {
        set({
          modal: {
            isOpen: true,
            title,
            component,
            props,
          },
        });
      },

      closeModal: () => {
        set({
          modal: {
            isOpen: false,
            title: undefined,
            component: undefined,
            props: undefined,
          },
        });
      },

      setGlobalLoading: (loading: boolean) => {
        set({ globalLoading: loading });
      },

      setCurrentPath: (path: string) => {
        set({ currentPath: path });
      },
    }),
    {
      name: STORAGE_KEYS.APP_SETTINGS,
      partialize: (state) => ({
        sidebarOpen: state.sidebarOpen,
        viewMode: state.viewMode,
        theme: state.theme,
        settings: state.settings,
      }),
    }
  )
);
