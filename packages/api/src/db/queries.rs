use sqlx::PgPool;
use uuid::Uuid;

use super::models::*;

pub async fn create_user(
    pool: &PgPool,
    full_name: &str,
    state_of_release: &str,
    conviction_type: &str,
) -> Result<User, sqlx::Error> {
    sqlx::query_as::<_, User>(
        r#"
        INSERT INTO users (full_name, state_of_release, conviction_type)
        VALUES ($1, $2, $3)
        RETURNING *
        "#,
    )
    .bind(full_name)
    .bind(state_of_release)
    .bind(conviction_type)
    .fetch_one(pool)
    .await
}

pub async fn get_user(pool: &PgPool, user_id: Uuid) -> Result<Option<User>, sqlx::Error> {
    sqlx::query_as::<_, User>("SELECT * FROM users WHERE id = $1")
        .bind(user_id)
        .fetch_optional(pool)
        .await
}

pub async fn create_plan(
    pool: &PgPool,
    user_id: Uuid,
    state: &str,
    plan_data: serde_json::Value,
) -> Result<ActionPlan, sqlx::Error> {
    sqlx::query_as::<_, ActionPlan>(
        r#"
        INSERT INTO action_plans (user_id, state, plan_data)
        VALUES ($1, $2, $3)
        RETURNING *
        "#,
    )
    .bind(user_id)
    .bind(state)
    .bind(plan_data)
    .fetch_one(pool)
    .await
}

pub async fn get_plan(
    pool: &PgPool,
    plan_id: Uuid,
) -> Result<Option<ActionPlan>, sqlx::Error> {
    sqlx::query_as::<_, ActionPlan>("SELECT * FROM action_plans WHERE id = $1")
        .bind(plan_id)
        .fetch_optional(pool)
        .await
}

pub async fn get_plan_steps(
    pool: &PgPool,
    plan_id: Uuid,
) -> Result<Vec<PlanStep>, sqlx::Error> {
    sqlx::query_as::<_, PlanStep>(
        "SELECT * FROM plan_steps WHERE plan_id = $1 ORDER BY sort_order",
    )
    .bind(plan_id)
    .fetch_all(pool)
    .await
}

pub async fn update_step_status(
    pool: &PgPool,
    step_id: Uuid,
    status: &str,
) -> Result<PlanStep, sqlx::Error> {
    let completed_at = if status == "completed" {
        Some(chrono::Utc::now())
    } else {
        None
    };

    sqlx::query_as::<_, PlanStep>(
        r#"
        UPDATE plan_steps
        SET status = $2, completed_at = $3
        WHERE id = $1
        RETURNING *
        "#,
    )
    .bind(step_id)
    .bind(status)
    .bind(completed_at)
    .fetch_one(pool)
    .await
}

pub async fn create_intake_session(
    pool: &PgPool,
) -> Result<IntakeSession, sqlx::Error> {
    sqlx::query_as::<_, IntakeSession>(
        r#"
        INSERT INTO intake_sessions (stage, responses)
        VALUES ('welcome', '{}')
        RETURNING *
        "#,
    )
    .fetch_one(pool)
    .await
}

pub async fn get_user_deadlines(
    pool: &PgPool,
    user_id: Uuid,
) -> Result<Vec<Deadline>, sqlx::Error> {
    sqlx::query_as::<_, Deadline>(
        "SELECT * FROM deadlines WHERE user_id = $1 ORDER BY due_date",
    )
    .bind(user_id)
    .fetch_all(pool)
    .await
}

pub async fn get_active_risk_flags(
    pool: &PgPool,
    user_id: Uuid,
) -> Result<Vec<RiskFlag>, sqlx::Error> {
    sqlx::query_as::<_, RiskFlag>(
        "SELECT * FROM risk_flags WHERE user_id = $1 AND resolved = false ORDER BY created_at DESC",
    )
    .bind(user_id)
    .fetch_all(pool)
    .await
}
