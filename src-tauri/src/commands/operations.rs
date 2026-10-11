use std::fs;
use std::path::Path;
use tauri::State;
use crate::db::Database;
use crate::models::OperationResult;

#[tauri::command]
pub fn safe_delete(path: String, permanent: bool) -> Result<OperationResult, String> {
    let target = Path::new(&path);
    if !target.exists() {
        return Err(format!("The item no longer exists: {}", path));
    }

    if permanent {
        if target.is_dir() {
            fs::remove_dir_all(target).map_err(|e| format!("Failed to delete folder: {}", e))?;
        } else {
            fs::remove_file(target).map_err(|e| format!("Failed to delete file: {}", e))?;
        }
        Ok(OperationResult {
            success: true,
            message: "Permanently deleted item".to_string(),
            affected_paths: vec![path],
        })
    } else {
        // Send to native Windows Recycle Bin using `trash`
        trash::delete(target).map_err(|e| {
            format!(
                "Could not send to Recycle Bin: {}. (If this is a removable USB drive, permanent deletion may be required)",
                e
            )
        })?;

        Ok(OperationResult {
            success: true,
            message: "Moved to Recycle Bin".to_string(),
            affected_paths: vec![path],
        })
    }
}

#[tauri::command]
pub fn rename_file(
    db: State<'_, Database>,
    old_path: String,
    new_name: String,
) -> Result<OperationResult, String> {
    let source = Path::new(&old_path);
    if !source.exists() {
        return Err("Source file does not exist".to_string());
    }

    let clean_name = new_name.trim();
    if clean_name.is_empty() {
        return Err("New name cannot be empty".to_string());
    }
    if clean_name.contains(['\\', '/', ':', '*', '?', '"', '<', '>', '|']) {
        return Err("Name contains invalid Windows characters".to_string());
    }

    let parent = source.parent().ok_or("Cannot determine parent folder")?;
    let target = parent.join(clean_name);

    if target.exists() && target != source {
        return Err(format!("An item named '{}' already exists in this folder", clean_name));
    }

    fs::rename(source, &target).map_err(|e| format!("Rename failed: {}", e))?;

    let target_str = target.to_string_lossy().to_string();
    db.log_operation("rename", &old_path, &target_str).ok();

    Ok(OperationResult {
        success: true,
        message: format!("Renamed to {}", clean_name),
        affected_paths: vec![target_str],
    })
}

#[tauri::command]
pub fn copy_item(
    db: State<'_, Database>,
    source: String,
    destination_dir: String,
    overwrite: bool,
    new_name: Option<String>,
) -> Result<OperationResult, String> {
    let src = Path::new(&source);
    if !src.exists() {
        return Err("Source file or folder not found".to_string());
    }

    let dest_dir = Path::new(&destination_dir);
    if !dest_dir.is_dir() {
        return Err("Destination is not a folder".to_string());
    }

    let file_name = match new_name {
        Some(name) => name,
        None => src.file_name().ok_or("Invalid file name")?.to_string_lossy().to_string(),
    };

    let target = dest_dir.join(&file_name);

    if target.exists() && !overwrite {
        return Err("Destination file already exists".to_string());
    }

    if src.is_dir() {
        copy_dir_recursive(src, &target).map_err(|e| format!("Copy directory failed: {}", e))?;
    } else {
        fs::copy(src, &target).map_err(|e| format!("Copy file failed: {}", e))?;
    }

    let target_str = target.to_string_lossy().to_string();
    db.log_operation("copy", &source, &target_str).ok();

    Ok(OperationResult {
        success: true,
        message: "Successfully copied".to_string(),
        affected_paths: vec![target_str],
    })
}

