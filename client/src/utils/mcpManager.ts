import { webSocketService } from "../services";
import type {
  MCPMessage,
  MCPCommand,
  MCPResponse,
  MCPCommandType,
} from "../types";

interface MCPConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  connectionCount: number;
}

class MCPConnectionManager {
  private static instance: MCPConnectionManager | null = null;
  private connectionState: MCPConnectionState = {
    isConnected: false,
    isConnecting: false,
    error: null,
    connectionCount: 0,
  };

  private listeners: Map<string, Function[]> = new Map();
  private connectionPromise: Promise<void> | null = null;
  private initialized = false;

  static getInstance(): MCPConnectionManager {
    if (!MCPConnectionManager.instance) {
      MCPConnectionManager.instance = new MCPConnectionManager();
    }
    return MCPConnectionManager.instance;
  }

  private constructor() {
    this.setupEventListeners();
  }

  private setupEventListeners() {
    if (this.initialized) return;
    this.initialized = true;

    console.log("[MCP Manager] Setting up event listeners");

    webSocketService.on("open", () => {
      console.log("[MCP Manager] WebSocket opened");
      this.updateState({
        isConnected: true,
        isConnecting: false,
        error: null,
      });
      this.emit("connected");
    });

    webSocketService.on("close", (event: CloseEvent) => {
      console.log("[MCP Manager] WebSocket closed:", event.code);
      this.updateState({
        isConnected: false,
        isConnecting: false,
      });
      this.emit("disconnected", event);
    });

    webSocketService.on("error", (event: Event) => {
      console.error("[MCP Manager] WebSocket error:", event);
      this.updateState({
        isConnected: false,
        isConnecting: false,
        error: "WebSocket connection error",
      });
      this.emit("error", event);
    });

    webSocketService.on("message", (message: MCPMessage) => {
      console.log("[MCP Manager] Received message:", message);

      if (message.type === "response") {
        this.handleResponse(message.payload as MCPResponse);
      } else if (message.type === "command") {
        console.log(
          "[MCP Manager] Processing command payload:",
          message.payload
        );
        this.handleCommand(message.payload as MCPCommand);
      } else {
        console.warn("[MCP Manager] Unknown message type:", message.type);
      }

      this.emit("message", message);
    });
  }

  private updateState(updates: Partial<MCPConnectionState>) {
    this.connectionState = { ...this.connectionState, ...updates };
    this.emit("stateChanged", this.connectionState);
  }

  private emit(eventName: string, data?: any) {
    const eventListeners = this.listeners.get(eventName);
    console.log(
      `[MCP Manager] Emitting event '${eventName}' to ${
        eventListeners?.length || 0
      } listeners`
    );

    if (eventListeners) {
      eventListeners.forEach((listener, index) => {
        try {
          console.log(
            `[MCP Manager] Calling listener ${index} for event '${eventName}'`
          );
          listener(data);
        } catch (error) {
          console.error(
            `[MCP Manager] Error in ${eventName} listener ${index}:`,
            error
          );
        }
      });
    } else {
      console.warn(
        `[MCP Manager] No listeners registered for event '${eventName}'`
      );
    }
  }

  async connect(): Promise<void> {
    if (this.connectionState.isConnected) {
      console.log("[MCP Manager] Already connected");
      return Promise.resolve();
    }

    if (this.connectionState.isConnecting || this.connectionPromise) {
      console.log("[MCP Manager] Connection already in progress");
      return this.connectionPromise || Promise.resolve();
    }

    console.log("[MCP Manager] Starting connection...");

    this.connectionPromise = this.performConnection();

    try {
      await this.connectionPromise;
    } finally {
      this.connectionPromise = null;
    }
  }

  private async performConnection(): Promise<void> {
    try {
      this.updateState({ isConnecting: true, error: null });
      this.connectionState.connectionCount++;

      console.log(
        `[MCP Manager] Connection attempt #${this.connectionState.connectionCount}`
      );

      // Direct connection through webSocketService only
      await webSocketService.connect();

      console.log("[MCP Manager] Connection successful");
    } catch (error) {
      console.error("[MCP Manager] Connection failed:", error);
      this.updateState({
        isConnecting: false,
        error: error instanceof Error ? error.message : "Connection failed",
      });
      throw error;
    }
  }

  disconnect(): void {
    console.log("[MCP Manager] Disconnecting...");

    // Direct disconnection through webSocketService only
    webSocketService.disconnect();

    this.updateState({
      isConnected: false,
      isConnecting: false,
      error: null,
    });
  }

