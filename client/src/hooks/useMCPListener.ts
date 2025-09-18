import { useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "../store";
import { mcpHandler } from "../services";
import { mcpManager, useMCPManager } from "../utils/mcpManager";
import type {
  MCPCommand,
  MCPResponse,
  MCPCommandType,
  MCPMessage,
  AddProductCommand,
} from "../types";

export interface UseMCPListenerOptions {
  autoConnect?: boolean;
  onCommandReceived?: (command: MCPCommand) => void;
  onCommandExecuted?: (command: MCPCommand, response: MCPResponse) => void;
  onError?: (error: Error, command?: MCPCommand) => void;
  navigate?: (path: string, options?: { replace?: boolean }) => void;
}

export interface UseMCPListenerReturn {
  // Connection state
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;

  // Command execution
  executeCommand: <T = any>(type: MCPCommandType, payload: any) => Promise<T>;

  // Statistics
  getStats: () => any;

  // Connection management
  connect: () => Promise<void>;
  disconnect: () => void;
  reconnect: () => Promise<void>;
}

export function useMCPListener(
  options: UseMCPListenerOptions = {}
): UseMCPListenerReturn {
  console.log("[useMCPListener] Hook called with options:", options);

  const { autoConnect = false, navigate: externalNavigate } = options;

  // Only call useNavigate if navigate function not provided
  let navigate: any = null;
  try {
    navigate = externalNavigate || useNavigate();
  } catch (error) {
    // useNavigate fails if not in Router context
    navigate = externalNavigate || null;
    if (!navigate) {
      console.warn(
        "[useMCPListener] useNavigate not available - must provide navigate function in options"
      );
    }
  }

  const { showToast, openModal } = useAppStore();
  const optionsRef = useRef(options);

  // Remove the initialized ref as it's causing issues
  // const inititalizedRef = useRef(false);

  // Use the singleton MCP manager
  const {
    isConnected,
    isConnecting,
    error,
    connect,
    disconnect,
    reconnect,
    getStats,
  } = useMCPManager();

  // Update options ref
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  // Event handlers - use useCallback to ensure stable references
  const handleMCPMessage = useCallback(async (message: MCPMessage) => {
    try {
      console.log("[useMCPListener] Handling MCP message:", message.type);
      switch (message.type) {
        case "response":
          handleCommandResponse(message.payload as MCPResponse);
          break;
        case "heartbeat":
          console.log("[MCP] Heartbeat received");
          break;
        default:
          console.log("[MCP] Message received:", message.type);
      }
    } catch (error) {
      console.error("[MCP] Error handling message:", error);
      optionsRef.current.onError?.(error as Error);
    }
  }, []);

  const handleMCPError = useCallback((event: Event) => {
    console.error("[MCP] Connection error:", event);
    optionsRef.current.onError?.(new Error("MCP connection error"));
  }, []);

  const handleMCPConnected = useCallback(() => {
    console.log("[MCP] Connected successfully");
  }, []);

  const handleMCPDisconnected = useCallback((event: CloseEvent) => {
    console.log("[MCP] Disconnected:", event.code);
  }, []);

  // Handle incoming commands from MCP bridge
  const handleIncomingCommand = useCallback(async (command: MCPCommand) => {
    try {
      console.log(
        `[useMCPListener] Executing incoming command: ${command.type}`,
        command
      );
      optionsRef.current.onCommandReceived?.(command);

      // Execute command using MCP handler
      const response = await mcpHandler.executeCommand(command);
      console.log(`[useMCPListener] Command executed successfully:`, response);

      // Send response back to bridge
      const responseMessage: MCPMessage = {
        type: "response",
        payload: response,
        timestamp: Date.now(),
      };

      mcpManager.sendMessage(responseMessage);
      optionsRef.current.onCommandExecuted?.(command, response);
    } catch (error) {
      console.error(
        "[useMCPListener] Error executing incoming command:",
        error
      );

      // Send error response
      const errorResponse: MCPResponse = {
        id: command.id,
        success: false,
        error:
          error instanceof Error ? error.message : "Command execution failed",
        timestamp: Date.now(),
      };

      const responseMessage: MCPMessage = {
        type: "response",
        payload: errorResponse,
        timestamp: Date.now(),
      };

      mcpManager.sendMessage(responseMessage);
      optionsRef.current.onError?.(error as Error, command);
    }
  }, []);

  // Setup MCP handler options and event listeners
  useEffect(() => {
    console.log(
      "[useMCPListener] Setting up MCP handler and event listeners..."
    );

    // Setup MCP handler with current options
    mcpHandler.updateOptions({
      onNavigate: (path: string, replace?: boolean) => {
        console.log(
          `[useMCPListener] Navigate requested: ${path} (replace: ${replace})`
        );
        if (navigate) {
          if (replace) {
            navigate(path, { replace: true });
          } else {
            navigate(path);
          }
        } else {
          console.warn("[useMCPListener] Navigate function not available");
        }
      },
      onShowNotification: (
        message: string,
        type: string,
        duration?: number
      ) => {
        console.log(`[useMCPListener] Show notification: ${message} (${type})`);
        showToast(message, type as any, duration);
      },
      onUpdateUI: (component: string, action: string, data?: any) => {
        console.log(`[useMCPListener] Update UI: ${component}.${action}`, data);
        handleUIUpdate(component, action, data);
      },
    });

    // Setup event listeners - ensure they are registered each time
    console.log("[useMCPListener] Registering event listeners...");
    mcpManager.on("message", handleMCPMessage);
    mcpManager.on("error", handleMCPError);
    mcpManager.on("connected", handleMCPConnected);
    mcpManager.on("disconnected", handleMCPDisconnected);
    mcpManager.on("commandReceived", handleIncomingCommand);

    // Log current listener count for debugging
    console.log(
      "[useMCPListener] Event listeners registered. Current stats:",
      mcpManager.getStats()
    );

    // Cleanup function
    return () => {
      console.log("[useMCPListener] Cleaning up event listeners...");
      mcpManager.off("message", handleMCPMessage);
      mcpManager.off("error", handleMCPError);
      mcpManager.off("connected", handleMCPConnected);
      mcpManager.off("disconnected", handleMCPDisconnected);
      mcpManager.off("commandReceived", handleIncomingCommand);
    };
  }, [
    handleMCPMessage,
    handleMCPError,
    handleMCPConnected,
    handleMCPDisconnected,
    handleIncomingCommand,
    navigate,
    showToast,
  ]);

  // Handle command responses
  const handleCommandResponse = useCallback((response: MCPResponse) => {
    console.log("[useMCPListener] Handling command response:", response);
    mcpManager.handleResponse(response);
  }, []);

  // Execute outgoing commands
  const executeCommand = useCallback(
    async <T = any>(type: MCPCommandType, payload: any): Promise<T> => {
      if (!isConnected) {
        throw new Error("MCP not connected");
      }
      return mcpManager.executeCommand<T>(type, payload);
    },
    [isConnected]
  );

  // Handle UI updates from MCP commands
  const handleUIUpdate = useCallback(
    (component: string, action: string, data?: any) => {
      try {
        console.log(`[useMCPListener] UI Update: ${component}.${action}`, data);

        switch (component) {
          case "ProductList":
            if (action === "refresh") {
              window.dispatchEvent(new CustomEvent("mcp:refresh-products"));
            } else if (action === "update") {
              window.dispatchEvent(
                new CustomEvent("mcp:update-products", { detail: data })
              );
            }
            break;

          case "ProductForm":
            if (action === "show") {
              openModal("Thêm/Sửa Sản Phẩm", () => null, data);
            }
            break;

          case "SearchFilter":
            if (action === "update") {
              window.dispatchEvent(
                new CustomEvent("mcp:update-filters", { detail: data })
              );
            } else if (action === "clear") {
              window.dispatchEvent(new CustomEvent("mcp:clear-filters"));
            }
            break;

          default:
            console.warn(`[useMCPListener] Unknown UI component: ${component}`);
        }
      } catch (error) {
        console.error("[useMCPListener] Error handling UI update:", error);
      }
    },
    [openModal]
  );

  // Auto connect
  useEffect(() => {
    if (autoConnect && !isConnected && !isConnecting) {
      console.log("[useMCPListener] Auto-connecting to MCP...");
      connect().catch((error) => {
        console.error("[useMCPListener] Auto-connect failed:", error);
      });
    }
  }, [autoConnect, isConnected, isConnecting, connect]);

  return {
    // Connection state
    isConnected,
    isConnecting,
    error,

    // Command execution
    executeCommand,

    // Statistics
    getStats,

    // Connection management
    connect,
    disconnect,
    reconnect,
  };
}

export function useProductMCP() {
  const { executeCommand, isConnected } = useMCPListener();

  const addProduct = useCallback(
    async (productData: AddProductCommand["payload"]) => {
      if (!isConnected) {
        throw new Error("MCP not connected");
      }
      return executeCommand("addProduct", productData);
    },
    [executeCommand, isConnected]
  );

  const removeProduct = useCallback(
    async (productId: string) => {
      if (!isConnected) {
        throw new Error("MCP not connected");
      }
      return executeCommand("removeProduct", { productId });
    },
    [executeCommand, isConnected]
  );

  const searchProduct = useCallback(
    async (query?: string, filters?: any) => {
      if (!isConnected) {
        throw new Error("MCP not connected");
      }
      return executeCommand("searchProduct", { query, filters });
    },
    [executeCommand, isConnected]
  );

  return {
    addProduct,
    removeProduct,
    searchProduct,
    isConnected,
  };
}

export function useUIMCP() {
  const { executeCommand, isConnected } = useMCPListener();

  const clickElement = useCallback(
    async (selector: string, elementType?: string) => {
      if (!isConnected) {
        throw new Error("MCP not connected");
      }
      return executeCommand("clickElement", { selector, elementType });
    },
    [executeCommand, isConnected]
  );

  const fillForm = useCallback(
    async (fields: Record<string, any>, formSelector?: string) => {
      if (!isConnected) {
        throw new Error("MCP not connected");
      }
      return executeCommand("fillForm", { fields, formSelector });
    },
    [executeCommand, isConnected]
  );

  const swipeTab = useCallback(
    async (tabName: string, direction?: "left" | "right") => {
      if (!isConnected) {
        throw new Error("MCP not connected");
      }
      return executeCommand("swipeTab", { tabName, direction });
    },
    [executeCommand, isConnected]
  );

  const updateUI = useCallback(
    async (
      component: string,
      action: "show" | "hide" | "update" | "refresh",
      data?: any
    ) => {
      if (!isConnected) {
        throw new Error("MCP not connected");
      }
      return executeCommand("updateUI", { component, action, data });
    },
    [executeCommand]
  );

  const showNotification = useCallback(
    async (
      message: string,
      type: "success" | "error" | "warning" | "info" = "info",
      duration?: number
    ) => {
      if (!isConnected) {
        throw new Error("MCP not connected");
      }
      return executeCommand("showNotification", { message, type, duration });
    },
    [executeCommand, isConnected]
  );

  const navigateTo = useCallback(
    async (path: string, replace?: boolean) => {
      if (!isConnected) {
        throw new Error("MCP not connected");
      }
      return executeCommand("navigateTo", { path, replace });
    },
    [executeCommand, isConnected]
  );

  return {
    clickElement,
    fillForm,
    swipeTab,
    updateUI,
    showNotification,
    navigateTo,
    isConnected,
  };
}

export function useMCPDebug() {
  const getCommandHistory = useCallback((_type?: MCPCommandType) => {
    return [];
  }, []);

  const clearHistory = useCallback(() => {}, []);

  const getConnectionStats = useCallback(() => {
    return {
      isConnected: mcpManager.isConnected(),
      manager: mcpManager.getStats(),
    };
  }, []);

  return {
    commandHistory: [],
    responseHistory: [],
    getCommandHistory,
    clearHistory,
    getConnectionStats,
  };
}
