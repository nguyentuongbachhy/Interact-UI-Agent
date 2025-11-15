use anyhow::{Context as AnyhowContext, Result};
use chromiumoxide::page::Page;
use std::sync::Arc;
use tokio::sync::RwLock;

use crate::models::{
    AXElement, ElementRect, SimplifiedElement, UIContext, Viewport,
};

/// Extract UI context from page using Accessibility Tree (Solution A)
pub struct ContextExtractor;

impl ContextExtractor {
    /// Extract full UI context from page
    pub async fn extract(page: Arc<RwLock<Page>>) -> Result<UIContext> {
        let page_guard = page.read().await;

        // Get basic page info
        let url = page_guard
            .url()
            .await?
            .map(|u| u.to_string())
            .unwrap_or_default();

        let title = page_guard.get_title().await?.unwrap_or_default();

        // Get viewport info
        let viewport = Self::extract_viewport(&page_guard).await?;

        // Get accessibility tree
        let ax_tree = Self::extract_ax_tree(&page_guard).await?;

        // Simplify for LLM consumption
        let elements = Self::simplify_tree(&ax_tree, &viewport);

        Ok(UIContext {
            url,
            title,
            viewport,
            elements,
        })
    }

    /// Extract viewport information
    async fn extract_viewport(page: &Page) -> Result<Viewport> {
        // Get viewport size and scroll position using JavaScript
        let script = r#"
            ({
                width: window.innerWidth,
                height: window.innerHeight,
                scrollX: window.scrollX || window.pageXOffset,
                scrollY: window.scrollY || window.pageYOffset
            })
        "#;

        let viewport_data = page.evaluate(script).await?;
        let value = viewport_data.value().context("No value returned")?;
        let viewport_obj = value.as_object().context("Invalid viewport data")?;

        let width = viewport_obj
            .get("width")
            .and_then(|v| v.as_f64())
            .unwrap_or(1280.0) as u32;

        let height = viewport_obj
            .get("height")
            .and_then(|v| v.as_f64())
            .unwrap_or(720.0) as u32;

        let scroll_x = viewport_obj
            .get("scrollX")
            .and_then(|v| v.as_f64())
            .unwrap_or(0.0);

        let scroll_y = viewport_obj
            .get("scrollY")
            .and_then(|v| v.as_f64())
            .unwrap_or(0.0);

        Ok(Viewport {
            width,
            height,
            scroll_x,
            scroll_y,
        })
    }

    /// Extract accessibility tree from page
    async fn extract_ax_tree(page: &Page) -> Result<Vec<AXElement>> {
        // Use JavaScript-based approach to extract semantic elements
        let script = r#"
            (() => {
                const elements = [];
                let id = 0;

                // Helper to check if element is visible
                function isVisible(el) {
                    if (!el) return false;
                    const style = window.getComputedStyle(el);
                    return style.display !== 'none' &&
                           style.visibility !== 'hidden' &&
                           style.opacity !== '0';
                }

                // Helper to get accessible name
                function getAccessibleName(el) {
                    // Try aria-label first
                    if (el.getAttribute('aria-label')) {
                        return el.getAttribute('aria-label');
                    }
                    // Try aria-labelledby
                    const labelledBy = el.getAttribute('aria-labelledby');
                    if (labelledBy) {
                        const label = document.getElementById(labelledBy);
                        if (label) return label.textContent.trim();
                    }
                    // Try associated label
                    if (el.id) {
                        const label = document.querySelector(`label[for="${el.id}"]`);
                        if (label) return label.textContent.trim();
                    }
                    // Try placeholder for inputs
                    if (el.placeholder) return el.placeholder;
                    // Try text content for buttons/links
                    if (el.tagName === 'BUTTON' || el.tagName === 'A') {
                        return el.textContent.trim();
                    }
                    // Try value for inputs
                    if (el.value) return el.value;

                    return null;
                }

                // Helper to get role
                function getRole(el) {
                    // Explicit ARIA role
                    const ariaRole = el.getAttribute('role');
                    if (ariaRole) return ariaRole;

                    // Implicit roles based on tag
                    const tagRoles = {
                        'BUTTON': 'button',
                        'A': 'link',
                        'INPUT': el.type === 'submit' ? 'button' : 'textbox',
                        'TEXTAREA': 'textbox',
                        'SELECT': 'combobox',
                        'H1': 'heading',
                        'H2': 'heading',
                        'H3': 'heading',
                        'IMG': 'img',
                        'NAV': 'navigation',
                        'MAIN': 'main',
                        'HEADER': 'banner',
                        'FOOTER': 'contentinfo',
                        'SECTION': 'region',
                        'FORM': 'form',
                    };

                    return tagRoles[el.tagName] || 'generic';
                }

                // Get bounding rect
                function getRect(el) {
                    const rect = el.getBoundingClientRect();
                    return {
                        x: rect.x,
                        y: rect.y,
                        width: rect.width,
                        height: rect.height
                    };
                }

                // Collect interactive and semantic elements
                const selectors = [
                    'button',
                    'a[href]',
                    'input',
                    'textarea',
                    'select',
                    '[role="button"]',
                    '[role="link"]',
                    '[role="textbox"]',
                    '[role="combobox"]',
                    '[role="checkbox"]',
                    '[role="radio"]',
                    '[role="tab"]',
                    '[role="menuitem"]',
                    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
                    '[aria-label]',
                ];

                const foundElements = document.querySelectorAll(selectors.join(','));

                foundElements.forEach(el => {
                    const role = getRole(el);
                    const name = getAccessibleName(el);
                    const visible = isVisible(el);
                    const rect = getRect(el);

                    // Only include if it has a name or is a heading
                    if (name || role === 'heading') {
                        elements.push({
                            id: id++,
                            role,
                            name,
                            value: el.value || null,
                            description: el.getAttribute('aria-description') || el.title || null,
                            enabled: !el.disabled,
                            visible,
                            rect,
                            children: [] // We'll keep it flat for simplicity
                        });
                    }
                });

                return elements;
            })()
        "#;

        let result = page.evaluate(script).await?;

        // Parse the result
        let value = result.into_value()?;
        let elements: Vec<AXElement> = serde_json::from_value(value)?;

        Ok(elements)
    }

    /// Simplify AX tree for LLM consumption
    fn simplify_tree(ax_tree: &[AXElement], viewport: &Viewport) -> Vec<SimplifiedElement> {
        ax_tree
            .iter()
            .map(|el| {
                // Check if element is in viewport
                let in_viewport = if let Some(rect) = &el.rect {
                    Self::is_in_viewport(rect, viewport)
                } else {
                    false
                };

                let mut simplified = SimplifiedElement::new(
                    el.id,
                    &el.role,
                    el.name.as_deref(),
                    in_viewport,
                );

                // Add description to selector if available
                simplified.selector.description = el.description.clone();

                simplified
            })
            .collect()
    }

    /// Check if element rect is in viewport
    fn is_in_viewport(rect: &ElementRect, viewport: &Viewport) -> bool {
        let viewport_bottom = viewport.scroll_y + viewport.height as f64;
        let viewport_right = viewport.scroll_x + viewport.width as f64;

        let element_bottom = rect.y + rect.height;
        let element_right = rect.x + rect.width;

        // Element is in viewport if it overlaps with viewport bounds
        rect.y < viewport_bottom
            && element_bottom > viewport.scroll_y
            && rect.x < viewport_right
            && element_right > viewport.scroll_x
    }
}
