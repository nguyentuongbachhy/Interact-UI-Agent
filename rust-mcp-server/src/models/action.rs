use serde::{Deserialize, Serialize};
use super::SemanticSelector;

/// Action request from agent
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "tool", rename_all = "snake_case")]
pub enum ActionRequest {
    Click {
        #[serde(flatten)]
        selector: SemanticSelector,
    },
    Type {
        #[serde(flatten)]
        selector: SemanticSelector,
        text: String,
    },
    Scroll {
        direction: ScrollDirection,
        amount: Option<u32>,
    },
    WaitForElement {
        #[serde(flatten)]
        selector: SemanticSelector,
        timeout_ms: Option<u64>,
    },
    Navigate {
        url: String,
    },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ScrollDirection {
    Up,
    Down,
    Left,
    Right,
}

/// Smart feedback response (Solution C)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ActionResponse {
    pub success: bool,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub reason: Option<String>,

    /// Smart suggestion for recovery
    #[serde(skip_serializing_if = "Option::is_none")]
    pub suggestion: Option<String>,

    /// Additional context
    #[serde(skip_serializing_if = "Option::is_none")]
    pub details: Option<serde_json::Value>,
}

impl ActionResponse {
    pub fn success() -> Self {
        Self {
            success: true,
            error: None,
            reason: None,
            suggestion: None,
            details: None,
        }
    }

    pub fn error_with_suggestion(error: &str, reason: &str, suggestion: &str) -> Self {
        Self {
            success: false,
            error: Some(error.to_string()),
            reason: Some(reason.to_string()),
            suggestion: Some(suggestion.to_string()),
            details: None,
        }
    }

    pub fn element_not_visible(element_name: &str, role: &str) -> Self {
        Self::error_with_suggestion(
            "element_not_visible",
            &format!("Element '{}' ({}) was found but is below viewport.", element_name, role),
            "call scroll_down() or wait_for_element()",
        )
    }

    pub fn element_not_found(selector: &SemanticSelector) -> Self {
        let role = &selector.role;
        let name = selector.name.as_deref().unwrap_or("unknown");

        Self::error_with_suggestion(
            "element_not_found",
            &format!("Could not find {} with name '{}'", role, name),
            "try get_context() to see available elements",
        )
    }

    pub fn element_not_enabled(element_name: &str) -> Self {
        Self::error_with_suggestion(
            "element_not_enabled",
            &format!("Element '{}' is disabled", element_name),
            "wait for element to become enabled or check if preconditions are met",
        )
    }
}
