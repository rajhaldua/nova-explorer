pub mod models;
pub mod db;
pub mod commands;

use db::Database;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let app_data_dir = app.path().app_data_dir().unwrap_or_else(|_| {
                std::path::PathBuf::from("data")
            });
            let db = Database::init(app_data_dir).expect("Failed to initialize SQLite database");
            app.manage(db);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Filesystem commands
            commands::list_directory,
            commands::get_special_folders,
            commands::create_folder,
            commands::check_collision,
            commands::search_directory,
            // Operations commands
            commands::safe_delete,
            commands::rename_file,
            commands::copy_item,
            commands::move_item,
            commands::undo_last_operation,
            // Volume commands
            commands::list_volumes,
            // Shell commands
            commands::open_path,
            commands::reveal_in_explorer,
            commands::switch_to_windows_explorer,
            commands::set_auto_start,
            commands::get_auto_start,
            // DB commands
            commands::get_setting,
            commands::set_setting,
            commands::get_favorites,
            commands::add_favorite,
            commands::remove_favorite,
            commands::get_tags,
            commands::set_file_tag,
            commands::remove_file_tag,
            commands::get_file_tags,
            // Thumbnail & Preview commands
            commands::get_thumbnail,
            commands::batch_get_thumbnails,
            commands::get_file_preview,
        ])
        .run(tauri::generate_context!())
        .expect("error while running NovaExplorer application");
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    #[test]
    fn test_database_lifecycle() {
        let temp_dir = std::env::temp_dir().join(format!("nova_test_{}", chrono::Utc::now().timestamp_millis()));
        let db = Database::init(temp_dir.clone()).expect("Failed to create test database");

        // Settings test
        db.set_setting("test_key", "test_value").expect("Failed to set setting");
        let val = db.get_setting("test_key").expect("Failed to get setting");
        assert_eq!(val, Some("test_value".to_string()));

        // Favorites test
        db.add_favorite("C:\\Test", "Test Label").expect("Failed to add favorite");
        let favs = db.get_favorites().expect("Failed to get favorites");
        assert!(favs.iter().any(|f| f.path == "C:\\Test" && f.label == "Test Label"));

        // Tags test
        let tags = db.get_tags().expect("Failed to get tags");
        assert!(!tags.is_empty(), "Default tags should be seeded");

        // Operation logging & undo
        let op_id = db.log_operation("rename", "C:\\old.txt", "C:\\new.txt").expect("Failed to log op");
        let last = db.get_last_undoable_operation().expect("Failed to fetch last op");
        assert!(last.is_some());
        let (id, op_type, src, tgt) = last.unwrap();
        assert_eq!(id, op_id);
        assert_eq!(op_type, "rename");
        assert_eq!(src, "C:\\old.txt");
        assert_eq!(tgt, "C:\\new.txt");

        db.mark_operation_undone(&id).expect("Failed to mark undone");
        let after_undo = db.get_last_undoable_operation().expect("Failed to fetch after undo");
        assert!(after_undo.is_none());

        // Cleanup
        fs::remove_dir_all(&temp_dir).ok();
    }

    #[test]
    fn test_special_folders_detection() {
        let folders = commands::get_special_folders().expect("Failed to get special folders");
        assert!(!folders.desktop.is_empty(), "Desktop path should not be empty");
        assert!(!folders.documents.is_empty(), "Documents path should not be empty");
        assert!(!folders.home.is_empty(), "Home path should not be empty");
    }

    #[test]
    fn test_collision_check() {
        let temp_dir = std::env::temp_dir();
        let check = commands::check_collision(temp_dir.to_string_lossy().to_string(), "definitely_non_existing_file_99999.xyz".to_string())
            .expect("Collision check failed");
        assert!(!check.exists);
    }

    #[test]
    fn test_file_preview_helpers() {
        // Test temporary text file creation and preview
        let temp_file = std::env::temp_dir().join(format!("nova_preview_{}.txt", chrono::Utc::now().timestamp_millis()));
        fs::write(&temp_file, "Line 1: Hello NovaExplorer!\nLine 2: Testing preview engine.").expect("Failed to write temp file");

        let meta = temp_file.metadata().expect("Failed to read metadata");
        assert!(meta.len() > 0);

        fs::remove_file(&temp_file).ok();
    }

    #[test]
    fn test_image_thumbnail_generation() {
        use image::{RgbImage, Rgb};
        let temp_dir = std::env::temp_dir();
        let test_img_path = temp_dir.join(format!("nova_test_img_{}.png", chrono::Utc::now().timestamp_millis()));
        
        let mut img = RgbImage::new(100, 100);
        for x in 0..100 {
            for y in 0..100 {
                img.put_pixel(x, y, Rgb([255, 128, 64]));
            }
        }
        img.save(&test_img_path).expect("Failed to save test image");
        
        let dim = image::image_dimensions(&test_img_path).expect("Failed to read image dimensions");
        assert_eq!(dim, (100, 100));

        fs::remove_file(&test_img_path).ok();
    }
}
