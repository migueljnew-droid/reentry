use actix_web::{web, HttpResponse};
use serde::Deserialize;
use uuid::Uuid;

#[derive(Deserialize)]
pub struct GeneratePlanRequest {
    pub session_id: Uuid,
}

#[derive(Deserialize)]
pub struct UpdateStepRequest {
    pub status: String,
}

async fn generate_plan(body: web::Json<GeneratePlanRequest>) -> HttpResponse {
    let plan_id = Uuid::new_v4();

    // In production: AI agent generates full plan from intake data
    HttpResponse::Ok().json(serde_json::json!({
        "plan_id": plan_id,
        "status": "generated",
        "message": "Your action plan has been generated."
    }))
}

async fn get_plan(path: web::Path<Uuid>) -> HttpResponse {
    let plan_id = path.into_inner();

    // In production: fetch from database
    HttpResponse::Ok().json(serde_json::json!({
        "id": plan_id,
        "status": "active",
        "state": "GA",
        "steps_count": 14,
        "completed_count": 0
    }))
}

async fn get_plan_steps(path: web::Path<Uuid>) -> HttpResponse {
    let plan_id = path.into_inner();

    // In production: fetch steps from database
    HttpResponse::Ok().json(serde_json::json!({
        "plan_id": plan_id,
        "steps": []
    }))
}

async fn update_step(path: web::Path<(Uuid, Uuid)>, body: web::Json<UpdateStepRequest>) -> HttpResponse {
    let (plan_id, step_id) = path.into_inner();

    HttpResponse::Ok().json(serde_json::json!({
        "plan_id": plan_id,
        "step_id": step_id,
        "status": body.status
    }))
}

async fn export_plan(path: web::Path<Uuid>) -> HttpResponse {
    let _plan_id = path.into_inner();

    // In production: generate PDF export
    HttpResponse::Ok().json(serde_json::json!({
        "format": "pdf",
        "url": "/exports/plan.pdf"
    }))
}

pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/plans")
            .route("/generate", web::post().to(generate_plan))
            .route("/{id}", web::get().to(get_plan))
            .route("/{id}/steps", web::get().to(get_plan_steps))
            .route("/{id}/steps/{step_id}", web::patch().to(update_step))
            .route("/{id}/export", web::get().to(export_plan)),
    );
}
