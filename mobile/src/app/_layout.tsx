import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AppContext } from '../AppContext';
import { createApp } from '../data';

// For the local Prism mock server only. Real sign-in replaces this in Step 2.5.
const app = createApp(async () => 'mock-token');

export default function RootLayout() {
  return (
    <AppContext.Provider value={app}>
      <Stack>
        <Stack.Screen name="index" options={{ title: 'Badminton Courts' }} />
        <Stack.Screen name="book/[courtId]" options={{ title: 'Book a court' }} />
        <Stack.Screen name="bookings" options={{ title: 'My Bookings' }} />
      </Stack>
      <StatusBar style="auto" />
    </AppContext.Provider>
  );
}
