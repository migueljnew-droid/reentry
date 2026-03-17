use super::llm_router::{LlmRouter, TaskComplexity};
use super::LlmMessage;

pub struct BenefitsScreener {
    router: LlmRouter,
}

impl BenefitsScreener {
    pub fn new(router: LlmRouter) -> Self {
        Self { router }
    }

    pub async fn screen(
        &self,
        state: &str,
        conviction_type: &str,
        has_children: bool,
        income: Option<f64>,
    ) -> Result<Vec<BenefitResult>, anyhow::Error> {
        let prompt = format!(
            r#"Screen this person for ALL available benefits programs in {state}:

- State: {state}
- Conviction type: {conviction_type}
- Has children: {has_children}
- Current income: {income}

For each program, determine:
1. Whether they are likely eligible (true/false)
2. Confidence score (0.0-1.0)
3. Monthly benefit value
4. How to apply (specific URL, phone, or location)
5. Any conviction-related restrictions

Check ALL of these programs:
- SNAP (food stamps)
- Medicaid
- TANF (cash assistance)
- LIHEAP (energy assistance)
- Section 8 (housing voucher)
- SSI (if disabled)
- Lifeline (free phone)
- Pell Grant (education)
- WIC (if children under 5)
- State-specific programs for {state}

Respond with JSON array of results."#,
            income = income.map_or("Unknown".to_string(), |i| format!("${:.0}/month", i)),
        );

        let messages = vec![LlmMessage {
            role: "user".to_string(),
            content: prompt,
        }];

        let response = self.router.complete(messages, TaskComplexity::Medium).await?;

        // Parse results
        let results: Vec<BenefitResult> = serde_json::from_str(&response.content)
            .unwrap_or_default();

        Ok(results)
    }
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize, Default)]
pub struct BenefitResult {
    pub program_name: String,
    pub program_type: String,
    pub eligible: bool,
    pub confidence: f32,
    pub monthly_value: String,
    pub how_to_apply: String,
    pub conviction_restrictions: Vec<String>,
}
