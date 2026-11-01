// The state holder for the court list (Meeting 9), written as a React hook.
// Events go up (onEvent); one state value comes down.
import { useEffect, useState } from 'react';
import type { Court, CourtRepository } from '../data/courts';

export type CourtListState =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'empty' }
  | { kind: 'content'; items: Court[]; selectedId: string | null };

export type CourtListEvent =
  | { type: 'RefreshTapped' }
  | { type: 'CourtTapped'; id: string }
  | { type: 'BookTapped' };

// Only a court that is active and available can be booked (openapi.yaml, listCourts).
export function isBookable(court: Court) {
  return court.status === 'active' && court.isAvailable;
}

async function read(repo: CourtRepository): Promise<CourtListState> {
  try {
    const items = await repo.list();
    return items.length === 0 ? { kind: 'empty' } : { kind: 'content', items, selectedId: null };
  } catch {
    return { kind: 'error', message: 'We could not load the courts. Please check your connection.' };
  }
}

export function useCourtListScreen(repo: CourtRepository, onBook: (court: Court) => void) {
  const [state, setState] = useState<CourtListState>({ kind: 'loading' });

  useEffect(() => { read(repo).then(setState); }, [repo]);

  const onEvent = (e: CourtListEvent) => {
    if (e.type === 'RefreshTapped') {
      setState({ kind: 'loading' });
      read(repo).then(setState);
    } else if (state.kind === 'content') {
      if (e.type === 'CourtTapped') {
        const court = state.items.find(c => c.id === e.id);
        if (court && isBookable(court)) setState({ ...state, selectedId: e.id });
      } else {
        const court = state.items.find(c => c.id === state.selectedId);
        if (court) onBook(court);
      }
    }
  };

  return { state, onEvent };
}
