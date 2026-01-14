use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

// ============================================================================
// Types
// ============================================================================

#[derive(Serialize, Deserialize)]
pub struct ClaudeSettings {
    settings: serde_json::Value,
    local: serde_json::Value,
}

#[derive(Serialize, Deserialize)]
pub struct ConfigResult {
    config: serde_json::Value,
    raw: String,
}

#[derive(Serialize, Deserialize)]
pub struct Command {
    path: String,
    name: String,
}

#[derive(Serialize, Deserialize)]
pub struct CommandContent {
    path: String,
    content: String,
}

#[derive(Serialize, Deserialize)]
pub struct Skill {
    name: String,
    #[serde(rename = "isSystem")]
    is_system: bool,
}

#[derive(Serialize, Deserialize)]
pub struct SkillContent {
    name: String,
    content: String,
}

#[derive(Serialize, Deserialize)]
pub struct HistoryEntry {
    id: usize,
    text: String,
    timestamp: i64,
    #[serde(rename = "sessionId")]
    session_id: String,
    project: Option<String>,
}

#[derive(Serialize, Deserialize)]
pub struct HistoryResult {
    entries: Vec<HistoryEntry>,
    total: usize,
    limit: usize,
    offset: usize,
    sessions: Vec<String>,
}

#[derive(Serialize, Deserialize)]
pub struct GeminiSession {
    #[serde(rename = "projectHash")]
    project_hash: String,
    #[serde(rename = "sessionId")]
    session_id: String,
    timestamp: i64,
}

#[derive(Serialize, Deserialize)]
pub struct GeminiSessionDetail {
    #[serde(rename = "projectHash")]
    project_hash: String,
    #[serde(rename = "sessionId")]
    session_id: String,
    session: serde_json::Value,
}

#[derive(Serialize, Deserialize)]
pub struct Prompt {
    name: String,
    path: String,
}

#[derive(Serialize, Deserialize)]
pub struct Extension {
    name: String,
    enabled: bool,
    overrides: Option<Vec<String>>,
}

#[derive(Serialize, Deserialize)]
pub struct PromptContent {
    path: String,
    content: String,
}

#[derive(Serialize, Deserialize)]
pub struct ClaudePlugin {
    id: String,
    name: String,
    marketplace: String,
    version: String,
    #[serde(rename = "installPath")]
    install_path: String,
    #[serde(rename = "installedAt")]
    installed_at: String,
    #[serde(rename = "lastUpdated")]
    last_updated: String,
    scope: String,
}

#[derive(Serialize, Deserialize)]
pub struct PluginsResult {
    plugins: Vec<ClaudePlugin>,
}

// ============================================================================
// Helpers
// ============================================================================

fn home_dir() -> PathBuf {
    dirs::home_dir().expect("Could not find home directory")
}

fn claude_dir() -> PathBuf {
    home_dir().join(".claude")
}

fn codex_dir() -> PathBuf {
    home_dir().join(".codex")
}

fn gemini_dir() -> PathBuf {
    home_dir().join(".gemini")
}

fn create_backup(path: &PathBuf) -> Result<(), String> {
    if path.exists() {
        let timestamp = chrono::Utc::now().format("%Y%m%d_%H%M%S");
        let backup_name = format!(
            "{}.backup.{}",
            path.file_name().unwrap().to_string_lossy(),
            timestamp
        );
        let backup_path = path.parent().unwrap().join(backup_name);
        fs::copy(path, &backup_path).map_err(|e| e.to_string())?;

        // Keep only last 5 backups
        let prefix = format!(
            "{}.backup.",
            path.file_name().unwrap().to_string_lossy()
        );
        if let Ok(entries) = fs::read_dir(path.parent().unwrap()) {
            let mut backups: Vec<_> = entries
                .filter_map(|e| e.ok())
                .filter(|e| e.file_name().to_string_lossy().starts_with(&prefix))
                .collect();
            backups.sort_by_key(|e| e.file_name());
            while backups.len() > 5 {
                if let Some(oldest) = backups.first() {
                    let _ = fs::remove_file(oldest.path());
                    backups.remove(0);
                }
            }
        }
    }
    Ok(())
}

