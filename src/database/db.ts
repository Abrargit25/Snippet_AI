import { openDatabaseSync, type SQLiteDatabase } from 'expo-sqlite';

let db: SQLiteDatabase | null = null;

export function getDb(): SQLiteDatabase {
  if (!db) db = openDatabaseSync('devsnippets.db');
  return db;
}

export async function initDb(): Promise<void> {
  await getDb().execAsync(`
    CREATE TABLE IF NOT EXISTS snippets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      code_content TEXT NOT NULL DEFAULT '',
      language TEXT NOT NULL,
      ai_explanation TEXT,
      is_favorite INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      tags TEXT NOT NULL DEFAULT '[]'
    );
  `);
  try {
    await getDb().execAsync('ALTER TABLE snippets ADD COLUMN image_uri TEXT');
  } catch {
    /* column exists */
  }
}
