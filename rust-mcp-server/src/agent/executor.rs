use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::sync::Arc;

use crate::browser::{BrowserAutomation, ContextExtractor};
use crate::models::{ActionRequest, ActionResponse, UIContext};

use super::llm_client::LLMClient;
use super::prompt::{build_retry_prompt, build_system_prompt, build_user_prompt};

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

/// Step in conversation history for multi-step execution
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConversationStep {
    pub step_number: usize,
    pub action_decided: ActionRequest,
    pub action_result: ActionResponse,
    pub context_after: UIContext,
    pub llm_response: String,
}

/// Result from multi-step execution (Step 3: Feedback Loop)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MultiStepExecutionResult {
    /// Whether the entire task was completed successfully
    pub task_completed: bool,

    /// Number of steps taken
    pub steps_taken: usize,

    /// Maximum steps allowed (to prevent infinite loops)
    pub max_steps: usize,

    /// History of all steps taken
    pub steps: Vec<ConversationStep>,

    /// Final UI context
    pub final_context: Option<UIContext>,

    /// Error message if task failed
    pub error: Option<String>,

    /// Number of retries performed
    pub retries_count: usize,
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

    /// Execute a multi-step task with feedback loop and retry mechanism (Step 3)
    ///
    /// Flow:
    /// 1. Extract UI context
    /// 2. Ask LLM for next action
    /// 3. Execute action
    /// 4. If action fails, use build_retry_prompt to retry
    /// 5. If action succeeds, check if task is complete
    /// 6. Repeat until task is complete or max_steps reached
    ///
    /// # Arguments
    /// * `browser` - Browser automation instance
    /// * `task` - The task description
    /// * `max_steps` - Maximum number of steps to prevent infinite loops (default: 20)
    /// * `max_retries_per_step` - Maximum retries per failed action (default: 3)
    pub async fn execute_multi_step(
        &self,
        browser: &Arc<BrowserAutomation>,
        task: &str,
        max_steps: Option<usize>,
        max_retries_per_step: Option<usize>,
    ) -> Result<MultiStepExecutionResult> {
        let max_steps = max_steps.unwrap_or(20);
        let max_retries_per_step = max_retries_per_step.unwrap_or(3);
        let mut steps: Vec<ConversationStep> = Vec::new();
        let mut total_retries = 0;

        tracing::info!(
            "Agent: Starting multi-step execution for task: '{}' (max_steps: {}, max_retries: {})",
            task,
            max_steps,
            max_retries_per_step
        );

        for step_num in 1..=max_steps {
            tracing::info!("Agent: Step {}/{}", step_num, max_steps);

            // Extract current UI context
            let page = browser.get_page().await;
            let context = match ContextExtractor::extract(page).await {
                Ok(ctx) => ctx,
                Err(e) => {
                    return Ok(MultiStepExecutionResult {
                        task_completed: false,
                        steps_taken: steps.len(),
                        max_steps,
                        steps,
                        final_context: None,
                        error: Some(format!("Failed to extract context at step {}: {}", step_num, e)),
                        retries_count: total_retries,
                    });
                }
            };

            // Build prompt and get LLM decision
            let system_prompt = build_system_prompt();
            let user_prompt = build_user_prompt(&context, task);

            let (action, llm_response) = match self.try_action_with_retry(
                browser,
                &context,
                task,
                &system_prompt,
                &user_prompt,
                max_retries_per_step,
            ).await {
                Ok((act, resp, retries)) => {
                    total_retries += retries;
                    (act, resp)
                }
                Err(e) => {
                    return Ok(MultiStepExecutionResult {
                        task_completed: false,
                        steps_taken: steps.len(),
                        max_steps,
                        steps,
                        final_context: Some(context),
                        error: Some(format!("Failed at step {} after retries: {}", step_num, e)),
                        retries_count: total_retries,
                    });
                }
            };

            // Get updated context after action
            let page = browser.get_page().await;
            let context_after = match ContextExtractor::extract(page).await {
                Ok(ctx) => ctx,
                Err(e) => {
                    tracing::warn!("Failed to extract context after action: {}", e);
                    context.clone()
                }
            };

            // Record this step
            steps.push(ConversationStep {
                step_number: step_num,
                action_decided: action.clone(),
                action_result: ActionResponse {
                    success: true,
                    error: None,
                    reason: Some("Action executed successfully".to_string()),
                    suggestion: None,
                    details: None,
                },
                context_after: context_after.clone(),
                llm_response: llm_response.clone(),
            });

            // Check if task is complete
            if self.is_task_complete(&context_after, task, &steps).await? {
                tracing::info!("Agent: Task completed successfully at step {}", step_num);
                return Ok(MultiStepExecutionResult {
                    task_completed: true,
                    steps_taken: step_num,
                    max_steps,
                    steps,
                    final_context: Some(context_after),
                    error: None,
                    retries_count: total_retries,
                });
            }

            tracing::info!("Agent: Task not yet complete, continuing...");
        }

        // Reached max steps without completion
        let final_page = browser.get_page().await;
        let final_context = ContextExtractor::extract(final_page).await.ok();

        Ok(MultiStepExecutionResult {
            task_completed: false,
            steps_taken: max_steps,
            max_steps,
            steps,
            final_context,
            error: Some(format!(
                "Reached maximum steps ({}) without completing task",
                max_steps
            )),
            retries_count: total_retries,
        })
    }

    /// Try to execute an action with retry mechanism
    /// Returns (ActionRequest, LLM response, retry_count)
    async fn try_action_with_retry(
        &self,
        browser: &Arc<BrowserAutomation>,
        context: &UIContext,
        task: &str,
        system_prompt: &str,
        initial_user_prompt: &str,
        max_retries: usize,
    ) -> Result<(ActionRequest, String, usize)> {
        let mut current_prompt = initial_user_prompt.to_string();
        let mut last_error: Option<(String, String, String)> = None; // (action_str, error, suggestion)

        for retry in 0..=max_retries {
            if retry > 0 {
                tracing::info!("Agent: Retry attempt {}/{}", retry, max_retries);
            }

            // Get LLM decision
            let llm_response = self
                .llm_client
                .generate_json(system_prompt, &current_prompt)
                .await?;

            // Parse action
            let action: ActionRequest = match serde_json::from_str(&llm_response) {
                Ok(act) => act,
                Err(e) => {
                    if retry < max_retries {
                        tracing::warn!("Failed to parse LLM response, will retry: {}", e);
                        continue;
                    }
                    return Err(anyhow::anyhow!("Failed to parse LLM response: {}", e));
                }
            };

            tracing::info!("Agent: Attempting action: {:?}", action);

            // Execute action
            match browser.execute_action(&action).await {
                Ok(result) => {
                    if result.success {
                        tracing::info!("Agent: Action succeeded");
                        return Ok((action, llm_response, retry));
                    } else {
                        // Action executed but returned failure
                        let error_msg = result.error.as_ref()
                            .or(result.reason.as_ref())
                            .map(|s| s.as_str())
                            .unwrap_or("Action failed");
                        tracing::warn!("Agent: Action failed: {}", error_msg);
                        if retry < max_retries {
                            // Build retry prompt with feedback
                            let action_str = serde_json::to_string(&action)
                                .unwrap_or_else(|_| format!("{:?}", action));
                            let suggestion = result
                                .suggestion
                                .clone()
                                .unwrap_or_else(|| "Try a different approach".to_string());

                            current_prompt = build_retry_prompt(
                                context,
                                task,
                                &action_str,
                                error_msg,
                                &suggestion,
                            );

                            last_error = Some((action_str, error_msg.to_string(), suggestion));
                            continue;
                        } else {
                            return Err(anyhow::anyhow!(
                                "Action failed after {} retries: {}",
                                max_retries,
                                error_msg
                            ));
                        }
                    }
                }
                Err(e) => {
                    tracing::error!("Agent: Action execution error: {}", e);
                    if retry < max_retries {
                        let action_str = serde_json::to_string(&action)
                            .unwrap_or_else(|_| format!("{:?}", action));
                        current_prompt = build_retry_prompt(
                            context,
                            task,
                            &action_str,
                            &e.to_string(),
                            "Check if the element exists and is interactable",
                        );
                        continue;
                    }
                    return Err(e);
                }
            }
        }

        Err(anyhow::anyhow!(
            "Failed after {} retries",
            max_retries
        ))
    }

    /// Check if the task is complete by asking the LLM
    async fn is_task_complete(
        &self,
        context: &UIContext,
        task: &str,
        steps: &[ConversationStep],
    ) -> Result<bool> {
        // Build a summary of what we've done
        let mut steps_summary = String::new();
        for step in steps {
            let result_desc = step.action_result.reason.as_ref()
                .or(step.action_result.error.as_ref())
                .map(|s| s.as_str())
                .unwrap_or("completed");
            steps_summary.push_str(&format!(
                "Step {}: {:?} - {}\n",
                step.step_number, step.action_decided, result_desc
            ));
        }

        let completion_prompt = format!(
            r#"You are evaluating if a task has been completed.

Original Task: {}

Steps taken so far:
{}

Current page state:
URL: {}
Title: {}

Question: Has the task been fully completed based on the steps taken and current page state?

Respond with a JSON object:
{{
  "completed": true or false,
  "reason": "brief explanation"
}}

IMPORTANT: Respond ONLY with valid JSON."#,
            task, steps_summary, context.url, context.title
        );

        let response = self
            .llm_client
            .generate_json("You are a task completion evaluator.", &completion_prompt)
            .await?;

        // Parse response
        #[derive(Deserialize)]
        struct CompletionResponse {
            completed: bool,
            #[allow(dead_code)]
            reason: String,
        }

        match serde_json::from_str::<CompletionResponse>(&response) {
            Ok(resp) => {
                tracing::info!("Task completion check: {} ({})", resp.completed, resp.reason);
                Ok(resp.completed)
            }
            Err(e) => {
                tracing::warn!("Failed to parse completion response, assuming not complete: {}", e);
                Ok(false)
            }
        }
    }
}

impl Default for AgentExecutor {
    fn default() -> Self {
        Self::new()
    }
}
