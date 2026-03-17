use actix_web::{web, HttpResponse};
use serde::Deserialize;
use uuid::Uuid;

#[derive(Deserialize)]
pub struct ScreenRequest {
    pub user_id: Uuid,
}

async fn screen_benefits(body: web::Json<ScreenRequest>) -> HttpResponse {
    // In production: AI agent screens user against 100+ programs
    HttpResponse::Ok().json(serde_json::json!({
        "user_id": body.user_id,
        "programs_screened": 12,
        "eligible_programs": 8,
        "results": [
            {
                "program": "SNAP (Food Stamps)",
                "eligible": true,
                "confidence": 0.95,
                "monthly_value": "$292",
                "how_to_apply": "Apply online at gateway.ga.gov or call 877-423-4746"
            },
            {
                "program": "Medicaid",
                "eligible": true,
                "confidence": 0.98,
                "monthly_value": "Full health coverage",
                "how_to_apply": "Apply online at gateway.ga.gov"
            },
            {
                "program": "Lifeline (Free Phone)",
                "eligible": true,
                "confidence": 0.90,
                "monthly_value": "Free phone + service",
                "how_to_apply": "Visit lifelinesupport.org"
            }
        ]
    }))
}

async fn get_programs(path: web::Path<String>) -> HttpResponse {
    let state = path.into_inner();

    HttpResponse::Ok().json(serde_json::json!({
        "state": state,
        "programs": [
            {"name": "SNAP", "type": "food"},
            {"name": "Medicaid", "type": "healthcare"},
            {"name": "TANF", "type": "cash"},
            {"name": "LIHEAP", "type": "energy"},
            {"name": "Section 8", "type": "housing"},
            {"name": "Lifeline", "type": "phone"},
            {"name": "Pell Grant", "type": "education"}
        ]
    }))
}

async fn get_results(path: web::Path<Uuid>) -> HttpResponse {
    let user_id = path.into_inner();

    HttpResponse::Ok().json(serde_json::json!({
        "user_id": user_id,
        "results": []
    }))
}

pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/benefits")
            .route("/screen", web::post().to(screen_benefits))
            .route("/programs/{state}", web::get().to(get_programs))
            .route("/results/{user_id}", web::get().to(get_results)),
    );
}
