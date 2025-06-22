// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::sync::{Arc, Mutex};
use tauri::{CustomMenuItem, SystemTray, SystemTrayEvent, SystemTrayMenu, Manager, State};
use tokio::time::{sleep, Duration};

mod colonel;
use colonel::ColonelManager;

// Application state
#[derive(Default)]
struct AppState {
    colonel_manager: Arc<Mutex<ColonelManager>>,
}

// Tauri commands
#[tauri::command]
async fn start_colonel(state: State<'_, AppState>) -> Result<String, String> {
    let manager = state.colonel_manager.clone();
    
    tokio::task::spawn_blocking(move || {
        let mut manager_guard = manager.lock().map_err(|e| format!("Lock error: {}", e))?;
        tokio::runtime::Handle::current().block_on(async {
            manager_guard.start().await.map_err(|e| format!("Failed to start The_Colonel: {}", e))
        })
    }).await.map_err(|e| format!("Task join error: {}", e))??;
    
    Ok("The_Colonel started successfully".to_string())
}

#[tauri::command]
async fn stop_colonel(state: State<'_, AppState>) -> Result<String, String> {
    let manager = state.colonel_manager.clone();
    
    tokio::task::spawn_blocking(move || {
        let mut manager_guard = manager.lock().map_err(|e| format!("Lock error: {}", e))?;
        tokio::runtime::Handle::current().block_on(async {
            manager_guard.stop().await.map_err(|e| format!("Failed to stop The_Colonel: {}", e))
        })
    }).await.map_err(|e| format!("Task join error: {}", e))??;
    
    Ok("The_Colonel stopped successfully".to_string())
}

#[tauri::command]
async fn get_colonel_status(state: State<'_, AppState>) -> Result<bool, String> {
    let manager = state.colonel_manager.clone();
    let mut manager_guard = manager.lock().map_err(|e| format!("Lock error: {}", e))?;
    
    Ok(manager_guard.is_running())
}

#[tauri::command]
async fn test_colonel_connection() -> Result<bool, String> {
    match reqwest::get("http://localhost:8264/v1/models").await {
        Ok(response) => Ok(response.status().is_success()),
        Err(_) => Ok(false),
    }
}

fn main() {
    // Create system tray
    let tray_menu = SystemTrayMenu::new()
        .add_item(CustomMenuItem::new("show".to_string(), "Show Window"))
        .add_item(CustomMenuItem::new("hide".to_string(), "Hide Window"))
        .add_native_item(tauri::SystemTrayMenuItem::Separator)
        .add_item(CustomMenuItem::new("start_colonel".to_string(), "Start The_Colonel"))
        .add_item(CustomMenuItem::new("stop_colonel".to_string(), "Stop The_Colonel"))
        .add_native_item(tauri::SystemTrayMenuItem::Separator)
        .add_item(CustomMenuItem::new("quit".to_string(), "Quit"));

    let system_tray = SystemTray::new().with_menu(tray_menu);

    tauri::Builder::default()
        .manage(AppState::default())
        .system_tray(system_tray)
        .on_system_tray_event(|app, event| match event {
            SystemTrayEvent::LeftClick {
                position: _,
                size: _,
                ..
            } => {
                if let Some(window) = app.get_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
            SystemTrayEvent::MenuItemClick { id, .. } => match id.as_str() {
                "show" => {
                    if let Some(window) = app.get_window("main") {
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                }
                "hide" => {
                    if let Some(window) = app.get_window("main") {
                        let _ = window.hide();
                    }
                }
                "start_colonel" => {
                    let app_handle = app.app_handle();
                    tauri::async_runtime::spawn(async move {
                        let state: State<AppState> = app_handle.state();
                        let _ = start_colonel(state).await;
                    });
                }
                "stop_colonel" => {
                    let app_handle = app.app_handle();
                    tauri::async_runtime::spawn(async move {
                        let state: State<AppState> = app_handle.state();
                        let _ = stop_colonel(state).await;
                    });
                }
                "quit" => {
                    let app_handle = app.app_handle();
                    tauri::async_runtime::spawn(async move {
                        let state: State<AppState> = app_handle.state();
                        let _ = stop_colonel(state).await;
                        app_handle.exit(0);
                    });
                }
                _ => {}
            },
            _ => {}
        })
        .on_window_event(|event| match event.event() {
            tauri::WindowEvent::CloseRequested { api, .. } => {
                // Hide window instead of closing when clicking X
                event.window().hide().unwrap();
                api.prevent_close();
            }
            _ => {}
        })
        .setup(|app| {
            // Auto-start The_Colonel when app starts
            let app_handle = app.handle();
            tauri::async_runtime::spawn(async move {
                // Wait a moment for the app to fully initialize
                sleep(Duration::from_secs(2)).await;
                
                let state: State<AppState> = app_handle.state();
                match start_colonel(state).await {
                    Ok(msg) => println!("Auto-start success: {}", msg),
                    Err(err) => println!("Auto-start failed: {}", err),
                }
            });
            
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            start_colonel,
            stop_colonel, 
            get_colonel_status,
            test_colonel_connection
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}