use anyhow::{Context, Result};
use playwright::api::{
    Browser, BrowserContext, BrowserType, ElementHandle, Page, Playwright,
};
use std::sync::Arc;
use tokio::sync::RwLock;

use crate::models::{ActionRequest, ActionResponse, ScrollDirection, SemanticSelector};

/// Browser automation handler using Playwright
pub struct BrowserAutomation {
    playwright: Arc<Playwright>,
    browser: Arc<RwLock<Browser>>,
    context: Arc<RwLock<BrowserContext>>,
    page: Arc<RwLock<Page>>,
}

impl BrowserAutomation {
    /// Create new browser automation instance
    pub async fn new(initial_url: &str, viewport_width: u32, viewport_height: u32) -> Result<Self> {
        // Initialize Playwright
        let playwright = Playwright::initialize().await?;
        let playwright = Arc::new(playwright);

        // Launch browser (headless by default, can be configured)
        let chromium = playwright.chromium();
        let browser = chromium
            .launcher()
            .headless(true)
            .launch()
            .await?;

        let browser = Arc::new(RwLock::new(browser));

        // Create browser context with viewport
        let browser_guard = browser.read().await;
        let context = browser_guard
            .context_builder()
            .viewport_size(viewport_width, viewport_height)
            .build()
            .await?;

        let context = Arc::new(RwLock::new(context));

        // Create new page and navigate
        let context_guard = context.read().await;
        let page = context_guard.new_page().await?;
        page.goto_builder(initial_url).goto().await?;

        let page = Arc::new(RwLock::new(page));

        Ok(Self {
            playwright,
            browser,
            context,
            page,
        })
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
        let element_result = self.find_element(&page, selector).await;

        match element_result {
            Ok(Some(element)) => {
                // Check if element is visible and in viewport
                if !element.is_visible().await? {
                    return Ok(ActionResponse::element_not_visible(
                        selector.name.as_deref().unwrap_or("unknown"),
                        &selector.role,
                    ));
                }

                if !element.is_enabled().await? {
                    return Ok(ActionResponse::element_not_enabled(
                        selector.name.as_deref().unwrap_or("unknown"),
                    ));
                }

                // Perform click
                element.click_builder().click().await?;

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

        let element_result = self.find_element(&page, selector).await;

        match element_result {
            Ok(Some(element)) => {
                if !element.is_visible().await? {
                    return Ok(ActionResponse::element_not_visible(
                        selector.name.as_deref().unwrap_or("unknown"),
                        &selector.role,
                    ));
                }

                if !element.is_enabled().await? {
                    return Ok(ActionResponse::element_not_enabled(
                        selector.name.as_deref().unwrap_or("unknown"),
                    ));
                }

                // Clear existing text first
                element.fill("").await?;

                // Type new text
                element.type_builder(text).r#type().await?;

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
        page.evaluate(&script).await?;

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

        let playwright_selector = self.build_playwright_selector(selector);

        let wait_result = tokio::time::timeout(
            tokio::time::Duration::from_millis(timeout),
            page.wait_for_selector_builder(&playwright_selector)
                .wait_for_selector(),
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

        page.goto_builder(url).goto().await?;

        // Wait for page to load
        page.wait_for_load_state().await?;

        Ok(ActionResponse::success())
    }

    /// Find element using semantic selector (Solution B)
    async fn find_element(
        &self,
        page: &Page,
        selector: &SemanticSelector,
    ) -> Result<Option<ElementHandle>> {
        let playwright_selector = self.build_playwright_selector(selector);

        // Try semantic selector first
        let element = page.query_selector(&playwright_selector).await?;

        if element.is_some() {
            return Ok(element);
        }

        // Try CSS fallback if available
        if let Some(css) = &selector.css_fallback {
            let element = page.query_selector(css).await?;
            return Ok(element);
        }

        Ok(None)
    }

    /// Build Playwright selector from semantic selector
    fn build_playwright_selector(&self, selector: &SemanticSelector) -> String {
        // Playwright uses role-based selectors: role=button[name="Login"]
        let mut parts = vec![format!("role={}", selector.role)];

        if let Some(name) = &selector.name {
            parts.push(format!("[name=\"{}\"]", name));
        }

        if let Some(desc) = &selector.description {
            parts.push(format!("[description=\"{}\"]", desc));
        }

        parts.join("")
    }

    /// Get current page URL
    pub async fn get_url(&self) -> Result<String> {
        let page = self.page.read().await;
        Ok(page.url()?)
    }

    /// Get current page title
    pub async fn get_title(&self) -> Result<String> {
        let page = self.page.read().await;
        Ok(page.title().await?)
    }

    /// Get page reference for context extraction
    pub async fn get_page(&self) -> Arc<RwLock<Page>> {
        Arc::clone(&self.page)
    }
}
