use anyhow::Result;
use chromiumoxide::browser::{Browser, BrowserConfig};
use chromiumoxide::cdp::browser_protocol::page::Viewport;
use chromiumoxide::element::Element;
use chromiumoxide::page::Page;
use futures::StreamExt;
use std::sync::Arc;
use tokio::sync::RwLock;

use crate::models::{ActionRequest, ActionResponse, ScrollDirection, SemanticSelector};

/// Browser automation handler using Chromiumoxide
pub struct BrowserAutomation {
    #[allow(dead_code)] // Kept for future direct browser control
    browser: Arc<Browser>,
    page: Arc<RwLock<Page>>,
}

impl BrowserAutomation {
    /// Create new browser automation instance
    pub async fn new(initial_url: &str, viewport_width: u32, viewport_height: u32) -> Result<Self> {
        // Configure browser
        let (browser, mut handler) = Browser::launch(
            BrowserConfig::builder()
                .window_size(viewport_width, viewport_height)
                .build()
                .map_err(|e| anyhow::anyhow!("Failed to build browser config: {}", e))?,
        )
        .await?;

        // Spawn handler task to process browser events
        tokio::spawn(async move {
            while let Some(h) = handler.next().await {
                if h.is_err() {
                    tracing::error!("Browser handler error: {:?}", h);
                    break;
                }
            }
        });

        let browser = Arc::new(browser);

        // Create new page
        let page = browser.new_page("about:blank").await?;

        // Set viewport using emulation
        let _ = page
            .execute(chromiumoxide::cdp::browser_protocol::emulation::SetDeviceMetricsOverrideParams {
                width: viewport_width as i64,
                height: viewport_height as i64,
                device_scale_factor: 1.0,
                mobile: false,
                scale: None,
                screen_width: None,
                screen_height: None,
                position_x: None,
                position_y: None,
                dont_set_visible_size: None,
                screen_orientation: None,
                viewport: Some(Viewport {
                    x: 0.0,
                    y: 0.0,
                    scale: 1.0,
                    width: viewport_width as f64,
                    height: viewport_height as f64,
                }),
                display_feature: None,
            })
            .await;

        // Navigate to initial URL
        page.goto(initial_url).await?;

        // Wait for page to load
        page.wait_for_navigation().await?;

        let page = Arc::new(RwLock::new(page));

        Ok(Self { browser, page })
    }

    /// Execute an action request (Solution B: Semantic Selectors)
    pub async fn execute_action(&self, action: &ActionRequest) -> Result<ActionResponse> {
        match action {
            ActionRequest::Click { selector } => self.click(selector).await,
            ActionRequest::Type { selector, text } => self.type_text(selector, text).await,
            ActionRequest::Scroll { direction, amount } => {
                self.scroll(direction, amount.unwrap_or(300)).await
            }
            ActionRequest::WaitForElement { selector, timeout_ms } => {
                self.wait_for_element(selector, *timeout_ms).await
            }
            ActionRequest::Navigate { url } => self.navigate(url).await,
        }
    }

    /// Click an element using semantic selector
    async fn click(&self, selector: &SemanticSelector) -> Result<ActionResponse> {
        let page = self.page.read().await;

        // Find element using semantic selector
        match self.find_element(&page, selector).await {
            Ok(Some(element)) => {
                // Check if element is visible
                let is_visible = self.is_element_visible(&page, &element).await?;
                if !is_visible {
                    return Ok(ActionResponse::element_not_visible(
                        selector.name.as_deref().unwrap_or("unknown"),
                        &selector.role,
                    ));
                }

                // Check if element is enabled
                let is_enabled = self.is_element_enabled(&page, &element).await?;
                if !is_enabled {
                    return Ok(ActionResponse::element_not_enabled(
                        selector.name.as_deref().unwrap_or("unknown"),
                    ));
                }

                // Perform click
                element.click().await?;

                // Wait a bit for potential page changes
                tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;

                Ok(ActionResponse::success())
            }
            Ok(None) => Ok(ActionResponse::element_not_found(selector)),
            Err(e) => Ok(ActionResponse::error_with_suggestion(
                "execution_error",
                &format!("Failed to click: {}", e),
                "try get_context() to verify element exists",
            )),
        }
    }