// ============================================================================
// Claude Commands
// ============================================================================

#[tauri::command]
fn claude_get_settings() -> Result<ClaudeSettings, String> {
    let settings_path = claude_dir().join("settings.json");
    let local_path = claude_dir().join("settings.local.json");

    let settings = fs::read_to_string(&settings_path)
        .ok()
        .and_then(|s| serde_json::from_str(&s).ok())
        .unwrap_or(serde_json::json!({}));

    let local = fs::read_to_string(&local_path)
        .ok()
        .and_then(|s| serde_json::from_str(&s).ok())
        .unwrap_or(serde_json::json!({}));

    Ok(ClaudeSettings { settings, local })
}

#[tauri::command]
fn claude_save_settings(settings_type: String, content: String) -> Result<bool, String> {
    let path = if settings_type == "local" {
        claude_dir().join("settings.local.json")
    } else {
        claude_dir().join("settings.json")
    };

    // Validate JSON
    serde_json::from_str::<serde_json::Value>(&content).map_err(|e| e.to_string())?;

    create_backup(&path)?;
    fs::write(&path, &content).map_err(|e| e.to_string())?;
    Ok(true)
}

#[tauri::command]
fn claude_get_commands() -> Result<Vec<Command>, String> {
    let commands_dir = claude_dir().join("commands");
    list_markdown_files(&commands_dir, "")
}

fn list_markdown_files(dir: &PathBuf, base: &str) -> Result<Vec<Command>, String> {
    let mut results = Vec::new();

    if let Ok(entries) = fs::read_dir(dir) {
        for entry in entries.filter_map(|e| e.ok()) {
            let path = entry.path();
            let name = entry.file_name().to_string_lossy().to_string();
            let relative = if base.is_empty() {
                name.clone()
            } else {
                format!("{}/{}", base, name)
            };

            if path.is_dir() {
                if let Ok(nested) = list_markdown_files(&path, &relative) {
                    results.extend(nested);
                }
            } else if name.ends_with(".md") {
                results.push(Command {
                    path: relative,
                    name: name.trim_end_matches(".md").to_string(),
                });
            }
        }
    }

    Ok(results)
}

#[tauri::command]
fn claude_get_command(path: String) -> Result<CommandContent, String> {
    let file_path = claude_dir().join("commands").join(&path);
    let content = fs::read_to_string(&file_path).map_err(|e| e.to_string())?;
    Ok(CommandContent { path, content })
}

#[tauri::command]
fn claude_save_command(path: String, content: String) -> Result<bool, String> {
    let file_path = claude_dir().join("commands").join(&path);
    create_backup(&file_path)?;
    fs::write(&file_path, &content).map_err(|e| e.to_string())?;
    Ok(true)
}

#[tauri::command]
fn claude_create_command(path: String, content: String) -> Result<bool, String> {
    let file_path = claude_dir().join("commands").join(&path);
    if let Some(parent) = file_path.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    fs::write(&file_path, &content).map_err(|e| e.to_string())?;
    Ok(true)
}

#[tauri::command]
fn claude_delete_command(path: String) -> Result<bool, String> {
    let file_path = claude_dir().join("commands").join(&path);
    create_backup(&file_path)?;
    fs::remove_file(&file_path).map_err(|e| e.to_string())?;
    Ok(true)
}

