// The repository (Meeting 9): the only door to delivery data.
// Screens never import the transport or call fetch() themselves.
import type { Db } from './db';
import { drainOnce, enqueue, type Outcome } from './queue';
import type { Transport } from './transport';

export type Delivery = {
  id: string; student: string; place: string;
  status: 'pickedUp' | 'delivered'; pending: number;
};

export class DeliveryRepository {
  private running: Promise<void> | null = null;

  constructor(private db: Db, private transport: Transport) {}

  listToday(): Promise<Delivery[]> {
    return this.db.getAllAsync<Delivery>(`SELECT * FROM local_deliveries ORDER BY id`);
  }

  // Meeting 10: two writes, one transaction. No network call in here.
  async markDelivered(id: string): Promise<void> {
    await this.db.withExclusiveTransactionAsync(async txn => {
      await txn.runAsync(
        `UPDATE local_deliveries SET status = 'delivered', pending = 1 WHERE id = ?`, id);
      await enqueue(txn, 'delivery', id, 'markDelivered', { id });
    });
    void this.sync();                                     // drain soon; never awaited
  }

  // One drain at a time; a second call waits for the one already running.
  sync(): Promise<void> {
    this.running ??= drainOnce(this.db, this.transport, (row, outcome) =>
      this.settle(row.entity_id, outcome)).finally(() => { this.running = null; });
    return this.running;
  }

  private async settle(id: string, outcome: Outcome) {
    if (outcome === 'accepted') {
      await this.db.runAsync(`UPDATE local_deliveries SET pending = 0 WHERE id = ?`, id);
    }
    // TODO (your group): 'conflicting' → your conflict policy; 'permanent' → revert and tell.
  }
}
