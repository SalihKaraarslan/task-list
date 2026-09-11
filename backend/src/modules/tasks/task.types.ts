import type { TaskStatus } from './task.model';

// The shape of a task that we send to clients.
export interface TaskDto {
  id: string;
  title: string;
  status: TaskStatus;
  // ISO 8601 string, for example "2026-09-11T10:00:00.000Z".
  createdAt: string;
}

// Optional filters for list and stats queries.
export interface TaskFilterInput {
  status?: TaskStatus | null;
  search?: string | null;
}

// Input for one page of tasks.
export interface ListTasksParams {
  filter?: TaskFilterInput | null;
  first?: number | null;
  after?: string | null;
}

// One page of tasks, as the service returns it.
// There is no totalCount here on purpose. Counting is a separate database query, so the GraphQL
// layer runs it only when a client asks for that field.
export interface TaskPage {
  items: TaskDto[];
  // The cursor for the next page, or null on the last page.
  nextCursor: string | null;
  // The filter that produced this page. The totalCount resolver counts with the same filter.
  filter: TaskFilterInput | null | undefined;
}

// Task counts by status.
export interface TaskStats {
  pending: number;
  completed: number;
  total: number;
}
