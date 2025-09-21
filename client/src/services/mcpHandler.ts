import type {
  MCPCommand,
  MCPResponse,
  MCPCommandType,
  AddProductCommand,
  RemoveProductCommand,
  SearchProductCommand,
  ClickElementCommand,
  FillFormCommand,
  SwipeTabCommand,
  UpdateUICommand,
  ShowNotificationCommand,
  NavigateToCommand,
} from "../types";
import { productService } from "./productService";

export interface MCPHandlerOptions {
  onNavigate?: (path: string, replace?: boolean) => void;
  onShowNotification?: (
    message: string,
    type: string,
    duration?: number
  ) => void;
  onUpdateUI?: (component: string, action: string, data?: any) => void;
}

export class MCPHandler {
  private options: MCPHandlerOptions;
  private commandHandlers: Map<MCPCommandType, (payload: any) => Promise<any>>;

  constructor(options: MCPHandlerOptions = {}) {
    this.options = options;
    this.commandHandlers = new Map();
    this.registerDefaultHandlers();
  }

  private registerDefaultHandlers(): void {
    this.commandHandlers.set("addProduct", this.handleAddProduct.bind(this));
    this.commandHandlers.set(
      "removeProduct",
      this.handleRemoveProduct.bind(this)
    );
    this.commandHandlers.set(
      "searchProduct",
      this.handleSearchProduct.bind(this)
    );
    this.commandHandlers.set(
      "clickElement",
      this.handleClickElement.bind(this)
    );
    this.commandHandlers.set("fillForm", this.handleFillForm.bind(this));
    this.commandHandlers.set("swipeTab", this.handleSwipeTab.bind(this));
    this.commandHandlers.set("updateUI", this.handleUpdateUI.bind(this));
    this.commandHandlers.set(
      "showNotification",
      this.handleShowNotification.bind(this)
    );
    this.commandHandlers.set("navigateTo", this.handleNavigateTo.bind(this));
  }

