// The state holder for signing in (Meeting 9), written as a React hook.
// Events go up (onEvent); one state value comes down.
import { useState } from 'react';
import type { Auth } from '../data/auth';

export type SignInState =
  | { kind: 'idle'; error: string | null }
  | { kind: 'signingIn' };

export type SignInEvent = { type: 'SignInTapped' };

export function useSignInScreen(auth: Auth) {
  const [state, setState] = useState<SignInState>({ kind: 'idle', error: null });

  const onEvent = async (e: SignInEvent) => {
    if (e.type !== 'SignInTapped' || state.kind === 'signingIn') return;
    setState({ kind: 'signingIn' });
    try {
      if (!(await auth.signIn())) setState({ kind: 'idle', error: null });
    } catch {
      setState({ kind: 'idle', error: 'We could not sign you in. Please check your connection and try again.' });
    }
  };

  return { state, onEvent };
}
