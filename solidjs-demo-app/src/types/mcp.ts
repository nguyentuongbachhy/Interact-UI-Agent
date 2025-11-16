// Types for MCP Server communication

export interface TriggerEvent {
  event: 'page_changed' | 'user_action' | 'state_update';
  path: string;
  metadata?: Record<string, any>;
}

export interface TriggerResponse {
  acknowledged: boolean;
  context_refreshed: boolean;
  context?: UIContext;
}

export interface UIContext {
  url: string;
  title: string;
  viewport: Viewport;
  elements: SimplifiedElement[];
}

export interface Viewport {
  width: number;
  height: number;
  scroll_x: number;
  scroll_y: number;
}

export interface SimplifiedElement {
  id: number;
  display: string;
  selector: SemanticSelector;
  in_viewport: boolean;
}

export interface SemanticSelector {
  role: string;
  name?: string;
  description?: string;
  css_fallback?: string;
}

export interface ActionRequest {
  tool: 'click' | 'type' | 'scroll' | 'wait_for_element' | 'navigate';
  role?: string;
  name?: string;
  text?: string;
  direction?: 'up' | 'down' | 'left' | 'right';
  amount?: number;
  timeout_ms?: number;
  url?: string;
}

export interface ActionResponse {
  success: boolean;
  error?: string;
  reason?: string;
  suggestion?: string;
  details?: any;
}