#[tauri::command]
fn claude_get_history(
    limit: Option<usize>,
    offset: Option<usize>,
    search: Option<String>,
    session_id: Option<String>,
) -> Result<HistoryResult, String> {
    let history_path = claude_dir().join("history.jsonl");
    let content = fs::read_to_string(&history_path).unwrap_or_default();
    let lines: Vec<&str> = content.lines().filter(|l| !l.is_empty()).collect();

    let limit = limit.unwrap_or(50);
    let offset = offset.unwrap_or(0);

    let mut entries: Vec<HistoryEntry> = lines
        .iter()
        .enumerate()
        .filter_map(|(idx, line)| {
            serde_json::from_str::<serde_json::Value>(line).ok().map(|v| HistoryEntry {
                id: idx,
                text: v["display"].as_str().unwrap_or("").to_string(),
                timestamp: v["timestamp"].as_i64().unwrap_or(0),
                session_id: v["sessionId"].as_str().unwrap_or("").to_string(),
                project: v["project"].as_str().map(|s| s.to_string()),
            })
        })
        .collect();

    entries.reverse(); // Newest first

    // Filter by search
    if let Some(ref s) = search {
        let s_lower = s.to_lowercase();
        entries.retain(|e| {
            e.text.to_lowercase().contains(&s_lower)
                || e.project.as_ref().map(|p| p.to_lowercase().contains(&s_lower)).unwrap_or(false)
        });
    }

    // Filter by session
    if let Some(ref sid) = session_id {
        entries.retain(|e| &e.session_id == sid);
    }

    let total = entries.len();
    let paginated: Vec<_> = entries.into_iter().skip(offset).take(limit).collect();

    // Get unique sessions
    let sessions: Vec<String> = lines
        .iter()
        .filter_map(|line| {
            serde_json::from_str::<serde_json::Value>(line)
                .ok()
                .and_then(|v| v["sessionId"].as_str().map(|s| s.to_string()))
        })
        .collect::<std::collections::HashSet<_>>()
        .into_iter()
        .collect();

    Ok(HistoryResult {
        entries: paginated,
        total,
        limit,
        offset,
        sessions,
    })
}

#[tauri::command]
fn claude_get_plugins() -> Result<PluginsResult, String> {
    let plugins_path = claude_dir().join("plugins").join("installed_plugins.json");

    let content = match fs::read_to_string(&plugins_path) {
        Ok(c) => c,
        Err(_) => return Ok(PluginsResult { plugins: vec![] }),
    };

    let json: serde_json::Value = match serde_json::from_str(&content) {
        Ok(v) => v,
        Err(_) => return Ok(PluginsResult { plugins: vec![] }),
    };

    let mut plugins = Vec::new();

    // Parse the nested structure: { "plugins": { "id@marketplace": [{ ... }] } }
    if let Some(plugins_obj) = json.get("plugins").and_then(|p| p.as_object()) {
        for (key, installations) in plugins_obj {
            // key is like "claude-hud@claude-hud" or "github@claude-plugins-official"
            let parts: Vec<&str> = key.split('@').collect();
            let name = parts.first().unwrap_or(&"").to_string();
            let marketplace = parts.get(1).unwrap_or(&"").to_string();

            // Get the first (most recent) installation
            if let Some(install) = installations.as_array().and_then(|arr| arr.first()) {
                plugins.push(ClaudePlugin {
                    id: key.clone(),
                    name,
                    marketplace,
                    version: install.get("version").and_then(|v| v.as_str()).unwrap_or("").to_string(),
                    install_path: install.get("installPath").and_then(|v| v.as_str()).unwrap_or("").to_string(),
                    installed_at: install.get("installedAt").and_then(|v| v.as_str()).unwrap_or("").to_string(),
                    last_updated: install.get("lastUpdated").and_then(|v| v.as_str()).unwrap_or("").to_string(),
                    scope: install.get("scope").and_then(|v| v.as_str()).unwrap_or("user").to_string(),
                });
            }
        }
    }

    // Sort by name
    plugins.sort_by(|a, b| a.name.cmp(&b.name));

    Ok(PluginsResult { plugins })
}

