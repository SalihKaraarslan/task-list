import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { getErrorMessage } from '../../../api/graphqlClient';
import { colors, fontSize, radius, spacing } from '../../../theme';
import { TITLE_MAX_LENGTH } from '../constants';
import { validateTitle } from '../validation';

interface TaskFormProps {
  // Gets a clean title. Rejects when the backend refuses the task.
  onSubmit: (title: string) => Promise<void>;
  // Gets every error message. The parent shows it in the floating banner,
  // so nothing in the layout moves.
  onError: (message: string) => void;
  isSubmitting: boolean;
}

export function TaskForm({ onSubmit, onError, isSubmitting }: TaskFormProps) {
  const [text, setText] = useState('');
  // A fast double tap (or Enter plus a tap) must not create the task twice.
  const isSubmittingRef = useRef(false);

  const canSubmit = validateTitle(text).ok && !isSubmitting;

  const handleSubmit = async () => {
    if (isSubmittingRef.current) {
      return;
    }
    const result = validateTitle(text);
    if (!result.ok) {
      onError(result.error);
      return;
    }
    isSubmittingRef.current = true;
    try {
      await onSubmit(result.title);
      setText('');
    } catch (submitError) {
      onError(getErrorMessage(submitError));
    } finally {
      isSubmittingRef.current = false;
    }
  };

  return (
    <View style={styles.row}>
      <TextInput
        value={text}
        onChangeText={setText}
        onSubmitEditing={handleSubmit}
        placeholder="What needs to be done?"
        placeholderTextColor={colors.textMuted}
        maxLength={TITLE_MAX_LENGTH}
        returnKeyType="done"
        editable={!isSubmitting}
        style={styles.input}
        accessibilityLabel="New task title"
      />
      <Pressable
        onPress={handleSubmit}
        disabled={!canSubmit}
        style={[styles.button, !canSubmit && styles.buttonDisabled]}
        accessibilityRole="button"
      >
        <Text style={styles.buttonText}>{isSubmitting ? 'Adding…' : 'Add'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.text,
    fontSize: fontSize.md,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: colors.onPrimary,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
});
