import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
    if (_db) return _db;

    const dbPath = process.env.DB_PATH || './data/app.db';
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    _db = new Database(dbPath);
    _db.pragma('journal_mode = WAL');

    _db.exec(`
        CREATE TABLE IF NOT EXISTS usage_counter (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            count INTEGER NOT NULL DEFAULT 0,
            reset_at INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS analysis_cache (
            video_id TEXT PRIMARY KEY,
            result_json TEXT NOT NULL,
            created_at INTEGER NOT NULL
        );

        INSERT OR IGNORE INTO usage_counter (id, count, reset_at)
        VALUES (1, 0, ${new Date().setHours(24, 0, 0, 0)});
    `);

    return _db;
}
