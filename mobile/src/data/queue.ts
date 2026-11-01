// The mutation queue (Meeting 10): enqueue in the caller's transaction, drain later.
import * as Crypto from 'expo-crypto';
import type { Db } from './db';
import { NetworkError, type Reply, type Transport } from './transport';

type Txn = Pick<Db, 'runAsync'>;

type QueueRow = {
  id: number; entity_type: string; entity_id: string; operation: string;
  payload: string; idempotency_key: string; attempts: number;
};

// Called inside the same transaction as the optimistic local change.
// The key is generated here, at tap time, and reused on every attempt.
export async function enqueue(txn: Txn, entityType: string, entityId: string,
                              operation: string, payload: unknown) {
  const now = Date.now();
  await txn.runAsync(
    `INSERT INTO mutation_queue (entity_type, entity_id, operation, payload,
       idempotency_key, state, next_attempt_at, created_at)
     VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)`,
    entityType, entityId, operation, JSON.stringify(payload),
    Crypto.randomUUID(), now, now);
}

export function nextDelayMs(attempts: number): number {
  const BASE = 1000, CAP = 5 * 60 * 1000;
  const ceiling = Math.min(CAP, BASE * 2 ** attempts);
  return Math.random() * ceiling;                       // full jitter
}

export type Outcome = 'accepted' | 'retryable' | 'conflicting' | 'permanent';

// TODO (your group): name the permanent refusals your openapi.yaml documents.
export function classify(reply: Reply | 'noReply'): Outcome {
  if (reply === 'noReply') return 'retryable';          // ambiguous: retry, same key
  if (reply.ok) return 'accepted';
  if (reply.status === 409 || reply.status === 412) return 'conflicting';
  if ([408, 429].includes(reply.status) || reply.status >= 500) return 'retryable';
  return 'permanent';
}

// At start-up: a row left 'inflight' means the app died mid-request. We cannot know
// whether the server acted, so it goes back in line; the same key makes that safe.
export async function recoverInflight(db: Db) {
  await db.runAsync(`UPDATE mutation_queue SET state = 'failed' WHERE state = 'inflight'`);
}

// One pass: the oldest ready row of each entity lane, so one stuck lane blocks nothing else.
export async function drainOnce(db: Db, transport: Transport, onSettled: (row: QueueRow,
                                outcome: Outcome) => Promise<void>) {
  const rows = await db.getAllAsync<QueueRow>(
    `SELECT * FROM mutation_queue q
      WHERE state IN ('pending', 'failed') AND next_attempt_at <= ?
        AND id = (SELECT MIN(id) FROM mutation_queue
                   WHERE entity_type = q.entity_type AND entity_id = q.entity_id
                     AND state != 'done')`, Date.now());

  for (const row of rows) {
    await db.runAsync(`UPDATE mutation_queue SET state = 'inflight' WHERE id = ?`, row.id);
    let reply: Reply | 'noReply';
    try {
      reply = await transport.call(row.operation, JSON.parse(row.payload),
                                   { 'Idempotency-Key': row.idempotency_key });
    } catch (e) {
      if (!(e instanceof NetworkError)) throw e;
      reply = 'noReply';
    }
    const outcome = classify(reply);
    if (outcome === 'retryable') {
      await db.runAsync(
        `UPDATE mutation_queue SET state = 'failed', attempts = attempts + 1,
           next_attempt_at = ?, last_error = ? WHERE id = ?`,
        Date.now() + nextDelayMs(row.attempts + 1),
        reply === 'noReply' ? 'no reply' : `HTTP ${reply.status}`, row.id);
    } else {
      await db.runAsync(`UPDATE mutation_queue SET state = 'done' WHERE id = ?`, row.id);
      await onSettled(row, outcome);
    }
  }
}
