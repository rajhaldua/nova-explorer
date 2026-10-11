use std::fs;
use std::path::{Path, PathBuf};
use std::time::UNIX_EPOCH;
use crate::models::{ConflictCheck, FileEntry, SpecialFolders};

#[tauri::command]
pub fn list_directory(path: String, show_hidden: bool) -> Result<Vec<FileEntry>, String> {
    let target_path = Path::new(&path);
    if !target_path.exists() {
        return Err(format!("The path does not exist: {}", path));
    }
    if !target_path.is_dir() {
        return Err(format!("The specified path is not a folder: {}", path));
    }

    let entries = fs::read_dir(target_path).map_err(|e| format!("Unable to open folder: {}", e))?;
    let mut result = Vec::new();

    for entry in entries.flatten() {
        let file_path = entry.path();
        let file_name = entry.file_name().to_string_lossy().to_string();

        // Check hidden file attribute
        let is_hidden = is_path_hidden(&file_name, &file_path);
        if is_hidden && !show_hidden {
            continue;
        }

        let metadata = entry.metadata().ok();
        let is_dir = metadata.as_ref().map(|m| m.is_dir()).unwrap_or(false);
        let is_symlink = metadata.as_ref().map(|m| m.is_symlink()).unwrap_or(false);
        let is_readonly = metadata.as_ref().map(|m| m.permissions().readonly()).unwrap_or(false);
        let size = metadata.as_ref().map(|m| m.len()).unwrap_or(0);

        let modified = metadata.as_ref().and_then(|m| {
            m.modified().ok().and_then(|t| t.duration_since(UNIX_EPOCH).ok().map(|d| d.as_secs() as i64))
        });

        let created = metadata.as_ref().and_then(|m| {
            m.created().ok().and_then(|t| t.duration_since(UNIX_EPOCH).ok().map(|d| d.as_secs() as i64))
        });

        let extension = if is_dir {
            String::new()
        } else {
            file_path.extension().map(|e| e.to_string_lossy().to_lowercase()).unwrap_or_default()
        };

        result.push(FileEntry {
            name: file_name,
            path: file_path.to_string_lossy().to_string(),
            is_dir,
            is_symlink,
            is_hidden,
            is_readonly,
            size,
            modified,
            created,
            extension,
        });
    }

    // Sort: Folders first alphabetically, then files alphabetically
    result.sort_by(|a, b| {
        match (a.is_dir, b.is_dir) {
            (true, false) => std::cmp::Ordering::Less,
            (false, true) => std::cmp::Ordering::Greater,
            _ => a.name.to_lowercase().cmp(&b.name.to_lowercase()),
        }
    });

    Ok(result)
}

#[tauri::command]
pub fn get_special_folders() -> Result<SpecialFolders, String> {
    let home = std::env::var("USERPROFILE")
        .or_else(|_| std::env::var("HOME"))
        .unwrap_or_else(|_| "C:\\".to_string());
    let home_path = PathBuf::from(&home);
    let onedrive_path = home_path.join("OneDrive");

    let resolve_folder = |name: &str| -> String {
        let direct = home_path.join(name);
        if direct.exists() {
            return direct.to_string_lossy().to_string();
        }
        let onedrive = onedrive_path.join(name);
        if onedrive.exists() {
            return onedrive.to_string_lossy().to_string();
        }
        // Auto-create or fallback to direct
        fs::create_dir_all(&direct).ok();
        direct.to_string_lossy().to_string()
    };

    let desktop = resolve_folder("Desktop");
    let documents = resolve_folder("Documents");
    let downloads = resolve_folder("Downloads");
    let pictures = resolve_folder("Pictures");
    let music = resolve_folder("Music");
    let videos = resolve_folder("Videos");

    Ok(SpecialFolders {
        desktop,
        documents,
        downloads,
        pictures,
        music,
        videos,
        home,
    })
}

