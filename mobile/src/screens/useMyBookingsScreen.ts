// The state holder for my bookings (Meeting 9), written as a React hook.
// Events go up (onEvent); one state value comes down.
import { useEffect, useState } from 'react';
import type { Booking, BookingRepository } from '../data/bookings';

export type MyBookingsState =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'empty' }
  | { kind: 'content'; items: Booking[] };

export type MyBookingsEvent =
  | { type: 'RefreshTapped' }
  | { type: 'BookAnotherTapped' };

async function read(repo: BookingRepository): Promise<MyBookingsState> {
  try {
    const items = await repo.listMine();
    return items.length === 0 ? { kind: 'empty' } : { kind: 'content', items };
  } catch {
    return { kind: 'error', message: 'We could not load your bookings. Please check your connection.' };
  }
}

export function useMyBookingsScreen(repo: BookingRepository, onBookAnother: () => void) {
  const [state, setState] = useState<MyBookingsState>({ kind: 'loading' });

  useEffect(() => { read(repo).then(setState); }, [repo]);

  const onEvent = (e: MyBookingsEvent) => {
    if (e.type === 'BookAnotherTapped') {
      onBookAnother();
    } else {
      setState({ kind: 'loading' });
      read(repo).then(setState);
    }
  };

  return { state, onEvent };
}
