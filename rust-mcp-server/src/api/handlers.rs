use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};
use serde::{Deserialize, Serialize};

use crate::agent::{AgentExecutor, AgentExecutionResult};
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
