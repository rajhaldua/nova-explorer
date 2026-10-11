use rusqlite::{params, Connection, Result};
use std::path::PathBuf;
use std::sync::Mutex;
use crate::models::{FavoriteItem, TagItem};

pub struct Database {
    pub conn: Mutex<Connection>,
}

impl Database {
    pub fn init(app_data_dir: PathBuf) -> Result<Self> {
        std::fs::create_dir_all(&app_data_dir).ok();
        let db_path = app_data_dir.join("nova_explorer.db");
        let conn = Connection::open(db_path)?;

        // Initialize schema
        conn.execute_batch(
            "
            CREATE TABLE IF NOT EXISTS app_settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS favorites (
                id TEXT PRIMARY KEY,
                path TEXT NOT NULL,
                label TEXT NOT NULL,
                position INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS tags (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                color TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS file_tags (
                path TEXT NOT NULL,
                tag_id TEXT NOT NULL,
                PRIMARY KEY (path, tag_id),
                FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS folder_preferences (
                path TEXT PRIMARY KEY,
                view_mode TEXT NOT NULL,
                sort_by TEXT NOT NULL,
                sort_asc INTEGER DEFAULT 1
            );

            CREATE TABLE IF NOT EXISTS operation_history (
                id TEXT PRIMARY KEY,
                op_type TEXT NOT NULL,
                source_path TEXT NOT NULL,
                target_path TEXT NOT NULL,
                timestamp INTEGER NOT NULL,
                undone INTEGER DEFAULT 0
            );
            "
        )?;

        // Seed default tags if empty
        let tag_count: i64 = conn.query_row("SELECT COUNT(*) FROM tags", [], |r| r.get(0)).unwrap_or(0);
        if tag_count == 0 {
            conn.execute(
                "INSERT INTO tags (id, name, color) VALUES ('tag_important', 'Important', '#ef4444'), ('tag_work', 'Personal', '#3b82f6'), ('tag_photos', 'Family', '#10b981')",
                [],
            ).ok();
        }

        Ok(Database {
            conn: Mutex::new(conn),
        })
    }

    pub fn get_setting(&self, key: &str) -> Result<Option<String>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare("SELECT value FROM app_settings WHERE key = ?1")?;
        let mut rows = stmt.query(params![key])?;
        if let Some(row) = rows.next()? {
            Ok(Some(row.get(0)?))
        } else {
            Ok(None)
        }
    }

    pub fn set_setting(&self, key: &str, value: &str) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT INTO app_settings (key, value, updated_at) VALUES (?1, ?2, CURRENT_TIMESTAMP)
             ON CONFLICT(key) DO UPDATE SET value = ?2, updated_at = CURRENT_TIMESTAMP",
            params![key, value],
        )?;
        Ok(())
    }

    pub fn get_favorites(&self) -> Result<Vec<FavoriteItem>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare("SELECT id, path, label, position, created_at FROM favorites ORDER BY position ASC, created_at ASC")?;
        let items = stmt.query_map([], |row| {
            Ok(FavoriteItem {
                id: row.get(0)?,
                path: row.get(1)?,
                label: row.get(2)?,
                position: row.get(3)?,
                created_at: row.get(4)?,
            })
        })?.filter_map(|r| r.ok()).collect();
        Ok(items)
    }

    pub fn add_favorite(&self, path: &str, label: &str) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        let id = format!("fav_{}", chrono::Utc::now().timestamp_millis());
        conn.execute(
            "INSERT INTO favorites (id, path, label) VALUES (?1, ?2, ?3)",
            params![id, path, label],
        )?;
        Ok(())
    }

    pub fn remove_favorite(&self, id: &str) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute("DELETE FROM favorites WHERE id = ?1", params![id])?;
        Ok(())
    }

    pub fn get_tags(&self) -> Result<Vec<TagItem>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare("SELECT id, name, color, created_at FROM tags ORDER BY name ASC")?;
        let items = stmt.query_map([], |row| {
            Ok(TagItem {
                id: row.get(0)?,
                name: row.get(1)?,
                color: row.get(2)?,
                created_at: row.get(3)?,
            })
        })?.filter_map(|r| r.ok()).collect();
        Ok(items)
    }

    pub fn set_file_tag(&self, path: &str, tag_id: &str) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT OR IGNORE INTO file_tags (path, tag_id) VALUES (?1, ?2)",
            params![path, tag_id],
        )?;
        Ok(())
    }

    pub fn remove_file_tag(&self, path: &str, tag_id: &str) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute("DELETE FROM file_tags WHERE path = ?1 AND tag_id = ?2", params![path, tag_id])?;
        Ok(())
    }

    pub fn get_file_tags(&self, path: &str) -> Result<Vec<TagItem>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT t.id, t.name, t.color, t.created_at
             FROM tags t
             JOIN file_tags ft ON t.id = ft.tag_id
             WHERE ft.path = ?1"
        )?;
        let items = stmt.query_map(params![path], |row| {
            Ok(TagItem {
                id: row.get(0)?,
                name: row.get(1)?,
                color: row.get(2)?,
                created_at: row.get(3)?,
            })
        })?.filter_map(|r| r.ok()).collect();
        Ok(items)
    }

    pub fn log_operation(&self, op_type: &str, source: &str, target: &str) -> Result<String> {
        let conn = self.conn.lock().unwrap();
        let id = format!("op_{}", chrono::Utc::now().timestamp_millis());
        let now = chrono::Utc::now().timestamp();
        conn.execute(
            "INSERT INTO operation_history (id, op_type, source_path, target_path, timestamp, undone) VALUES (?1, ?2, ?3, ?4, ?5, 0)",
            params![id, op_type, source, target, now],
        )?;
        Ok(id)
    }

    pub fn get_last_undoable_operation(&self) -> Result<Option<(String, String, String, String)>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, op_type, source_path, target_path
             FROM operation_history
             WHERE undone = 0 AND op_type IN ('rename', 'move', 'copy')
             ORDER BY timestamp DESC LIMIT 1"
        )?;
        let mut rows = stmt.query([])?;
        if let Some(row) = rows.next()? {
            Ok(Some((row.get(0)?, row.get(1)?, row.get(2)?, row.get(3)?)))
        } else {
            Ok(None)
        }
    }

    pub fn mark_operation_undone(&self, id: &str) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute("UPDATE operation_history SET undone = 1 WHERE id = ?1", params![id])?;
        Ok(())
    }
}
