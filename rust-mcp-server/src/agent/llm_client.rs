use anyhow::Result;
use async_openai::{
    types::{
        ChatCompletionRequestMessage, ChatCompletionRequestSystemMessageArgs,
        ChatCompletionRequestUserMessageArgs, CreateChatCompletionRequestArgs,
    },
    Client,
};

/// LLM Client for agent decision-making (Step 2)
pub struct LLMClient {
    client: Client<async_openai::config::OpenAIConfig>,
    model: String,
}

impl LLMClient {
    /// Create new LLM client
    pub fn new() -> Self {
        let api_key = std::env::var("OPENAI_API_KEY")
            .expect("OPENAI_API_KEY must be set for agent functionality");

        let config = async_openai::config::OpenAIConfig::new()
            .with_api_key(api_key);

        let client = Client::with_config(config);

        let model = std::env::var("OPENAI_MODEL")
            .unwrap_or_else(|_| "gpt-4".to_string());

        Self { client, model }
    }

    /// Generate a completion from the LLM
    /// Currently using generate_json for structured output, but kept for future use
    #[allow(dead_code)]
    pub async fn generate(
        &self,
        system_prompt: &str,
        user_message: &str,
    ) -> Result<String> {
        let messages = vec![
            ChatCompletionRequestMessage::System(
                ChatCompletionRequestSystemMessageArgs::default()
                    .content(system_prompt)
                    .build()?,
            ),
            ChatCompletionRequestMessage::User(
                ChatCompletionRequestUserMessageArgs::default()
                    .content(user_message)
                    .build()?,
            ),
        ];

        let request = CreateChatCompletionRequestArgs::default()
            .model(&self.model)
            .messages(messages)
            .temperature(0.1) // Low temperature for consistent actions
            .max_tokens(500u32)
            .build()?;

        let response = self.client.chat().create(request).await?;

        let content = response
            .choices
            .first()
            .and_then(|choice| choice.message.content.clone())
            .ok_or_else(|| anyhow::anyhow!("No response from LLM"))?;

        Ok(content)
    }

    /// Generate with JSON mode (for structured output)
    pub async fn generate_json(
        &self,
        system_prompt: &str,
        user_message: &str,
    ) -> Result<String> {
        let messages = vec![
            ChatCompletionRequestMessage::System(
                ChatCompletionRequestSystemMessageArgs::default()
                    .content(system_prompt)
                    .build()?,
            ),
            ChatCompletionRequestMessage::User(
                ChatCompletionRequestUserMessageArgs::default()
                    .content(user_message)
                    .build()?,
            ),
        ];

        let request = CreateChatCompletionRequestArgs::default()
            .model(&self.model)
            .messages(messages)
            .temperature(0.1)
            .max_tokens(500u32)
            .response_format(async_openai::types::ChatCompletionResponseFormat {
                r#type: async_openai::types::ChatCompletionResponseFormatType::JsonObject,
            })
            .build()?;

        let response = self.client.chat().create(request).await?;

        let content = response
            .choices
            .first()
            .and_then(|choice| choice.message.content.clone())
            .ok_or_else(|| anyhow::anyhow!("No response from LLM"))?;

        Ok(content)
    }
}

impl Default for LLMClient {
    fn default() -> Self {
        Self::new()
    }
}
