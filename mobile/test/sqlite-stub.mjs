// Minimal expo-sqlite surface over node:sqlite, enough for the starter's data layer.
import { DatabaseSync } from 'node:sqlite';

const flat = params => (params.length === 1 && Array.isArray(params[0]) ? params[0] : params);

export async function openDatabaseAsync() {
  const raw = new DatabaseSync(':memory:');
  const db = {
    raw,
    async execAsync(sql) { raw.exec(sql); },
    async runAsync(sql, ...params) {
      const r = raw.prepare(sql).run(...flat(params));
      return { changes: r.changes, lastInsertRowId: r.lastInsertRowid };
    },
    async getAllAsync(sql, ...params) { return raw.prepare(sql).all(...flat(params)); },
    async withExclusiveTransactionAsync(task) {
      raw.exec('BEGIN EXCLUSIVE');
      try { await task(db); raw.exec('COMMIT'); } catch (e) { raw.exec('ROLLBACK'); throw e; }
    },
  };
  return db;
}
