use tauri::State;
use crate::db::Database;
use crate::models::{FavoriteItem, TagItem};

#[tauri::command]
pub fn get_setting(db: State<'_, Database>, key: String) -> Result<Option<String>, String> {
    db.get_setting(&key).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn set_setting(db: State<'_, Database>, key: String, value: String) -> Result<(), String> {
    db.set_setting(&key, &value).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_favorites(db: State<'_, Database>) -> Result<Vec<FavoriteItem>, String> {
    db.get_favorites().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn add_favorite(db: State<'_, Database>, path: String, label: String) -> Result<(), String> {
    db.add_favorite(&path, &label).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn remove_favorite(db: State<'_, Database>, id: String) -> Result<(), String> {
    db.remove_favorite(&id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_tags(db: State<'_, Database>) -> Result<Vec<TagItem>, String> {
    db.get_tags().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn set_file_tag(db: State<'_, Database>, path: String, tag_id: String) -> Result<(), String> {
    db.set_file_tag(&path, &tag_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn remove_file_tag(db: State<'_, Database>, path: String, tag_id: String) -> Result<(), String> {
    db.remove_file_tag(&path, &tag_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_file_tags(db: State<'_, Database>, path: String) -> Result<Vec<TagItem>, String> {
    db.get_file_tags(&path).map_err(|e| e.to_string())
}
