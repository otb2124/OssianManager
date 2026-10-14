//! Rich metadata for the file inspector panel.

use std::collections::HashMap;
use std::fs;
use std::io::Read;
use std::path::Path;
use std::time::{SystemTime, UNIX_EPOCH};

const DIR_SCAN_LIMIT: u64 = 50_000;
const TEXT_SCAN_LIMIT: u64 = 16 * 1024 * 1024;
const HEAD_BYTES: usize = 8192;
const PREVIEW_BYTES: usize = 4096;
const PREVIEW_LINES: usize = 40;
const TOP_EXTENSIONS: usize = 8;

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ImageInfo {
    pub width: u32,
    pub height: u32,
}

#[derive(serde::Serialize)]
pub struct ExtCount {
    pub ext: String,
    pub count: u64,
}

#[derive(serde::Serialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct DirStats {
    pub files: u64,
    pub folders: u64,
    pub total_size: u64,
    pub direct_files: u64,
    pub direct_folders: u64,
    pub truncated: bool,
    pub extensions: Vec<ExtCount>,
}

#[derive(serde::Serialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct EntryInfo {
    pub name: String,
    pub path: String,
    pub parent: Option<String>,
    pub extension: Option<String>,
    pub is_directory: bool,
    pub is_symlink: bool,
    pub symlink_target: Option<String>,
    pub size: u64,
    pub created_ms: Option<u64>,
    pub modified_ms: Option<u64>,
    pub accessed_ms: Option<u64>,
    pub readonly: bool,
    pub hidden: bool,
    pub detected_type: Option<String>,
    pub is_text: Option<bool>,
    pub encoding: Option<String>,
    pub line_count: Option<u64>,
    pub line_endings: Option<String>,
    pub image: Option<ImageInfo>,
    pub text_preview: Option<String>,
    pub preview_truncated: bool,
    pub dir: Option<DirStats>,
}

// ── commands ───────────────────────────────────────────────────────────────

