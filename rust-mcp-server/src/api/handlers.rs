use axum::{
    extract::{Path, State},
    http::StatusCode,
    Extension,
    Json,
};
use serde::{Deserialize, Serialize};

use crate::agent::{AgentExecutor, AgentExecutionResult, MultiStepExecutionResult};
use crate::auth::{AuthUser, Claims};
use crate::browser::ContextExtractor;
use crate::models::{ActionRequest, ActionResponse, TriggerEvent, UIContext};

use super::state::AppState;

/// Health check endpoint
pub async fn health_check() -> &'static str {
    "OK"
}

/// Create new session
#[derive(Debug, Deserialize)]
pub struct CreateSessionRequest {
    pub initial_url: String,
    #[serde(default = "default_viewport_width")]
    pub viewport_width: u32,
    #[serde(default = "default_viewport_height")]
    pub viewport_height: u32,
}

fn default_viewport_width() -> u32 {
    1280
}

fn default_viewport_height() -> u32 {
    720
}

#[derive(Debug, Serialize)]
pub struct CreateSessionResponse {
    pub session_id: String,
}

pub async fn create_session(
    State(state): State<AppState>,
    Json(req): Json<CreateSessionRequest>,
) -> Result<Json<CreateSessionResponse>, (StatusCode, String)> {
    let session_id = state
        .session_manager
        .create_session(req.initial_url, req.viewport_width, req.viewport_height)
        .await
        .map_err(|e| {
            tracing::error!("Failed to create session: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to create session: {}", e),
            )
        })?;

    Ok(Json(CreateSessionResponse { session_id }))
}

/// Get UI context (Step 1 API: get_context)
/// This implements Solution A: AXTree extraction
pub async fn get_context(
    State(state): State<AppState>,
    Path(session_id): Path<String>,
) -> Result<Json<UIContext>, (StatusCode, String)> {
    // Update activity
    state
        .session_manager
        .update_activity(&session_id)
        .map_err(|e| {
            (
                StatusCode::NOT_FOUND,
                format!("Session not found: {}", e),
            )
        })?;

    // Get browser
    let browser = state
        .session_manager
        .get_browser(&session_id)
        .map_err(|e| {
            (
                StatusCode::NOT_FOUND,
                format!("Session not found: {}", e),
            )
        })?;

    // Extract context
    let page = browser.get_page().await;
    let context = ContextExtractor::extract(page).await.map_err(|e| {
        tracing::error!("Failed to extract context: {}", e);
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to extract context: {}", e),
        )
    })?;

    Ok(Json(context))
}

/// Execute action (Step 1 API: execute)
/// This implements Solution B: Semantic Selectors and Solution C: Smart Feedback
pub async fn execute_action(
    State(state): State<AppState>,
    Path(session_id): Path<String>,
    Json(action): Json<ActionRequest>,
) -> Result<Json<ActionResponse>, (StatusCode, String)> {
    // Update activity
    state
        .session_manager
        .update_activity(&session_id)
        .map_err(|e| {
            (
                StatusCode::NOT_FOUND,
                format!("Session not found: {}", e),
            )
        })?;

    // Get browser
    let browser = state
        .session_manager
        .get_browser(&session_id)
        .map_err(|e| {
            (
                StatusCode::NOT_FOUND,
                format!("Session not found: {}", e),
            )
        })?;

    // Execute action
    let response = browser.execute_action(&action).await.map_err(|e| {
        tracing::error!("Failed to execute action: {}", e);
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to execute action: {}", e),
        )
    })?;

    Ok(Json(response))
}

