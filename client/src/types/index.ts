// Auth types
export * from "./auth";

// Product types
export * from "./product";

// MCP types
export * from "./mcp";

// API types
export * from "./api";

// Common types
export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

export interface SelectOption {
  label: string;
  value: string;
}

export interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "warning" | "info";
  duration?: number;
  timestamp: number;
}

export interface ModalState {
  isOpen: boolean;
  title?: string;
  component?: React.ComponentType<any>;
  props?: any;
}

export interface Theme {
  mode: "light" | "dark";
  primaryColor: string;
  accentColor: string;
}

export interface AppSettings {
  theme: Theme;
  language: string;
  notifications: {
    browser: boolean;
    email: boolean;
    push: boolean;
  };
  preferences: {
    autoSave: boolean;
    showTutorial: boolean;
    defaultPageSize: number;
  };
}

export type ViewMode = "grid" | "list";

export type SortDirection = "asc" | "desc";

export interface SortConfig {
  field: string;
  direction: SortDirection;
}