#[tauri::command]
pub async fn inspect_entry(path: String) -> Result<EntryInfo, String> {
    tauri::async_runtime::spawn_blocking(move || inspect(&path))
        .await
        .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn hash_file(path: String) -> Result<String, String> {
    tauri::async_runtime::spawn_blocking(move || -> Result<String, String> {
        use sha2::{Digest, Sha256};

        let mut file = fs::File::open(&path).map_err(|e| format!("{path}: {e}"))?;
        let mut hasher = Sha256::new();
        let mut buf = vec![0u8; 64 * 1024];
        loop {
            let n = file.read(&mut buf).map_err(|e| e.to_string())?;
            if n == 0 {
                break;
            }
            hasher.update(&buf[..n]);
        }
        Ok(format!("{:x}", hasher.finalize()))
    })
    .await
    .map_err(|e| e.to_string())?
}

/// Raw bytes go to the webview as an ArrayBuffer (no JSON/base64 overhead), used for image previews.
#[tauri::command]
pub async fn read_file_bytes(path: String, max_bytes: u64) -> Result<tauri::ipc::Response, String> {
    tauri::async_runtime::spawn_blocking(move || -> Result<Vec<u8>, String> {
        let meta = fs::metadata(&path).map_err(|e| format!("{path}: {e}"))?;
        if meta.len() > max_bytes {
            return Err(format!("File is larger than {max_bytes} bytes"));
        }
        fs::read(&path).map_err(|e| format!("{path}: {e}"))
    })
    .await
    .map_err(|e| e.to_string())?
    .map(tauri::ipc::Response::new)
}

// ── inspection ─────────────────────────────────────────────────────────────

fn inspect(path: &str) -> Result<EntryInfo, String> {
    let p = Path::new(path);
    let link_meta = fs::symlink_metadata(p).map_err(|e| format!("{path}: {e}"))?;
    let meta = fs::metadata(p).map_err(|e| format!("{path}: {e}"))?; // follows symlinks
    let is_symlink = link_meta.file_type().is_symlink();

    let name = p
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or(path)
        .to_string();

    let mut info = EntryInfo {
        name: name.clone(),
        path: path.to_string(),
        parent: p
            .parent()
            .and_then(|x| x.to_str())
            .filter(|s| !s.is_empty())
            .map(String::from),
        extension: p
            .extension()
            .and_then(|e| e.to_str())
            .map(|e| e.to_lowercase()),
        is_directory: meta.is_dir(),
        is_symlink,
        symlink_target: if is_symlink {
            fs::read_link(p).ok().and_then(|t| t.to_str().map(String::from))
        } else {
            None
        },
        size: if meta.is_dir() { 0 } else { meta.len() },
        created_ms: to_ms(meta.created()),
        modified_ms: to_ms(meta.modified()),
        accessed_ms: to_ms(meta.accessed()),
        readonly: meta.permissions().readonly(),
        hidden: is_hidden(&meta, &name),
        ..Default::default()
    };

    if meta.is_file() {
        inspect_file(p, info.size, &mut info);
    } else if meta.is_dir() {
        info.dir = Some(scan_dir_stats(p));
    }

    Ok(info)
}

fn inspect_file(p: &Path, size: u64, info: &mut EntryInfo) {
    if size == 0 {
        info.is_text = Some(true);
        info.line_count = Some(0);
        info.line_endings = Some("None".to_string());
        return;
    }

    let head = match fs::File::open(p).and_then(|f| {
        let mut buf = Vec::with_capacity(HEAD_BYTES);
        f.take(HEAD_BYTES as u64).read_to_end(&mut buf).map(|_| buf)
    }) {
        Ok(b) => b,
        Err(_) => return,
    };

    info.detected_type = sniff_type(&head).map(String::from);

    if let Ok(dim) = imagesize::size(p) {
        info.image = Some(ImageInfo {
            width: dim.width as u32,
            height: dim.height as u32,
        });
    }

    let (bom_len, bom_encoding) = detect_bom(&head);

    // UTF-16: report it, but don't count lines or preview (we only decode UTF-8).
    if bom_len == 2 {
        info.is_text = Some(true);
        info.encoding = bom_encoding.map(String::from);
        return;
    }

    let body = &head[bom_len..];
    let has_nul = body.contains(&0);
    // A multi-byte character cut off at the end of the sample is fine.
    let valid_utf8 = match std::str::from_utf8(body) {
        Ok(_) => true,
        Err(e) => e.error_len().is_none(),
    };
    if has_nul || !valid_utf8 {
        info.is_text = Some(false);
        return;
    }

    info.is_text = Some(true);
    let encoding: &str = if bom_len == 3 {
        "UTF-8 (BOM)"
    } else if body.is_ascii() {
        "ASCII"
    } else {
        "UTF-8"
    };
    info.encoding = Some(encoding.to_string());

    if size <= TEXT_SCAN_LIMIT {
        if let Some((lines, ending)) = count_lines(p) {
            info.line_count = Some(lines);
            info.line_endings = Some(ending.to_string());
        }
    }

    let end = (bom_len + PREVIEW_BYTES).min(head.len());
    let text = String::from_utf8_lossy(&head[bom_len..end]);
    let mut lines: Vec<&str> = text.lines().collect();
    let too_many_lines = lines.len() > PREVIEW_LINES;
    lines.truncate(PREVIEW_LINES);
    info.text_preview = Some(lines.join("\n"));
    info.preview_truncated = too_many_lines || (end as u64) < size;
}

fn count_lines(p: &Path) -> Option<(u64, &'static str)> {
    let mut file = fs::File::open(p).ok()?;
    let mut buf = vec![0u8; 64 * 1024];
    let (mut lf, mut crlf) = (0u64, 0u64);
    let mut prev = 0u8;
    let mut last: Option<u8> = None;

    loop {
        let n = file.read(&mut buf).ok()?;
        if n == 0 {
            break;
        }
        for &b in &buf[..n] {
            if b == b'\n' {
                if prev == b'\r' {
                    crlf += 1;
                } else {
                    lf += 1;
                }
            }
            prev = b;
        }
        last = Some(buf[n - 1]);
    }

    let newlines = lf + crlf;
    let lines = match last {
        None => 0,
        Some(b'\n') => newlines,
        Some(_) => newlines + 1, // last line has no trailing newline
    };
    let ending = match (lf > 0, crlf > 0) {
        (true, true) => "Mixed",
        (false, true) => "CRLF",
        (true, false) => "LF",
        (false, false) => "None",
    };
    Some((lines, ending))
}

fn scan_dir_stats(root: &Path) -> DirStats {
    let mut stats = DirStats::default();
    let mut ext_counts: HashMap<String, u64> = HashMap::new();
    let mut stack = vec![root.to_path_buf()];
    let mut seen = 0u64;

    'outer: while let Some(dir) = stack.pop() {
        let is_root = dir.as_path() == root;
        let Ok(entries) = fs::read_dir(&dir) else { continue };

        for entry in entries.flatten() {
            seen += 1;
            if seen > DIR_SCAN_LIMIT {
                stats.truncated = true;
                break 'outer;
            }
            // file_type() does not follow symlinks, so link loops can't trap the scan.
            let Ok(ft) = entry.file_type() else { continue };

            if ft.is_dir() {
                stats.folders += 1;
                if is_root {
                    stats.direct_folders += 1;
                }
                stack.push(entry.path());
            } else if ft.is_file() {
                stats.files += 1;
                if is_root {
                    stats.direct_files += 1;
                }
                if let Ok(m) = entry.metadata() {
                    stats.total_size += m.len();
                }
                let ext = entry
                    .path()
                    .extension()
                    .and_then(|e| e.to_str())
                    .map(|e| format!(".{}", e.to_lowercase()))
                    .unwrap_or_else(|| "(none)".to_string());
                *ext_counts.entry(ext).or_insert(0) += 1;
            }
        }
    }

    let mut list: Vec<ExtCount> = ext_counts
        .into_iter()
        .map(|(ext, count)| ExtCount { ext, count })
        .collect();
    list.sort_by(|a, b| b.count.cmp(&a.count).then(a.ext.cmp(&b.ext)));
    list.truncate(TOP_EXTENSIONS);
    stats.extensions = list;
    stats
}

