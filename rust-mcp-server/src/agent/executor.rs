use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::sync::Arc;

use crate::browser::{BrowserAutomation, ContextExtractor};
use crate::models::{ActionRequest, ActionResponse, UIContext};

use super::llm_client::LLMClient;
use super::prompt::{build_system_prompt, build_user_prompt};

/// Agent executor for single-step autonomous execution (Step 2)
pub struct AgentExecutor {
    llm_client: LLMClient,
}

/// Response from agent execution
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentExecutionResult {
    /// Whether the task was successfully executed
    pub success: bool,

    /// The action that was decided by the LLM
    pub action_decided: Option<ActionRequest>,

    /// The result of executing the action
    pub action_result: Option<ActionResponse>,

    /// Current UI context after execution
    pub current_context: Option<UIContext>,

    /// Error message if something went wrong
    pub error: Option<String>,

    /// Raw LLM response for debugging
    pub llm_response: Option<String>,
}

impl AgentExecutor {
    /// Create new agent executor
    pub fn new() -> Self {
        Self {
            llm_client: LLMClient::new(),
        }
    }

    /// Execute a single-step task autonomously
    ///
    /// Flow:
    /// 1. Get current UI context (AXTree)
    /// 2. Send context + task to LLM
    /// 3. LLM decides next action
    /// 4. Execute the action
    /// 5. Return result
    pub async fn execute_single_step(
        &self,
        browser: &Arc<BrowserAutomation>,
        task: &str,
    ) -> Result<AgentExecutionResult> {
        // Step 1: Get current UI context
        tracing::info!("Agent: Extracting UI context for task: {}", task);

        let page = browser.get_page().await;
        let context = match ContextExtractor::extract(page).await {
            Ok(ctx) => ctx,
            Err(e) => {
                return Ok(AgentExecutionResult {
                    success: false,
                    action_decided: None,
                    action_result: None,
                    current_context: None,
                    error: Some(format!("Failed to extract context: {}", e)),
                    llm_response: None,
                });
            }
        };

        tracing::info!(
            "Agent: Found {} elements on page '{}'",
            context.elements.len(),
            context.title
        );

        // Step 2: Build prompts and get LLM decision
        let system_prompt = build_system_prompt();
        let user_prompt = build_user_prompt(&context, task);

        tracing::debug!("Agent: Sending prompt to LLM");

        let llm_response = match self
            .llm_client
            .generate_json(&system_prompt, &user_prompt)
            .await
        {
            Ok(response) => response,
            Err(e) => {
                return Ok(AgentExecutionResult {
                    success: false,
                    action_decided: None,
                    action_result: None,
                    current_context: Some(context),
                    error: Some(format!("LLM generation failed: {}", e)),
                    llm_response: None,
                });
            }
        };

        tracing::info!("Agent: LLM response: {}", llm_response);

        // Step 3: Parse LLM response into action
        let action: ActionRequest = match serde_json::from_str(&llm_response) {
            Ok(action) => action,
            Err(e) => {
                return Ok(AgentExecutionResult {
                    success: false,
                    action_decided: None,
                    action_result: None,
                    current_context: Some(context),
                    error: Some(format!("Failed to parse LLM response as action: {}", e)),
                    llm_response: Some(llm_response),
                });
            }
        };

        tracing::info!("Agent: Decided action: {:?}", action);

        // Step 4: Execute the action
        let action_result = match browser.execute_action(&action).await {
            Ok(result) => result,
            Err(e) => {
                return Ok(AgentExecutionResult {
                    success: false,
                    action_decided: Some(action),
                    action_result: None,
                    current_context: Some(context),
                    error: Some(format!("Action execution failed: {}", e)),
                    llm_response: Some(llm_response),
                });
            }
        };

        tracing::info!("Agent: Action result: {:?}", action_result);

        // Step 5: Get updated context
        let page = browser.get_page().await;
        let updated_context = ContextExtractor::extract(page).await.ok();

        Ok(AgentExecutionResult {
            success: action_result.success,
            action_decided: Some(action),
            action_result: Some(action_result),
            current_context: updated_context,
            error: None,
            llm_response: Some(llm_response),
        })
    }
}

impl Default for AgentExecutor {
    fn default() -> Self {
        Self::new()
    }
}
