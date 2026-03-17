use super::llm_router::{LlmRouter, TaskComplexity};
use super::LlmMessage;

pub struct PlanGenerator {
    router: LlmRouter,
}

impl PlanGenerator {
    pub fn new(router: LlmRouter) -> Self {
        Self { router }
    }

    pub async fn generate_plan(
        &self,
        state: &str,
        conviction_type: &str,
        immediate_needs: &[String],
        has_children: bool,
        supervision_type: &str,
        work_history: &str,
    ) -> Result<serde_json::Value, anyhow::Error> {
        let system_prompt = format!(
            r#"You are REENTRY's AI Plan Generator. Generate a comprehensive, personalized reentry action plan.

STATE: {state}
CONVICTION TYPE: {conviction_type}
IMMEDIATE NEEDS: {needs}
HAS CHILDREN: {has_children}
SUPERVISION: {supervision_type}
WORK HISTORY: {work_history}

Generate a JSON action plan with these phases:
1. IMMEDIATE (First 72 hours) — emergency shelter, food, phone, transportation
2. WEEK_1 — ID replacement, Medicaid, parole check-in, bank account
3. MONTH_1 — Benefits (SNAP, TANF, etc.), employment search, housing, legal
4. ONGOING — Supervision compliance, education, expungement

For each step include:
- title: clear action item
- category: id|benefits|housing|employment|legal|supervision|healthcare|education|family
- instructions: numbered step-by-step guide with specific phone numbers, addresses, URLs
- documents_needed: what to bring
- deadline: when to do this
- priority: 1-5 (1 = most urgent)

Be SPECIFIC to {state}. Use real agency names, real phone numbers, real URLs.
Do NOT use generic advice. Every instruction must be actionable TODAY.

Respond with valid JSON only."#,
            needs = immediate_needs.join(", "),
        );

        let messages = vec![
            LlmMessage {
                role: "user".to_string(),
                content: system_prompt,
            },
        ];

        let response = self.router.complete(messages, TaskComplexity::High).await?;

        // Parse the response as JSON
        let plan: serde_json::Value = serde_json::from_str(&response.content)
            .unwrap_or_else(|_| {
                serde_json::json!({
                    "error": "Failed to parse plan",
                    "raw": response.content
                })
            });

        Ok(plan)
    }
}
