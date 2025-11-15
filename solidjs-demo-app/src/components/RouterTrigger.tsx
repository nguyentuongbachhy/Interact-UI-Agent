import { createEffect, on } from 'solid-js';
import { useLocation } from '@solidjs/router';
import { mcpService } from '../services/mcpService';

/**
 * RouterTrigger Component - Step 1.5 Implementation
 *
 * This component implements the "White-box Trigger" part of the Hybrid Architecture.
 * It monitors client-side routing changes and notifies the MCP server when the page changes.
 *
 * Key Features:
 * - Uses useLocation() from @solidjs/router to track current path
 * - Uses createEffect() to react to path changes
 * - Sends POST /:session_id/trigger when routing occurs
 * - Enables the server to proactively refresh UI context (AXTree) on SPA navigation
 *
 * Why This is Important:
 * In a SPA, the URL changes but the browser doesn't reload. Without this trigger,
 * the MCP server wouldn't know when to extract new UI context after navigation.
 * This solves the "SPA challenge" mentioned in the technical spec.
 */
export function RouterTrigger() {
  const location = useLocation();

  // Monitor path changes and send trigger to MCP server
  createEffect(
    on(
      () => location.pathname,
      (pathname) => {
        console.log('[RouterTrigger] Path changed:', pathname);

        // Send trigger event to MCP server
        mcpService
          .sendTrigger({
            event: 'page_changed',
            path: pathname,
            metadata: {
              search: location.search,
              hash: location.hash,
              timestamp: Date.now(),
            },
          })
          .catch((err) => {
            console.error('[RouterTrigger] Failed to send trigger:', err);
          });
      },
      { defer: false } // Run immediately on mount
    )
  );

  // This component doesn't render anything
  return null;
}
