import { router } from 'expo-router';
import { useApp } from '../AppContext';
import CourtListScreen from '../screens/CourtListScreen';

export default function CourtListRoute() {
  const { courts } = useApp();
  return (
    <CourtListScreen
      repo={courts}
      onBook={court => router.push({
        pathname: '/book/[courtId]',
        params: { courtId: court.id, courtName: court.name },
      })}
    />
  );
}
