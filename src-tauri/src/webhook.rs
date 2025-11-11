use crate::settings;
use crate::webhook_history;
use chrono::Utc;
use reqwest::Client;
use serde_json::json;
use std::time::Duration;
use tauri::{AppHandle, Emitter};

pub async fn send_webhook(
    app: &AppHandle,
    text: &str,
    duration: Option<f64>,
) -> Result<(), String> {
    let settings = settings::load_settings(app);

    let webhook_url = match settings.webhook_url {
        Some(url) if !url.is_empty() => url,
        _ => return Ok(()), // No webhook URL configured, silently skip
    };

    let timestamp = Utc::now().to_rfc3339();

    let payload = json!({
        "text": text,
        "timestamp": timestamp,
        "duration": duration,
    });

    let client = Client::builder()
        .timeout(Duration::from_secs(10))
        .build()
        .map_err(|e| format!("Failed to create HTTP client: {}", e))?;

    let mut request = client.post(&webhook_url).json(&payload);

    // Add authorization header if token is configured
    if let Some(token) = settings.webhook_token {
        if !token.is_empty() {
            request = request.header("Authorization", format!("Bearer {}", token));
        }
    }

    let result = request.send().await;

    match result {
        Ok(response) => {
            let status = response.status();
            // Always try to read the response body
            let response_body = response.text().await.ok();

            if !status.is_success() {
                // Try to read the response body for more details
                let mut error_msg = format!("Webhook request failed with status {}", status);
                if let Some(ref response_text) = response_body {
                    if !response_text.is_empty() {
                        // Truncate very long responses to avoid cluttering the UI
                        let truncated = if response_text.len() > 500 {
                            format!("{}...", &response_text[..500])
                        } else {
                            response_text.clone()
                        };
                        error_msg = format!("Status {}: {}", status, truncated);
                    }
                }
                let _ = app.emit("webhook:error", &error_msg);
                // Record failed webhook call with response body
                let _ = webhook_history::add_webhook_call(
                    app,
                    text.to_string(),
                    false,
                    Some(error_msg.clone()),
                    duration,
                    response_body,
                );
                return Err(error_msg);
            }
            // Record successful webhook call with response body
            let _ = webhook_history::add_webhook_call(
                app,
                text.to_string(),
                true,
                None,
                duration,
                response_body,
            );
            Ok(())
        }
        Err(e) => {
            let error_msg = format!("Webhook request failed: {}", e);
            let _ = app.emit("webhook:error", &error_msg);
            // Record failed webhook call (no response body available for network errors)
            let _ = webhook_history::add_webhook_call(
                app,
                text.to_string(),
                false,
                Some(error_msg.clone()),
                duration,
                None,
            );
            Err(error_msg)
        }
    }
}

