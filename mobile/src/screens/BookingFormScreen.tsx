import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { BookingRepository } from '../data/bookings';
import { commonStyles, PrimaryButton } from './common';
import { type BookingField, useBookingFormScreen } from './useBookingFormScreen';

const FIELDS: { field: BookingField; label: string; hint: string }[] = [
  { field: 'date', label: 'Date (YYYY-MM-DD)', hint: 'Booking date' },
  { field: 'start', label: 'Start time (HH:MM)', hint: 'Start time' },
  { field: 'end', label: 'End time (HH:MM)', hint: 'End time' },
];

type Props = {
  repo: BookingRepository;
  courtId: string;
  courtName: string;
  onBooked: () => void;
};

export default function BookingFormScreen({ repo, courtId, courtName, onBooked }: Props) {
  const { state, onEvent } = useBookingFormScreen(repo, courtId, onBooked);
  const submitting = state.kind === 'submitting';

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {FIELDS.map(({ field, label, hint }) => (
          <View key={field} style={styles.field}>
            <Text style={styles.label}>{label}</Text>
            <TextInput
              accessibilityLabel={`${hint} for ${courtName}`}
              editable={!submitting}
              style={styles.input}
              value={state[field]}
              onChangeText={value => onEvent({ type: 'FieldChanged', field, value })}
            />
          </View>
        ))}
        {state.kind === 'editing' && state.error ? (
          <Text accessibilityRole="alert" style={styles.error}>⚠ {state.error}</Text>
        ) : null}
      </ScrollView>
      <View style={commonStyles.footer}>
        <PrimaryButton
          label={submitting ? 'Booking…' : 'Confirm booking'}
          accessibilityLabel={`Confirm booking for ${courtName}`}
          disabled={submitting}
          onPress={() => onEvent({ type: 'ConfirmTapped' })}
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
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    color: '#6b6375',
    marginBottom: 6,
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: '#6b6375',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 18,
    color: '#08060d',
  },
  error: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8b4444',
  },
});
