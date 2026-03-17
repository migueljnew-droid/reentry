use sqlx::postgres::{PgPool, PgPoolOptions};

pub mod models;
pub mod queries;

pub type DbPool = PgPool;

pub async fn create_pool(database_url: &str) -> DbPool {
    // Try to connect, but NEVER panic — the API must start even without DB
    match PgPoolOptions::new()
        .max_connections(20)
        .acquire_timeout(std::time::Duration::from_secs(5))
        .connect(database_url)
        .await
    {
        Ok(pool) => {
            tracing::info!("Database connected successfully");
            pool
        }
        Err(e) => {
            tracing::warn!("Database connection failed: {}. API will run without persistent storage.", e);
            // Create a lazy pool that won't panic — queries will fail at runtime instead
            match PgPoolOptions::new()
                .max_connections(1)
                .connect_lazy(database_url)
            {
                Ok(pool) => pool,
                Err(e2) => {
                    tracing::error!("Lazy pool creation also failed: {}. Using dummy URL.", e2);
                    // Last resort: create pool with dummy URL — queries will fail but server runs
                    PgPoolOptions::new()
                        .max_connections(1)
                        .connect_lazy("postgres://localhost:5432/reentry")
                        .expect("Failed to create fallback pool with localhost URL")
                }
            }
        }
    }
}