#[tauri::command]
fn claude_get_skills() -> Result<Vec<Skill>, String> {
    let skills_dir = claude_dir().join("skills");
    let mut results = Vec::new();

    if let Ok(entries) = fs::read_dir(&skills_dir) {
        for entry in entries.filter_map(|e| e.ok()) {
            let name = entry.file_name().to_string_lossy().to_string();
            if name.ends_with(".md") {
                results.push(Skill {
                    name: name.trim_end_matches(".md").to_string(),
                    is_system: false,
                });
            }
        }
    }

    results.sort_by(|a, b| a.name.cmp(&b.name));
    Ok(results)
}

#[tauri::command]
fn claude_get_skill(name: String) -> Result<SkillContent, String> {
    let skill_path = claude_dir().join("skills").join(format!("{}.md", name));
    let content = fs::read_to_string(&skill_path).map_err(|e| e.to_string())?;
    Ok(SkillContent { name, content })
}

#[tauri::command]
fn claude_save_skill(name: String, content: String) -> Result<bool, String> {
    let skill_path = claude_dir().join("skills").join(format!("{}.md", name));
    create_backup(&skill_path)?;
    fs::write(&skill_path, &content).map_err(|e| e.to_string())?;
    Ok(true)
}

#[tauri::command]
fn claude_create_skill(name: String, content: String) -> Result<bool, String> {
    let skills_dir = claude_dir().join("skills");
    fs::create_dir_all(&skills_dir).map_err(|e| e.to_string())?;
    let skill_path = skills_dir.join(format!("{}.md", name));
    if skill_path.exists() {
        return Err("Skill already exists".to_string());
    }
    fs::write(&skill_path, &content).map_err(|e| e.to_string())?;
    Ok(true)
}

#[tauri::command]
fn claude_delete_skill(name: String) -> Result<bool, String> {
    let skill_path = claude_dir().join("skills").join(format!("{}.md", name));
    create_backup(&skill_path)?;
    fs::remove_file(&skill_path).map_err(|e| e.to_string())?;
    Ok(true)
}

// ============================================================================
// Codex Commands
// ============================================================================

#[tauri::command]
fn codex_get_config() -> Result<ConfigResult, String> {
    let config_path = codex_dir().join("config.toml");
    let raw = fs::read_to_string(&config_path).map_err(|e| e.to_string())?;
    let config: serde_json::Value = toml::from_str(&raw)
        .map(|v: toml::Value| serde_json::to_value(v).unwrap_or(serde_json::json!({})))
        .unwrap_or(serde_json::json!({}));
    Ok(ConfigResult { config, raw })
}

#[tauri::command]
fn codex_save_config(content: String) -> Result<bool, String> {
    let config_path = codex_dir().join("config.toml");
    // Validate TOML
    toml::from_str::<toml::Value>(&content).map_err(|e| e.to_string())?;
    create_backup(&config_path)?;
    fs::write(&config_path, &content).map_err(|e| e.to_string())?;
    Ok(true)
}

#[tauri::command]
fn codex_get_skills() -> Result<Vec<Skill>, String> {
    let skills_dir = codex_dir().join("skills");
    let mut results = Vec::new();

    if let Ok(entries) = fs::read_dir(&skills_dir) {
        for entry in entries.filter_map(|e| e.ok()) {
            if entry.path().is_dir() {
                let name = entry.file_name().to_string_lossy().to_string();
                if name == ".system" {
                    // List system skills
                    if let Ok(sys_entries) = fs::read_dir(entry.path()) {
                        for sys_entry in sys_entries.filter_map(|e| e.ok()) {
                            if sys_entry.path().is_dir() {
                                results.push(Skill {
                                    name: format!(".system/{}", sys_entry.file_name().to_string_lossy()),
                                    is_system: true,
                                });
                            }
                        }
                    }
                } else {
                    results.push(Skill {
                        name,
                        is_system: false,
                    });
                }
            }
        }
    }

    Ok(results)
}

