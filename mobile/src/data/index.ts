// The composition root (Meeting 9): the only place that chooses implementations.
import { BookingRepository } from './bookings';
import { CourtRepository } from './courts';
import { FaultyTransport, HttpTransport } from './transport';

export function createApp(getToken: () => Promise<string | null>) {
  const http = new HttpTransport(getToken);
  const transport = __DEV__ ? new FaultyTransport(http) : http;  // debug menu: dev only

  const courts = new CourtRepository(transport);
  const bookings = new BookingRepository(transport, courts);
  return { transport, courts, bookings };
}

export type App = ReturnType<typeof createApp>;