  // Main command execution method
  async executeCommand(command: MCPCommand): Promise<MCPResponse> {
    try {
      console.log(`Executing MCP command: ${command.type}`, command.payload);

      const handler = this.commandHandlers.get(command.type);
      if (!handler) {
        throw new Error(`Unknown command type: ${command.type}`);
      }

      const result = await handler(command.payload);

      return {
        id: command.id,
        success: true,
        data: result,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error(`Error executing command ${command.type}:`, error);

      return {
        id: command.id,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: Date.now(),
      };
    }
  }

  // Product operations
  private async handleAddProduct(
    payload: AddProductCommand["payload"]
  ): Promise<any> {
    try {
      const product = await productService.createProduct(payload);

      // Show success notification
      this.options.onShowNotification?.(
        `Product "${product.name}" added successfully`,
        "success"
      );

      // Update UI to refresh product list
      this.options.onUpdateUI?.("ProductList", "refresh");

      return { success: true, product };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Can not add any product";
      this.options.onShowNotification?.(message, "error");
      throw error;
    }
  }

  private async handleRemoveProduct(
    payload: RemoveProductCommand["payload"]
  ): Promise<any> {
    try {
      await productService.deleteProduct(payload.productId);

      this.options.onShowNotification?.(
        "Deleted product successfully",
        "success"
      );

      this.options.onUpdateUI?.("ProductList", "refresh");

      return { success: true };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Can not delete product";
      this.options.onShowNotification?.(message, "error");
      throw error;
    }
  }

  private async handleSearchProduct(
    payload: SearchProductCommand["payload"]
  ): Promise<any> {
    try {
      const result = await productService.searchProducts(
        payload.query || "",
        payload.filters
      );

      // Update UI with search results
      this.options.onUpdateUI?.("ProductList", "update", {
        products: result.products,
        query: payload.query,
        filters: payload.filters,
      });

      return {
        success: true,
        products: result.products,
        total: result.total,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Search failed";
      this.options.onShowNotification?.(message, "error");
      throw error;
    }
  }

  // UI Interaction handlers
  private async handleClickElement(
    payload: ClickElementCommand["payload"]
  ): Promise<any> {
    try {
      const element = document.querySelector(payload.selector);

      if (!element) {
        throw new Error(`Element not found: ${payload.selector}`);
      }

      // Create and dispatch click event
      const clickEvent = new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
        view: window,
      });

      element.dispatchEvent(clickEvent);

      // If it's a focusable element, also focus it
      if (
        element instanceof HTMLElement &&
        (element.tagName === "INPUT" ||
          element.tagName === "BUTTON" ||
          element.tabIndex >= 0)
      ) {
        element.focus();
      }

      return {
        success: true,
        element: {
          tagName: element.tagName,
          id: element.id,
          className: element.className,
        },
      };
    } catch (error) {
      throw new Error(
        `Click failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  private async handleFillForm(
    payload: FillFormCommand["payload"]
  ): Promise<any> {
    try {
      const results: Array<{
        field: string;
        success: boolean;
        error?: string;
      }> = [];

      for (const [fieldName, value] of Object.entries(payload.fields)) {
        try {
          let selector = `[name="${fieldName}"]`;

          // If form selector is provided, scope to that form
          if (payload.formSelector) {
            selector = `${payload.formSelector} ${selector}`;
          }

          const element = document.querySelector(selector) as
            | HTMLInputElement
            | HTMLSelectElement
            | HTMLTextAreaElement;

          if (!element) {
            results.push({
              field: fieldName,
              success: false,
              error: "Element not found",
            });
            continue;
          }

          // Handle different input types
          if (element instanceof HTMLInputElement) {
            if (element.type === "checkbox" || element.type === "radio") {
              element.checked = Boolean(value);
            } else {
              element.value = String(value);
            }
          } else if (
            element instanceof HTMLSelectElement ||
            element instanceof HTMLTextAreaElement
          ) {
            element.value = String(value);
          }

          // Dispatch input and change events
          element.dispatchEvent(new Event("input", { bubbles: true }));
          element.dispatchEvent(new Event("change", { bubbles: true }));

          results.push({ field: fieldName, success: true });
        } catch (error) {
          results.push({
            field: fieldName,
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      const successCount = results.filter((r) => r.success).length;
      const totalCount = results.length;

      return {
        success: successCount === totalCount,
        results,
        summary: `${successCount}/${totalCount} fields filled successfully`,
      };
    } catch (error) {
      throw new Error(
        `Form fill failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  private async handleSwipeTab(
    payload: SwipeTabCommand["payload"]
  ): Promise<any> {
    try {
      // Find tab by name or data attribute
      const tabSelectors = [
        `[data-tab="${payload.tabName}"]`,
        `[aria-label="${payload.tabName}"]`,
        `[title="${payload.tabName}"]`,
      ];

      let tabElement: Element | null = null;

      for (const selector of tabSelectors) {
        tabElement = document.querySelector(selector);
        if (tabElement) break;
      }

      if (!tabElement) {
        throw new Error(`Tab not found: ${payload.tabName}`);
      }

      // Create and dispatch click event to switch tab
      const clickEvent = new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
        view: window,
      });

      tabElement.dispatchEvent(clickEvent);

      return {
        success: true,
        tabName: payload.tabName,
        element: {
          tagName: tabElement.tagName,
          id: tabElement.id,
          className: tabElement.className,
        },
      };
    } catch (error) {
      throw new Error(
        `Tab switch failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  // UI Update handlers
  private async handleUpdateUI(
    payload: UpdateUICommand["payload"]
  ): Promise<any> {
    try {
      this.options.onUpdateUI?.(
        payload.component,
        payload.action,
        payload.data
      );

      return {
        success: true,
        component: payload.component,
        action: payload.action,
      };
    } catch (error) {
      throw error;
    }
  }

  private async handleShowNotification(
    payload: ShowNotificationCommand["payload"]
  ): Promise<any> {
    try {
      this.options.onShowNotification?.(
        payload.message,
        payload.type,
        payload.duration
      );

      return { success: true };
    } catch (error) {
      throw error;
    }
  }

  private async handleNavigateTo(
    payload: NavigateToCommand["payload"]
  ): Promise<any> {
    try {
      this.options.onNavigate?.(payload.path, payload.replace);

      return {
        success: true,
        path: payload.path,
      };
    } catch (error) {
      throw error;
    }
  }

  // Handler registration
  registerHandler(
    type: MCPCommandType,
    handler: (payload: any) => Promise<any>
  ): void {
    this.commandHandlers.set(type, handler);
  }

  unregisterHandler(type: MCPCommandType): boolean {
    return this.commandHandlers.delete(type);
  }

  // Options update
  updateOptions(newOptions: Partial<MCPHandlerOptions>): void {
    this.options = { ...this.options, ...newOptions };
  }

  // Utility methods
  getRegisteredHandlers(): MCPCommandType[] {
    return Array.from(this.commandHandlers.keys());
  }

  hasHandler(type: MCPCommandType): boolean {
    return this.commandHandlers.has(type);
  }
}

// Export singleton instance
export const mcpHandler = new MCPHandler();
