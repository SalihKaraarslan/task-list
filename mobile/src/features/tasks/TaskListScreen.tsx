import { useCallback, useMemo, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getErrorMessage } from '../../api/graphqlClient';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { ErrorBanner } from '../../components/ErrorBanner';
import { useDebounce } from '../../hooks/useDebounce';
import { colors, fontSize, spacing } from '../../theme';
import { TaskFilterTabs } from './components/TaskFilterTabs';
import { TaskForm } from './components/TaskForm';
import { TaskList } from './components/TaskList';
import { TaskSearch } from './components/TaskSearch';
import { DUPLICATE_PENDING_TITLE_MESSAGE, SEARCH_DEBOUNCE_MS } from './constants';
import {
  selectPendingTitlesInCache,
  useCreateTaskMutation,
  useGetTaskStatsQuery,
  useGetTasksInfiniteQuery,
  useUpdateTaskMutation,
  type TaskStatsFilter,
} from './tasksApi';
import {
  clearSearchText,
  selectSearchText,
  selectStatusFilter,
  setSearchText,
  setStatusFilter,
} from './tasksFilterSlice';
import type { StatusFilter, Task, TaskFilter, TaskStatus } from './types';
import { normalizeTitle } from './validation';

export function TaskListScreen() {
  const dispatch = useAppDispatch();
  const searchText = useAppSelector(selectSearchText);
  const statusFilter = useAppSelector(selectStatusFilter);
  // Pending titles we already know about. Lets us refuse a duplicate without a server round trip.
  const pendingTitles = useAppSelector(selectPendingTitlesInCache);
  const debouncedSearch = useDebounce(searchText, SEARCH_DEBOUNCE_MS);

  // Every error (form, toggle, server) goes to the floating banner, so the layout never moves.
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // The filter is the cache key for RTK Query. Same filter, same cache entry.
  const filter = useMemo(
    () => buildTaskFilter(statusFilter, debouncedSearch),
    [statusFilter, debouncedSearch],
  );
  const statsFilter = useMemo<TaskStatsFilter>(
    () => (filter.search ? { search: filter.search } : {}),
    [filter.search],
  );

  // When the user switches tabs, show the cached list right away. Fetch a fresh copy in the
  // background only if the cached one is older than 30 seconds.
  const tasksQuery = useGetTasksInfiniteQuery(filter, { refetchOnMountOrArgChange: 30 });
  const statsQuery = useGetTaskStatsQuery(statsFilter);
  const [createTask, { isLoading: isCreating }] = useCreateTaskMutation();
  const [updateTask] = useUpdateTaskMutation();

  // currentData belongs to the current filter only. data can still hold the previous filter.
  const tasks = useMemo(
    () => tasksQuery.currentData?.pages.flatMap((page) => page.items) ?? [],
    [tasksQuery.currentData],
  );
  const hasNoData = tasksQuery.currentData === undefined;
  const isLoading = hasNoData && tasksQuery.isFetching;
  const errorMessage = hasNoData && tasksQuery.isError ? getErrorMessage(tasksQuery.error) : null;
  const emptyMessage =
    filter.search || filter.status
      ? 'No tasks match your filters.'
      : 'No tasks yet. Add one above.';

  const handleCreate = useCallback(
    async (title: string) => {
      if (pendingTitles.has(normalizeTitle(title))) {
        throw new Error(DUPLICATE_PENDING_TITLE_MESSAGE);
      }
      // unwrap() turns a failed request into a thrown error, so the form can show it.
      await createTask({ title }).unwrap();
    },
    [createTask, pendingTitles],
  );

  const handleToggle = useCallback(
    (task: Task) => {
      const status: TaskStatus = task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
      Keyboard.dismiss();
      // Moving a task back to pending is not allowed while another pending task has its title.
      // We know that from the cache, so we can say no right away instead of flipping and undoing.
      if (status === 'PENDING' && pendingTitles.has(normalizeTitle(task.title))) {
        setBannerMessage(DUPLICATE_PENDING_TITLE_MESSAGE);
        return;
      }
      updateTask({ id: task.id, status })
        .unwrap()
        .catch((error: unknown) => setBannerMessage(getErrorMessage(error)));
    },
    [updateTask, pendingTitles],
  );

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([tasksQuery.refetch(), statsQuery.refetch()]);
    } finally {
      setIsRefreshing(false);
    }
  }, [tasksQuery, statsQuery]);

  const dismissBanner = useCallback(() => setBannerMessage(null), []);

  const handleStatusFilterChange = useCallback(
    (value: StatusFilter) => {
      Keyboard.dismiss();
      dispatch(setStatusFilter(value));
    },
    [dispatch],
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* A tap on empty header space closes the keyboard. Inputs and buttons handle their own taps. */}
        <Pressable style={styles.header} onPress={Keyboard.dismiss} accessible={false}>
          <Text style={styles.heading}>Tasks</Text>
          <TaskForm onSubmit={handleCreate} onError={setBannerMessage} isSubmitting={isCreating} />
          <TaskSearch
            value={searchText}
            onChange={(value) => dispatch(setSearchText(value))}
            onClear={() => dispatch(clearSearchText())}
          />
          <TaskFilterTabs
            value={statusFilter}
            stats={statsQuery.data}
            onChange={handleStatusFilterChange}
          />
        </Pressable>

        <TaskList
          tasks={tasks}
          isLoading={isLoading}
          isRefreshing={isRefreshing}
          isFetchingNextPage={tasksQuery.isFetchingNextPage}
          hasNextPage={tasksQuery.hasNextPage}
          errorMessage={errorMessage}
          emptyMessage={emptyMessage}
          onRefresh={handleRefresh}
          onEndReached={tasksQuery.fetchNextPage}
          onRetry={tasksQuery.refetch}
          onToggle={handleToggle}
        />
      </KeyboardAvoidingView>

      {/* Floats over the content, so showing it does not move the list. */}
      <ErrorBanner message={bannerMessage} onDismiss={dismissBanner} />
    </SafeAreaView>
  );
}

// Builds the filter for the backend. Fields are left out instead of set to undefined,
// so "All tasks, no search" and {} produce the same cache key.
function buildTaskFilter(statusFilter: StatusFilter, search: string): TaskFilter {
  const filter: TaskFilter = {};
  if (statusFilter !== 'ALL') {
    filter.status = statusFilter;
  }
  const trimmedSearch = search.trim();
  if (trimmedSearch) {
    filter.search = trimmedSearch;
  }
  return filter;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  heading: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: '700',
  },
});
