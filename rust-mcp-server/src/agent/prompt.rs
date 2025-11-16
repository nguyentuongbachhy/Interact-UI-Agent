use crate::models::UIContext;

/// Build system prompt for the UI automation agent
pub fn build_system_prompt() -> String {
    r#"You are a UI automation agent that controls a web browser to accomplish user tasks.

Your capabilities:
1. You can see the current page context as an Accessibility Tree (AXTree)
2. You can execute actions: click, type, scroll, wait_for_element, navigate
3. You receive smart feedback when actions fail with suggestions for recovery

Action Format (respond in JSON):
{
  "tool": "click" | "type" | "scroll" | "wait_for_element" | "navigate",
  "role": "button" | "link" | "textbox" | "combobox" | etc,
  "name": "element name from AXTree",
  "text": "text to type (for type action)",
  "direction": "up" | "down" | "left" | "right" (for scroll),
  "amount": number (for scroll, optional),
  "url": "URL to navigate to (for navigate)"
}

Guidelines:
1. Always use semantic selectors (role + name) from the AXTree context
2. Prefer elements that are in_viewport: true
3. If an element is not in viewport, scroll to it first
4. If an action fails, read the suggestion in the error response
5. Be precise with element names - match exactly as shown in the AXTree

Example AXTree format:
[1] Button('Login') - in_viewport: true
[2] Textbox('Username') - in_viewport: true
[3] Textbox('Password') - in_viewport: false

Example actions:
- Click login button: {"tool": "click", "role": "button", "name": "Login"}
- Type username: {"tool": "type", "role": "textbox", "name": "Username", "text": "john@example.com"}
- Scroll to see password field: {"tool": "scroll", "direction": "down", "amount": 300}

IMPORTANT: Respond ONLY with a single valid JSON action object. No explanations, no markdown, just JSON."#.to_string()
}

/// Build user prompt with current UI context and task
pub fn build_user_prompt(context: &UIContext, task: &str) -> String {
    // Build element list from context
    let mut elements_str = String::new();
    for elem in &context.elements {
        elements_str.push_str(&format!(
            "{} - in_viewport: {}\n",
            elem.display, elem.in_viewport
        ));
    }

    format!(
        r#"Current Page State:
URL: {}
Title: {}
Viewport: {}x{} (scroll: {}, {})

Available Elements (Accessibility Tree):
{}

Your Task: {}

Please provide the NEXT SINGLE ACTION to accomplish this task as a JSON object."#,
        context.url,
        context.title,
        context.viewport.width,
        context.viewport.height,
        context.viewport.scroll_x,
        context.viewport.scroll_y,
        elements_str.trim(),
        task
    )
}

/// Build prompt after action failure to enable self-correction
pub fn build_retry_prompt(
    context: &UIContext,
    task: &str,
    failed_action: &str,
    error_message: &str,
    suggestion: &str,
) -> String {
    let mut elements_str = String::new();
    for elem in &context.elements {
        elements_str.push_str(&format!(
            "{} - in_viewport: {}\n",
            elem.display, elem.in_viewport
        ));
    }

    format!(
        r#"Current Page State:
URL: {}
Title: {}

Available Elements (Accessibility Tree):
{}

Your Task: {}

Previous Action Attempted:
{}

This action failed with error: {}

Suggestion: {}

Based on this feedback, please provide the CORRECTED NEXT ACTION as a JSON object."#,
        context.url,
        context.title,
        elements_str.trim(),
        task,
        failed_action,
        error_message,
        suggestion
    )
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::{SimplifiedElement, Viewport};

    #[test]
    fn test_build_system_prompt() {
        let prompt = build_system_prompt();
        assert!(prompt.contains("UI automation agent"));
        assert!(prompt.contains("JSON"));
    }

    #[test]
    fn test_build_user_prompt() {
        let context = UIContext {
            url: "http://localhost:3000".to_string(),
            title: "Test Page".to_string(),
            viewport: Viewport {
                width: 1280,
                height: 720,
                scroll_x: 0.0,
                scroll_y: 0.0,
            },
            elements: vec![
                SimplifiedElement::new(1, "button", Some("Login"), true),
            ],
        };

        let prompt = build_user_prompt(&context, "Click the login button");
        assert!(prompt.contains("Test Page"));
        assert!(prompt.contains("[1] Button('Login')"));
        assert!(prompt.contains("Click the login button"));
    }
}