  async reconnect(): Promise<void> {
    console.log("[MCP Manager] Reconnecting...");
    this.disconnect();
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await this.connect();
  }

  on(eventName: string, listener: Function): void {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, []);
    }
    this.listeners.get(eventName)!.push(listener);
  }

  off(eventName: string, listener: Function): void {
    const eventListeners = this.listeners.get(eventName);
    if (eventListeners) {
      const index = eventListeners.indexOf(listener);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    }
  }

  // State getters
  getState(): MCPConnectionState {
    return { ...this.connectionState };
  }

  isConnected(): boolean {
    return this.connectionState.isConnected;
  }

  isConnecting(): boolean {
    return this.connectionState.isConnecting;
  }

  getError(): string | null {
    return this.connectionState.error;
  }

  sendMessage(message: MCPMessage): boolean {
    if (!this.connectionState.isConnected) {
      console.warn("[MCP Manager] Cannot send message - not connected");
      return false;
    }

    return webSocketService.send(message);
  }

  // Command execution functionality (moved from mcpStore)
  private pendingCommands: Map<
    string,
    { resolve: Function; reject: Function; timestamp: number }
  > = new Map();

  async executeCommand<T = any>(
    type: MCPCommandType,
    payload: any
  ): Promise<T> {
    if (!this.connectionState.isConnected) {
      throw new Error("MCP Bridge not connected");
    }

    const commandId = `cmd-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 11)}`;
    const command: MCPCommand = {
      id: commandId,
      type,
      payload,
      timestamp: Date.now(),
    };

    return new Promise<T>((resolve, reject) => {
      // Store pending command
      this.pendingCommands.set(commandId, {
        resolve,
        reject,
        timestamp: Date.now(),
      });

      // Send command
      const message: MCPMessage = {
        type: "command",
        payload: command,
        timestamp: Date.now(),
      };

      if (!this.sendMessage(message)) {
        this.pendingCommands.delete(commandId);
        reject(new Error("Failed to send command"));
        return;
      }

      // Set timeout for command
      setTimeout(() => {
        if (this.pendingCommands.has(commandId)) {
          this.pendingCommands.delete(commandId);
          reject(new Error("Command timeout"));
        }
      }, 30000); // 30 second timeout
    });
  }

  handleResponse(response: MCPResponse): void {
    const pending = this.pendingCommands.get(response.id);
    if (pending) {
      this.pendingCommands.delete(response.id);
      if (response.success) {
        pending.resolve(response.data);
      } else {
        pending.reject(new Error(response.error || "Command failed"));
      }
    }
  }

  handleCommand(command: MCPCommand): void {
    console.log("[MCP Manager] Received command from server:", command);
    console.log("[MCP Manager] Command type:", command.type);
    console.log("[MCP Manager] Command payload:", command.payload);

    // Emit command event for listeners (like useMCPListener)
    this.emit("commandReceived", command);

    // Also emit specific command type events
    this.emit(`command:${command.type}`, command);

    console.log("[MCP Manager] Command events emitted successfully");
  }

  getStats() {
    return {
      ...webSocketService.getStats(),
      connectionAttempts: this.connectionState.connectionCount,
      currentState: this.connectionState,
    };
  }

  destroy(): void {
    console.log("[MCP Manager] Destroying manager...");
    this.disconnect();
    this.listeners.clear();
    this.initialized = false;
    MCPConnectionManager.instance = null;
  }
}

export const mcpManager = MCPConnectionManager.getInstance();

import { useState, useEffect, useCallback } from "react";

export function useMCPManager() {
  const [state, setState] = useState(() => mcpManager.getState());

  useEffect(() => {
    const handleStateChange = (newState: MCPConnectionState) => {
      setState(newState);
    };

    mcpManager.on("stateChanged", handleStateChange);

    setState(mcpManager.getState());

    return () => {
      mcpManager.off("stateChanged", handleStateChange);
    };
  }, []);

  const connect = useCallback(() => {
    return mcpManager.connect();
  }, []);

  const disconnect = useCallback(() => {
    mcpManager.disconnect();
  }, []);

  const reconnect = useCallback(() => {
    return mcpManager.reconnect();
  }, []);

  const executeCommand = useCallback(
    <T = any>(type: MCPCommandType, payload: any): Promise<T> => {
      return mcpManager.executeCommand<T>(type, payload);
    },
    []
  );

  return {
    ...state,
    connect,
    disconnect,
    reconnect,
    executeCommand,
    sendMessage: mcpManager.sendMessage.bind(mcpManager),
    getStats: mcpManager.getStats.bind(mcpManager),
  };
}
