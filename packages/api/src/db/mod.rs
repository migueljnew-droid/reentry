use sqlx::postgres::{PgPool, PgPoolOptions};

pub mod models;
pub mod queries;

pub type DbPool = PgPool;

pub async fn create_pool(database_url: &str) -> DbPool {
    match PgPoolOptions::new()
        .max_connections(20)
        .connect(database_url)
        .await
    {
        Ok(pool) => {
            tracing::info!("Database connected successfully");
            pool
        }
        Err(e) => {
            tracing::warn!("Database connection failed: {}. Using lazy pool.", e);
            PgPoolOptions::new()
                .max_connections(1)
                .connect_lazy(database_url)
                .expect("Failed to create lazy pool")
        }
    }
}
