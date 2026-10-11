use sysinfo::Disks;
use crate::models::VolumeInfo;

#[tauri::command]
pub fn list_volumes() -> Result<Vec<VolumeInfo>, String> {
    let disks = Disks::new_with_refreshed_list();
    let mut volumes = Vec::new();

    for disk in disks.list() {
        let mount_point = disk.mount_point().to_string_lossy().to_string();
        let name = disk.name().to_string_lossy().to_string();
        let total_bytes = disk.total_space();
        let available_bytes = disk.available_space();
        let used_bytes = total_bytes.saturating_sub(available_bytes);
        let file_system = disk.file_system().to_string_lossy().to_string();
        let is_removable = disk.is_removable();

        let display_name = if name.is_empty() {
            format!("Local Disk ({})", mount_point.trim_end_matches('\\'))
        } else {
            format!("{} ({})", name, mount_point.trim_end_matches('\\'))
        };

        volumes.push(VolumeInfo {
            name: display_name,
            mount_point,
            total_bytes,
            available_bytes,
            used_bytes,
            file_system,
            is_removable,
        });
    }

    // Sort volumes by mount point (e.g. C:\ first, then D:\)
    volumes.sort_by(|a, b| a.mount_point.cmp(&b.mount_point));

    Ok(volumes)
}
