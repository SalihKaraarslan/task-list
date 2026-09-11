import * as taskService from '../modules/tasks/task.service';
import type { TaskPage } from '../modules/tasks/task.types';
import type { CreateTaskArgs, GetTasksArgs, TaskStatsArgs, UpdateTaskArgs } from './types';

// Resolvers stay thin. They only pass the arguments to the service layer.
export const resolvers = {
  Query: {
    getTasks: (_parent: unknown, args: GetTasksArgs) => taskService.listTasks(args),
    taskStats: (_parent: unknown, args: TaskStatsArgs) => taskService.getTaskStats(args.filter),
  },
  Mutation: {
    createTask: (_parent: unknown, args: CreateTaskArgs) => taskService.createTask(args.title),
    updateTask: (_parent: unknown, args: UpdateTaskArgs) =>
      taskService.updateTaskStatus(args.id, args.status),
  },
  TaskConnection: {
    // Counting is its own database query. GraphQL calls this resolver only when a client asks
    // for totalCount, so clients that do not need the number never pay for it.
    totalCount: (page: TaskPage) => taskService.countTasks(page.filter),
  },
};
