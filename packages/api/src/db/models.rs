use chrono::{DateTime, NaiveDate, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct User {
    pub id: Uuid,
    pub auth_id: Option<Uuid>,
    pub phone: Option<String>,
    pub email: Option<String>,
    pub full_name: String,
    pub state_of_release: String,
    pub conviction_type: String,
    pub release_date: Option<NaiveDate>,
    pub release_facility: Option<String>,
    pub family_situation: serde_json::Value,
    pub skills: serde_json::Value,
    pub immediate_needs: Vec<String>,
    pub supervision_terms: serde_json::Value,
    pub language_preference: String,
    pub role: String,
    pub onboarding_complete: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct ActionPlan {
    pub id: Uuid,
    pub user_id: Uuid,
    pub state: String,
    pub status: String,
    pub plan_data: serde_json::Value,
    pub generated_at: DateTime<Utc>,
    pub last_synced: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct PlanStep {
    pub id: Uuid,
    pub plan_id: Uuid,
    pub phase: String,
    pub category: String,
    pub title: String,
    pub description: Option<String>,
    pub instructions: serde_json::Value,
    pub documents_needed: Vec<String>,
    pub deadline: Option<NaiveDate>,
    pub status: String,
    pub completed_at: Option<DateTime<Utc>>,
    pub priority: i32,
    pub sort_order: i32,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct BenefitsScreening {
    pub id: Uuid,
    pub user_id: Uuid,
    pub program_name: String,
    pub program_type: String,
    pub eligible: Option<bool>,
    pub confidence: Option<f32>,
    pub requirements_met: serde_json::Value,
    pub requirements_missing: serde_json::Value,
    pub application_url: Option<String>,
    pub notes: Option<String>,
    pub screened_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Deadline {
    pub id: Uuid,
    pub user_id: Uuid,
    pub plan_step_id: Option<Uuid>,
    pub title: String,
    pub description: Option<String>,
    pub due_date: DateTime<Utc>,
    pub category: String,
    pub status: String,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct RiskFlag {
    pub id: Uuid,
    pub user_id: Uuid,
    pub flag_type: String,
    pub severity: String,
    pub description: String,
    pub resolved: bool,
    pub resolved_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct IntakeSession {
    pub id: Uuid,
    pub user_id: Option<Uuid>,
    pub stage: String,
    pub responses: serde_json::Value,
    pub started_at: DateTime<Utc>,
    pub completed_at: Option<DateTime<Utc>>,
}
