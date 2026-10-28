mod library;
mod paths;
mod proc;
mod tools;
mod ytdlp;

use serde_json::Value;
use tauri::AppHandle;

#[tauri::command]
async fn engine_status(app: AppHandle) -> tools::EngineStatus {
    tools::status(&app).await
}

#[tauri::command]
async fn engine_install(app: AppHandle, tool: String) -> Result<(), String> {
    tools::install(&app, &tool).await
}

#[tauri::command]
async fn engine_update_ytdlp(app: AppHandle) -> Result<String, String> {
    tools::update_ytdlp(&app).await
}

#[tauri::command]
async fn resolve_stream(app: AppHandle, req: ytdlp::SourceRequest) -> Result<ytdlp::ResolvedStream, String> {
    ytdlp::resolve_stream(&app, req).await
}

#[tauri::command]
async fn cache_track(app: AppHandle, id: String, req: ytdlp::SourceRequest) -> Result<String, String> {
    ytdlp::cache_track(&app, &id, req).await
}

#[tauri::command]
async fn download_track(app: AppHandle, req: ytdlp::DownloadRequest) -> Result<ytdlp::Downloaded, String> {
    ytdlp::download_track(&app, req).await
}

#[tauri::command]
fn cancel_download(app: AppHandle, id: String) {
    ytdlp::cancel(&app, &id);
}

#[tauri::command]
async fn library_read(app: AppHandle) -> Result<Option<Value>, String> {
    library::read(&app).await
}

#[tauri::command]
async fn library_write(app: AppHandle, tracks: Value) -> Result<(), String> {
    library::write(&app, tracks).await
}

#[tauri::command]
async fn delete_file(path: String) -> Result<(), String> {
    library::delete_audio(&path).await
}

#[tauri::command]
fn file_exists(path: String) -> bool {
    std::path::Path::new(&path).is_file()
}

/// Opens a folder in the file manager, creating it first (the music folder
/// doesn't exist until the first download).
#[tauri::command]
fn open_folder(path: String) -> Result<(), String> {
    std::fs::create_dir_all(&path).map_err(|e| e.to_string())?;
    tauri_plugin_opener::open_path(&path, None::<&str>).map_err(|e| e.to_string())
}

#[tauri::command]
fn reveal_file(path: String) -> Result<(), String> {
    tauri_plugin_opener::reveal_item_in_dir(&path).map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            use tauri::Manager;
            if let Some(w) = app.get_webview_window("main") {
                let _ = w.unminimize();
                let _ = w.set_focus();
            }
        }))
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_http::init())
        .manage(ytdlp::Jobs::default())
        .setup(|app| {
            let handle = app.handle().clone();
            library::allow_known_dirs(&handle);
            // Leftovers from downloads interrupted by quitting.
            let _ = std::fs::remove_dir_all(paths::work_dir(&handle));
            tauri::async_runtime::spawn(tools::auto_update(handle));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            engine_status,
            engine_install,
            engine_update_ytdlp,
            resolve_stream,
            cache_track,
            download_track,
            cancel_download,
            library_read,
            library_write,
            delete_file,
            file_exists,
            open_folder,
            reveal_file,
        ])
        .run(tauri::generate_context!())
        .expect("error while running EXØS");
}
