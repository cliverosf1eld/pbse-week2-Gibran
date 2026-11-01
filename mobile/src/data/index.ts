// The composition root (Meeting 9): the only place that chooses implementations.
import { openKantinDb } from './db';
import { DeliveryRepository } from './deliveries';
import { recoverInflight } from './queue';
import { FaultyTransport, HttpTransport } from './transport';

export async function createApp(getToken: () => Promise<string | null>) {
  const db = await openKantinDb();
  await recoverInflight(db);                              // a kill mid-request: retry it

  const http = new HttpTransport(getToken);
  const transport = __DEV__ ? new FaultyTransport(http) : http;  // debug menu: dev only

  const deliveries = new DeliveryRepository(db, transport);
  void deliveries.sync();                                 // drain on start-up
  return { transport, deliveries };
}
