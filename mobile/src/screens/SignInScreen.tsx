import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Auth } from '../data/auth';
import { commonStyles, PrimaryButton } from './common';
import { useSignInScreen } from './useSignInScreen';

export default function SignInScreen({ auth }: { auth: Auth }) {
  const { state, onEvent } = useSignInScreen(auth);
  const signingIn = state.kind === 'signingIn';

  return (
    <SafeAreaView style={commonStyles.fill} edges={['bottom']}>
      <ScrollView contentContainerStyle={commonStyles.scrollContent}>
        <Text style={commonStyles.message}>Sign in to browse and book badminton courts.</Text>
        {state.kind === 'idle' && state.error ? (
          <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.error}>
            ⚠ {state.error}
          </Text>
        ) : null}
      </ScrollView>
      <View style={commonStyles.footer}>
        <PrimaryButton
          label={signingIn ? 'Signing in…' : 'Sign in'}
          disabled={signingIn}
          onPress={() => onEvent({ type: 'SignInTapped' })}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  error: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8b4444',
    marginTop: 16,
  },
});
