use actix_web::{web, HttpResponse};
use serde::Deserialize;
use uuid::Uuid;

#[derive(Deserialize)]
pub struct MatchRequest {
    pub user_id: Uuid,
}

async fn match_employment(body: web::Json<MatchRequest>) -> HttpResponse {
    // In production: AI agent matches against employer database
    HttpResponse::Ok().json(serde_json::json!({
        "user_id": body.user_id,
        "matches": [
            {
                "employer": "Amazon Warehouse",
                "job_title": "Warehouse Associate",
                "location": "Atlanta, GA",
                "salary": "$17-22/hr",
                "conviction_friendly": true,
                "match_score": 0.85,
                "apply_url": "https://hiring.amazon.com"
            },
            {
                "employer": "Goodwill Industries",
                "job_title": "Retail Associate",
                "location": "Atlanta, GA",
                "salary": "$15-18/hr",
                "conviction_friendly": true,
                "match_score": 0.80,
                "notes": "Also offers free job training"
            }
        ]
    }))
}

async fn get_matches(path: web::Path<Uuid>) -> HttpResponse {
    let user_id = path.into_inner();

    HttpResponse::Ok().json(serde_json::json!({
        "user_id": user_id,
        "matches": []
    }))
}

async fn update_match(path: web::Path<Uuid>) -> HttpResponse {
    let match_id = path.into_inner();

    HttpResponse::Ok().json(serde_json::json!({
        "match_id": match_id,
        "updated": true
    }))
}

pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/employment")
            .route("/match", web::post().to(match_employment))
            .route("/matches/{user_id}", web::get().to(get_matches))
            .route("/matches/{id}", web::patch().to(update_match)),
    );
}
