import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSyncExternalStore } from 'react';
import { AppContext } from '../AppContext';
import { createApp, createAuth } from '../data';

const auth = createAuth();
const app = { ...createApp(auth.getToken), auth };

export default function RootLayout() {
  const status = useSyncExternalStore(auth.subscribe, auth.status);

  if (status === 'loading') return null;

  return (
    <AppContext.Provider value={app}>
      <Stack>
        <Stack.Protected guard={status === 'signedIn'}>
          <Stack.Screen name="index" options={{ title: 'Badminton Courts' }} />
          <Stack.Screen name="book/[courtId]" options={{ title: 'Book a court' }} />
          <Stack.Screen name="bookings" options={{ title: 'My Bookings' }} />
        </Stack.Protected>
        <Stack.Protected guard={status === 'signedOut'}>
          <Stack.Screen name="sign-in" options={{ title: 'Sign in' }} />
        </Stack.Protected>
        <Stack.Screen name="callback" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
    </AppContext.Provider>
  );
}
