import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Auth } from '../data/auth';
import { commonStyles, PrimaryButton } from './common';
import { useSignInScreen } from './useSignInScreen';

export default function SignInScreen({ auth }: { auth: Auth }) {
  const { state, onEvent } = useSignInScreen(auth);
  const signingIn = state.kind === 'signingIn';

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={commonStyles.screen}>
        <Text style={commonStyles.message}>Sign in to browse and book badminton courts.</Text>
        {state.kind === 'idle' && state.error ? (
          <Text accessibilityRole="alert" style={styles.error}>⚠ {state.error}</Text>
        ) : null}
      </View>
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
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  error: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8b4444',
    marginTop: 16,
  },
});
