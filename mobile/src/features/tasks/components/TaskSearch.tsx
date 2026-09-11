import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, fontSize, radius, spacing } from '../../../theme';

interface TaskSearchProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
}

// Search box. The parent waits a moment after typing before it asks the backend.
export function TaskSearch({ value, onChange, onClear }: TaskSearchProps) {
  return (
    <View style={styles.container}>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder="Search by title…"
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        style={styles.input}
        accessibilityLabel="Search tasks"
      />
      {value.length > 0 ? (
        <Pressable
          onPress={onClear}
          style={styles.clearButton}
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          hitSlop={8}
        >
          <Text style={styles.clearText}>×</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
  },
  input: {
    flex: 1,
    paddingVertical: spacing.sm,
    color: colors.text,
    fontSize: fontSize.md,
  },
  clearButton: {
    paddingLeft: spacing.sm,
  },
  clearText: {
    color: colors.textMuted,
    fontSize: fontSize.lg,
  },
});
