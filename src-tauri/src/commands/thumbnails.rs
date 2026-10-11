use std::collections::HashMap;
use std::fs;
use std::io::Cursor;
use std::path::{Path, PathBuf};
use base64::engine::general_purpose::STANDARD as BASE64;
use base64::Engine;
use image::ImageFormat;
use tauri::{AppHandle, Manager};
use crate::models::FilePreview;

#[tauri::command]
pub fn get_thumbnail(app: AppHandle, path: String, max_dim: u32) -> Result<String, String> {
    let target = Path::new(&path);
    if !target.exists() || !target.is_file() {
        return Err("File does not exist or is a directory".to_string());
    }

    let ext = target.extension().and_then(|e| e.to_str()).unwrap_or("").to_lowercase();
    let is_img = is_supported_image(&ext);

    // Direct vector preview for SVGs
    if ext == "svg" {
        if let Ok(bytes) = fs::read(target) {
            if bytes.len() <= 2 * 1024 * 1024 {
                return Ok(format!("data:image/svg+xml;base64,{}", BASE64.encode(&bytes)));
            }
        }
    }

    let dim = if max_dim == 0 { 256 } else { max_dim.clamp(64, 1024) };
    let app_data = app.path().app_data_dir().unwrap_or_else(|_| PathBuf::from("data"));
    let cache_dir = app_data.join("thumbnails");
    fs::create_dir_all(&cache_dir).ok();

    let meta = target.metadata().map_err(|e| e.to_string())?;
    let len = meta.len();
    let mod_time = meta.modified().ok()
        .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
        .map(|d| d.as_secs())
        .unwrap_or(0);

    let cache_key = format!("{:x}", calculate_hash(&format!("{}:{}:{}:{}", path, len, mod_time, dim)));
    let cache_file = cache_dir.join(format!("{}.jpg", cache_key));

    // Return from disk cache if present
    if cache_file.exists() {
        if let Ok(bytes) = fs::read(&cache_file) {
            return Ok(format!("data:image/jpeg;base64,{}", BASE64.encode(&bytes)));
        }
    }

    // 1. PSD embedded thumbnail
    if ext == "psd" {
        if let Ok(bytes) = fs::read(target) {
            if let Some(thumb) = extract_psd_thumbnail(&bytes) {
                fs::write(&cache_file, &thumb).ok();
                return Ok(format!("data:image/jpeg;base64,{}", BASE64.encode(&thumb)));
            }
        }
    }

    // 2. EPS embedded thumbnail
    if ext == "eps" {
        if let Ok(bytes) = fs::read(target) {
            if let Some(thumb) = extract_eps_thumbnail(&bytes) {
                fs::write(&cache_file, &thumb).ok();
                return Ok(format!("data:image/jpeg;base64,{}", BASE64.encode(&thumb)));
            }
        }
    }

    // 3. Windows Shell Thumbnail extraction (native Windows QuickLook & installed shell plugins)
    if let Some(shell_jpeg) = extract_windows_shell_thumbnail(&path, dim) {
        fs::write(&cache_file, &shell_jpeg).ok();
        return Ok(format!("data:image/jpeg;base64,{}", BASE64.encode(&shell_jpeg)));
    }

    if !is_img {
        return Err("No shell thumbnail or decoder available for this file type".to_string());
    }

    // 4. Default decode using `image` crate
    let img = image::open(target).map_err(|e| format!("Failed to decode image: {}", e))?;
    let thumb = img.thumbnail(dim, dim);

    let mut jpeg_bytes = Vec::new();
    let mut cursor = Cursor::new(&mut jpeg_bytes);
    thumb.write_to(&mut cursor, ImageFormat::Jpeg).map_err(|e| format!("Failed to encode thumbnail: {}", e))?;

    // Save to disk cache
    fs::write(&cache_file, &jpeg_bytes).ok();

    Ok(format!("data:image/jpeg;base64,{}", BASE64.encode(&jpeg_bytes)))
}

#[tauri::command]
pub fn batch_get_thumbnails(app: AppHandle, paths: Vec<String>, max_dim: u32) -> Result<HashMap<String, String>, String> {
    let mut results = HashMap::new();
    let dim = if max_dim == 0 { 256 } else { max_dim.clamp(64, 1024) };

    for path in paths {
        if let Ok(thumb_data) = get_thumbnail(app.clone(), path.clone(), dim) {
            results.insert(path, thumb_data);
        }
    }

    Ok(results)
}

