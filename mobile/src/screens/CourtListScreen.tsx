
import { useEffect, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { API_BASE_URL } from '../config';

type Court = {
  id: string;
  name: string;
  location: string;
  courtType: string;
  isAvailable: boolean;
  status: string;
};

type ViewState =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'empty' }
  | { kind: 'content'; items: Court[] };

async function loadCourts(): Promise<ViewState> {
  try {
    const response = await fetch(`${API_BASE_URL}/courts`, {
      headers: {
        // For the local Prism mock server only.
        // Session 9 will add real Keycloak authentication.
        Authorization: 'Bearer mock-token',
      },
    });

    if (!response.ok) {
      throw new Error(`Request failed (${response.status})`);
    }

    const body: { items?: Court[] } = await response.json();
    const courts = body.items ?? [];
    return courts.length === 0
      ? { kind: 'empty' }
      : { kind: 'content', items: courts };
  } catch {
    return {
      kind: 'error',
      message: 'We could not load the courts. Please check your connection.',
    };
  }
}

export default function CourtListScreen() {
  const [state, setState] = useState<ViewState>({ kind: 'loading' });

  useEffect(() => {
    loadCourts().then(setState);
  }, []);

  const reloadCourts = () => {
    setState({ kind: 'loading' });
    loadCourts().then(setState);
  };

  const getCourtType = (type: string) => {
    switch (type) {
      case 'indoor':
        return 'Indoor';
      case 'outdoor':
        return 'Outdoor';
      default:
        return 'Other court type';
    }
  };

  const getCourtStatus = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'retired':
        return 'Retired';
      default:
        return 'Other status';
    }
  };

  const renderCourt = ({ item }: { item: Court }) => {
    const bookable = item.status === 'active' && item.isAvailable;

    return (
      <View style={styles.card}>
        <Text style={styles.courtName}>{item.name}</Text>

        <Text style={styles.location}>{item.location}</Text>

        <View style={styles.details}>
          <View>
            <Text style={styles.courtType}>
              {getCourtType(item.courtType)}
            </Text>

            <Text style={styles.status}>
              {getCourtStatus(item.status)}
            </Text>
          </View>

          <View
            style={[
              styles.badge,
              bookable ? styles.availableBadge : styles.unavailableBadge,
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                bookable
                  ? styles.availableText
                  : styles.unavailableText,
              ]}
            >
              {bookable ? 'Available' : 'Unavailable'}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  if (state.kind === 'loading') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Badminton Courts</Text>
        <Text style={styles.subtitle}>
          Browse courts at your sports hall.
        </Text>

        {[1, 2, 3].map(number => (
          <View key={number} style={styles.card}>
            <View style={styles.skeletonTitle} />
            <View style={styles.skeletonLine} />
            <View style={styles.skeletonLineShort} />
          </View>
        ))}
      </View>
    );
  }

  if (state.kind === 'error') {
    return (
      <View style={styles.messageContainer}>
        <Text style={styles.title}>Badminton Courts</Text>
        <Text style={styles.message}>{state.message}</Text>

        <Pressable style={styles.button} onPress={reloadCourts}>
          <Text style={styles.buttonText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  if (state.kind === 'empty') {
    return (
      <View style={styles.messageContainer}>
        <Text style={styles.title}>Badminton Courts</Text>
        <Text style={styles.message}>
          No courts are currently available.
        </Text>

        <Pressable style={styles.button} onPress={reloadCourts}>
          <Text style={styles.buttonText}>Check again</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={styles.content}
      data={state.items}
      keyExtractor={item => item.id}
      renderItem={renderCourt}
      ListHeaderComponent={
        <View>
          <Text style={styles.title}>Badminton Courts</Text>
          <Text style={styles.subtitle}>
            Browse courts at your sports hall.
          </Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 24,
    paddingTop: 45,
  },
  content: {
    padding: 24,
    paddingTop: 45,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#08060d',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 17,
    color: '#6b6375',
    marginBottom: 28,
  },
  card: {
    borderWidth: 1,
    borderColor: '#e5e4e7',
    borderRadius: 14,
    padding: 20,
    marginBottom: 16,
    backgroundColor: '#ffffff',
  },
  courtName: {
    fontSize: 23,
    fontWeight: 'bold',
    color: '#08060d',
    marginBottom: 8,
  },
  location: {
    fontSize: 17,
    color: '#6b6375',
    marginBottom: 24,
  },
  details: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  courtType: {
    fontSize: 16,
    color: '#6b6375',
    marginBottom: 5,
  },
  status: {
    fontSize: 13,
    color: '#888888',
  },
  badge: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 9,
  },
  availableBadge: {
    backgroundColor: '#e6f4ee',
  },
  unavailableBadge: {
    backgroundColor: '#f2eeee',
  },
  badgeText: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  availableText: {
    color: '#287653',
  },
  unavailableText: {
    color: '#8b4444',
  },
  messageContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 24,
    paddingTop: 45,
    alignItems: 'flex-start',
  },
  message: {
    fontSize: 16,
    color: '#6b6375',
    marginTop: 12,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#aa3bff',
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  skeletonTitle: {
    width: '55%',
    height: 22,
    backgroundColor: '#e5e4e7',
    borderRadius: 5,
    marginBottom: 14,
  },
  skeletonLine: {
    width: '75%',
    height: 14,
    backgroundColor: '#f0eff2',
    borderRadius: 5,
    marginBottom: 12,
  },
  skeletonLineShort: {
    width: '45%',
    height: 14,
    backgroundColor: '#f0eff2',
    borderRadius: 5,
  },
});
