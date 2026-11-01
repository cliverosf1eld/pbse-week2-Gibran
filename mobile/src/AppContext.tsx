// Hands the one App from the composition root to the route files.
import { createContext, useContext } from 'react';
import type { App } from './data';

export const AppContext = createContext<App | null>(null);

export function useApp(): App {
  const app = useContext(AppContext);
  if (!app) throw new Error('useApp must be used inside AppContext');
  return app;
}
