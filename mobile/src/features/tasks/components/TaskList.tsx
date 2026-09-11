import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import { colors, spacing } from '../../../theme';
import type { Task } from '../types';
import { ListState } from './ListState';
import { TaskItem } from './TaskItem';

interface TaskListProps {
  tasks: Task[];
  // True while the first page of the current filter is loading.
  isLoading: boolean;
  isRefreshing: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  // Set when loading failed and there is nothing to show.
  errorMessage: string | null;
  emptyMessage: string;
  onRefresh: () => void;
  onEndReached: () => void;
  onRetry: () => void;
  onToggle: (task: Task) => void;
}

export function TaskList({
  tasks,
  isLoading,
  isRefreshing,
  isFetchingNextPage,
  hasNextPage,
  errorMessage,
  emptyMessage,
  onRefresh,
  onEndReached,
  onRetry,
  onToggle,
}: TaskListProps) {
  if (isLoading) {
    return <ListState variant="loading" />;
  }

  if (errorMessage) {
    return <ListState variant="error" message={errorMessage} onRetry={onRetry} />;
  }

  return (
    <FlatList
      data={tasks}
      keyExtractor={(task) => task.id}
      renderItem={({ item }) => <TaskItem task={item} onToggle={onToggle} />}
      ItemSeparatorComponent={Separator}
      contentContainerStyle={styles.content}
      ListEmptyComponent={<ListState variant="empty" message={emptyMessage} />}
      ListFooterComponent={
        isFetchingNextPage ? (
          <ActivityIndicator style={styles.footer} color={colors.primary} />
        ) : null
      }
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
        />
      }
      // Load the next page when the user gets close to the end of the list.
      onEndReached={() => {
        if (hasNextPage && !isFetchingNextPage) {
          onEndReached();
        }
      }}
      onEndReachedThreshold={0.4}
      // Lets a tap on a row work while the keyboard is open, and closes the keyboard on scroll.
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
    />
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    padding: spacing.lg,
    paddingTop: spacing.sm,
  },
  separator: {
    height: spacing.sm,
  },
  footer: {
    paddingVertical: spacing.lg,
  },
});
