use actix_web::{web, HttpResponse};
use serde::Deserialize;
use uuid::Uuid;

#[derive(Deserialize)]
pub struct CreateDeadlineRequest {
    pub title: String,
    pub due_date: String,
    pub category: String,
    pub description: Option<String>,
}

async fn get_deadlines() -> HttpResponse {
    // In production: fetch from DB using auth context
    HttpResponse::Ok().json(serde_json::json!({
        "deadlines": [
            {
                "id": Uuid::new_v4(),
                "title": "Parole check-in",
                "due_date": "2026-03-24T10:00:00Z",
                "category": "supervision",
                "status": "upcoming",
                "days_until": 7
            },
            {
                "id": Uuid::new_v4(),
                "title": "SNAP recertification",
                "due_date": "2026-04-15T23:59:00Z",
                "category": "benefits",
                "status": "upcoming",
                "days_until": 29
            }
        ]
    }))
}

async fn create_deadline(body: web::Json<CreateDeadlineRequest>) -> HttpResponse {
    HttpResponse::Created().json(serde_json::json!({
        "id": Uuid::new_v4(),
        "title": body.title,
        "due_date": body.due_date,
        "category": body.category,
        "status": "upcoming"
    }))
}

async fn update_deadline(path: web::Path<Uuid>) -> HttpResponse {
    let deadline_id = path.into_inner();

    HttpResponse::Ok().json(serde_json::json!({
        "id": deadline_id,
        "updated": true
    }))
}

pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/deadlines")
            .route("", web::get().to(get_deadlines))
            .route("", web::post().to(create_deadline))
            .route("/{id}", web::patch().to(update_deadline)),
    );
}