#[tauri::command]
fn codex_get_skill(name: String) -> Result<SkillContent, String> {
    let skill_path = codex_dir().join("skills").join(&name).join("SKILL.md");
    let content = fs::read_to_string(&skill_path).map_err(|e| e.to_string())?;
    Ok(SkillContent { name, content })
}

#[tauri::command]
fn codex_save_skill(name: String, content: String) -> Result<bool, String> {
    let skill_path = codex_dir().join("skills").join(&name).join("SKILL.md");
    create_backup(&skill_path)?;
    fs::write(&skill_path, &content).map_err(|e| e.to_string())?;
    Ok(true)
}

#[tauri::command]
fn codex_create_skill(name: String, content: String) -> Result<bool, String> {
    let skill_dir = codex_dir().join("skills").join(&name);
    fs::create_dir_all(&skill_dir).map_err(|e| e.to_string())?;
    let skill_path = skill_dir.join("SKILL.md");
    fs::write(&skill_path, &content).map_err(|e| e.to_string())?;
    Ok(true)
}

#[tauri::command]
fn codex_delete_skill(name: String) -> Result<bool, String> {
    let skill_dir = codex_dir().join("skills").join(&name);
    let skill_path = skill_dir.join("SKILL.md");
    create_backup(&skill_path)?;
    fs::remove_dir_all(&skill_dir).map_err(|e| e.to_string())?;
    Ok(true)
}

#[tauri::command]
fn codex_get_prompts() -> Result<Vec<Prompt>, String> {
    let prompts_dir = codex_dir().join("prompts");
    let mut results = Vec::new();

    if let Ok(entries) = fs::read_dir(&prompts_dir) {
        for entry in entries.filter_map(|e| e.ok()) {
            let name = entry.file_name().to_string_lossy().to_string();
            if name.ends_with(".md") {
                results.push(Prompt {
                    name: name.trim_end_matches(".md").to_string(),
                    path: name,
                });
            }
        }
    }

    Ok(results)
}

#[tauri::command]
fn codex_get_prompt(path: String) -> Result<PromptContent, String> {
    let file_path = codex_dir().join("prompts").join(&path);
    let content = fs::read_to_string(&file_path).map_err(|e| e.to_string())?;
    Ok(PromptContent { path, content })
}

#[tauri::command]
fn codex_save_prompt(path: String, content: String) -> Result<bool, String> {
    let file_path = codex_dir().join("prompts").join(&path);
    create_backup(&file_path)?;
    fs::write(&file_path, &content).map_err(|e| e.to_string())?;
    Ok(true)
}

#[tauri::command]
fn codex_create_prompt(path: String, content: String) -> Result<bool, String> {
    let prompts_dir = codex_dir().join("prompts");
    fs::create_dir_all(&prompts_dir).map_err(|e| e.to_string())?;
    let file_path = prompts_dir.join(&path);
    if file_path.exists() {
        return Err("Prompt already exists".to_string());
    }
    fs::write(&file_path, &content).map_err(|e| e.to_string())?;
    Ok(true)
}

#[tauri::command]
fn codex_delete_prompt(path: String) -> Result<bool, String> {
    let file_path = codex_dir().join("prompts").join(&path);
    create_backup(&file_path)?;
    fs::remove_file(&file_path).map_err(|e| e.to_string())?;
    Ok(true)
}

