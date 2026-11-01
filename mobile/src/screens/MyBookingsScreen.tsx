import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Booking, BookingRepository } from '../data/bookings';
import { commonStyles, LoadingSkeleton, MessageState, PrimaryButton } from './common';
import { useMyBookingsScreen } from './useMyBookingsScreen';

const bookingStatusLabel = (status: string) => {
  switch (status) {
    case 'confirmed':
      return '✓ Confirmed';
    case 'cancelled':
      return '✕ Cancelled';
    default:
      return 'Other status';
  }
};

const timeLabel = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

type Props = {
  repo: BookingRepository;
  onBookAnother: () => void;
};

export default function MyBookingsScreen({ repo, onBookAnother }: Props) {
  const { state, onEvent } = useMyBookingsScreen(repo, onBookAnother);

  if (state.kind === 'loading') {
    return <LoadingSkeleton label="Loading your bookings" />;
  }

  if (state.kind === 'error') {
    return (
      <MessageState
        message={state.message}
        actionLabel="Retry"
        actionAccessibilityLabel="Retry loading your bookings"
        onAction={() => onEvent({ type: 'RefreshTapped' })}
      />
    );
  }

  if (state.kind === 'empty') {
    return (
      <MessageState
        message="You have no bookings yet."
        actionLabel="Book a court"
        onAction={() => onEvent({ type: 'BookAnotherTapped' })}
      />
    );
  }

  const renderBooking = ({ item }: { item: Booking }) => {
    const when = `${new Date(item.startTime).toLocaleDateString()}, ${timeLabel(item.startTime)} to ${timeLabel(item.endTime)}`;
    const status = bookingStatusLabel(item.status);

    return (
      <View
        accessible
        accessibilityLabel={`${item.courtName}, ${when}, ${status}`}
        style={commonStyles.card}
      >
        <Text style={commonStyles.name}>{item.courtName}</Text>
        <Text style={commonStyles.detail}>{when}</Text>
        <View style={commonStyles.badge}>
          <Text style={commonStyles.badgeText}>{status}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <FlatList
        contentContainerStyle={styles.content}
        data={state.items}
        keyExtractor={item => item.id}
        renderItem={renderBooking}
      />
      <View style={commonStyles.footer}>
        <PrimaryButton
          label="Book another court"
          onPress={() => onEvent({ type: 'BookAnotherTapped' })}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    padding: 24,
  },
});
