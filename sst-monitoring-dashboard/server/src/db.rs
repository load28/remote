use rusqlite::{Connection, params};
use std::sync::{Arc, Mutex};

use crate::models::auth::{User, UserRole, UserStatus};

pub type Db = Arc<Mutex<Connection>>;

pub fn init_db() -> Db {
    let conn = Connection::open("sst_monitor.db").expect("Failed to open database");

    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'user',
            status TEXT NOT NULL DEFAULT 'pending_verification',
            email_verification_token TEXT,
            email_verified_at TEXT,
            approved_at TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );",
    )
    .expect("Failed to create users table");

    // Seed admin user if none exists
    let admin_count: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM users WHERE role = 'admin'",
            [],
            |row| row.get(0),
        )
        .unwrap_or(0);

    if admin_count == 0 {
        let id = uuid::Uuid::new_v4().to_string();
        let password_hash = bcrypt::hash("admin123!", bcrypt::DEFAULT_COST).unwrap();
        conn.execute(
            "INSERT INTO users (id, email, password_hash, role, status, email_verified_at, approved_at)
             VALUES (?1, ?2, ?3, 'admin', 'active', datetime('now'), datetime('now'))",
            params![id, "admin@sst-monitor.local", password_hash],
        )
        .expect("Failed to seed admin user");
        tracing::info!("Seeded default admin user: admin@sst-monitor.local / admin123!");
    }

    Arc::new(Mutex::new(conn))
}

pub fn create_user(db: &Db, email: &str, password_hash: &str, verification_token: &str) -> Result<User, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;

    // Check if email already exists
    let exists: bool = conn
        .query_row(
            "SELECT COUNT(*) > 0 FROM users WHERE email = ?1",
            params![email],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;

    if exists {
        return Err("Email already registered".to_string());
    }

    let id = uuid::Uuid::new_v4().to_string();
    conn.execute(
        "INSERT INTO users (id, email, password_hash, email_verification_token) VALUES (?1, ?2, ?3, ?4)",
        params![id, email, password_hash, verification_token],
    )
    .map_err(|e| e.to_string())?;

    get_user_by_id_inner(&conn, &id)
}

pub fn verify_email(db: &Db, token: &str) -> Result<User, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;

    let user_id: String = conn
        .query_row(
            "SELECT id FROM users WHERE email_verification_token = ?1 AND status = 'pending_verification'",
            params![token],
            |row| row.get(0),
        )
        .map_err(|_| "Invalid or expired verification token".to_string())?;

    conn.execute(
        "UPDATE users SET status = 'pending_approval', email_verified_at = datetime('now'), email_verification_token = NULL WHERE id = ?1",
        params![user_id],
    )
    .map_err(|e| e.to_string())?;

    get_user_by_id_inner(&conn, &user_id)
}

pub fn get_user_by_email(db: &Db, email: &str) -> Result<User, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    conn.query_row(
        "SELECT id, email, password_hash, role, status, email_verified_at, approved_at, created_at FROM users WHERE email = ?1",
        params![email],
        |row| Ok(map_user_row(row)),
    )
    .map_err(|_| "User not found".to_string())
}

pub fn get_user_by_id(db: &Db, id: &str) -> Result<User, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    get_user_by_id_inner(&conn, id)
}

fn get_user_by_id_inner(conn: &Connection, id: &str) -> Result<User, String> {
    conn.query_row(
        "SELECT id, email, password_hash, role, status, email_verified_at, approved_at, created_at FROM users WHERE id = ?1",
        params![id],
        |row| Ok(map_user_row(row)),
    )
    .map_err(|_| "User not found".to_string())
}

pub fn list_users(db: &Db) -> Result<Vec<User>, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT id, email, password_hash, role, status, email_verified_at, approved_at, created_at FROM users ORDER BY created_at DESC")
        .map_err(|e| e.to_string())?;

    let users = stmt
        .query_map([], |row| Ok(map_user_row(row)))
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    Ok(users)
}

pub fn approve_user(db: &Db, user_id: &str) -> Result<User, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;

    let affected = conn
        .execute(
            "UPDATE users SET status = 'active', approved_at = datetime('now') WHERE id = ?1 AND status = 'pending_approval'",
            params![user_id],
        )
        .map_err(|e| e.to_string())?;

    if affected == 0 {
        return Err("User not found or not in pending approval status".to_string());
    }

    get_user_by_id_inner(&conn, user_id)
}

pub fn reject_user(db: &Db, user_id: &str) -> Result<(), String> {
    let conn = db.lock().map_err(|e| e.to_string())?;

    let affected = conn
        .execute(
            "UPDATE users SET status = 'rejected' WHERE id = ?1 AND status = 'pending_approval'",
            params![user_id],
        )
        .map_err(|e| e.to_string())?;

    if affected == 0 {
        return Err("User not found or not in pending approval status".to_string());
    }

    Ok(())
}

fn map_user_row(row: &rusqlite::Row) -> User {
    User {
        id: row.get(0).unwrap(),
        email: row.get(1).unwrap(),
        password_hash: row.get(2).unwrap(),
        role: match row.get::<_, String>(3).unwrap().as_str() {
            "admin" => UserRole::Admin,
            _ => UserRole::User,
        },
        status: match row.get::<_, String>(4).unwrap().as_str() {
            "pending_verification" => UserStatus::PendingVerification,
            "pending_approval" => UserStatus::PendingApproval,
            "active" => UserStatus::Active,
            "rejected" => UserStatus::Rejected,
            _ => UserStatus::PendingVerification,
        },
        email_verified_at: row.get(5).unwrap(),
        approved_at: row.get(6).unwrap(),
        created_at: row.get(7).unwrap(),
    }
}
