import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useApp } from '../../AppContext';
import BookingFormScreen from '../../screens/BookingFormScreen';

export default function BookingFormRoute() {
  const { bookings } = useApp();
  const { courtId, courtName } = useLocalSearchParams<{ courtId: string; courtName: string }>();
  return (
    <>
      <Stack.Screen options={{ title: `Book ${courtName}` }} />
      <BookingFormScreen
        repo={bookings}
        courtId={courtId}
        courtName={courtName}
        onBooked={() => router.replace('/bookings')}
      />
    </>
  );
}