/// Handle trigger event (Step 1.5 API: trigger)
/// This is called by the SolidJS client when page changes
pub async fn handle_trigger(
    State(state): State<AppState>,
    Path(session_id): Path<String>,
    Json(trigger): Json<TriggerEvent>,
) -> Result<Json<TriggerResponse>, (StatusCode, String)> {
    tracing::info!(
        "Received trigger event: {:?} for path: {}",
        trigger.event,
        trigger.path
    );

    // Update activity
    state
        .session_manager
        .update_activity(&session_id)
        .map_err(|e| {
            (
                StatusCode::NOT_FOUND,
                format!("Session not found: {}", e),
            )
        })?;

    // Get browser to potentially refresh context
    let browser = state
        .session_manager
        .get_browser(&session_id)
        .map_err(|e| {
            (
                StatusCode::NOT_FOUND,
                format!("Session not found: {}", e),
            )
        })?;

    // Optionally, auto-refresh context on page change
    let context = match trigger.event {
        crate::models::TriggerEventType::PageChanged => {
            let page = browser.get_page().await;
            Some(ContextExtractor::extract(page).await.map_err(|e| {
                tracing::error!("Failed to extract context after trigger: {}", e);
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    format!("Failed to extract context: {}", e),
                )
            })?)
        }
        _ => None,
    };

    Ok(Json(TriggerResponse {
        acknowledged: true,
        context_refreshed: context.is_some(),
        context,
    }))
}

#[derive(Debug, Serialize)]
pub struct TriggerResponse {
    pub acknowledged: bool,
    pub context_refreshed: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub context: Option<UIContext>,
}

/// Delete session
pub async fn delete_session(
    State(state): State<AppState>,
    Path(session_id): Path<String>,
) -> Result<StatusCode, (StatusCode, String)> {
    state
        .session_manager
        .remove_session(&session_id)
        .map_err(|e| {
            (
                StatusCode::NOT_FOUND,
                format!("Session not found: {}", e),
            )
        })?;

    Ok(StatusCode::NO_CONTENT)
}

/// List sessions
#[derive(Debug, Serialize)]
pub struct ListSessionsResponse {
    pub sessions: Vec<String>,
    pub count: usize,
}

pub async fn list_sessions(
    State(state): State<AppState>,
) -> Json<ListSessionsResponse> {
    let sessions = state.session_manager.list_sessions();
    let count = sessions.len();

    Json(ListSessionsResponse { sessions, count })
}

/// Execute task with AI agent (Step 2: Agent Logic)
#[derive(Debug, Deserialize)]
pub struct AgentTaskRequest {
    pub task: String,
}

pub async fn agent_execute_task(
    State(state): State<AppState>,
    Path(session_id): Path<String>,
    Json(req): Json<AgentTaskRequest>,
) -> Result<Json<AgentExecutionResult>, (StatusCode, String)> {
    tracing::info!("Agent execution requested for session: {}", session_id);
    tracing::info!("Task: {}", req.task);

    // Update activity
    state
        .session_manager
        .update_activity(&session_id)
        .map_err(|e| {
            (
                StatusCode::NOT_FOUND,
                format!("Session not found: {}", e),
            )
        })?;

    // Get browser
    let browser = state
        .session_manager
        .get_browser(&session_id)
        .map_err(|e| {
            (
                StatusCode::NOT_FOUND,
                format!("Session not found: {}", e),
            )
        })?;

    // Create agent executor
    let agent = AgentExecutor::new();

    // Execute task
    let result = agent
        .execute_single_step(&browser, &req.task)
        .await
        .map_err(|e| {
            tracing::error!("Agent execution error: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Agent execution failed: {}", e),
            )
        })?;

    tracing::info!("Agent execution completed: success={}", result.success);

    Ok(Json(result))
}

/// Execute multi-step task with feedback loop (Step 3: Feedback Loop)
#[derive(Debug, Deserialize)]
pub struct MultiStepTaskRequest {
    pub task: String,
    /// Maximum number of steps (default: 20)
    #[serde(default)]
    pub max_steps: Option<usize>,
    /// Maximum retries per step (default: 3)
    #[serde(default)]
    pub max_retries_per_step: Option<usize>,
}

