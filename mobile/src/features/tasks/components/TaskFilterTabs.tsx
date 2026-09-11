import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fontSize, radius, spacing } from '../../../theme';
import type { StatusFilter, TaskStats } from '../types';

interface Tab {
  key: StatusFilter;
  label: string;
  count: (stats: TaskStats) => number;
}

const TABS: Tab[] = [
  { key: 'ALL', label: 'All', count: (stats) => stats.total },
  { key: 'PENDING', label: 'Pending', count: (stats) => stats.pending },
  { key: 'COMPLETED', label: 'Completed', count: (stats) => stats.completed },
];

interface TaskFilterTabsProps {
  value: StatusFilter;
  // Counts from the backend. Undefined while they load.
  stats?: TaskStats;
  onChange: (value: StatusFilter) => void;
}

export function TaskFilterTabs({ value, stats, onChange }: TaskFilterTabsProps) {
  return (
    <View style={styles.row} accessibilityRole="tablist">
      {TABS.map((tab) => {
        const isActive = tab.key === value;
        const count = stats ? tab.count(stats) : null;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onChange(tab.key)}
            style={[styles.tab, isActive && styles.tabActive]}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
          >
            <Text style={[styles.label, isActive && styles.labelActive]}>
              {tab.label}
              {count === null ? '' : ` ${count}`}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
  },
  tabActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  label: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  labelActive: {
    color: colors.primary,
  },
});
