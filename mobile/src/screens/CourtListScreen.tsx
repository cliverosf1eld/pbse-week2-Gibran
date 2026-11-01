import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Court, CourtRepository } from '../data/courts';
import { commonStyles, LoadingSkeleton, MessageState, PrimaryButton } from './common';
import { isBookable, useCourtListScreen } from './useCourtListScreen';

const courtTypeLabel = (type: string) => {
  switch (type) {
    case 'indoor':
      return 'Indoor';
    case 'outdoor':
      return 'Outdoor';
    default:
      return 'Other court type';
  }
};

const courtStatusLabel = (status: string) => {
  switch (status) {
    case 'active':
      return 'Active';
    case 'retired':
      return 'Retired';
    default:
      return 'Other status';
  }
};

type Props = {
  repo: CourtRepository;
  onBook: (court: Court) => void;
};

export default function CourtListScreen({ repo, onBook }: Props) {
  const { state, onEvent } = useCourtListScreen(repo, onBook);

  if (state.kind === 'loading') {
    return <LoadingSkeleton label="Loading courts" />;
  }

  if (state.kind === 'error') {
    return (
      <MessageState
        message={state.message}
        actionLabel="Retry"
        actionAccessibilityLabel="Retry loading the courts"
        onAction={() => onEvent({ type: 'RefreshTapped' })}
      />
    );
  }

  if (state.kind === 'empty') {
    return (
      <MessageState
        message="No courts are currently available."
        actionLabel="Check again"
        actionAccessibilityLabel="Check again for courts"
        onAction={() => onEvent({ type: 'RefreshTapped' })}
      />
    );
  }

  const selected = state.items.find(court => court.id === state.selectedId);

  const renderCourt = ({ item }: { item: Court }) => {
    const bookable = isBookable(item);
    const isSelected = item.id === state.selectedId;
    const availability = bookable ? 'Available' : 'Unavailable';
    const details = `${courtTypeLabel(item.courtType)} · ${courtStatusLabel(item.status)}`;

    return (
      <Pressable
        accessibilityRole="radio"
        accessibilityLabel={`${item.name}, ${item.location}, ${details}, ${availability}`}
        accessibilityState={{ checked: isSelected, disabled: !bookable }}
        disabled={!bookable}
        style={[commonStyles.card, isSelected && styles.selectedCard]}
        onPress={() => onEvent({ type: 'CourtTapped', id: item.id })}
      >
        <Text style={commonStyles.name}>{item.name}</Text>
        <Text style={commonStyles.detail}>{item.location}</Text>
        <Text style={commonStyles.detail}>{details}</Text>
        <View style={commonStyles.badge}>
          <Text style={commonStyles.badgeText}>
            {isSelected ? '✓ Selected' : availability}
          </Text>
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <FlatList
        contentContainerStyle={styles.content}
        data={state.items}
        keyExtractor={item => item.id}
        renderItem={renderCourt}
        ListHeaderComponent={
          <Text style={styles.subtitle}>Choose a court at your sports hall.</Text>
        }
      />
      <View style={commonStyles.footer}>
        <PrimaryButton
          label={selected ? `Book ${selected.name}` : 'Choose a court first'}
          disabled={!selected}
          onPress={() => onEvent({ type: 'BookTapped' })}
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
  subtitle: {
    fontSize: 17,
    color: '#6b6375',
    marginBottom: 20,
  },
  selectedCard: {
    borderWidth: 3,
    borderColor: '#08060d',
  },
});
