import type { Types } from 'mongoose';

import type { TaskStatus } from './task.model';
import type { TaskDto } from './task.types';

// The fields we need from a database document to build a TaskDto.
interface TaskSource {
  _id: Types.ObjectId;
  title: string;
  status: TaskStatus;
  createdAt: Date;
}

// Converts a database document into the shape the API returns.
export function toTaskDto(task: TaskSource): TaskDto {
  return {
    id: task._id.toHexString(),
    title: task.title,
    status: task.status,
    createdAt: task.createdAt.toISOString(),
  };
}
