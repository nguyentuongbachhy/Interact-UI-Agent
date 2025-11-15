use serde::{Deserialize, Serialize};

/// Accessibility Tree Element - simplified representation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AXElement {
    /// Simple numeric ID for referencing in LLM prompts
    pub id: usize,

    /// ARIA role (button, link, textbox, etc.)
    pub role: String,

    /// Accessible name/label
    pub name: Option<String>,

    /// Element value (for inputs)
    pub value: Option<String>,

    /// Additional description
    pub description: Option<String>,

    /// Is the element visible/enabled
    pub enabled: bool,
    pub visible: bool,

    /// Position information (for scroll/viewport checks)
    pub rect: Option<ElementRect>,

    /// Child elements
    pub children: Vec<AXElement>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ElementRect {
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
}

/// Simplified context for LLM
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UIContext {
    /// Current page URL
    pub url: String,

    /// Current page title
    pub title: String,

    /// Viewport dimensions
    pub viewport: Viewport,

    /// Simplified element list (flattened AXTree)
    pub elements: Vec<SimplifiedElement>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Viewport {
    pub width: u32,
    pub height: u32,
    pub scroll_x: f64,
    pub scroll_y: f64,
}

/// Simplified element for LLM context (easier to parse)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SimplifiedElement {
    /// Unique ID in this context
    pub id: usize,

    /// Format: "[1] Button('Login')" or "[2] Textbox('Username')"
    pub display: String,

    /// Full semantic selector for execution
    pub selector: SemanticSelector,

    /// Is this element in viewport?
    pub in_viewport: bool,
}

/// Semantic selector - describes how to find an element
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SemanticSelector {
    pub role: String,
    pub name: Option<String>,
    pub description: Option<String>,

    /// Fallback CSS selector if semantic search fails
    pub css_fallback: Option<String>,
}

impl SimplifiedElement {
    pub fn new(id: usize, role: &str, name: Option<&str>, in_viewport: bool) -> Self {
        let display = if let Some(n) = name {
            format!("[{}] {}('{}')", id, role, n)
        } else {
            format!("[{}] {}", id, role)
        };

        Self {
            id,
            display,
            selector: SemanticSelector {
                role: role.to_string(),
                name: name.map(|s| s.to_string()),
                description: None,
                css_fallback: None,
            },
            in_viewport,
        }
    }
}
