// The repository (Meeting 9): the only door to booking data.
// Screens never import the transport or call fetch() themselves.
import * as Crypto from 'expo-crypto';
import type { CourtRepository } from './courts';
import type { Transport } from './transport';

export type NewBooking = { courtId: string; startTime: string; endTime: string };

// A booking only carries courtId, so the repository adds the name the screen displays.
export type Booking = NewBooking & { id: string; status: string; courtName: string };

// The server answered and said no (409, 422): the message is safe to show the user.
export class BookingRefused extends Error {}

export class BookingRepository {
  // The intent still without an answer: pressing Confirm again retries it with the same key.
  private unanswered: { body: string; key: string } | null = null;

  constructor(private transport: Transport, private courts: CourtRepository) {}

  async listMine(): Promise<Booking[]> {
    const [reply, courts] = await Promise.all([
      this.transport.call('listBookings', undefined, {}),
      this.courts.list(),
    ]);
    if (!reply.ok) throw new Error(`listBookings failed (${reply.status})`);
    const items = (reply.body as { items?: Omit<Booking, 'courtName'>[] }).items ?? [];
    return items.map(b => ({
      ...b,
      courtName: courts.find(c => c.id === b.courtId)?.name ?? 'Unknown court',
    }));
  }

  async create(booking: NewBooking): Promise<void> {
    const body = JSON.stringify(booking);
    const key = this.unanswered?.body === body ? this.unanswered.key : Crypto.randomUUID();
    this.unanswered = { body, key };

    const reply = await this.transport.call('createBooking', booking, { 'Idempotency-Key': key });
    if (reply.ok) {
      this.unanswered = null;
      return;
    }
    if (reply.status === 409 || reply.status === 422) {
      this.unanswered = null;
      const problem = reply.body as { title?: string } | null;
      throw new BookingRefused(problem?.title ?? 'This booking was refused.');
    }
    throw new Error(`createBooking failed (${reply.status})`);
  }
}
