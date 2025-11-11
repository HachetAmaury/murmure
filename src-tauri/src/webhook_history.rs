use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Emitter, Manager};
use std::sync::{Mutex, OnceLock};

const MAX_WEBHOOK_HISTORY_ENTRIES: usize = 5;

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct WebhookHistoryEntry {
    pub id: u64,
    pub timestamp: i64,
    pub text: String,
    pub success: bool,
    pub error_message: Option<String>,
    pub duration: Option<f64>,
    pub response_body: Option<String>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
struct WebhookHistoryData {
    entries: Vec<WebhookHistoryEntry>,
    next_id: u64,
}

impl Default for WebhookHistoryData {
    fn default() -> Self {
        Self {
            entries: Vec::new(),
            next_id: 1,
        }
    }
}

fn get_webhook_history_file_path(app: &AppHandle) -> Result<PathBuf> {
    let app_data_dir = app.path().app_data_dir()?;
    if !app_data_dir.exists() {
        fs::create_dir_all(&app_data_dir)?;
    }
    Ok(app_data_dir.join("webhook_history.json"))
}

fn read_webhook_history(app: &AppHandle) -> Result<WebhookHistoryData> {
    let path = get_webhook_history_file_path(app)?;
    if !path.exists() {
        return Ok(WebhookHistoryData::default());
    }
    let content = fs::read_to_string(path)?;
    let data = serde_json::from_str(&content)?;
    Ok(data)
}

fn write_webhook_history(app: &AppHandle, data: &WebhookHistoryData) -> Result<()> {
    let path = get_webhook_history_file_path(app)?;
    let content = serde_json::to_string_pretty(data)?;
    fs::write(path, content)?;
    Ok(())
}

static WEBHOOK_HISTORY_MEM: OnceLock<Mutex<WebhookHistoryData>> = OnceLock::new();

fn memory_data() -> &'static Mutex<WebhookHistoryData> {
    WEBHOOK_HISTORY_MEM.get_or_init(|| Mutex::new(WebhookHistoryData::default()))
}

pub fn add_webhook_call(
    app: &AppHandle,
    text: String,
    success: bool,
    error_message: Option<String>,
    duration: Option<f64>,
    response_body: Option<String>,
) -> Result<()> {
    let mut data = match memory_data().lock() {
        Ok(d) => d.clone(),
        Err(_) => WebhookHistoryData::default(),
    };

    let timestamp = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)?
        .as_secs() as i64;

    let entry = WebhookHistoryEntry {
        id: data.next_id,
        timestamp,
        text,
        success,
        error_message,
        duration,
        response_body,
    };

    data.entries.insert(0, entry);
    data.next_id += 1;

    if data.entries.len() > MAX_WEBHOOK_HISTORY_ENTRIES {
        data.entries.truncate(MAX_WEBHOOK_HISTORY_ENTRIES);
    }

    if let Ok(mut guard) = memory_data().lock() {
        *guard = data.clone();
    }

    // Also persist to disk
    write_webhook_history(app, &data)?;

    let _ = app.emit("webhook-history-updated", ());

    Ok(())
}

pub fn get_webhook_history(app: &AppHandle) -> Result<Vec<WebhookHistoryEntry>> {
    let data = match memory_data().lock() {
        Ok(d) => d.clone(),
        Err(_) => {
            // Try to load from disk if memory is empty
            read_webhook_history(app).unwrap_or_default()
        }
    };
    Ok(data.entries)
}

pub fn clear_webhook_history(app: &AppHandle) -> Result<()> {
    if let Ok(mut guard) = memory_data().lock() {
        guard.entries.clear();
    }
    let path = get_webhook_history_file_path(app)?;
    if path.exists() {
        let _ = fs::remove_file(path);
    }
    let _ = app.emit("webhook-history-updated", ());
    Ok(())
}

