use axum::{
    middleware,
    routing::{delete, get, post},
    Router,
};
use tower_http::cors::{Any, CorsLayer};
use tower_governor::{governor::GovernorConfigBuilder, GovernorLayer};

#[allow(unused_imports)] // Used when protected_routes is enabled
use crate::auth::{auth_middleware, optional_auth_middleware};
use super::handlers::*;
use super::state::AppState;

/// Build application router
pub fn create_router(state: AppState) -> Router {
    // CORS layer for frontend
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    // Rate limiting (Step 4)
    // Get rate limit from environment or use default (60 requests per minute)
    let rate_limit_per_minute: u64 = std::env::var("RATE_LIMIT_PER_MINUTE")
        .ok()
        .and_then(|s| s.parse().ok())
        .unwrap_or(60);

    let governor_conf = std::sync::Arc::new(
        GovernorConfigBuilder::default()
            .per_second((rate_limit_per_minute / 60) as u64) // Convert to per-second
            .burst_size(((rate_limit_per_minute / 60) * 10) as u32) // Allow bursts
            .finish()
            .expect("Failed to create rate limiter config"),
    );

    let rate_limit_layer = GovernorLayer {
        config: governor_conf,
    };

    // Public routes (no auth required)
    let public_routes = Router::new()
        .route("/health", get(health_check))
        .route("/auth/login", post(login));

    // Optional auth routes (work with or without auth)
    let optional_auth_routes = Router::new()
        .route("/sessions", post(create_session))
        .route("/sessions", get(list_sessions))
        .layer(middleware::from_fn_with_state(
            state.jwt_handler.clone(),
            optional_auth_middleware,
        ));

    // Protected routes (require authentication) - commented out for now since we want backward compatibility
    // Can be enabled in production
    /* let protected_routes = Router::new()
        .route("/sessions/:session_id", delete(delete_session))
        .route("/:session_id/get_context", get(get_context))
        .route("/:session_id/execute", post(execute_action))
        .route("/:session_id/trigger", post(handle_trigger))
        .route("/:session_id/agent/execute", post(agent_execute_task))
        .route("/:session_id/agent/execute_multi_step", post(agent_execute_multi_step))
        .route("/auth/me", get(get_current_user))
        .layer(middleware::from_fn_with_state(
            state.jwt_handler.clone(),
            auth_middleware,
        ));
    */

    // For now, use optional auth for backward compatibility
    let main_routes = Router::new()
        .route("/sessions/:session_id", delete(delete_session))
        .route("/:session_id/get_context", get(get_context))
        .route("/:session_id/execute", post(execute_action))
        .route("/:session_id/trigger", post(handle_trigger))
        .route("/:session_id/agent/execute", post(agent_execute_task))
        .route("/:session_id/agent/execute_multi_step", post(agent_execute_multi_step))
        .route("/auth/me", get(get_current_user))
        .layer(middleware::from_fn_with_state(
            state.jwt_handler.clone(),
            optional_auth_middleware,
        ));

    // Combine all routes
    Router::new()
        .merge(public_routes)
        .merge(optional_auth_routes)
        .merge(main_routes)
        .layer(rate_limit_layer)
        .layer(cors)
        .with_state(state)
}
