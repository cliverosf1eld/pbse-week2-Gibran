// The repository (Meeting 9): the only door to court data.
// Screens never import the transport or call fetch() themselves.
import type { Transport } from './transport';

// Only the fields the app displays; unknown fields are ignored.
export type Court = {
  id: string; name: string; location: string;
  courtType: string; isAvailable: boolean; status: string;
};

export class CourtRepository {
  constructor(private transport: Transport) {}

  async list(): Promise<Court[]> {
    const reply = await this.transport.call('listCourts', undefined, {});
    if (!reply.ok) throw new Error(`listCourts failed (${reply.status})`);
    return (reply.body as { items?: Court[] }).items ?? [];
  }
}