    /// Type text into an element
    async fn type_text(&self, selector: &SemanticSelector, text: &str) -> Result<ActionResponse> {
        let page = self.page.read().await;

        match self.find_element(&page, selector).await {
            Ok(Some(element)) => {
                // Check if element is visible
                let is_visible = self.is_element_visible(&page, &element).await?;
                if !is_visible {
                    return Ok(ActionResponse::element_not_visible(
                        selector.name.as_deref().unwrap_or("unknown"),
                        &selector.role,
                    ));
                }

                // Check if element is enabled
                let is_enabled = self.is_element_enabled(&page, &element).await?;
                if !is_enabled {
                    return Ok(ActionResponse::element_not_enabled(
                        selector.name.as_deref().unwrap_or("unknown"),
                    ));
                }

                // Focus and clear
                element.click().await?;
                element.press_key("End").await?;

                // Select all and delete
                #[cfg(target_os = "macos")]
                element.press_key("Meta+a").await?;
                #[cfg(not(target_os = "macos"))]
                element.press_key("Control+a").await?;

                element.press_key("Backspace").await?;

                // Type new text
                element.type_str(text).await?;

                Ok(ActionResponse::success())
            }
            Ok(None) => Ok(ActionResponse::element_not_found(selector)),
            Err(e) => Ok(ActionResponse::error_with_suggestion(
                "execution_error",
                &format!("Failed to type: {}", e),
                "try get_context() to verify element exists and is a text input",
            )),
        }
    }

    /// Scroll the page
    async fn scroll(&self, direction: &ScrollDirection, amount: u32) -> Result<ActionResponse> {
        let page = self.page.read().await;

        let (x, y) = match direction {
            ScrollDirection::Down => (0, amount as i32),
            ScrollDirection::Up => (0, -(amount as i32)),
            ScrollDirection::Right => (amount as i32, 0),
            ScrollDirection::Left => (-(amount as i32), 0),
        };

        let script = format!("window.scrollBy({}, {})", x, y);
        page.evaluate(script).await?;

        // Wait for scroll to complete
        tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;

        Ok(ActionResponse::success())
    }

    /// Wait for element to appear
    async fn wait_for_element(
        &self,
        selector: &SemanticSelector,
        timeout_ms: Option<u64>,
    ) -> Result<ActionResponse> {
        let timeout = timeout_ms.unwrap_or(5000);
        let page = self.page.read().await;

        let css_selector = self.build_css_selector(selector);

        let wait_result = tokio::time::timeout(
            tokio::time::Duration::from_millis(timeout),
            page.find_element(&css_selector),
        )
        .await;

        match wait_result {
            Ok(Ok(_)) => Ok(ActionResponse::success()),
            Ok(Err(e)) => Ok(ActionResponse::error_with_suggestion(
                "element_not_found",
                &format!("Element did not appear: {}", e),
                "verify the selector is correct or increase timeout",
            )),
            Err(_) => Ok(ActionResponse::error_with_suggestion(
                "timeout",
                &format!("Element did not appear within {}ms", timeout),
                "try increasing timeout or verify element exists",
            )),
        }
    }

    /// Navigate to a URL
    async fn navigate(&self, url: &str) -> Result<ActionResponse> {
        let page = self.page.read().await;

        page.goto(url).await?;
        page.wait_for_navigation().await?;

        Ok(ActionResponse::success())
    }

    /// Find element using semantic selector (Solution B)
    async fn find_element(
        &self,
        page: &Page,
        selector: &SemanticSelector,
    ) -> Result<Option<Element>> {
        // Try CSS selector approach with semantic attributes
        let js_script = self.build_find_element_script(selector);

        let result = page.evaluate(js_script).await?;

        // Check if result is null
        if let Some(value) = result.value() {
            if value.is_null() {
                // Try CSS fallback if available
                if let Some(css) = &selector.css_fallback {
                    match page.find_element(css).await {
                        Ok(el) => return Ok(Some(el)),
                        Err(_) => return Ok(None),
                    }
                }
                return Ok(None);
            }

            // Get the element ID from JavaScript and find it
            if let Some(element_id) = value.as_str() {
                // Use the element ID to find via CSS
                let element = page.find_element(&format!("[data-element-id='{}']", element_id)).await.ok();
                return Ok(element);
            }
        }

        // Fallback: try direct CSS selector
        let css_selector = self.build_css_selector(selector);
        match page.find_element(&css_selector).await {
            Ok(el) => Ok(Some(el)),
            Err(_) => Ok(None),
        }
    }