#[tauri::command]
pub fn get_file_preview(app: AppHandle, path: String) -> Result<FilePreview, String> {
    let target = Path::new(&path);
    if !target.exists() {
        return Err(format!("File does not exist: {}", path));
    }

    let meta = target.metadata().map_err(|e| e.to_string())?;
    let name = target.file_name().unwrap_or_default().to_string_lossy().to_string();
    let size = meta.len();
    let modified = meta.modified().ok()
        .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
        .map(|d| d.as_secs() as i64);

    let ext = target.extension().and_then(|e| e.to_str()).unwrap_or("").to_lowercase();

    // 1. Image Preview
    if is_supported_image(&ext) {
        let dimensions = if ext == "svg" {
            None
        } else {
            image::image_dimensions(target).ok()
        };
        let thumbnail_data = get_thumbnail(app, path.clone(), 800).ok();

        return Ok(FilePreview {
            path,
            name,
            size,
            modified,
            preview_type: "image".to_string(),
            text_content: None,
            thumbnail_data,
            dimensions,
            line_count: None,
            media_data: None,
            mime_type: Some(format!("image/{}", if ext == "svg" { "svg+xml" } else { &ext })),
        });
    }

    // 2. Audio Playback Engine
    if ["mp3", "wav", "flac", "aac", "ogg", "m4a", "wma", "opus", "aiff"].contains(&ext.as_str()) {
        let media_data = if size <= 25 * 1024 * 1024 {
            fs::read(target).ok().map(|bytes| {
                let mime_sub = match ext.as_str() {
                    "mp3" => "mpeg",
                    "m4a" | "aac" => "mp4",
                    "ogg" | "opus" => "ogg",
                    "wav" => "wav",
                    _ => &ext,
                };
                format!("data:audio/{};base64,{}", mime_sub, BASE64.encode(&bytes))
            })
        } else {
            None
        };

        return Ok(FilePreview {
            path,
            name,
            size,
            modified,
            preview_type: "audio".to_string(),
            text_content: None,
            thumbnail_data: None,
            dimensions: None,
            line_count: None,
            media_data,
            mime_type: Some(format!("audio/{}", ext)),
        });
    }

    // 3. Video Playback Engine
    if ["mp4", "mkv", "avi", "mov", "wmv", "webm", "flv", "m4v", "3gp"].contains(&ext.as_str()) {
        let media_data = if (ext == "mp4" || ext == "webm" || ext == "m4v") && size <= 40 * 1024 * 1024 {
            fs::read(target).ok().map(|bytes| {
                format!("data:video/{};base64,{}", if ext == "m4v" { "mp4" } else { &ext }, BASE64.encode(&bytes))
            })
        } else {
            None
        };

        return Ok(FilePreview {
            path,
            name,
            size,
            modified,
            preview_type: "video".to_string(),
            text_content: None,
            thumbnail_data: None,
            dimensions: None,
            line_count: None,
            media_data,
            mime_type: Some(format!("video/{}", ext)),
        });
    }

    // 4. Font Typography Specimen
    if ["ttf", "otf", "woff", "woff2"].contains(&ext.as_str()) {
        let media_data = if size <= 15 * 1024 * 1024 {
            fs::read(target).ok().map(|bytes| {
                format!("data:font/{};base64,{}", ext, BASE64.encode(&bytes))
            })
        } else {
            None
        };

        return Ok(FilePreview {
            path,
            name,
            size,
            modified,
            preview_type: "font".to_string(),
            text_content: None,
            thumbnail_data: None,
            dimensions: None,
            line_count: None,
            media_data,
            mime_type: Some(format!("font/{}", ext)),
        });
    }

    // 5. CSV / TSV Spreadsheet Data
    if ext == "csv" || ext == "tsv" {
        let max_read = 128 * 1024;
        let bytes = fs::read(target).map_err(|e| format!("Failed to read file: {}", e))?;
        let sample = if bytes.len() > max_read { &bytes[..max_read] } else { &bytes[..] };
        let content = String::from_utf8_lossy(sample).to_string();
        let line_count = Some(content.lines().count());

        return Ok(FilePreview {
            path,
            name,
            size,
            modified,
            preview_type: "csv".to_string(),
            text_content: Some(content),
            thumbnail_data: None,
            dimensions: None,
            line_count,
            media_data: None,
            mime_type: Some(format!("text/{}", ext)),
        });
    }

    // 6. JSON Data
    if ["json", "jsonc", "json5", "geojson"].contains(&ext.as_str()) {
        let max_read = 128 * 1024;
        let bytes = fs::read(target).map_err(|e| format!("Failed to read file: {}", e))?;
        let sample = if bytes.len() > max_read { &bytes[..max_read] } else { &bytes[..] };
        let content = String::from_utf8_lossy(sample).to_string();
        let line_count = Some(content.lines().count());

        return Ok(FilePreview {
            path,
            name,
            size,
            modified,
            preview_type: "json".to_string(),
            text_content: Some(content),
            thumbnail_data: None,
            dimensions: None,
            line_count,
            media_data: None,
            mime_type: Some("application/json".to_string()),
        });
    }

    // 7. Markdown Documentation
    if ["md", "markdown", "mdown", "mkd"].contains(&ext.as_str()) {
        let max_read = 128 * 1024;
        let bytes = fs::read(target).map_err(|e| format!("Failed to read file: {}", e))?;
        let sample = if bytes.len() > max_read { &bytes[..max_read] } else { &bytes[..] };
        let content = String::from_utf8_lossy(sample).to_string();
        let line_count = Some(content.lines().count());

        return Ok(FilePreview {
            path,
            name,
            size,
            modified,
            preview_type: "markdown".to_string(),
            text_content: Some(content),
            thumbnail_data: None,
            dimensions: None,
            line_count,
            media_data: None,
            mime_type: Some("text/markdown".to_string()),
        });
    }

    // 8. General Code & Text
    if is_text_format(&ext) {
        let max_read = 128 * 1024;
        let bytes = fs::read(target).map_err(|e| format!("Failed to read file: {}", e))?;
        let sample = if bytes.len() > max_read { &bytes[..max_read] } else { &bytes[..] };
        let content = String::from_utf8_lossy(sample).to_string();
        let line_count = Some(content.lines().count());

        return Ok(FilePreview {
            path,
            name,
            size,
            modified,
            preview_type: "text".to_string(),
            text_content: Some(content),
            thumbnail_data: None,
            dimensions: None,
            line_count,
            media_data: None,
            mime_type: Some("text/plain".to_string()),
        });
    }

    // 9. PDF Documents
    if ext == "pdf" {
        let media_data = if size <= 35 * 1024 * 1024 {
            fs::read(target).ok().map(|bytes| {
                format!("data:application/pdf;base64,{}", BASE64.encode(&bytes))
            })
        } else {
            None
        };
        let thumbnail_data = get_thumbnail(app, path.clone(), 800).ok();

        return Ok(FilePreview {
            path,
            name,
            size,
            modified,
            preview_type: "pdf".to_string(),
            text_content: None,
            thumbnail_data,
            dimensions: None,
            line_count: None,
            media_data,
            mime_type: Some("application/pdf".to_string()),
        });
    }

    // 10. Adobe Illustrator (.ai) - Native PDF Compatibility or Embedded Artwork
    if ext == "ai" {
        let bytes = fs::read(target).unwrap_or_default();
        let is_pdf = is_ai_pdf(&bytes);
        let media_data = if is_pdf && size <= 35 * 1024 * 1024 {
            Some(format!("data:application/pdf;base64,{}", BASE64.encode(&bytes)))
        } else {
            None
        };
        let thumbnail_data = get_thumbnail(app, path.clone(), 800).ok();

        return Ok(FilePreview {
            path,
            name,
            size,
            modified,
            preview_type: if is_pdf { "pdf".to_string() } else { "design".to_string() },
            text_content: None,
            thumbnail_data,
            dimensions: None,
            line_count: None,
            media_data,
            mime_type: Some("application/illustrator".to_string()),
        });
    }

    // 11. Adobe Photoshop (.psd) - Embedded Composite Thumbnail
    if ext == "psd" {
        let bytes = fs::read(target).unwrap_or_default();
        let thumb_bytes = extract_psd_thumbnail(&bytes);
        let thumbnail_data = thumb_bytes
            .map(|tb| format!("data:image/jpeg;base64,{}", BASE64.encode(&tb)))
            .or_else(|| get_thumbnail(app, path.clone(), 800).ok());

        return Ok(FilePreview {
            path,
            name,
            size,
            modified,
            preview_type: if thumbnail_data.is_some() { "image".to_string() } else { "design".to_string() },
            text_content: None,
            thumbnail_data,
            dimensions: None,
            line_count: None,
            media_data: None,
            mime_type: Some("image/vnd.adobe.photoshop".to_string()),
        });
    }

    // 12. Encapsulated PostScript (.eps) - Binary TIFF preview or PostScript stream
    if ext == "eps" {
        let bytes = fs::read(target).unwrap_or_default();
        let thumb_bytes = extract_eps_thumbnail(&bytes);
        let thumbnail_data = thumb_bytes
            .map(|tb| format!("data:image/jpeg;base64,{}", BASE64.encode(&tb)))
            .or_else(|| get_thumbnail(app, path.clone(), 800).ok());

        let sample_len = bytes.len().min(64 * 1024);
        let sample_text = String::from_utf8_lossy(&bytes[..sample_len]).to_string();

        return Ok(FilePreview {
            path,
            name,
            size,
            modified,
            preview_type: if thumbnail_data.is_some() { "image".to_string() } else { "text".to_string() },
            text_content: Some(sample_text),
            thumbnail_data,
            dimensions: None,
            line_count: None,
            media_data: None,
            mime_type: Some("application/postscript".to_string()),
        });
    }

    // 13. Compressed Archives
    if ["zip", "rar", "7z", "tar", "gz", "bz2", "xz", "iso", "cab", "tgz"].contains(&ext.as_str()) {
        let thumbnail_data = get_thumbnail(app, path.clone(), 800).ok();
        return Ok(FilePreview {
            path,
            name,
            size,
            modified,
            preview_type: "archive".to_string(),
            text_content: None,
            thumbnail_data,
            dimensions: None,
            line_count: None,
            media_data: None,
            mime_type: Some(format!("application/{}", ext)),
        });
    }

    // 14. Office & Documents (Word, Excel, PowerPoint, LibreOffice)
    if ["docx", "doc", "xlsx", "xls", "pptx", "ppt", "odt", "ods", "odp", "rtf", "epub", "pages", "numbers", "key"].contains(&ext.as_str()) {
        let thumbnail_data = get_thumbnail(app, path.clone(), 800).ok();
        return Ok(FilePreview {
            path,
            name,
            size,
            modified,
            preview_type: "office".to_string(),
            text_content: None,
            thumbnail_data,
            dimensions: None,
            line_count: None,
            media_data: None,
            mime_type: Some(format!("application/{}", ext)),
        });
    }

    // 15. 3D Models & CAD (Blender, OBJ, STL, GLTF, FBX)
    if ["obj", "stl", "gltf", "glb", "step", "iges", "fbx", "dae", "blend"].contains(&ext.as_str()) {
        let thumbnail_data = get_thumbnail(app, path.clone(), 800).ok();
        return Ok(FilePreview {
            path,
            name,
            size,
            modified,
            preview_type: "3d".to_string(),
            text_content: None,
            thumbnail_data,
            dimensions: None,
            line_count: None,
            media_data: None,
            mime_type: Some(format!("model/{}", ext)),
        });
    }

    // 16. Design & Creative (Sketch, Figma, Raw photos)
    if ["sketch", "fig", "xd", "raw", "cr2", "nef", "arw"].contains(&ext.as_str()) {
        let thumbnail_data = get_thumbnail(app, path.clone(), 800).ok();
        return Ok(FilePreview {
            path,
            name,
            size,
            modified,
            preview_type: "design".to_string(),
            text_content: None,
            thumbnail_data,
            dimensions: None,
            line_count: None,
            media_data: None,
            mime_type: Some(format!("image/{}", ext)),
        });
    }

    // 17. System & Binaries
    if ["exe", "msi", "dll", "sys", "drv", "bin", "dmg", "apk", "vhd", "vhdx"].contains(&ext.as_str()) {
        let thumbnail_data = get_thumbnail(app, path.clone(), 800).ok();
        return Ok(FilePreview {
            path,
            name,
            size,
            modified,
            preview_type: "system".to_string(),
            text_content: None,
            thumbnail_data,
            dimensions: None,
            line_count: None,
            media_data: None,
            mime_type: Some("application/octet-stream".to_string()),
        });
    }

    // 18. Generic Binary / Any other file
    let thumbnail_data = get_thumbnail(app, path.clone(), 800).ok();
    Ok(FilePreview {
        path,
        name,
        size,
        modified,
        preview_type: if thumbnail_data.is_some() { "image".to_string() } else { "unsupported".to_string() },
        text_content: None,
        thumbnail_data,
        dimensions: None,
        line_count: None,
        media_data: None,
        mime_type: None,
    })
}

