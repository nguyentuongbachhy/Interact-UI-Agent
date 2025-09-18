import type { MCPMessage, MCPConnectionState } from "../types";
import { getErrorMessage } from "../utils/constants";

export type WebSocketEventType = "open" | "close" | "error" | "message";

export interface WebSocketServiceConfig {
  url?: string;
  protocols?: string[];
  reconnectAttempts?: number;
  reconnectInterval?: number;
  heartbeatInterval?: number;
  connectionTimeout?: number;
}

export class WebSocketService {
  private ws: WebSocket | null = null;
  private config: Required<WebSocketServiceConfig>;
  private reconnectCount = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private connectionTimer: NodeJS.Timeout | null = null;
  private eventListeners: Map<WebSocketEventType, Set<Function>> = new Map();
  private messageQueue: MCPMessage[] = [];
  private isIntentionalClose = false;

  constructor(config: WebSocketServiceConfig = {}) {
    this.config = {
      url: config.url || this.getDefaultUrl(),
      protocols: config.protocols || [],
      reconnectAttempts: config.reconnectAttempts || 5,
      reconnectInterval: config.reconnectInterval || 3000,
      heartbeatInterval: config.heartbeatInterval || 30000,
      connectionTimeout: config.connectionTimeout || 10000,
    };

    this.initEventListeners();
  }

  private getDefaultUrl(): string {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.hostname;
    const port = import.meta.env.VITE_MCP_PORT || "8001";
    return `${protocol}//${host}:${port}/mcp`;
  }

  private initEventListeners(): void {
    this.eventListeners.set("open", new Set());
    this.eventListeners.set("close", new Set());
    this.eventListeners.set("error", new Set());
    this.eventListeners.set("message", new Set());
  }

  // Event listener management
  on(event: WebSocketEventType, callback: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.add(callback);
    }
  }

  off(event: WebSocketEventType, callback: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  private emit(event: WebSocketEventType, ...args: any[]): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach((callback) => {
        try {
          callback(...args);
        } catch (error) {
          console.error(`Error in ${event} listener:`, error);
        }
      });
    }
  }

  // Connection management
  async connect(url?: string): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.warn("WebSocket is already connected");
      return;
    }

    const connectUrl = url || this.config.url;
    this.isIntentionalClose = false;

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(connectUrl, this.config.protocols);

        // Connection timeout
        this.connectionTimer = setTimeout(() => {
          if (this.ws?.readyState !== WebSocket.OPEN) {
            this.ws?.close();
            reject(new Error("Connection timeout"));
          }
        }, this.config.connectionTimeout);

        this.ws.onopen = (event) => {
          console.log("WebSocket connected to:", connectUrl);

          if (this.connectionTimer) {
            clearTimeout(this.connectionTimer);
            this.connectionTimer = null;
          }

          this.reconnectCount = 0;
          this.startHeartbeat();
          this.flushMessageQueue();

          this.emit("open", event);
          resolve();
        };

        this.ws.onclose = (event) => {
          console.log("WebSocket closed:", event.code, event.reason);

          this.stopHeartbeat();
          this.emit("close", event);

          if (!this.isIntentionalClose && this.shouldReconnect()) {
            this.scheduleReconnect();
          }
        };

        this.ws.onerror = (event) => {
          console.error("WebSocket error:", event);
          this.emit("error", event);

          if (this.connectionTimer) {
            clearTimeout(this.connectionTimer);
            this.connectionTimer = null;
          }

          reject(new Error(getErrorMessage("MCP_CONNECTION_ERROR")));
        };

        this.ws.onmessage = (event) => {
          try {
            const message: MCPMessage = JSON.parse(event.data);

            // Handle ready message to complete connection handshake
            if (message.type === "ready") {
              console.log("MCP connection ready:", message.payload);
              // The 'open' event already handled connection state
              // Just emit the ready message for any listeners
              this.emit("message", message);
            } else {
              this.emit("message", message);
            }
          } catch (error) {
            console.error("Failed to parse WebSocket message:", error);
            this.emit("error", new Error("Invalid message format"));
          }
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect(
    code: number = 1000,
    reason: string = "Intentional disconnect"
  ): void {
    this.isIntentionalClose = true;
    this.clearReconnectTimer();
    this.stopHeartbeat();

    if (this.ws) {
      this.ws.close(code, reason);
      this.ws = null;
    }
  }

  // Message sending
  send(message: MCPMessage): boolean {
    if (this.ws?.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(message));
        return true;
      } catch (error) {
        console.error("Failed to send WebSocket message:", error);
        return false;
      }
    } else {
      // Queue message if not connected
      this.messageQueue.push(message);
      console.warn("WebSocket not connected, message queued");
      return false;
    }
  }

  // Connection state
  getConnectionState(): MCPConnectionState {
    return {
      isConnected: this.ws?.readyState === WebSocket.OPEN,
      isConnecting: this.ws?.readyState === WebSocket.CONNECTING,
      error: null, // Error state managed by consumer
      lastHeartbeat: Date.now(), // Managed by consumer
    };
  }

  getReadyState(): number | null {
    return this.ws?.readyState || null;
  }

  // Private methods
  private shouldReconnect(): boolean {
    return this.reconnectCount < this.config.reconnectAttempts;
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      return;
    }

    this.reconnectCount++;
    const delay =
      this.config.reconnectInterval * Math.pow(1.5, this.reconnectCount - 1);

    console.log(
      `Scheduling reconnect attempt ${this.reconnectCount}/${this.config.reconnectAttempts} in ${delay}ms`
    );

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect().catch((error) => {
        console.error("Reconnect failed:", error);
      });
    }, delay);
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();

    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send({
          type: "heartbeat",
          payload: {},
          timestamp: Date.now(),
        });
      }
    }, this.config.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message && !this.send(message)) {
        // If send fails, put message back at beginning of queue
        this.messageQueue.unshift(message);
        break;
      }
    }
  }

  // Configuration
  updateConfig(newConfig: Partial<WebSocketServiceConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig(): WebSocketServiceConfig {
    return { ...this.config };
  }

  // Statistics
  getStats(): {
    reconnectCount: number;
    queuedMessages: number;
    isConnected: boolean;
    readyState: number | null;
  } {
    return {
      reconnectCount: this.reconnectCount,
      queuedMessages: this.messageQueue.length,
      isConnected: this.ws?.readyState === WebSocket.OPEN,
      readyState: this.ws?.readyState || null,
    };
  }

  // Cleanup
  destroy(): void {
    this.disconnect();
    this.clearReconnectTimer();
    this.eventListeners.clear();
    this.messageQueue = [];
  }
}

// Export singleton instance
export const webSocketService = new WebSocketService();
