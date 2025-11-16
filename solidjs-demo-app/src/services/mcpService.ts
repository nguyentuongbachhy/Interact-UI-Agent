import type { TriggerEvent, TriggerResponse, ActionRequest, ActionResponse, UIContext } from '../types/mcp';

const MCP_SERVER_URL = import.meta.env.VITE_MCP_SERVER_URL || 'http://localhost:8080';

class MCPService {
  private sessionId: string | null = null;

  /**
   * Initialize session with MCP server
   */
  async createSession(initialUrl: string): Promise<string> {
    const response = await fetch(`${MCP_SERVER_URL}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        initial_url: initialUrl,
        viewport_width: window.innerWidth,
        viewport_height: window.innerHeight,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create session: ${response.statusText}`);
    }

    const data = await response.json();
    this.sessionId = data.session_id;

    console.log('[MCP] Session created:', this.sessionId);
    return this.sessionId;
  }

  /**
   * Send trigger event to MCP server (Step 1.5 - White-box trigger)
   */
  async sendTrigger(event: TriggerEvent): Promise<TriggerResponse> {
    if (!this.sessionId) {
      console.warn('[MCP] No session ID, skipping trigger');
      return { acknowledged: false, context_refreshed: false };
    }

    try {
      const response = await fetch(`${MCP_SERVER_URL}/${this.sessionId}/trigger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      });

      if (!response.ok) {
        throw new Error(`Trigger failed: ${response.statusText}`);
      }

      const data: TriggerResponse = await response.json();
      console.log('[MCP] Trigger sent:', event.event, event.path, '→', data);

      return data;
    } catch (error) {
      console.error('[MCP] Trigger error:', error);
      return { acknowledged: false, context_refreshed: false };
    }
  }

  /**
   * Get current UI context (AXTree)
   */
  async getContext(): Promise<UIContext | null> {
    if (!this.sessionId) {
      throw new Error('No active session');
    }

    const response = await fetch(`${MCP_SERVER_URL}/${this.sessionId}/get_context`);

    if (!response.ok) {
      throw new Error(`Failed to get context: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Execute an action on the page
   */
  async executeAction(action: ActionRequest): Promise<ActionResponse> {
    if (!this.sessionId) {
      throw new Error('No active session');
    }

    const response = await fetch(`${MCP_SERVER_URL}/${this.sessionId}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(action),
    });

    if (!response.ok) {
      throw new Error(`Action execution failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Delete current session
   */
  async deleteSession(): Promise<void> {
    if (!this.sessionId) {
      return;
    }

    await fetch(`${MCP_SERVER_URL}/sessions/${this.sessionId}`, {
      method: 'DELETE',
    });

    console.log('[MCP] Session deleted:', this.sessionId);
    this.sessionId = null;
  }

  getSessionId(): string | null {
    return this.sessionId;
  }
}

// Singleton instance
export const mcpService = new MCPService();
