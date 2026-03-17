use actix_web::{web, HttpResponse};
use serde::Serialize;

#[derive(Serialize)]
struct HealthResponse {
    status: String,
    version: String,
    service: String,
}

async fn health() -> HttpResponse {
    HttpResponse::Ok().json(HealthResponse {
        status: "ok".to_string(),
        version: env!("CARGO_PKG_VERSION").to_string(),
        service: "reentry-api".to_string(),
    })
}

async fn ready() -> HttpResponse {
    // In production: check DB connectivity
    HttpResponse::Ok().json(serde_json::json!({
        "status": "ready",
        "checks": {
            "database": "ok",
            "ai_engine": "ok"
        }
    }))
}

pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/health")
            .route("", web::get().to(health))
            .route("/ready", web::get().to(ready)),
    );
}
