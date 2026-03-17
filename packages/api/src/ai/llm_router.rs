use crate::config::AppConfig;
use super::{LlmMessage, LlmResponse};

#[derive(Debug, Clone, Copy)]
pub enum TaskComplexity {
    Low,       // FAQ, status checks → Haiku/Flash
    Medium,    // Benefits screening, employment matching → Sonnet
    High,      // Plan generation, risk assessment → Opus
}

pub struct LlmRouter {
    config: AppConfig,
    client: reqwest::Client,
}

impl LlmRouter {
    pub fn new(config: AppConfig) -> Self {
        Self {
            config,
            client: reqwest::Client::new(),
        }
    }

    pub fn select_model(&self, complexity: TaskComplexity) -> &str {
        match complexity {
            TaskComplexity::Low => "claude-haiku-4-5-20251001",
            TaskComplexity::Medium => "claude-sonnet-4-6",
            TaskComplexity::High => "claude-opus-4-6",
        }
    }

    pub async fn complete(
        &self,
        messages: Vec<LlmMessage>,
        complexity: TaskComplexity,
    ) -> Result<LlmResponse, anyhow::Error> {
        let model = self.select_model(complexity);

        let api_key = self.config.anthropic_api_key
            .as_deref()
            .or(self.config.openai_api_key.as_deref())
            .ok_or_else(|| anyhow::anyhow!("No API key configured"))?;

        // Use Anthropic API
        let response = self.client
            .post("https://api.anthropic.com/v1/messages")
            .header("x-api-key", api_key)
            .header("anthropic-version", "2023-06-01")
            .header("content-type", "application/json")
            .json(&serde_json::json!({
                "model": model,
                "max_tokens": 4096,
                "messages": messages,
            }))
            .send()
            .await?;

        let body: serde_json::Value = response.json().await?;

        let content = body["content"][0]["text"]
            .as_str()
            .unwrap_or("No response generated")
            .to_string();

        let usage = body["usage"].clone();

        Ok(LlmResponse {
            content,
            model: model.to_string(),
            usage: super::LlmUsage {
                prompt_tokens: usage["input_tokens"].as_u64().unwrap_or(0) as u32,
                completion_tokens: usage["output_tokens"].as_u64().unwrap_or(0) as u32,
                total_tokens: (usage["input_tokens"].as_u64().unwrap_or(0)
                    + usage["output_tokens"].as_u64().unwrap_or(0)) as u32,
            },
        })
    }
}