#[tauri::command]
pub fn move_item(
    db: State<'_, Database>,
    source: String,
    destination_dir: String,
    overwrite: bool,
    new_name: Option<String>,
) -> Result<OperationResult, String> {
    let src = Path::new(&source);
    if !src.exists() {
        return Err("Source file or folder not found".to_string());
    }

    let dest_dir = Path::new(&destination_dir);
    if !dest_dir.is_dir() {
        return Err("Destination is not a folder".to_string());
    }

    let file_name = match new_name {
        Some(name) => name,
        None => src.file_name().ok_or("Invalid file name")?.to_string_lossy().to_string(),
    };

    let target = dest_dir.join(&file_name);

    if target.exists() && !overwrite {
        return Err("Destination file already exists".to_string());
    }

    // Try fs::rename first (atomic on same drive). If across volumes, fallback to copy + delete.
    if fs::rename(src, &target).is_err() {
        if src.is_dir() {
            copy_dir_recursive(src, &target).map_err(|e| format!("Move failed: {}", e))?;
            fs::remove_dir_all(src).map_err(|e| format!("Cleanup failed: {}", e))?;
        } else {
            fs::copy(src, &target).map_err(|e| format!("Move failed: {}", e))?;
            fs::remove_file(src).map_err(|e| format!("Cleanup failed: {}", e))?;
        }
    }

    let target_str = target.to_string_lossy().to_string();
    db.log_operation("move", &source, &target_str).ok();

    Ok(OperationResult {
        success: true,
        message: "Successfully moved".to_string(),
        affected_paths: vec![target_str],
    })
}

#[tauri::command]
pub fn undo_last_operation(db: State<'_, Database>) -> Result<OperationResult, String> {
    let last_op = db.get_last_undoable_operation().map_err(|e| e.to_string())?;

    match last_op {
        Some((op_id, op_type, source, target)) => {
            let src = Path::new(&source);
            let tgt = Path::new(&target);

            match op_type.as_str() {
                "rename" => {
                    if !tgt.exists() {
                        return Err("Cannot undo: renamed file was deleted or moved".to_string());
                    }
                    fs::rename(tgt, src).map_err(|e| format!("Undo rename failed: {}", e))?;
                    db.mark_operation_undone(&op_id).ok();
                    Ok(OperationResult {
                        success: true,
                        message: format!("Undid rename. Restored {}", source),
                        affected_paths: vec![source],
                    })
                }
                "move" => {
                    if !tgt.exists() {
                        return Err("Cannot undo: moved file no longer exists".to_string());
                    }
                    if fs::rename(tgt, src).is_err() {
                        if tgt.is_dir() {
                            copy_dir_recursive(tgt, src).map_err(|e| format!("Undo move failed: {}", e))?;
                            fs::remove_dir_all(tgt).ok();
                        } else {
                            fs::copy(tgt, src).map_err(|e| format!("Undo move failed: {}", e))?;
                            fs::remove_file(tgt).ok();
                        }
                    }
                    db.mark_operation_undone(&op_id).ok();
                    Ok(OperationResult {
                        success: true,
                        message: format!("Undid move. Returned to original location"),
                        affected_paths: vec![source],
                    })
                }
                "copy" => {
                    if tgt.exists() {
                        if tgt.is_dir() {
                            fs::remove_dir_all(tgt).map_err(|e| format!("Undo copy failed: {}", e))?;
                        } else {
                            fs::remove_file(tgt).map_err(|e| format!("Undo copy failed: {}", e))?;
                        }
                    }
                    db.mark_operation_undone(&op_id).ok();
                    Ok(OperationResult {
                        success: true,
                        message: "Undid copy. Removed copied file".to_string(),
                        affected_paths: vec![target],
                    })
                }
                _ => Err("Operation type cannot be undone".to_string()),
            }
        }
        None => Err("No recent file actions available to undo".to_string()),
    }
}

fn copy_dir_recursive(src: &Path, dst: &Path) -> std::io::Result<()> {
    fs::create_dir_all(dst)?;
    for entry in fs::read_dir(src)? {
        let entry = entry?;
        let entry_type = entry.file_type()?;
        let dest_child = dst.join(entry.file_name());
        if entry_type.is_dir() {
            copy_dir_recursive(&entry.path(), &dest_child)?;
        } else {
            fs::copy(entry.path(), dest_child)?;
        }
    }
    Ok(())
}
