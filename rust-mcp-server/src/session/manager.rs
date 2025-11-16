use anyhow::{Context as AnyhowContext, Result};
use dashmap::DashMap;
use std::sync::Arc;

use crate::browser::BrowserAutomation;
use crate::models::Session;

/// Session manager - manages browser sessions
pub struct SessionManager {
    sessions: Arc<DashMap<String, SessionData>>,
}

pub struct SessionData {
    pub session: Session,
    pub browser: Arc<BrowserAutomation>,
}

impl SessionManager {
    pub fn new() -> Self {
        Self {
            sessions: Arc::new(DashMap::new()),
        }
    }

    /// Create a new session with browser
    pub async fn create_session(
        &self,
        initial_url: String,
        viewport_width: u32,
        viewport_height: u32,
    ) -> Result<String> {
        // Create session metadata
        let session = Session::new(
            initial_url.clone(),
            viewport_width,
            viewport_height,
        );

        let session_id = session.id.clone();

        // Create browser automation
        let browser = BrowserAutomation::new(&initial_url, viewport_width, viewport_height).await?;

        // Store session
        self.sessions.insert(
            session_id.clone(),
            SessionData {
                session,
                browser: Arc::new(browser),
            },
        );

        Ok(session_id)
    }

    /// Get session browser
    pub fn get_browser(&self, session_id: &str) -> Result<Arc<BrowserAutomation>> {
        let entry = self
            .sessions
            .get(session_id)
            .context("Session not found")?;

        Ok(Arc::clone(&entry.browser))
    }

    /// Get session metadata
    pub fn get_session(&self, session_id: &str) -> Result<Session> {
        let entry = self
            .sessions
            .get(session_id)
            .context("Session not found")?;

        Ok(entry.session.clone())
    }

    /// Update session activity
    pub fn update_activity(&self, session_id: &str) -> Result<()> {
        let mut entry = self
            .sessions
            .get_mut(session_id)
            .context("Session not found")?;

        entry.session.update_activity();

        Ok(())
    }

    /// Remove session
    pub fn remove_session(&self, session_id: &str) -> Result<()> {
        self.sessions
            .remove(session_id)
            .context("Session not found")?;

        Ok(())
    }

    /// List all sessions
    pub fn list_sessions(&self) -> Vec<String> {
        self.sessions
            .iter()
            .map(|entry| entry.key().clone())
            .collect()
    }

    /// Get session count
    pub fn session_count(&self) -> usize {
        self.sessions.len()
    }
}

impl Default for SessionManager {
    fn default() -> Self {
        Self::new()
    }
}