fn is_supported_image(ext: &str) -> bool {
    matches!(
        ext,
        "jpg"
            | "jpeg"
            | "png"
            | "webp"
            | "bmp"
            | "gif"
            | "ico"
            | "tiff"
            | "tif"
            | "svg"
            | "psd"
            | "ai"
            | "eps"
            | "pdf"
    )
}

fn is_text_format(ext: &str) -> bool {
    matches!(
        ext,
        "txt"
            | "log"
            | "xml"
            | "html"
            | "htm"
            | "css"
            | "scss"
            | "sass"
            | "less"
            | "js"
            | "mjs"
            | "cjs"
            | "jsx"
            | "ts"
            | "mts"
            | "tsx"
            | "yaml"
            | "yml"
            | "toml"
            | "ini"
            | "conf"
            | "cfg"
            | "env"
            | "properties"
            | "sql"
            | "sh"
            | "bash"
            | "zsh"
            | "bat"
            | "cmd"
            | "ps1"
            | "psm1"
            | "rs"
            | "py"
            | "pyw"
            | "c"
            | "cpp"
            | "cc"
            | "cxx"
            | "h"
            | "hpp"
            | "cs"
            | "java"
            | "kt"
            | "kts"
            | "go"
            | "rb"
            | "php"
            | "lua"
            | "swift"
            | "dart"
            | "r"
            | "scala"
            | "dockerfile"
            | "makefile"
            | "cmake"
            | "graphql"
            | "vue"
            | "svelte"
            | "asm"
            | "diff"
            | "patch"
            | "proto"
            | "gradle"
    )
}