#[tauri::command]
pub fn create_folder(parent: String, name: String) -> Result<String, String> {
    let clean_name = name.trim();
    if clean_name.is_empty() {
        return Err("Folder name cannot be empty".to_string());
    }
    if clean_name.contains(['\\', '/', ':', '*', '?', '"', '<', '>', '|']) {
        return Err("Folder name contains invalid characters".to_string());
    }

    let parent_path = Path::new(&parent);
    let new_path = parent_path.join(clean_name);

    if new_path.exists() {
        return Err(format!("A folder or file named '{}' already exists", clean_name));
    }

    fs::create_dir(&new_path).map_err(|e| format!("Failed to create folder: {}", e))?;
    Ok(new_path.to_string_lossy().to_string())
}

#[tauri::command]
pub fn check_collision(target_dir: String, name: String) -> Result<ConflictCheck, String> {
    let target_path = Path::new(&target_dir).join(&name);
    if !target_path.exists() {
        return Ok(ConflictCheck {
            exists: false,
            target_name: name,
            target_path: target_path.to_string_lossy().to_string(),
            is_dir: false,
            size: 0,
            modified: None,
        });
    }

    let metadata = target_path.metadata().map_err(|e| e.to_string())?;
    let is_dir = metadata.is_dir();
    let size = metadata.len();
    let modified = metadata.modified().ok().and_then(|t| t.duration_since(UNIX_EPOCH).ok().map(|d| d.as_secs() as i64));

    Ok(ConflictCheck {
        exists: true,
        target_name: name,
        target_path: target_path.to_string_lossy().to_string(),
        is_dir,
        size,
        modified,
    })
}

#[tauri::command]
pub fn search_directory(root_path: String, query: String, max_results: usize) -> Result<Vec<FileEntry>, String> {
    let target = Path::new(&root_path);
    if !target.exists() || !target.is_dir() {
        return Err("Invalid search directory".to_string());
    }

    let query_lower = query.trim().to_lowercase();
    if query_lower.is_empty() {
        return Ok(Vec::new());
    }

    let limit = if max_results == 0 { 100 } else { max_results.min(250) };
    let mut matches = Vec::new();

    let walker = walkdir::WalkDir::new(target)
        .max_depth(5)
        .into_iter()
        .filter_entry(|e| {
            // Skip hidden folders and Windows system folders
            let file_name = e.file_name().to_string_lossy();
            !file_name.starts_with('.') && file_name != "$RECYCLE.BIN" && file_name != "System Volume Information"
        });

    for entry_result in walker {
        if matches.len() >= limit {
            break;
        }
        if let Ok(entry) = entry_result {
            let file_name = entry.file_name().to_string_lossy();
            if file_name.to_lowercase().contains(&query_lower) {
                let metadata = entry.metadata().ok();
                let is_dir = entry.file_type().is_dir();
                let is_symlink = entry.file_type().is_symlink();
                let size = metadata.as_ref().map(|m| m.len()).unwrap_or(0);
                let modified = metadata.as_ref().and_then(|m| {
                    m.modified().ok().and_then(|t| t.duration_since(UNIX_EPOCH).ok().map(|d| d.as_secs() as i64))
                });
                let extension = if is_dir {
                    String::new()
                } else {
                    entry.path().extension().map(|e| e.to_string_lossy().to_lowercase()).unwrap_or_default()
                };

                matches.push(FileEntry {
                    name: file_name.to_string(),
                    path: entry.path().to_string_lossy().to_string(),
                    is_dir,
                    is_symlink,
                    is_hidden: false,
                    is_readonly: false,
                    size,
                    modified,
                    created: None,
                    extension,
                });
            }
        }
    }

    Ok(matches)
}

fn is_path_hidden(file_name: &str, _path: &Path) -> bool {
    if file_name.starts_with('.') {
        return true;
    }
    #[cfg(windows)]
    {
        use std::os::windows::fs::MetadataExt;
        if let Ok(meta) = _path.metadata() {
            // FILE_ATTRIBUTE_HIDDEN = 0x2
            if (meta.file_attributes() & 0x2) != 0 {
                return true;
            }
        }
    }
    false
}
