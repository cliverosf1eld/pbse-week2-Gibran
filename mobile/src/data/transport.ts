// The seam (Meetings 9 and 10): every request leaves the app through a Transport.
// The app injects HttpTransport; a test or the debug menu injects FaultyTransport.
import { API_BASE_URL } from '../config';

export type Reply = { ok: boolean; status: number; body: unknown };

export interface Transport {
  call(operation: string, body: unknown, headers: Record<string, string>): Promise<Reply>;
}

export class NetworkError extends Error {}

// One entry per operation the app calls, from openapi.yaml.
const ROUTES: Record<string, (body: any) => { method: string; path: string }> = {
  listCourts: () => ({ method: 'GET', path: '/courts?limit=100' }),
  listBookings: () => ({ method: 'GET', path: '/bookings?limit=100' }),
  createBooking: () => ({ method: 'POST', path: '/bookings' }),
};

export class HttpTransport implements Transport {
  constructor(private getToken: () => Promise<string | null>) {}

  async call(operation: string, body: unknown, headers: Record<string, string>) {
    const route = ROUTES[operation](body);
    const token = await this.getToken();
    let res: Response;
    try {
      res = await fetch(API_BASE_URL + route.path, {
        method: route.method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...headers,
        },
        body: JSON.stringify(body),
      });
    } catch {
      throw new NetworkError();                 // no reply at all: ambiguous
    }
    const text = await res.text();
    return { ok: res.ok, status: res.status, body: text ? JSON.parse(text) : null };
  }
}

export type FaultMode = 'ok' | 'offline' | 'server500' | 'timeout' | 'lostReply';

export class FaultyTransport implements Transport {
  mode: FaultMode = 'ok';
  constructor(private real: Transport) {}

  async call(operation: string, body: unknown, headers: Record<string, string>) {
    switch (this.mode) {
      case 'offline':   throw new NetworkError();
      case 'server500': return { ok: false, status: 503, body: null };
      case 'timeout':   return new Promise<Reply>(() => {});   // never answers
      case 'lostReply': await this.real.call(operation, body, headers);
                        throw new NetworkError();                // the server DID act
      default:          return this.real.call(operation, body, headers);
    }
  }
}
