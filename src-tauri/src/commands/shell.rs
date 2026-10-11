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

#[tauri::command]
pub fn switch_to_windows_explorer(folder_path: Option<String>) -> Result<(), String> {
    #[cfg(windows)]
    {
        let target_dir = match folder_path {
            Some(ref p) if !p.is_empty() && Path::new(p).exists() => p.clone(),
            _ => std::env::var("USERPROFILE").unwrap_or_else(|_| "C:\\".to_string()),
        };

        Command::new("explorer.exe")
            .arg(&target_dir)
            .spawn()
            .map_err(|e| format!("Failed to launch Windows Explorer: {}", e))?;
    }

    #[cfg(not(windows))]
    {
        let target = folder_path.unwrap_or_else(|| ".".to_string());
        Command::new("xdg-open")
            .arg(&target)
            .spawn()
            .map_err(|e| format!("Failed to open file manager: {}", e))?;
    }

    Ok(())
}

#[tauri::command]
pub fn set_auto_start(enable: bool) -> Result<bool, String> {
    #[cfg(windows)]
    {
        let exe_path = std::env::current_exe()
            .map_err(|e| format!("Could not get current executable path: {}", e))?;
        let exe_str = exe_path.to_string_lossy().to_string();

        if enable {
            let status = Command::new("reg")
                .arg("add")
                .arg("HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run")
                .arg("/v")
                .arg("NovaExplorer")
                .arg("/t")
                .arg("REG_SZ")
                .arg("/d")
                .arg(format!("\"{}\"", exe_str))
                .arg("/f")
                .status()
                .map_err(|e| format!("Failed to execute reg.exe: {}", e))?;

            if !status.success() {
                return Err("Failed to register NovaExplorer in Windows startup".to_string());
            }
        } else {
            let _ = Command::new("reg")
                .arg("delete")
                .arg("HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run")
                .arg("/v")
                .arg("NovaExplorer")
                .arg("/f")
                .status();
        }

        Ok(enable)
    }

    #[cfg(not(windows))]
    {
        Ok(false)
    }
}

#[tauri::command]
pub fn get_auto_start() -> Result<bool, String> {
    #[cfg(windows)]
    {
        let output = Command::new("reg")
            .arg("query")
            .arg("HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run")
            .arg("/v")
            .arg("NovaExplorer")
            .output();

        match output {
            Ok(out) => Ok(out.status.success()),
            Err(_) => Ok(false),
        }
    }

    #[cfg(not(windows))]
    {
        Ok(false)
    }
}

