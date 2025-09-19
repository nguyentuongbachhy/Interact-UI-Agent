// API Services
export { apiService, ApiService } from "./api";
export { authService } from "./authService";
export { productService } from "./productService";
export { notificationService } from "./notificationService";

// WebSocket & MCP Services
export { webSocketService, WebSocketService } from "./websocket";
export { mcpHandler, MCPHandler } from "./mcpHandler";

// Re-export types for convenience
export type {
  ApiResponse,
  ApiError,
  ApiConfig,
  RequestOptions,
} from "../types/api";

export type { WebSocketEventType, WebSocketServiceConfig } from "./websocket";

export type { MCPHandlerOptions } from "./mcpHandler";

import { apiService } from "./api";
import { webSocketService } from "./websocket";

// Service initialization helper
export const initializeServices = async () => {
  try {
    // Set API base URL from environment
    const apiUrl = import.meta.env.VITE_API_URL;
    if (apiUrl) {
      apiService.setBaseURL(apiUrl);
    }

    // Set request timeout
    const timeout = parseInt(import.meta.env.VITE_API_TIMEOUT || "10000");
    apiService.setTimeout(timeout);

    const mcpUrl = import.meta.env.VITE_MCP_URL;
    if (mcpUrl) {
      webSocketService.updateConfig({ url: mcpUrl });
    }

    console.log("Services initialized successfully");

    return true;
  } catch (error) {
    console.error("Failed to initialize services:", error);
    return false;
  }
};

// Service health check
export const checkServicesHealth = async (): Promise<{
  api: boolean;
  websocket: boolean;
  overall: boolean;
}> => {
  const health = {
    api: false,
    websocket: false,
    overall: false,
  };

  try {
    // Check API health
    await apiService.get("/health");
    health.api = true;
  } catch (error) {
    console.error("API health check failed:", error);
  }

  try {
    // Check WebSocket health
    const wsStats = webSocketService.getStats();
    health.websocket = wsStats.isConnected;
  } catch (error) {
    console.error("WebSocket health check failed:", error);
  }

  health.overall = health.api && health.websocket;
  return health;
};
