// Run with: npm run test:queue  (Node 22.15+; uses Node's built-in SQLite in place of expo-sqlite)
// Exercises the starter's real queue code: lost reply, restart mid-flight, one stuck lane.
import { registerHooks } from 'node:module';
const here = new URL('./', import.meta.url);
registerHooks({ resolve(spec, ctx, next) {
  if (spec === 'expo-sqlite') return { url: new URL('sqlite-stub.mjs', here).href, shortCircuit: true };
  if (spec === 'expo-crypto') return { url: new URL('crypto-stub.mjs', here).href, shortCircuit: true };
  return next(spec, ctx);
} });
import assert from 'node:assert/strict';
const { openKantinDb } = await import('../src/data/db.ts');
const { DeliveryRepository } = await import('../src/data/deliveries.ts');
const { recoverInflight } = await import('../src/data/queue.ts');
const { FaultyTransport } = await import('../src/data/transport.ts');

// A server that honours Idempotency-Key, and can be told to fail some entities with 503.
function fakeServer(stuck = new Set<string>()) {
  const seen = new Set<string>();
  const transitions: string[] = [];
  const t: any = {
    async call(_op: string, body: any, headers: Record<string, string>) {
      if (stuck.has(body.id)) return { ok: false, status: 503, body: null };
      const key = headers['Idempotency-Key'];
      if (!seen.has(key)) { seen.add(key); transitions.push(body.id); }
      return { ok: true, status: 200, body: { id: body.id } };
    },
  };
  return { t, transitions };
}

async function setup(ids: string[]) {
  const db = await openKantinDb();
  for (const id of ids)
    await db.runAsync(`INSERT INTO local_deliveries VALUES (?, 'Rizky', 'Library', 'pickedUp', 0)`, id);
  return db;
}
const makeReady = (db: any) => db.runAsync(`UPDATE mutation_queue SET next_attempt_at = 0`);
const idle = async (repo: any) => { await repo.sync(); };   // wait for any drain already running

// 1 · lost reply: the server acts, the phone never hears, the retry must not duplicate.
{
  const db = await setup(['dlv_9Zx']);
  const server = fakeServer();
  const faulty = new FaultyTransport(server.t);
  const repo = new DeliveryRepository(db, faulty);
  faulty.mode = 'offline';
  await repo.markDelivered('dlv_9Zx');                        // must not throw offline
  await idle(repo);
  let [d] = await repo.listToday();
  assert.equal(d.status, 'delivered'); assert.equal(d.pending, 1);
  faulty.mode = 'lostReply';
  await makeReady(db); await repo.sync();
  faulty.mode = 'ok';
  await makeReady(db); await repo.sync();
  assert.deepEqual(server.transitions, ['dlv_9Zx'], 'exactly one transition on the server');
  [d] = await repo.listToday();
  assert.equal(d.pending, 0, 'pending marker clears');
  console.log('PASS lostReply → one transition, marker cleared');
}

// 2 · app killed while a row is inflight: it must be retried after restart, same key.
{
  const db = await setup(['dlv_3Rb']);
  const server = fakeServer();
  const faulty = new FaultyTransport(server.t);
  faulty.mode = 'offline';
  const repo = new DeliveryRepository(db, faulty);
  await repo.markDelivered('dlv_3Rb');
  await idle(repo);
  await db.runAsync(`UPDATE mutation_queue SET state = 'inflight'`);  // the kill
  await recoverInflight(db);                                         // the restart
  faulty.mode = 'ok';
  await makeReady(db); await repo.sync();
  assert.deepEqual(server.transitions, ['dlv_3Rb']);
  console.log('PASS restart with an inflight row → drained once');
}

// 3 · two mutations on one entity stay ordered; a stuck entity blocks nothing else.
{
  const db = await setup(['dlv_A', 'dlv_B']);
  const server = fakeServer(new Set(['dlv_B']));
  const faulty = new FaultyTransport(server.t);
  faulty.mode = 'offline';
  const repo = new DeliveryRepository(db, faulty);
  await repo.markDelivered('dlv_B');
  await repo.markDelivered('dlv_A');
  await repo.markDelivered('dlv_A');                          // second mutation, same lane
  await idle(repo);
  faulty.mode = 'ok';
  await makeReady(db); await repo.sync();                     // exactly one pass
  const rows = await db.getAllAsync<any>(`SELECT entity_id, state FROM mutation_queue ORDER BY id`);
  assert.deepEqual(rows.map((r: any) => `${r.entity_id}:${r.state}`),
                   ['dlv_B:failed', 'dlv_A:done', 'dlv_A:pending']);   // never sent: waits its turn
  assert.deepEqual(server.transitions, ['dlv_A'], 'A drained despite B being stuck');
  console.log('PASS one stuck lane blocks nothing; same-entity rows wait their turn');
}
