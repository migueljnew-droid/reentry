use actix_web::{web, HttpResponse};
use uuid::Uuid;

async fn get_clients() -> HttpResponse {
    // In production: fetch case manager's assigned clients
    HttpResponse::Ok().json(serde_json::json!({
        "clients": [],
        "total": 0
    }))
}

async fn get_client(path: web::Path<Uuid>) -> HttpResponse {
    let client_id = path.into_inner();

    HttpResponse::Ok().json(serde_json::json!({
        "client_id": client_id,
        "status": "active"
    }))
}

async fn get_risks() -> HttpResponse {
    HttpResponse::Ok().json(serde_json::json!({
        "risk_flags": [],
        "total": 0
    }))
}

async fn get_analytics() -> HttpResponse {
    HttpResponse::Ok().json(serde_json::json!({
        "total_clients": 0,
        "active_clients": 0,
        "average_progress": 0,
        "risk_breakdown": {
            "low": 0,
            "medium": 0,
            "high": 0,
            "critical": 0
        },
        "completion_rate": 0
    }))
}

async fn export_report() -> HttpResponse {
    HttpResponse::Ok().json(serde_json::json!({
        "format": "csv",
        "url": "/exports/report.csv"
    }))
}

pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/dashboard")
            .route("/clients", web::get().to(get_clients))
            .route("/clients/{id}", web::get().to(get_client))
            .route("/risks", web::get().to(get_risks))
            .route("/analytics", web::get().to(get_analytics))
            .route("/export", web::get().to(export_report)),
    );
}
