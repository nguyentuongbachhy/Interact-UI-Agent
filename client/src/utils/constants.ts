// API Configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || "http://localhost:8000/api",
  TIMEOUT: parseInt(import.meta.env.VITE_API_TIMEOUT || "10000"),
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
} as const;

// MCP Configuration
export const MCP_CONFIG = {
  DEFAULT_URL:
    import.meta.env.VITE_MCP_URL ||
    (typeof window !== "undefined"
      ? `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${
          window.location.hostname
        }:${import.meta.env.VITE_MCP_PORT || "8001"}/mcp`
      : "ws://localhost:8001/mcp"),
  RECONNECT_ATTEMPTS: 5,
  RECONNECT_INTERVAL: 3000,
  HEARTBEAT_INTERVAL: 30000,
  CONNECTION_TIMEOUT: 10000,
  COMMAND_TIMEOUT: 30000,
} as const;

// UI Constants
export const UI_CONFIG = {
  TOAST_DURATION: {
    SUCCESS: 3000,
    ERROR: 5000,
    WARNING: 4000,
    INFO: 3000,
  },
  DEBOUNCE_DELAY: 300,
  PAGE_SIZES: [12, 24, 48, 96],
  DEFAULT_PAGE_SIZE: 12,
  MOBILE_BREAKPOINT: 768,
  TABLET_BREAKPOINT: 1024,
} as const;

// Notification Configuration
export const NOTIFICATION_CONFIG = {
  MAX_NOTIFICATIONS: 50,
  AUTO_CLEANUP_DAYS: 30,
  POLLING_INTERVAL: 30000, // 30 seconds
  TYPES: {
    INFO: "info",
    SUCCESS: "success",
    WARNING: "warning",
    ERROR: "error",
    SYSTEM: "system",
  },
  POSITIONS: {
    TOP_RIGHT: "top-right",
    TOP_LEFT: "top-left",
    BOTTOM_RIGHT: "bottom-right",
    BOTTOM_LEFT: "bottom-left",
  },
} as const;

// Product Constants
export const PRODUCT_CONFIG = {
  MAX_NAME_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 500,
  MAX_PRICE: 999999999,
  MIN_PRICE: 0,
  MAX_QUANTITY: 999999,
  MIN_QUANTITY: 0,
  ALLOWED_IMAGE_TYPES: ["image/jpeg", "image/png", "image/webp"],
  MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
  LOW_STOCK_THRESHOLD: 5,
} as const;

// Auth Constants
export const AUTH_CONFIG = {
  TOKEN_REFRESH_THRESHOLD: 5 * 60, // 5 minutes in seconds
  PASSWORD_MIN_LENGTH: 6,
  PASSWORD_MAX_LENGTH: 128,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  TOKEN_STORAGE_KEY: "auth-storage",
} as const;

// Route Paths
export const ROUTES = {
  HOME: "/",
  AUTH: "/auth",
  PRODUCTS: "/products",
  PRODUCT_NEW: "/products/new",
  PRODUCT_EDIT: (id: string) => `/products/${id}/edit`,
  PRODUCT_DETAIL: (id: string) => `/products/${id}`,
  SEARCH: "/search",
  CATEGORIES: "/categories",
  ANALYTICS: "/analytics",
  SETTINGS: "/settings",
  PROFILE: "/profile",
  NOTIFICATIONS: "/notifications", // New
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH: "auth-storage",
  APP_SETTINGS: "app-storage",
  THEME: "theme-preference",
  VIEW_MODE: "view-mode",
  FILTERS: "search-filters",
  NOTIFICATIONS: "notifications-storage", // New
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: "Network error. Please check your internet connection.",
  UNAUTHORIZED: "Your session has expired. Please log in again.",
  FORBIDDEN: "You do not have permission to perform this action.",
  NOT_FOUND: "Requested resource not found.",
  SERVER_ERROR: "Server error. Please try again later.",
  VALIDATION_ERROR: "Invalid data. Please check again.",
  MCP_CONNECTION_ERROR: "Unable to connect to MCP Bridge.",
  MCP_COMMAND_ERROR: "MCP command execution failed.",
  PRODUCT_CREATE_ERROR: "Unable to create product.",
  PRODUCT_UPDATE_ERROR: "Unable to update product.",
  PRODUCT_DELETE_ERROR: "Unable to delete product.",
  LOGIN_ERROR: "Login failed. Please check your email and password.",
  REGISTER_ERROR: "Registration failed. The email may already be in use.",
  PASSWORD_MISMATCH: "Password confirmation does not match.",
  WEAK_PASSWORD: "Password too weak. Please choose a stronger one.",
  NOTIFICATION_LOAD_ERROR: "Failed to load notifications.", // New
  NOTIFICATION_MARK_READ_ERROR: "Failed to mark notification as read.", // New
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN: "Login successful!",
  REGISTER: "Registration successful!",
  LOGOUT: "Logout successful!",
  PRODUCT_CREATED: "Product created successfully!",
  PRODUCT_UPDATED: "Product updated successfully!",
  PRODUCT_DELETED: "Product deleted successfully!",
  PRODUCTS_BULK_DELETED: "Selected products deleted!",
  PROFILE_UPDATED: "Profile updated successfully!",
  PASSWORD_CHANGED: "Password changed successfully!",
  EMAIL_VERIFIED: "Email verified successfully!",
  MCP_CONNECTED: "Connected to MCP Bridge!",
  MCP_COMMAND_SUCCESS: "Command executed successfully!",
  NOTIFICATION_MARKED_READ: "Notification marked as read!", // New
  ALL_NOTIFICATIONS_MARKED_READ: "All notifications marked as read!", // New
  NOTIFICATION_DELETED: "Notification deleted!", // New
} as const;

