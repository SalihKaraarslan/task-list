import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { StatusFilter } from './types';

// UI state for the list: the search text and the active tab.
// Server data does not live here. RTK Query keeps that in its own cache.
interface TasksFilterState {
  searchText: string;
  statusFilter: StatusFilter;
}

const initialState: TasksFilterState = {
  searchText: '',
  statusFilter: 'ALL',
};

export const tasksFilterSlice = createSlice({
  name: 'tasksFilter',
  initialState,
  reducers: {
    setSearchText(state, action: PayloadAction<string>) {
      state.searchText = action.payload;
    },
    clearSearchText(state) {
      state.searchText = '';
    },
    setStatusFilter(state, action: PayloadAction<StatusFilter>) {
      state.statusFilter = action.payload;
    },
  },
  selectors: {
    selectSearchText: (state) => state.searchText,
    selectStatusFilter: (state) => state.statusFilter,
  },
});

export const { setSearchText, clearSearchText, setStatusFilter } = tasksFilterSlice.actions;
export const { selectSearchText, selectStatusFilter } = tasksFilterSlice.selectors;
