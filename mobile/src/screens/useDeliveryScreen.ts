// The state holder for one screen (Meeting 9), written as a React hook.
// Events go up (onEvent); one state value comes down. It never sets status itself.
import { useEffect, useState } from 'react';
import type { DeliveryRepository } from '../data/deliveries';

export type DeliveryState =
  | { kind: 'loading' }
  | { kind: 'ready'; name: string; pending: boolean; canMarkDelivered: boolean };

export type DeliveryEvent = { type: 'DeliveredTapped' };

async function read(repo: DeliveryRepository, id: string): Promise<DeliveryState> {
  const d = (await repo.listToday()).find(x => x.id === id);
  if (!d) return { kind: 'loading' };
  return { kind: 'ready', name: d.student, pending: d.pending === 1,
           canMarkDelivered: d.status === 'pickedUp' };
}

export function useDeliveryScreen(repo: DeliveryRepository, id: string) {
  const [state, setState] = useState<DeliveryState>({ kind: 'loading' });

  useEffect(() => { read(repo, id).then(setState); }, [repo, id]);

  const onEvent = async (e: DeliveryEvent) => {
    if (e.type === 'DeliveredTapped') await repo.markDelivered(id);
    setState(await read(repo, id));       // the new state comes from the database
  };

  return { state, onEvent };
}
