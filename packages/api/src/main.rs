use actix_cors::Cors;
use actix_web::{web, App, HttpServer, middleware as actix_middleware};
use tracing_actix_web::TracingLogger;

mod config;
mod db;
mod middleware;
mod routes;
mod services;
mod ai;

use config::AppConfig;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    // Load .env
    dotenvy::dotenv().ok();

    // Initialize tracing
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "reentry_api=info,actix_web=info".into()),
        )
        .init();

    let config = AppConfig::from_env();
    let port = config.port;

    // Initialize database pool
    let db_pool = db::create_pool(&config.database_url).await;

    tracing::info!("REENTRY API starting on port {}", port);

    HttpServer::new(move || {
        let cors = Cors::default()
            .allow_any_origin()
            .allow_any_method()
            .allow_any_header()
            .max_age(3600);

        App::new()
            .wrap(TracingLogger::default())
            .wrap(cors)
            .wrap(actix_middleware::Compress::default())
            .app_data(web::Data::new(db_pool.clone()))
            .app_data(web::Data::new(config.clone()))
            .configure(routes::configure)
    })
    .bind(("0.0.0.0", port))?
    .run()
    .await
}
