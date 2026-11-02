// The composition root (Meeting 9): the only place that chooses implementations.
import { KEYCLOAK_URL } from '../config';
import { type Auth, MockAuth } from './auth';
import { BookingRepository } from './bookings';
import { CourtRepository } from './courts';
import { KeycloakAuth } from './keycloak';
import { FaultyTransport, HttpTransport } from './transport';

export function createAuth(): Auth {
  return KEYCLOAK_URL ? new KeycloakAuth(KEYCLOAK_URL) : new MockAuth();
}

export function createApp(getToken: () => Promise<string | null>) {
  const http = new HttpTransport(getToken);
  const transport = __DEV__ ? new FaultyTransport(http) : http;  // debug menu: dev only

  const courts = new CourtRepository(transport);
  const bookings = new BookingRepository(transport, courts);
  return { transport, courts, bookings };
}

export type App = ReturnType<typeof createApp> & { auth: Auth };