#[tauri::command]
fn codex_get_history(
    limit: Option<usize>,
    offset: Option<usize>,
    search: Option<String>,
    session_id: Option<String>,
) -> Result<HistoryResult, String> {
    let history_path = codex_dir().join("history.jsonl");
    let content = fs::read_to_string(&history_path).unwrap_or_default();
    let lines: Vec<&str> = content.lines().filter(|l| !l.is_empty()).collect();

    let limit = limit.unwrap_or(50);
    let offset = offset.unwrap_or(0);

    let mut entries: Vec<HistoryEntry> = lines
        .iter()
        .enumerate()
        .filter_map(|(idx, line)| {
            serde_json::from_str::<serde_json::Value>(line).ok().map(|v| HistoryEntry {
                id: idx,
                text: v["text"].as_str().unwrap_or("").to_string(),
                timestamp: v["ts"].as_i64().unwrap_or(0) * 1000, // Convert to ms
                session_id: v["session_id"].as_str().unwrap_or("").to_string(),
                project: None,
            })
        })
        .collect();

    entries.reverse();

    if let Some(ref s) = search {
        let s_lower = s.to_lowercase();
        entries.retain(|e| e.text.to_lowercase().contains(&s_lower));
    }

    if let Some(ref sid) = session_id {
        entries.retain(|e| &e.session_id == sid);
    }

    let total = entries.len();
    let paginated: Vec<_> = entries.into_iter().skip(offset).take(limit).collect();

    let sessions: Vec<String> = lines
        .iter()
        .filter_map(|line| {
            serde_json::from_str::<serde_json::Value>(line)
                .ok()
                .and_then(|v| v["session_id"].as_str().map(|s| s.to_string()))
        })
        .collect::<std::collections::HashSet<_>>()
        .into_iter()
        .collect();

    Ok(HistoryResult {
        entries: paginated,
        total,
        limit,
        offset,
        sessions,
    })
}

// ============================================================================
// Gemini Commands
// ============================================================================

#[tauri::command]
fn gemini_get_settings() -> Result<ConfigResult, String> {
    let settings_path = gemini_dir().join("settings.json");
    let raw = fs::read_to_string(&settings_path).map_err(|e| e.to_string())?;
    let config = serde_json::from_str(&raw).unwrap_or(serde_json::json!({}));
    Ok(ConfigResult { config, raw })
}

#[tauri::command]
fn gemini_save_settings(content: String) -> Result<bool, String> {
    let settings_path = gemini_dir().join("settings.json");
    serde_json::from_str::<serde_json::Value>(&content).map_err(|e| e.to_string())?;
    create_backup(&settings_path)?;
    fs::write(&settings_path, &content).map_err(|e| e.to_string())?;
    Ok(true)
}

#[tauri::command]
fn gemini_get_extensions() -> Result<Vec<Extension>, String> {
    let ext_dir = gemini_dir().join("extensions");
    let enablement_path = ext_dir.join("extension-enablement.json");

    let enablement: std::collections::HashMap<String, bool> =
        fs::read_to_string(&enablement_path)
            .ok()
            .and_then(|s| serde_json::from_str(&s).ok())
            .unwrap_or_default();

    let mut results = Vec::new();

    if let Ok(entries) = fs::read_dir(&ext_dir) {
        for entry in entries.filter_map(|e| e.ok()) {
            if entry.path().is_dir() {
                let name = entry.file_name().to_string_lossy().to_string();

                // Try to read manifest for overrides
                let manifest_path = entry.path().join("manifest.json");
                let overrides: Option<Vec<String>> = fs::read_to_string(&manifest_path)
                    .ok()
                    .and_then(|s| serde_json::from_str::<serde_json::Value>(&s).ok())
                    .and_then(|v| {
                        v.get("overrides")
                            .and_then(|o| o.as_array())
                            .map(|arr| {
                                arr.iter()
                                    .filter_map(|v| v.as_str().map(|s| s.to_string()))
                                    .collect()
                            })
                    });

                results.push(Extension {
                    name: name.clone(),
                    enabled: *enablement.get(&name).unwrap_or(&false),
                    overrides,
                });
            }
        }
    }

    Ok(results)
}

