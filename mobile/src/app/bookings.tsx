import { router } from 'expo-router';
import { useApp } from '../AppContext';
import MyBookingsScreen from '../screens/MyBookingsScreen';

export default function MyBookingsRoute() {
  const { bookings } = useApp();
  return <MyBookingsScreen repo={bookings} onBookAnother={() => router.navigate('/')} />;
}
