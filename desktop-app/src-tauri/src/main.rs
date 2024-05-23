use std::fs;
use std::sync::mpsc::channel;
use notify::{RecommendedWatcher, Watcher, Config, RecursiveMode, EventKind};
use std::path::Path;
use tauri::Manager;

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let handle = app.handle();
            std::thread::spawn(move || {
                let (tx, rx) = channel();
                let mut watcher: RecommendedWatcher = Watcher::new(tx, Config::default()).unwrap();
                watcher.watch(Path::new("/Users/benjaminshafii/Desktop/new"), RecursiveMode::Recursive).unwrap();

                loop {
                    match rx.recv() {
                        Ok(event) => match event.as_ref().unwrap().kind {
                            EventKind::Create(_) => {
                                if let Some(path) = event.unwrap().paths.first() {
                                    let file_path = path.to_str().unwrap();

                                    // Read the file content
                                    match fs::read(path) {
                                        Ok(content) => {
                                            // Encode the content to base64 to safely send binary data
                                            let base64_content = base64::encode(&content);

                                            // Create a payload with both file path and content
                                            let payload = serde_json::json!({
                                                "file_path": file_path,
                                                "content": base64_content
                                            });

                                            // Emit the payload to the frontend
                                            handle.emit_all("file-added", payload).unwrap();
                                        }
                                        Err(e) => println!("Error reading file: {:?}", e),
                                    }
                                }
                            }
                            _ => {}
                        },
                        Err(e) => println!("watch error: {:?}", e),
                    }
                }
            });
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
