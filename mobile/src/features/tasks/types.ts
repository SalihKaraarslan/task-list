// Types that mirror the GraphQL schema of the backend.

export type TaskStatus = 'PENDING' | 'COMPLETED';

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  // ISO 8601 date string, for example "2026-09-11T10:00:00.000Z".
  createdAt: string;
}

// Filters for the task queries. Leave a field out to skip that filter.
export interface TaskFilter {
  status?: TaskStatus;
  search?: string;
}

// One page of tasks, as the backend returns it. We do not ask for totalCount:
// the tabs get their numbers from taskStats instead.
export interface TaskConnection {
  items: Task[];
  nextCursor: string | null;
}

export interface TaskStats {
  pending: number;
  completed: number;
  total: number;
}

// The tabs above the list. "ALL" means no status filter.
export type StatusFilter = 'ALL' | TaskStatus;