fn detect_bom(h: &[u8]) -> (usize, Option<&'static str>) {
    if h.starts_with(&[0xEF, 0xBB, 0xBF]) {
        (3, Some("UTF-8 (BOM)"))
    } else if h.starts_with(&[0xFF, 0xFE]) {
        (2, Some("UTF-16 LE (BOM)"))
    } else if h.starts_with(&[0xFE, 0xFF]) {
        (2, Some("UTF-16 BE (BOM)"))
    } else {
        (0, None)
    }
}

/// Identifies a file by its first bytes (independent of the extension).
fn sniff_type(h: &[u8]) -> Option<&'static str> {
    if h.starts_with(b"\x89PNG\r\n\x1a\n") {
        Some("PNG image")
    } else if h.starts_with(&[0xFF, 0xD8, 0xFF]) {
        Some("JPEG image")
    } else if h.starts_with(b"GIF87a") || h.starts_with(b"GIF89a") {
        Some("GIF image")
    } else if h.starts_with(b"DDS ") {
        Some("DDS texture")
    } else if h.len() >= 12 && h.starts_with(b"RIFF") && &h[8..12] == b"WEBP" {
        Some("WebP image")
    } else if h.len() >= 12 && h.starts_with(b"RIFF") && &h[8..12] == b"WAVE" {
        Some("WAV audio")
    } else if h.starts_with(b"OggS") {
        Some("Ogg container (audio/video)")
    } else if h.starts_with(b"ID3") {
        Some("MP3 audio")
    } else if h.starts_with(b"Kaydara FBX Binary") {
        Some("FBX binary model")
    } else if h.starts_with(b"; FBX") {
        Some("FBX ASCII model")
    } else if h.starts_with(b"glTF") {
        Some("glTF binary")
    } else if h.starts_with(b"%PDF") {
        Some("PDF document")
    } else if h.starts_with(b"PK\x03\x04") {
        Some("ZIP archive")
    } else if h.starts_with(b"MZ") {
        Some("Windows executable / DLL")
    } else if h.starts_with(b"\x7FELF") {
        Some("ELF binary")
    } else if h.starts_with(b"<?xml") {
        Some("XML document")
    } else {
        None
    }
}

fn to_ms(t: std::io::Result<SystemTime>) -> Option<u64> {
    t.ok()
        .and_then(|t| t.duration_since(UNIX_EPOCH).ok())
        .map(|d| d.as_millis() as u64)
}

#[cfg(windows)]
fn is_hidden(meta: &fs::Metadata, _name: &str) -> bool {
    use std::os::windows::fs::MetadataExt;
    meta.file_attributes() & 0x2 != 0 // FILE_ATTRIBUTE_HIDDEN
}

#[cfg(not(windows))]
fn is_hidden(_meta: &fs::Metadata, name: &str) -> bool {
    name.starts_with('.')
}