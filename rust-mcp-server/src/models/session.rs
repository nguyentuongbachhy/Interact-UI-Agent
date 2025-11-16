use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Session {
    pub id: String,

    /// User ID for multi-user support (Step 4)
    pub user_id: Option<String>,

    pub created_at: DateTime<Utc>,
    pub last_activity: DateTime<Utc>,

    /// Browser context info
    pub browser_info: BrowserInfo,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BrowserInfo {
    /// Initial URL
    pub initial_url: String,

    /// Current URL (updated on navigation)
    pub current_url: String,

    /// Viewport dimensions
    pub viewport_width: u32,
    pub viewport_height: u32,
}

impl Session {
    pub fn new(initial_url: String, viewport_width: u32, viewport_height: u32) -> Self {
        let now = Utc::now();

        Self {
            id: Uuid::new_v4().to_string(),
            user_id: None, // Can be set later for multi-user scenarios
            created_at: now,
            last_activity: now,
            browser_info: BrowserInfo {
                current_url: initial_url.clone(),
                initial_url,
                viewport_width,
                viewport_height,
            },
        }
    }

    /// Builder method to set user_id (for future multi-user session creation)
    #[allow(dead_code)]
    pub fn with_user_id(mut self, user_id: String) -> Self {
        self.user_id = Some(user_id);
        self
    }

    pub fn update_activity(&mut self) {
        self.last_activity = Utc::now();
    }
}

/// Trigger event from client (Step 1.5)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TriggerEvent {
    pub event: TriggerEventType,
    pub path: String,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub metadata: Option<serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum TriggerEventType {
    PageChanged,
    UserAction,
    StateUpdate,
}
