// Export all stores
export { useAuthStore } from "./authStore";
export { useProductStore } from "./productStore";
export { useAppStore } from "./appStore";

// Re-export store types for convenience
export type {
  User,
  AuthState,
  LoginRequest,
  RegisterRequest,
} from "../types/auth";

export type {
  Product,
  ProductState,
  SearchFilters,
  CreateProductRequest,
  UpdateProductRequest,
} from "../types/product";

export type {
  MCPCommand,
  MCPResponse,
  MCPConnectionState,
  MCPCommandType,
} from "../types/mcp";

export type { Toast, ModalState, Theme, AppSettings, ViewMode } from "../types";

import { useAuthStore } from "./authStore";

// Store initialization helper
export const initializeStores = async () => {
  // This function can be called on app startup to initialize stores

  const authStore = useAuthStore.getState();

  // Check if user is authenticated
  if (authStore.checkAuthStatus()) {
    // Only connect MCP if user is authenticated
    await connectMCPIfAuthenticated();
  } else {
    console.log("User is not authenticated, skipping MCP connection");
  }
};

// Helper function to connect MCP when user is authenticated
export const connectMCPIfAuthenticated = async () => {
  const { mcpManager } = await import("../utils/mcpManager");

  console.log("Connecting MCP for authenticated user...");
  try {
    await mcpManager.connect();
    console.log("MCP connection setup completed");
  } catch (error) {
    console.error("MCP connection failed:", error);
  }
};

export const disconnectMCP = async () => {
  try {
    const { mcpManager } = await import("../utils/mcpManager");
    mcpManager.disconnect();
    console.log("MCP disconnected");
  } catch (error) {
    console.error("Error disconnecting MCP:", error);
  }
};
