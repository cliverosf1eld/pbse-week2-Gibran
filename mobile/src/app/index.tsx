import { router, Stack } from 'expo-router';
import { useApp } from '../AppContext';
import { HeaderAction } from '../screens/common';
import CourtListScreen from '../screens/CourtListScreen';

export default function CourtListRoute() {
  const { auth, courts } = useApp();
  return (
    <>
      <Stack.Screen
        options={{ headerRight: () => <HeaderAction label="Sign out" onPress={auth.signOut} /> }}
      />
      <CourtListScreen
        repo={courts}
        onBook={court => router.push({
          pathname: '/book/[courtId]',
          params: { courtId: court.id, courtName: court.name },
        })}
      />
    </>
  );
}
