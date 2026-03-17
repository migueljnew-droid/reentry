use sqlx::postgres::{PgPool, PgPoolOptions};

pub mod models;
pub mod queries;

pub type DbPool = PgPool;

pub async fn create_pool(database_url: &str) -> DbPool {
    // Always use lazy pool — connects on first query, never blocks startup
    tracing::info!("Creating lazy database pool");
    match PgPoolOptions::new()
        .max_connections(20)
        .connect_lazy(database_url)
    {
        Ok(pool) => {
            tracing::info!("Lazy database pool created successfully");
            pool
        }
        Err(e) => {
            tracing::warn!("Lazy pool creation failed: {}. Using localhost fallback.", e);
            PgPoolOptions::new()
                .max_connections(1)
                .connect_lazy("postgres://localhost:5432/reentry")
                .expect("Fallback pool must succeed")
        }
    }
}
