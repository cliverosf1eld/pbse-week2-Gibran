// The local database: the screens' source of truth (Meeting 10).
// local_deliveries is the worked example; rename it to your own group's entity.
import * as SQLite from 'expo-sqlite';

export type Db = SQLite.SQLiteDatabase;

export async function openKantinDb(): Promise<Db> {
  const db = await SQLite.openDatabaseAsync('kantin.db');
  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS local_deliveries (
      id       TEXT PRIMARY KEY,
      student  TEXT NOT NULL,
      place    TEXT NOT NULL,
      status   TEXT NOT NULL,              -- pickedUp | delivered
      pending  INTEGER NOT NULL DEFAULT 0  -- 1 = not yet confirmed by the server
    );

    CREATE TABLE IF NOT EXISTS mutation_queue (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      entity_type      TEXT NOT NULL,
      entity_id        TEXT NOT NULL,
      operation        TEXT NOT NULL,
      payload          TEXT NOT NULL,
      idempotency_key  TEXT NOT NULL,
      state            TEXT NOT NULL,
      attempts         INTEGER NOT NULL DEFAULT 0,
      next_attempt_at  INTEGER NOT NULL,
      last_error       TEXT,
      created_at       INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_queue_ready ON mutation_queue (state, next_attempt_at);
  `);
  return db;
}