pub async fn agent_execute_multi_step(
    State(state): State<AppState>,
    Path(session_id): Path<String>,
    Json(req): Json<MultiStepTaskRequest>,
) -> Result<Json<MultiStepExecutionResult>, (StatusCode, String)> {
    tracing::info!("Multi-step agent execution requested for session: {}", session_id);
    tracing::info!("Task: {}", req.task);
    tracing::info!("Max steps: {:?}, Max retries per step: {:?}", req.max_steps, req.max_retries_per_step);

    // Update activity
    state
        .session_manager
        .update_activity(&session_id)
        .map_err(|e| {
            (
                StatusCode::NOT_FOUND,
                format!("Session not found: {}", e),
            )
        })?;

    // Get browser
    let browser = state
        .session_manager
        .get_browser(&session_id)
        .map_err(|e| {
            (
                StatusCode::NOT_FOUND,
                format!("Session not found: {}", e),
            )
        })?;

    // Create agent executor
    let agent = AgentExecutor::new();

    // Execute multi-step task
    let result = agent
        .execute_multi_step(&browser, &req.task, req.max_steps, req.max_retries_per_step)
        .await
        .map_err(|e| {
            tracing::error!("Multi-step agent execution error: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Multi-step agent execution failed: {}", e),
            )
        })?;

    tracing::info!(
        "Multi-step agent execution completed: task_completed={}, steps_taken={}, retries={}",
        result.task_completed,
        result.steps_taken,
        result.retries_count
    );

    Ok(Json(result))
}

// ===== Authentication Handlers (Step 4) =====

/// Login request for JWT authentication
#[derive(Debug, Deserialize)]
pub struct LoginRequest {
    pub username: String,
    /// In production, this would be a hashed password
    #[allow(dead_code)]
    pub password: String,
}

/// Login response with JWT token
#[derive(Debug, Serialize)]
pub struct LoginResponse {
    pub token: String,
    pub user_id: String,
    pub username: String,
}

/// Simple login endpoint (Step 4)
/// In production, you would validate against a database with hashed passwords
pub async fn login(
    State(state): State<AppState>,
    Json(req): Json<LoginRequest>,
) -> Result<Json<LoginResponse>, (StatusCode, String)> {
    tracing::info!("Login attempt for user: {}", req.username);

    // TODO: In production, validate against database with hashed passwords
    // For now, simple username-based authentication for demo
    if req.username.is_empty() {
        return Err((
            StatusCode::BAD_REQUEST,
            "Username cannot be empty".to_string(),
        ));
    }

    // Generate user ID (in production, retrieve from database)
    let user_id = format!("user_{}", uuid::Uuid::new_v4());

    // Get JWT expiration from env or use default (24 hours)
    let expiration_seconds = std::env::var("JWT_EXPIRATION_SECONDS")
        .ok()
        .and_then(|s| s.parse().ok())
        .unwrap_or(86400); // 24 hours

    // Create JWT claims
    let claims = Claims::new(
        user_id.clone(),
        Some(req.username.clone()),
        expiration_seconds,
    );

    // Encode token
    let token = state
        .jwt_handler
        .encode(&claims)
        .map_err(|e| {
            tracing::error!("Failed to encode JWT: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                "Failed to create token".to_string(),
            )
        })?;

    tracing::info!("User {} logged in successfully (user_id: {})", req.username, user_id);

    Ok(Json(LoginResponse {
        token,
        user_id,
        username: req.username,
    }))
}

/// Get current user info from JWT
/// Returns user info if authenticated, or None if not
#[derive(Debug, Serialize)]
pub struct CurrentUserResponse {
    pub authenticated: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub user_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub username: Option<String>,
}

pub async fn get_current_user(
    auth_user: Option<Extension<AuthUser>>,
) -> Json<CurrentUserResponse> {
    match auth_user {
        Some(Extension(user)) => Json(CurrentUserResponse {
            authenticated: true,
            user_id: Some(user.user_id),
            username: user.username,
        }),
        None => Json(CurrentUserResponse {
            authenticated: false,
            user_id: None,
            username: None,
        }),
    }
}
