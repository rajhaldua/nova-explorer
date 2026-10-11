use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileEntry {
    pub name: String,
    pub path: String,
    pub is_dir: bool,
    pub is_symlink: bool,
    pub is_hidden: bool,
    pub is_readonly: bool,
    pub size: u64,
    pub modified: Option<i64>,
    pub created: Option<i64>,
    pub extension: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VolumeInfo {
    pub name: String,
    pub mount_point: String,
    pub total_bytes: u64,
    pub available_bytes: u64,
    pub used_bytes: u64,
    pub file_system: String,
    pub is_removable: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SpecialFolders {
    pub desktop: String,
    pub documents: String,
    pub downloads: String,
    pub pictures: String,
    pub music: String,
    pub videos: String,
    pub home: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OperationResult {
    pub success: bool,
    pub message: String,
    pub affected_paths: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConflictCheck {
    pub exists: bool,
    pub target_name: String,
    pub target_path: String,
    pub is_dir: bool,
    pub size: u64,
    pub modified: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FavoriteItem {
    pub id: String,
    pub path: String,
    pub label: String,
    pub position: i32,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TagItem {
    pub id: String,
    pub name: String,
    pub color: String,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FilePreview {
    pub path: String,
    pub name: String,
    pub size: u64,
    pub modified: Option<i64>,
    pub preview_type: String,
    pub text_content: Option<String>,
    pub thumbnail_data: Option<String>,
    pub dimensions: Option<(u32, u32)>,
    pub line_count: Option<usize>,
    pub media_data: Option<String>,
    pub mime_type: Option<String>,
}
