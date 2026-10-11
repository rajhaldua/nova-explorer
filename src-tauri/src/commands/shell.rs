use std::path::Path;
use std::process::Command;

#[tauri::command]
pub fn open_path(path: String) -> Result<(), String> {
    let target = Path::new(&path);
    if !target.exists() {
        return Err("File or folder does not exist".to_string());
    }

    #[cfg(windows)]
    {
        // Use Windows "explorer" or "cmd /C start"
        Command::new("explorer")
            .arg(&path)
            .spawn()
            .map_err(|e| format!("Failed to open file: {}", e))?;
    }

    #[cfg(not(windows))]
    {
        Command::new("xdg-open")
            .arg(&path)
            .spawn()
            .map_err(|e| format!("Failed to open file: {}", e))?;
    }

    Ok(())
}

#[tauri::command]
pub fn reveal_in_explorer(path: String) -> Result<(), String> {
    let target = Path::new(&path);
    if !target.exists() {
        return Err("Target path does not exist".to_string());
    }

    #[cfg(windows)]
    {
        Command::new("explorer")
            .arg(format!("/select,{}", path))
            .spawn()
            .map_err(|e| format!("Failed to reveal in Explorer: {}", e))?;
    }

    #[cfg(not(windows))]
    {
        let parent = target.parent().unwrap_or(target);
        Command::new("xdg-open")
            .arg(parent)
            .spawn()
            .map_err(|e| format!("Failed to open folder: {}", e))?;
    }

    Ok(())
}
