import type { TaskStatus } from '../modules/tasks/task.model';
import type { TaskFilterInput } from '../modules/tasks/task.types';

// Argument types for the resolvers. They mirror the GraphQL schema.
// Optional arguments arrive as undefined when left out, or null when sent as null.

export interface GetTasksArgs {
  filter?: TaskFilterInput | null;
  first?: number | null;
  after?: string | null;
}

export interface TaskStatsArgs {
  filter?: TaskFilterInput | null;
}

export interface CreateTaskArgs {
  title: string;
}

export interface UpdateTaskArgs {
  id: string;
  status: TaskStatus;
}
