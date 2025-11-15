mod agent;
mod api;
mod browser;
mod models;
mod session;

use anyhow::Result;
use axum::Router;
use std::net::SocketAddr;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

use api::{create_router, AppState};

#[tokio::main]
async fn main() -> Result<()> {
    // Initialize tracing
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "mcp_server=debug,tower_http=debug".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    // Load environment variables
    dotenv::dotenv().ok();

    tracing::info!("Starting MCP Server for UI Automation");

    // Initialize Playwright (install browsers if needed)
    tracing::info!("Initializing Playwright...");
    // Note: You may need to run `npx playwright install` first

    // Create application state
    let state = AppState::new();

    // Build router
    let app: Router = create_router(state);

    // Determine port
    let port = std::env::var("PORT")
        .ok()
        .and_then(|p| p.parse().ok())
        .unwrap_or(8080);

    let addr = SocketAddr::from(([0, 0, 0, 0], port));

    tracing::info!("MCP Server listening on {}", addr);
    tracing::info!("API Documentation:");
    tracing::info!("  POST /sessions - Create new session");
    tracing::info!("  GET  /sessions - List all sessions");
    tracing::info!("  GET  /:session_id/get_context - Get UI context (AXTree)");
    tracing::info!("  POST /:session_id/execute - Execute action");
    tracing::info!("  POST /:session_id/trigger - Handle client trigger");
    tracing::info!("  POST /:session_id/agent/execute - Execute task with AI agent (Step 2)");
    tracing::info!("  DELETE /sessions/:session_id - Delete session");

    // Start server
    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}