fn calculate_hash(s: &str) -> u64 {
    use std::collections::hash_map::DefaultHasher;
    use std::hash::{Hash, Hasher};
    let mut hasher = DefaultHasher::new();
    s.hash(&mut hasher);
    hasher.finish()
}

fn is_ai_pdf(bytes: &[u8]) -> bool {
    if bytes.starts_with(b"%PDF-") {
        return true;
    }
    let check_len = bytes.len().min(4096);
    bytes[..check_len].windows(5).any(|w| w == b"%PDF-")
}

fn extract_psd_thumbnail(bytes: &[u8]) -> Option<Vec<u8>> {
    if bytes.len() < 26 || !bytes.starts_with(b"8BPS") {
        return None;
    }

    let max_scan = bytes.len().min(4 * 1024 * 1024);
    let slice = &bytes[..max_scan];

    let mut i = 26;
    while i + 12 < slice.len() {
        if &slice[i..i + 4] == b"8BIM" {
            let id = u16::from_be_bytes([slice[i + 4], slice[i + 5]]);
            let name_len = slice[i + 6] as usize;
            let mut offset = i + 7 + name_len;
            if offset % 2 != 0 {
                offset += 1;
            }
            if offset + 4 <= slice.len() {
                let size = u32::from_be_bytes([
                    slice[offset],
                    slice[offset + 1],
                    slice[offset + 2],
                    slice[offset + 3],
                ]) as usize;
                let data_start = offset + 4;
                let data_end = data_start + size;
                if data_end <= slice.len() && (id == 0x0409 || id == 0x040C) {
                    let res_data = &slice[data_start..data_end];
                    if let Some(soi_pos) = res_data.windows(3).position(|w| w == [0xFF, 0xD8, 0xFF]) {
                        return Some(res_data[soi_pos..].to_vec());
                    }
                }
                i = if data_end % 2 != 0 { data_end + 1 } else { data_end };
                continue;
            }
        }
        i += 1;
    }

    if let Some(soi_pos) = slice.windows(3).position(|w| w == [0xFF, 0xD8, 0xFF]) {
        if let Some(eoi_pos) = slice[soi_pos + 2..].windows(2).position(|w| w == [0xFF, 0xD9]) {
            let end = soi_pos + 2 + eoi_pos + 2;
            let jpeg_data = &slice[soi_pos..end];
            if jpeg_data.len() > 100 {
                return Some(jpeg_data.to_vec());
            }
        }
    }

    None
}

