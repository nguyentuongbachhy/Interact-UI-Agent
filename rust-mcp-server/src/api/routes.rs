use axum::{
    routing::{delete, get, post},
    Router,
};
use tower_http::cors::{Any, CorsLayer};

use super::handlers::*;
use super::state::AppState;

/// Build application router
pub fn create_router(state: AppState) -> Router {
    // CORS layer for frontend
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    Router::new()
        // Health check
        .route("/health", get(health_check))
        // Session management
        .route("/sessions", post(create_session))
        .route("/sessions", get(list_sessions))
        .route("/sessions/:session_id", delete(delete_session))
        // Main APIs (Step 1)
        .route("/:session_id/get_context", get(get_context))
        .route("/:session_id/execute", post(execute_action))
        .route("/:session_id/trigger", post(handle_trigger))
        // Agent APIs (Step 2)
        .route("/:session_id/agent/execute", post(agent_execute_task))
        .layer(cors)
        .with_state(state)
}
