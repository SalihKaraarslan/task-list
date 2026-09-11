import { createSelector } from '@reduxjs/toolkit';
import type { InfiniteData } from '@reduxjs/toolkit/query';
import { createApi } from '@reduxjs/toolkit/query/react';

import { CREATE_TASK, GET_TASKS, GET_TASK_STATS, UPDATE_TASK } from '../../api/documents';
import { graphqlBaseQuery } from '../../api/graphqlClient';
import { PAGE_SIZE } from './constants';
import type { Task, TaskConnection, TaskFilter, TaskStats, TaskStatus } from './types';
import { normalizeTitle } from './validation';

// The tag for "the list of tasks". Creating a task invalidates it, so the list is fetched again.
const TASK_LIST_TAG = { type: 'Task', id: 'LIST' } as const;

// Filter for the stats query. Stats only depend on the search text, not on the active tab.
export type TaskStatsFilter = Pick<TaskFilter, 'search'>;

// All loaded pages of one list, as RTK Query stores them.
type TaskPages = InfiniteData<TaskConnection, string | null>;

export const tasksApi = createApi({
  reducerPath: 'tasksApi',
  baseQuery: graphqlBaseQuery,
  tagTypes: ['Task', 'Stats'],
  endpoints: (build) => ({
    // One cache entry per filter. Each entry holds all the pages the user has loaded.
    // The page param is the cursor of the next page. Null means "the first page".
    getTasks: build.infiniteQuery<TaskConnection, TaskFilter, string | null>({
      infiniteQueryOptions: {
        initialPageParam: null,
        // The backend sends null on the last page. Undefined tells RTK Query to stop.
        getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
      },
      query: ({ queryArg, pageParam }) => ({
        document: GET_TASKS,
        variables: { filter: queryArg, first: PAGE_SIZE, after: pageParam },
      }),
      transformResponse: (response: { getTasks: TaskConnection }) => response.getTasks,
      providesTags: (result) => [
        TASK_LIST_TAG,
        ...(result?.pages.flatMap((page) =>
          page.items.map((task) => ({ type: 'Task' as const, id: task.id })),
        ) ?? []),
      ],
    }),

    getTaskStats: build.query<TaskStats, TaskStatsFilter>({
      query: (filter) => ({ document: GET_TASK_STATS, variables: { filter } }),
      transformResponse: (response: { taskStats: TaskStats }) => response.taskStats,
      providesTags: ['Stats'],
    }),

    createTask: build.mutation<Task, { title: string }>({
      query: (variables) => ({ document: CREATE_TASK, variables }),
      transformResponse: (response: { createTask: Task }) => response.createTask,
      // The backend creates the id and the date, so we simply fetch the list again.
      invalidatesTags: [TASK_LIST_TAG, 'Stats'],
    }),

    updateTask: build.mutation<Task, { id: string; status: TaskStatus }>({
      query: (variables) => ({ document: UPDATE_TASK, variables }),
      transformResponse: (response: { updateTask: Task }) => response.updateTask,
      invalidatesTags: ['Stats'],
      // Optimistic update. Every cached list changes right away, before the server answers:
      // the task gets its new status, it leaves the lists it no longer belongs to (for example
      // the Pending tab) and it joins the lists it now belongs to (for example the Completed tab).
      // If the request fails, all changes are undone and the lists are fetched again.
      async onQueryStarted({ id, status }, { dispatch, getState, queryFulfilled }) {
        const state = getState();
        const cachedFilters = tasksApi.util.selectCachedArgsForQuery(state, 'getTasks');

        // We only know the id and the new status. The rest of the task comes from a cached list.
        const cachedTask = cachedFilters
          .flatMap((filter) => tasksApi.endpoints.getTasks.select(filter)(state).data?.pages ?? [])
          .flatMap((page) => page.items)
          .find((task) => task.id === id);
        if (!cachedTask) {
          return;
        }
        const updatedTask: Task = { ...cachedTask, status };

        const patches = cachedFilters.map((filter) =>
          dispatch(
            tasksApi.util.updateQueryData('getTasks', filter, (draft) => {
              applyOptimisticStatus(draft, filter, updatedTask);
            }),
          ),
        );

        try {
          await queryFulfilled;
        } catch {
          patches.forEach((patch) => patch.undo());
          dispatch(tasksApi.util.invalidateTags([TASK_LIST_TAG]));
        }
      },
    }),
  }),
});

export const {
  useGetTasksInfiniteQuery,
  useGetTaskStatsQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
} = tasksApi;

// The store state as the API utilities expect it (the slice under "tasksApi").
type ApiRootState = Parameters<typeof tasksApi.util.selectCachedArgsForQuery>[0];

// The normalized titles of all pending tasks the app has loaded so far.
// The screen uses it to stop a duplicate before it calls the server (the backend checks too).
// createSelector memoizes on the API cache, so the set is rebuilt only when the cache changes.
export const selectPendingTitlesInCache = createSelector(
  [(state: ApiRootState) => state[tasksApi.reducerPath]],
  (apiState) => {
    const state = { [tasksApi.reducerPath]: apiState } as ApiRootState;
    const titles = new Set<string>();
    for (const filter of tasksApi.util.selectCachedArgsForQuery(state, 'getTasks')) {
      const pages = tasksApi.endpoints.getTasks.select(filter)(state).data?.pages ?? [];
      for (const page of pages) {
        for (const task of page.items) {
          if (task.status === 'PENDING') {
            titles.add(normalizeTitle(task.title));
          }
        }
      }
    }
    return titles;
  },
);

// Does this task belong in the list for this filter? Mirrors the backend rules:
// same status (when a status is set) and the title starts with the search text.
function matchesFilter(task: Task, filter: TaskFilter): boolean {
  if (filter.status && filter.status !== task.status) {
    return false;
  }
  if (filter.search && !task.title.toLowerCase().startsWith(filter.search.toLowerCase())) {
    return false;
  }
  return true;
}

// Changes one cached list so it looks like the server already saved the new status.
function applyOptimisticStatus(draft: TaskPages, filter: TaskFilter, task: Task): void {
  const belongs = matchesFilter(task, filter);

  for (const page of draft.pages) {
    const index = page.items.findIndex((item) => item.id === task.id);
    if (index === -1) {
      continue;
    }
    if (belongs) {
      page.items[index] = task;
    } else {
      page.items.splice(index, 1);
    }
    return;
  }

  // The task was not in this list. Add it when it belongs here now.
  if (belongs) {
    insertNewestFirst(draft, task);
  }
}

// Lists are sorted newest first. Ids grow with time (MongoDB ObjectIds), so the task goes
// right before the first task that is older than it.
function insertNewestFirst(draft: TaskPages, task: Task): void {
  for (const page of draft.pages) {
    const index = page.items.findIndex((item) => item.id < task.id);
    if (index !== -1) {
      page.items.splice(index, 0, task);
      return;
    }
  }

  // The task is older than everything we loaded. Add it at the end only when the server has
  // no more pages; otherwise it will arrive with the next page.
  const lastPage = draft.pages.at(-1);
  if (lastPage && lastPage.nextCursor === null) {
    lastPage.items.push(task);
  }
}
