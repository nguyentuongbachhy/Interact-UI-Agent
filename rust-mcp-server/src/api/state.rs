use std::sync::Arc;
use crate::auth::JwtHandler;
use crate::session::SessionManager;

/// Application state shared across handlers
#[derive(Clone)]
pub struct AppState {
    pub session_manager: Arc<SessionManager>,
    pub jwt_handler: Arc<JwtHandler>,
}

impl AppState {
    pub fn new() -> Self {
        // Get JWT secret from environment or use default for development
        let jwt_secret = std::env::var("JWT_SECRET")
            .unwrap_or_else(|_| {
                tracing::warn!("JWT_SECRET not set, using default (NOT SECURE FOR PRODUCTION)");
                "dev_secret_change_in_production".to_string()
            });

        Self {
            session_manager: Arc::new(SessionManager::new()),
            jwt_handler: Arc::new(JwtHandler::new(&jwt_secret)),
        }
    }
}

impl Default for AppState {
    fn default() -> Self {
        Self::new()
    }
}