// Validation Rules
export const VALIDATION_RULES = {
  EMAIL: {
    REQUIRED: "Email is required",
    INVALID: "Invalid email address",
  },
  PASSWORD: {
    MIN_LENGTH: "Password must be at least 6 characters",
    MAX_LENGTH: "Password must not exceed 32 characters",
    MISMATCH: "Password confirmation does not match",
  },
  NAME: {
    MIN_LENGTH: "Name must be at least 2 characters",
    MAX_LENGTH: "Name must not exceed 50 characters",
  },
  PRODUCT_NAME: {
    REQUIRED: "Product name is required",
    MIN_LENGTH: "Product name must be at least 1 character",
    MAX_LENGTH: "Product name must not exceed 100 characters",
  },
  PRICE: {
    MIN_VALUE: "Price must be greater than or equal to 0",
    MAX_VALUE: "Price must not exceed 999,999,999",
    INVALID: "Price must be a positive number",
  },
  QUANTITY: {
    MIN_VALUE: "Quantity must be greater than or equal to 0",
    MAX_VALUE: "Quantity must not exceed 999,999",
    INTEGER: "Quantity must be an integer",
  },
  URL: {
    INVALID: "Invalid URL",
  },
} as const;

// Feature Flags
export const FEATURE_FLAGS = {
  ENABLE_MCP: import.meta.env.VITE_ENABLE_MCP !== "false",
  ENABLE_ANALYTICS: import.meta.env.VITE_ENABLE_ANALYTICS === "true",
  ENABLE_BULK_OPERATIONS: import.meta.env.VITE_ENABLE_BULK_OPS !== "false",
  ENABLE_CATEGORIES: import.meta.env.VITE_ENABLE_CATEGORIES !== "false",
  ENABLE_IMAGE_UPLOAD: import.meta.env.VITE_ENABLE_IMAGE_UPLOAD !== "false",
  ENABLE_NOTIFICATIONS: import.meta.env.VITE_ENABLE_NOTIFICATIONS !== "false", // New
  DEBUG_MODE: import.meta.env.NODE_ENV === "development",
} as const;

// Default Values
export const DEFAULTS = {
  PAGINATION: {
    PAGE: 1,
    LIMIT: 12,
  },
  THEME: "light" as const,
  LANGUAGE: "vi" as const,
  VIEW_MODE: "grid" as const,
  SORT_ORDER: "desc" as const,
  NOTIFICATION_POSITION: "top-right" as const, // New
} as const;

// Export utility functions for constants
export const getErrorMessage = (key: keyof typeof ERROR_MESSAGES): string => {
  return ERROR_MESSAGES[key];
};

export const getSuccessMessage = (
  key: keyof typeof SUCCESS_MESSAGES
): string => {
  return SUCCESS_MESSAGES[key];
};

export const getValidationRule = (
  category: keyof typeof VALIDATION_RULES,
  rule: string
): string => {
  return (VALIDATION_RULES[category] as any)[rule] || "";
};

export const isFeatureEnabled = (
  feature: keyof typeof FEATURE_FLAGS
): boolean => {
  return FEATURE_FLAGS[feature];
};