fn extract_eps_thumbnail(bytes: &[u8]) -> Option<Vec<u8>> {
    if bytes.len() >= 30 && bytes.starts_with(&[0xC5, 0xD0, 0xD3, 0xC6]) {
        let tiff_offset = u32::from_le_bytes([bytes[20], bytes[21], bytes[22], bytes[23]]) as usize;
        let tiff_len = u32::from_le_bytes([bytes[24], bytes[25], bytes[26], bytes[27]]) as usize;
        if tiff_len > 0 && tiff_offset + tiff_len <= bytes.len() {
            let tiff_data = &bytes[tiff_offset..tiff_offset + tiff_len];
            if let Ok(img) = image::load_from_memory(tiff_data) {
                let mut jpeg_bytes = Vec::new();
                let mut cursor = Cursor::new(&mut jpeg_bytes);
                if img.write_to(&mut cursor, ImageFormat::Jpeg).is_ok() {
                    return Some(jpeg_bytes);
                }
            }
        }
    }

    let max_scan = bytes.len().min(2 * 1024 * 1024);
    let slice = &bytes[..max_scan];
    if let Some(soi_pos) = slice.windows(3).position(|w| w == [0xFF, 0xD8, 0xFF]) {
        if let Some(eoi_pos) = slice[soi_pos + 2..].windows(2).position(|w| w == [0xFF, 0xD9]) {
            let end = soi_pos + 2 + eoi_pos + 2;
            let jpeg_data = &slice[soi_pos..end];
            if jpeg_data.len() > 100 {
                return Some(jpeg_data.to_vec());
            }
        }
    }

    None
}

