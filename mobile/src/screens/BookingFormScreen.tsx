import { KeyboardAvoidingView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BookingRepository } from '../data/bookings';
import { commonStyles, PrimaryButton } from './common';
import { type BookingField, useBookingFormScreen } from './useBookingFormScreen';

// The navigation header sits above this screen, so the keyboard offset must include it.
const HEADER_HEIGHT = 56;

const FIELDS: { field: BookingField; label: string }[] = [
  { field: 'date', label: 'Date (YYYY-MM-DD)' },
  { field: 'start', label: 'Start time (HH:MM)' },
  { field: 'end', label: 'End time (HH:MM)' },
];

type Props = {
  repo: BookingRepository;
  courtId: string;
  courtName: string;
  onBooked: () => void;
};

export default function BookingFormScreen({ repo, courtId, courtName, onBooked }: Props) {
  const { state, onEvent } = useBookingFormScreen(repo, courtId, onBooked);
  const insets = useSafeAreaInsets();
  const submitting = state.kind === 'submitting';

  return (
    <SafeAreaView style={commonStyles.fill} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior="padding"
        keyboardVerticalOffset={insets.top + HEADER_HEIGHT}
        style={commonStyles.fill}
      >
        <ScrollView contentContainerStyle={commonStyles.scrollContent} keyboardShouldPersistTaps="handled">
          {FIELDS.map(({ field, label }) => (
            <View key={field} style={styles.field}>
              <Text style={styles.label}>{label}</Text>
              <TextInput
                accessibilityLabel={`${label} for ${courtName}`}
                editable={!submitting}
                style={styles.input}
                value={state[field]}
                onChangeText={value => onEvent({ type: 'FieldChanged', field, value })}
              />
            </View>
          ))}
          {state.kind === 'editing' && state.error ? (
            <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.error}>
              ⚠ {state.error}
            </Text>
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
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