#[tauri::command]
fn gemini_toggle_extension(name: String, enabled: bool) -> Result<bool, String> {
    let ext_dir = gemini_dir().join("extensions");
    let enablement_path = ext_dir.join("extension-enablement.json");

    // Read current state
    let mut enablement: std::collections::HashMap<String, bool> =
        fs::read_to_string(&enablement_path)
            .ok()
            .and_then(|s| serde_json::from_str(&s).ok())
            .unwrap_or_default();

    // Update the extension state
    enablement.insert(name, enabled);

    // Write back
    create_backup(&enablement_path)?;
    let json = serde_json::to_string_pretty(&enablement).map_err(|e| e.to_string())?;
    fs::write(&enablement_path, &json).map_err(|e| e.to_string())?;

    Ok(true)
}

#[tauri::command]
fn gemini_get_sessions() -> Result<Vec<GeminiSession>, String> {
    let tmp_dir = gemini_dir().join("tmp");
    let mut sessions = Vec::new();

    if let Ok(projects) = fs::read_dir(&tmp_dir) {
        for project in projects.filter_map(|e| e.ok()) {
            if project.path().is_dir() {
                let project_hash = project.file_name().to_string_lossy().to_string();
                let chats_dir = project.path().join("chats");

                if let Ok(chats) = fs::read_dir(&chats_dir) {
                    for chat in chats.filter_map(|e| e.ok()) {
                        let name = chat.file_name().to_string_lossy().to_string();
                        if name.ends_with(".json") {
                            let session_id = name.trim_end_matches(".json").to_string();

                            // Parse timestamp from filename
                            let timestamp = parse_gemini_session_timestamp(&session_id);

                            sessions.push(GeminiSession {
                                project_hash: project_hash.clone(),
                                session_id,
                                timestamp,
                            });
                        }
                    }
                }
            }
        }
    }

    sessions.sort_by(|a, b| b.timestamp.cmp(&a.timestamp));
    Ok(sessions)
}

fn parse_gemini_session_timestamp(session_id: &str) -> i64 {
    // session-2026-01-08T20-46-3ba7254a
    if let Some(caps) = session_id
        .strip_prefix("session-")
        .and_then(|s| s.get(..16))
    {
        // 2026-01-08T20-46
        let formatted = caps.replace("T", " ").replace("-", ":");
        // Try to parse as date
        if let Ok(dt) = chrono::NaiveDateTime::parse_from_str(
            &format!("{}:00", formatted.replace(" ", "T").replace(":", "-").get(..10).unwrap_or("")),
            "%Y-%m-%dT%H:%M:%S",
        ) {
            return dt.and_utc().timestamp_millis();
        }
    }
    0
}

#[tauri::command]
fn gemini_get_session(project_hash: String, session_id: String) -> Result<GeminiSessionDetail, String> {
    let session_path = gemini_dir()
        .join("tmp")
        .join(&project_hash)
        .join("chats")
        .join(format!("{}.json", session_id));

    let content = fs::read_to_string(&session_path).map_err(|e| e.to_string())?;
    let session = serde_json::from_str(&content).unwrap_or(serde_json::json!({}));

    Ok(GeminiSessionDetail {
        project_hash,
        session_id,
        session,
    })
}

// ============================================================================
// App Entry
// ============================================================================

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Claude
            claude_get_settings,
            claude_save_settings,
            claude_get_commands,
            claude_get_command,
            claude_save_command,
            claude_create_command,
            claude_delete_command,
            claude_get_history,
            claude_get_plugins,
            claude_get_skills,
            claude_get_skill,
            claude_save_skill,
            claude_create_skill,
            claude_delete_skill,
            // Codex
            codex_get_config,
            codex_save_config,
            codex_get_skills,
            codex_get_skill,
            codex_save_skill,
            codex_create_skill,
            codex_delete_skill,
            codex_get_prompts,
            codex_get_prompt,
            codex_save_prompt,
            codex_create_prompt,
            codex_delete_prompt,
            codex_get_history,
            // Gemini
            gemini_get_settings,
            gemini_save_settings,
            gemini_get_extensions,
            gemini_toggle_extension,
            gemini_get_sessions,
            gemini_get_session,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
