import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fontSize, radius, spacing } from '../../../theme';
import type { Task } from '../types';

interface TaskItemProps {
  task: Task;
  // Called when the user taps the row. The parent decides the new status.
  onToggle: (task: Task) => void;
}

function TaskItemComponent({ task, onToggle }: TaskItemProps) {
  const isCompleted = task.status === 'COMPLETED';

  return (
    <Pressable
      onPress={() => onToggle(task)}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: isCompleted }}
      accessibilityLabel={task.title}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <View style={[styles.checkbox, isCompleted && styles.checkboxChecked]}>
        {isCompleted ? <Text style={styles.checkmark}>✓</Text> : null}
      </View>
      <View style={styles.body}>
        <Text style={[styles.title, isCompleted && styles.titleCompleted]} numberOfLines={2}>
          {task.title}
        </Text>
        <Text style={styles.meta}>{formatDate(task.createdAt)}</Text>
      </View>
    </Pressable>
  );
}

// The list re-renders often. memo skips rows whose task did not change.
export const TaskItem = memo(TaskItemComponent);

// The app is in English, so dates use the English format on every phone (for example "Sep 11").
function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  cardPressed: {
    opacity: 0.7,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  checkmark: {
    color: colors.onPrimary,
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
  body: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '500',
  },
  titleCompleted: {
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
  meta: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
});
