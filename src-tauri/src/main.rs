#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod notifications;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .invoke_handler(tauri::generate_handler![
            notifications::set_notification_deadline
        ])
        .setup(|app| {
            notifications::initialize(app)?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("failed to run Pomintosh");
}
