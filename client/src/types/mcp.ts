export type MCPCommandType =
  | "addProduct"
  | "removeProduct"
  | "searchProduct"
  | "clickElement"
  | "fillForm"
  | "swipeTab"
  | "updateUI"
  | "showNotification"
  | "navigateTo";

export interface MCPCommand {
  id: string;
  type: MCPCommandType;
  payload: any;
  timestamp: number;
}

export interface AddProductCommand {
  type: "addProduct";
  payload: {
    name: string;
    description?: string;
    price: number;
    quantity: number;
    category?: string;
    imageUrl?: string;
  };
}

export interface RemoveProductCommand {
  type: "removeProduct";
  payload: {
    productId: string;
  };
}

export interface SearchProductCommand {
  type: "searchProduct";
  payload: {
    query?: string;
    filters?: {
      category?: string;
      minPrice?: number;
      maxPrice?: number;
      inStock?: boolean;
    };
  };
}

export interface ClickElementCommand {
  type: "clickElement";
  payload: {
    selector: string;
    elementType?: "button" | "link" | "input" | "div";
  };
}

export interface FillFormCommand {
  type: "fillForm";
  payload: {
    formSelector?: string;
    fields: Record<string, string | number | boolean>;
  };
}

export interface SwipeTabCommand {
  type: "swipeTab";
  payload: {
    tabName: string;
    direction?: "left" | "right";
  };
}

export interface UpdateUICommand {
  type: "updateUI";
  payload: {
    component: string;
    action: "show" | "hide" | "update" | "refresh";
    data?: any;
  };
}

export interface ShowNotificationCommand {
  type: "showNotification";
  payload: {
    message: string;
    type: "success" | "error" | "warning" | "info";
    duration?: number;
  };
}

export interface NavigateToCommand {
  type: "navigateTo";
  payload: {
    path: string;
    replace?: boolean;
  };
}

export interface MCPResponse {
  id: string;
  success: boolean;
  data?: any;
  error?: string;
  timestamp: number;
}

export interface MCPConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  lastHeartbeat: number | null;
}

export interface MCPMessage {
  type: "command" | "response" | "heartbeat" | "error" | "ready";
  payload: any;
  timestamp: number;
}
