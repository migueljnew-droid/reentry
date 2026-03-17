use actix_web::web;

pub mod health;
pub mod intake;
pub mod plans;
pub mod benefits;
pub mod employment;
pub mod deadlines;
pub mod dashboard;

pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/api/v1")
            .configure(health::configure)
            .configure(intake::configure)
            .configure(plans::configure)
            .configure(benefits::configure)
            .configure(employment::configure)
            .configure(deadlines::configure)
            .configure(dashboard::configure),
    );
}
