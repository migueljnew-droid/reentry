use actix_web::{web, HttpResponse};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Deserialize)]
pub struct MessageRequest {
    pub session_id: Uuid,
    pub message: String,
}

#[derive(Serialize)]
pub struct IntakeResponse {
    pub session_id: Uuid,
    pub reply: String,
    pub stage: String,
}

async fn start_intake() -> HttpResponse {
    let session_id = Uuid::new_v4();

    HttpResponse::Ok().json(IntakeResponse {
        session_id,
        reply: "Welcome to REENTRY. I'm here to build your personal reentry action plan. Let's start — what's your name?".to_string(),
        stage: "welcome".to_string(),
    })
}

async fn send_message(body: web::Json<MessageRequest>) -> HttpResponse {
    // In production: use AI agent to process message and advance intake
    let reply = format!(
        "Got it. I heard: \"{}\". Let me process that and move to the next step.",
        body.message
    );

    HttpResponse::Ok().json(IntakeResponse {
        session_id: body.session_id,
        reply,
        stage: "processing".to_string(),
    })
}

async fn send_voice() -> HttpResponse {
    // In production: receive audio, transcribe via Whisper, process
    HttpResponse::Ok().json(serde_json::json!({
        "transcript": "Voice transcription will be processed here",
        "reply": "I heard you. Processing your voice input...",
        "stage": "processing"
    }))
}

pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/intake")
            .route("/start", web::post().to(start_intake))
            .route("/message", web::post().to(send_message))
            .route("/voice", web::post().to(send_voice)),
    );
}
