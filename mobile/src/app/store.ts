import { configureStore } from '@reduxjs/toolkit';

import { tasksApi } from '../features/tasks/tasksApi';
import { tasksFilterSlice } from '../features/tasks/tasksFilterSlice';

export const store = configureStore({
  reducer: {
    // Server data (tasks, stats) lives in the RTK Query cache.
    [tasksApi.reducerPath]: tasksApi.reducer,
    // UI state (search text, active tab) lives in a normal slice.
    [tasksFilterSlice.reducerPath]: tasksFilterSlice.reducer,
  },
  // The RTK Query middleware handles caching, cache lifetimes and refetching.
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(tasksApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
