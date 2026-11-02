// The door to the signed-in user. Screens see this interface, never tokens or Keycloak.
export type AuthStatus = 'loading' | 'signedOut' | 'signedIn';

export interface Auth {
  status: () => AuthStatus;
  subscribe: (listener: () => void) => () => void;
  signIn: () => Promise<boolean>;                // false when the user cancelled
  signOut: () => Promise<void>;
  getToken: () => Promise<string | null>;
}

// For the local Prism mock server, which accepts any bearer token.
export class MockAuth implements Auth {
  private current: AuthStatus = 'signedIn';
  private listeners = new Set<() => void>();

  private set(status: AuthStatus) {
    this.current = status;
    this.listeners.forEach(listener => listener());
  }

  status = () => this.current;

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  };

  signIn = async () => {
    this.set('signedIn');
    return true;
  };

  signOut = async () => { this.set('signedOut'); };

  getToken = async () => 'mock-token';
}
