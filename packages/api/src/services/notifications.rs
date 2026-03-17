use serde::Serialize;

#[derive(Debug, Serialize)]
pub struct PushNotification {
    pub title: String,
    pub body: String,
    pub category: String,
    pub data: serde_json::Value,
}

pub struct NotificationService;

impl NotificationService {
    pub fn new() -> Self {
        Self
    }

    pub async fn send_deadline_reminder(
        &self,
        _user_id: uuid::Uuid,
        title: &str,
        days_until: i64,
    ) -> Result<(), anyhow::Error> {
        let body = match days_until {
            0 => format!("{} is TODAY!", title),
            1 => format!("{} is TOMORROW!", title),
            d => format!("{} is in {} days", title, d),
        };

        let notification = PushNotification {
            title: "REENTRY Reminder".to_string(),
            body,
            category: "deadline".to_string(),
            data: serde_json::json!({}),
        };

        // In production: send via Expo Push, Web Push, SMS
        tracing::info!("Sending notification: {:?}", notification);

        Ok(())
    }
}
