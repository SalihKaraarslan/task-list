import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fontSize, radius, spacing } from '../../../theme';

interface ListStateProps {
  variant: 'loading' | 'error' | 'empty';
  message?: string;
  onRetry?: () => void;
}

// What the list area shows when there are no rows: a spinner, an error, or an empty message.
export function ListState({ variant, message, onRetry }: ListStateProps) {
  if (variant === 'loading') {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.message, variant === 'error' && styles.errorMessage]}>{message}</Text>
      {variant === 'error' && onRetry ? (
        <Pressable onPress={onRetry} style={styles.retryButton} accessibilityRole="button">
          <Text style={styles.retryText}>Try again</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  message: {
    color: colors.textMuted,
    fontSize: fontSize.md,
    textAlign: 'center',
  },
  errorMessage: {
    color: colors.danger,
  },
  retryButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  retryText: {
    color: colors.onPrimary,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
});