#[cfg(not(windows))]
fn extract_windows_shell_thumbnail(_path: &str, _max_dim: u32) -> Option<Vec<u8>> {
    None
}

#[cfg(windows)]
fn extract_windows_shell_thumbnail(path: &str, max_dim: u32) -> Option<Vec<u8>> {
    extract_windows_shell_thumbnail_impl(path, max_dim)
}

#[cfg(windows)]
fn extract_windows_shell_thumbnail_impl(path: &str, max_dim: u32) -> Option<Vec<u8>> {
    use std::os::windows::ffi::OsStrExt;
    use windows_sys::core::GUID;
    use windows_sys::Win32::Foundation::S_OK;
    use windows_sys::Win32::Graphics::Gdi::{
        CreateCompatibleDC, DeleteDC, DeleteObject, GetDIBits, GetObjectW, BITMAP,
        BITMAPINFO, BITMAPINFOHEADER, BI_RGB, DIB_RGB_COLORS, HBITMAP,
    };
    use windows_sys::Win32::System::Com::{CoInitializeEx, CoUninitialize, COINIT_APARTMENTTHREADED};
    use windows_sys::Win32::UI::Shell::SHCreateItemFromParsingName;

    // GUID for IShellItemImageFactory: {bcc18b79-ba16-442f-80c4-8a59c30c463b}
    const IID_ISHELL_ITEM_IMAGE_FACTORY: GUID = GUID {
        data1: 0xbcc18b79,
        data2: 0xba16,
        data3: 0x442f,
        data4: [0x80, 0xc4, 0x8a, 0x59, 0xc3, 0x0c, 0x46, 0x3b],
    };

    #[repr(C)]
    #[allow(non_snake_case)]
    struct IShellItemImageFactoryVtbl {
        pub QueryInterface: unsafe extern "system" fn(
            this: *mut std::ffi::c_void,
            riid: *const GUID,
            ppv_object: *mut *mut std::ffi::c_void,
        ) -> i32,
        pub AddRef: unsafe extern "system" fn(this: *mut std::ffi::c_void) -> u32,
        pub Release: unsafe extern "system" fn(this: *mut std::ffi::c_void) -> u32,
        pub GetImage: unsafe extern "system" fn(
            this: *mut std::ffi::c_void,
            size: windows_sys::Win32::Foundation::SIZE,
            flags: u32,
            phbm: *mut HBITMAP,
        ) -> i32,
    }

    #[repr(C)]
    #[allow(non_snake_case)]
    struct IShellItemImageFactory {
        pub lpVtbl: *const IShellItemImageFactoryVtbl,
    }

    let path_wide: Vec<u16> = std::ffi::OsStr::new(path)
        .encode_wide()
        .chain(std::iter::once(0))
        .collect();

    unsafe {
        let _ = CoInitializeEx(std::ptr::null_mut(), COINIT_APARTMENTTHREADED as u32);

        let mut factory_ptr: *mut std::ffi::c_void = std::ptr::null_mut();
        let hr = SHCreateItemFromParsingName(
            path_wide.as_ptr(),
            std::ptr::null_mut(),
            &IID_ISHELL_ITEM_IMAGE_FACTORY,
            &mut factory_ptr,
        );

        if hr != S_OK || factory_ptr.is_null() {
            CoUninitialize();
            return None;
        }

        let factory = factory_ptr as *mut IShellItemImageFactory;
        let vtbl = &*(*factory).lpVtbl;

        let dim = max_dim.clamp(64, 1024) as i32;
        let size = windows_sys::Win32::Foundation::SIZE { cx: dim, cy: dim };
        // SIIGBF_BIGGERSIZEOK (0x1) | SIIGBF_SCALEUP (0x100)
        let flags: u32 = 0x01 | 0x100;
        let mut hbm: HBITMAP = std::ptr::null_mut();

        let get_img_hr = (vtbl.GetImage)(factory_ptr, size, flags, &mut hbm);
        (vtbl.Release)(factory_ptr);

        if get_img_hr != S_OK || hbm.is_null() {
            CoUninitialize();
            return None;
        }

        let mut bmp = std::mem::zeroed::<BITMAP>();
        let get_obj_res = GetObjectW(
            hbm as *mut _,
            std::mem::size_of::<BITMAP>() as i32,
            &mut bmp as *mut _ as *mut _,
        );

        if get_obj_res == 0 || bmp.bmWidth <= 0 || bmp.bmHeight <= 0 {
            DeleteObject(hbm as *mut _);
            CoUninitialize();
            return None;
        }

        let width = bmp.bmWidth as u32;
        let height = bmp.bmHeight.abs() as u32;

        let hdc = CreateCompatibleDC(std::ptr::null_mut());
        if hdc.is_null() {
            DeleteObject(hbm as *mut _);
            CoUninitialize();
            return None;
        }

        let mut bi = std::mem::zeroed::<BITMAPINFO>();
        bi.bmiHeader.biSize = std::mem::size_of::<BITMAPINFOHEADER>() as u32;
        bi.bmiHeader.biWidth = width as i32;
        bi.bmiHeader.biHeight = -(height as i32); // Top-down
        bi.bmiHeader.biPlanes = 1;
        bi.bmiHeader.biBitCount = 32;
        bi.bmiHeader.biCompression = BI_RGB;

        let mut raw_pixels = vec![0u8; (width * height * 4) as usize];
        let lines = GetDIBits(
            hdc,
            hbm,
            0,
            height,
            raw_pixels.as_mut_ptr() as *mut _,
            &mut bi,
            DIB_RGB_COLORS,
        );

        DeleteDC(hdc);
        DeleteObject(hbm as *mut _);
        CoUninitialize();

        if lines == 0 {
            return None;
        }

        // Convert BGRA to RGBA / RGB
        let mut rgba_pixels = vec![0u8; (width * height * 3) as usize];
        for i in 0..(width * height) as usize {
            let b = raw_pixels[i * 4];
            let g = raw_pixels[i * 4 + 1];
            let r = raw_pixels[i * 4 + 2];
            rgba_pixels[i * 3] = r;
            rgba_pixels[i * 3 + 1] = g;
            rgba_pixels[i * 3 + 2] = b;
        }

        let img_buf = image::RgbImage::from_raw(width, height, rgba_pixels)?;
        let mut jpeg_bytes = Vec::new();
        let mut cursor = Cursor::new(&mut jpeg_bytes);
        img_buf.write_to(&mut cursor, ImageFormat::Jpeg).ok()?;

        Some(jpeg_bytes)
    }
}


