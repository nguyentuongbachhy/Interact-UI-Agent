import { useEffect, useCallback, useRef, useState } from "react";
import { webSocketService } from "../services";
import type { MCPMessage, MCPConnectionState } from "../types";
import { MCP_CONFIG } from "../utils/constants";

export interface UseWebSocketOptions {
  url?: string;
  autoConnect?: boolean;
  reconnectAttempts?: number;
  reconnectInterval?: number;
  heartbeatInterval?: number;
  onOpen?: () => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (event: Event) => void;
  onMessage?: (message: MCPMessage) => void;
}

export interface UseWebSocketReturn {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  readyState: number | null;

  connect: (url?: string) => Promise<void>;
  disconnect: () => void;
  reconnect: () => Promise<void>;

  sendMessage: (message: MCPMessage) => boolean;

  getStats: () => {
    reconnectCount: number;
    queuedMessages: number;
    isConnected: boolean;
    readyState: number | null;
  };
}

export function useWebSocket(
  options: UseWebSocketOptions = {}
): UseWebSocketReturn {
  const {
    url = MCP_CONFIG.DEFAULT_URL,
    autoConnect = true,
    reconnectAttempts = MCP_CONFIG.RECONNECT_ATTEMPTS,
    reconnectInterval = MCP_CONFIG.RECONNECT_INTERVAL,
    heartbeatInterval = MCP_CONFIG.HEARTBEAT_INTERVAL,
  } = options;

  const [connectionState, setConnectionState] = useState<MCPConnectionState>({
    isConnected: false,
    isConnecting: false,
    error: null,
    lastHeartbeat: null,
  });

  const optionsRef = useRef(options);
  const mountedRef = useRef(true);

  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      webSocketService.disconnect();
    };
  }, []);

  useEffect(() => {
    webSocketService.updateConfig({
      url,
      reconnectAttempts,
      reconnectInterval,
      heartbeatInterval,
    });
  }, [url, reconnectAttempts, reconnectInterval, heartbeatInterval]);

  useEffect(() => {
    const handleOpen = () => {
      if (!mountedRef.current) return;
      setConnectionState((prev) => ({
        ...prev,
        isConnected: true,
        isConnecting: false,
        error: null,
      }));
      optionsRef.current.onOpen?.();
    };

    const handleClose = (event: CloseEvent) => {
      if (!mountedRef.current) return;
      setConnectionState((prev) => ({
        ...prev,
        isConnected: false,
        isConnecting: false,
      }));
      optionsRef.current.onClose?.(event);
    };

    const handleError = (event: Event) => {
      if (!mountedRef.current) return;
      setConnectionState((prev) => ({
        ...prev,
        error: "WebSocket connection error",
        isConnecting: false,
      }));
      optionsRef.current.onError?.(event);
    };

    const handleMessage = (message: MCPMessage) => {
      if (!mountedRef.current) return;
      if (message.type === "heartbeat") {
        setConnectionState((prev) => ({
          ...prev,
          lastHeartbeat: Date.now(),
        }));
      }
      optionsRef.current.onMessage?.(message);
    };

    webSocketService.on("open", handleOpen);
    webSocketService.on("close", handleClose);
    webSocketService.on("error", handleError);
    webSocketService.on("message", handleMessage);

    return () => {
      webSocketService.off("open", handleOpen);
      webSocketService.off("close", handleClose);
      webSocketService.off("error", handleError);
      webSocketService.off("message", handleMessage);
    };
  }, []);

  useEffect(() => {
    if (
      autoConnect &&
      !connectionState.isConnected &&
      !connectionState.isConnecting
    ) {
      setConnectionState((prev) => ({ ...prev, isConnecting: true }));
      connect().catch(console.error);
    }
  }, [autoConnect]);

  const connect = useCallback(
    async (connectUrl?: string) => {
      if (connectionState.isConnected || connectionState.isConnecting) {
        console.warn("WebSocket is already connected or connecting");
        return;
      }

      try {
        setConnectionState((prev) => ({
          ...prev,
          isConnecting: true,
          error: null,
        }));

        await webSocketService.connect(connectUrl || url);
      } catch (error) {
        if (mountedRef.current) {
          setConnectionState((prev) => ({
            ...prev,
            isConnecting: false,
            error: error instanceof Error ? error.message : "Connection failed",
          }));
        }
        throw error;
      }
    },
    [url, connectionState.isConnected, connectionState.isConnecting]
  );

  const disconnect = useCallback(() => {
    webSocketService.disconnect();
    setConnectionState({
      isConnected: false,
      isConnecting: false,
      error: null,
      lastHeartbeat: null,
    });
  }, []);

  const reconnect = useCallback(async () => {
    disconnect();
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await connect();
  }, [connect, disconnect]);

  const sendMessage = useCallback((message: MCPMessage): boolean => {
    try {
      return webSocketService.send(message);
    } catch (error) {
      console.error("Failed to send message:", error);
      return false;
    }
  }, []);

  const getStats = useCallback(() => {
    return webSocketService.getStats();
  }, []);

  return {
    isConnected: connectionState.isConnected,
    isConnecting: connectionState.isConnecting,
    error: connectionState.error,
    readyState: webSocketService.getReadyState(),

    connect,
    disconnect,
    reconnect,

    sendMessage,

    getStats,
  };
}

export function useWebSocketStatus() {
  const [connectionState, setConnectionState] = useState<MCPConnectionState>({
    isConnected: false,
    isConnecting: false,
    error: null,
    lastHeartbeat: null,
  });

  useEffect(() => {
    const updateState = () => {
      const state = webSocketService.getConnectionState();
      setConnectionState(state);
    };

    const handleOpen = () => updateState();
    const handleClose = () => updateState();
    const handleError = () => updateState();

    webSocketService.on("open", handleOpen);
    webSocketService.on("close", handleClose);
    webSocketService.on("error", handleError);

    updateState();

    return () => {
      webSocketService.off("open", handleOpen);
      webSocketService.off("close", handleClose);
      webSocketService.off("error", handleError);
    };
  }, []);

  return connectionState;
}

export function useWebSocketHealth() {
  const { isConnected, lastHeartbeat } = useWebSocketStatus();

  const isHealthy = useCallback((): boolean => {
    if (!isConnected) return false;

    if (!lastHeartbeat) return true;

    const now = Date.now();
    const timeSinceLastHeartbeat = now - lastHeartbeat;

    return timeSinceLastHeartbeat < MCP_CONFIG.HEARTBEAT_INTERVAL * 2;
  }, [isConnected, lastHeartbeat]);

  const getHealthStatus = useCallback(() => {
    return {
      isConnected,
      isHealthy: isHealthy(),
      lastHeartbeat,
      timeSinceLastHeartbeat: lastHeartbeat ? Date.now() - lastHeartbeat : null,
    };
  }, [isConnected, isHealthy, lastHeartbeat]);

  return {
    isHealthy: isHealthy(),
    getHealthStatus,
  };
}
