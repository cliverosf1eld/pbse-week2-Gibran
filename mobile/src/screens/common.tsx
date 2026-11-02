// The pieces every screen draws: the primary button, the message states and the skeleton.
import { Pressable, StyleSheet, Text, View } from 'react-native';

type PrimaryButtonProps = {
  label: string;
  accessibilityLabel?: string;
  disabled?: boolean;
  onPress: () => void;
};

export function PrimaryButton({ label, accessibilityLabel, disabled, onPress }: PrimaryButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      hitSlop={8}
      style={[commonStyles.button, disabled && commonStyles.buttonDisabled]}
      onPress={onPress}
    >
      <Text style={commonStyles.buttonText}>{label}</Text>
    </Pressable>
  );
}

export function HeaderAction({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      style={commonStyles.headerAction}
      onPress={onPress}
    >
      <Text style={commonStyles.headerActionText}>{label}</Text>
    </Pressable>
  );
}

type MessageStateProps = {
  message: string;
  actionLabel: string;
  actionAccessibilityLabel?: string;
  onAction: () => void;
};

export function MessageState({ message, actionLabel, actionAccessibilityLabel, onAction }: MessageStateProps) {
  return (
    <View style={commonStyles.screen}>
      <Text style={commonStyles.message}>{message}</Text>
      <View style={commonStyles.spacer} />
      <PrimaryButton
        label={actionLabel}
        accessibilityLabel={actionAccessibilityLabel}
        onPress={onAction}
      />
    </View>
  );
}

export function LoadingSkeleton({ label }: { label: string }) {
  return (
    <View style={commonStyles.screen} accessible accessibilityLabel={label}>
      {[1, 2, 3].map(number => (
        <View key={number} style={commonStyles.card}>
          <View style={commonStyles.skeletonTitle} />
          <View style={commonStyles.skeletonLine} />
          <View style={commonStyles.skeletonLineShort} />
        </View>
      ))}
    </View>
  );
}

export const commonStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 24,
  },
  spacer: {
    flex: 1,
  },
  footer: {
    padding: 24,
    paddingTop: 12,
    backgroundColor: '#ffffff',
  },
  card: {
    borderWidth: 1,
    borderColor: '#e5e4e7',
    borderRadius: 14,
    padding: 20,
    marginBottom: 16,
    backgroundColor: '#ffffff',
  },
  name: {
    fontSize: 23,
    fontWeight: 'bold',
    color: '#08060d',
    marginBottom: 8,
  },
  detail: {
    fontSize: 17,
    color: '#6b6375',
  },
  message: {
    fontSize: 16,
    color: '#6b6375',
  },
  badge: {
    alignSelf: 'flex-start',
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 9,
    backgroundColor: '#f2f1f4',
  },
  badgeText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#08060d',
  },
  button: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#aa3bff',
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 8,
  },
  buttonDisabled: {
    backgroundColor: '#6b6375',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  headerAction: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  headerActionText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#08060d',
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