    /// Build JavaScript to find element by semantic selector
    fn build_find_element_script(&self, selector: &SemanticSelector) -> String {
        let role = &selector.role;
        let name = selector.name.as_deref().unwrap_or("");

        // JavaScript to find element based on role and accessible name
        format!(
            r#"
            (function() {{
                function getAccessibleName(el) {{
                    if (el.getAttribute('aria-label')) return el.getAttribute('aria-label');
                    const labelledBy = el.getAttribute('aria-labelledby');
                    if (labelledBy) {{
                        const label = document.getElementById(labelledBy);
                        if (label) return label.textContent.trim();
                    }}
                    if (el.id) {{
                        const label = document.querySelector(`label[for="${{el.id}}"]`);
                        if (label) return label.textContent.trim();
                    }}
                    if (el.placeholder) return el.placeholder;
                    if (el.tagName === 'BUTTON' || el.tagName === 'A') {{
                        return el.textContent.trim();
                    }}
                    return '';
                }}

                function getRole(el) {{
                    const ariaRole = el.getAttribute('role');
                    if (ariaRole) return ariaRole;

                    const tagRoles = {{
                        'BUTTON': 'button',
                        'A': 'link',
                        'INPUT': el.type === 'submit' ? 'button' : 'textbox',
                        'TEXTAREA': 'textbox',
                        'SELECT': 'combobox',
                    }};
                    return tagRoles[el.tagName] || '';
                }}

                const targetRole = '{}';
                const targetName = '{}';

                const allElements = document.querySelectorAll('*');
                for (let el of allElements) {{
                    const role = getRole(el);
                    const name = getAccessibleName(el);

                    if (role === targetRole && (!targetName || name.includes(targetName))) {{
                        // Mark element for retrieval
                        el.setAttribute('data-element-id', Math.random().toString(36));
                        return el.getAttribute('data-element-id');
                    }}
                }}

                return null;
            }})()
            "#,
            role, name
        )
    }

    /// Build CSS selector from semantic selector (fallback)
    fn build_css_selector(&self, selector: &SemanticSelector) -> String {
        // Try to build a reasonable CSS selector based on role
        match selector.role.as_str() {
            "button" => {
                if let Some(name) = &selector.name {
                    format!("button:contains('{}'), [role='button']:contains('{}')", name, name)
                } else {
                    "button, [role='button']".to_string()
                }
            }
            "link" => {
                if let Some(name) = &selector.name {
                    format!("a:contains('{}')", name)
                } else {
                    "a".to_string()
                }
            }
            "textbox" => "input[type='text'], input:not([type]), textarea, [role='textbox']".to_string(),
            _ => {
                if let Some(name) = &selector.name {
                    format!("[role='{}']:contains('{}')", selector.role, name)
                } else {
                    format!("[role='{}']", selector.role)
                }
            }
        }
    }

    /// Check if element is visible
    async fn is_element_visible(&self, _page: &Page, element: &Element) -> Result<bool> {
        let script = r#"
            (function(el) {
                if (!el) return false;
                const style = window.getComputedStyle(el);
                return style.display !== 'none' &&
                       style.visibility !== 'hidden' &&
                       style.opacity !== '0';
            })(arguments[0])
        "#;

        let result = element.call_js_fn(script, false).await?;
        let value = serde_json::from_value::<bool>(result.result.value.clone().unwrap_or(serde_json::Value::Bool(false)))?;
        Ok(value)
    }

    /// Check if element is enabled
    async fn is_element_enabled(&self, _page: &Page, element: &Element) -> Result<bool> {
        let script = r#"
            (function(el) {
                if (!el) return false;
                return !el.disabled;
            })(arguments[0])
        "#;

        let result = element.call_js_fn(script, false).await?;
        let value = serde_json::from_value::<bool>(result.result.value.clone().unwrap_or(serde_json::Value::Bool(true)))?;
        Ok(value)
    }

    /// Get current page URL
    #[allow(dead_code)] // Utility method for future use
    pub async fn get_url(&self) -> Result<String> {
        let page = self.page.read().await;
        let url = page.url().await?;
        Ok(url.map(|u| u.to_string()).unwrap_or_default())
    }

    /// Get current page title
    #[allow(dead_code)] // Utility method for future use
    pub async fn get_title(&self) -> Result<String> {
        let page = self.page.read().await;
        let title = page.get_title().await?;
        Ok(title.unwrap_or_default())
    }

    /// Get page reference for context extraction
    pub async fn get_page(&self) -> Arc<RwLock<Page>> {
        Arc::clone(&self.page)
    }
}
