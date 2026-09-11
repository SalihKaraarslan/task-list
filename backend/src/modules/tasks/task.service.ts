import mongoose, { type PipelineStage, type QueryFilter, type Types } from 'mongoose';

import { badUserInput, notFound } from '../../graphql/errors';
import { decodeCursor, encodeCursor } from '../../utils/cursor';
import { escapeRegex } from '../../utils/regex';
import { toTaskDto } from './task.mapper';
import { TaskModel, type TaskDoc, type TaskStatus } from './task.model';
import type { ListTasksParams, TaskDto, TaskFilterInput, TaskPage, TaskStats } from './task.types';
import { normalizeTitle, validateFirst, validateSearch, validateTitle } from './task.validation';

// Builds the MongoDB filter for a status and a search text. Both are optional.
function buildFilter(filter: TaskFilterInput | null | undefined): QueryFilter<TaskDoc> {
  const match: QueryFilter<TaskDoc> = {};

  if (filter?.status) {
    match.status = filter.status;
  }

  const search = validateSearch(filter?.search);
  if (search) {
    // "^" means "starts with". The text is escaped, so it is matched as plain text.
    match.titleNormalized = { $regex: `^${escapeRegex(search)}` };
  }

  return match;
}

// Returns one page of tasks, newest first. Uses the task id as the cursor:
// newer tasks have bigger ids, so "id < cursor" gives the tasks after the last one we sent.
export async function listTasks(params: ListTasksParams): Promise<TaskPage> {
  const first = validateFirst(params.first);

  const query: QueryFilter<TaskDoc> = buildFilter(params.filter);
  if (params.after) {
    query._id = { $lt: decodeCursor(params.after) };
  }

  // We ask for one extra task. If we get it, we know there is a next page.
  const docs = await TaskModel.find(query)
    .sort({ _id: -1 })
    .limit(first + 1)
    .lean();

  const hasNextPage = docs.length > first;
  const items = docs.slice(0, first).map(toTaskDto);
  const lastItem = items.at(-1);

  return {
    items,
    nextCursor: hasNextPage && lastItem ? encodeCursor(lastItem.id) : null,
    filter: params.filter,
  };
}

// Counts the tasks that match a filter, across all pages.
export function countTasks(filter: TaskFilterInput | null | undefined): Promise<number> {
  return TaskModel.countDocuments(buildFilter(filter)).exec();
}

// One row of the aggregation result: a status and how many tasks have it.
interface StatusCountRow {
  _id: TaskStatus;
  count: number;
}

// Counts tasks by status with an aggregation pipeline.
// The database does the counting, so we never load the tasks themselves.
export async function getTaskStats(filter: TaskFilterInput | null | undefined): Promise<TaskStats> {
  const match = buildFilter(filter);

  const pipeline: PipelineStage[] = [];
  if (Object.keys(match).length > 0) {
    pipeline.push({ $match: match });
  }
  pipeline.push({ $group: { _id: '$status', count: { $sum: 1 } } });

  const rows = await TaskModel.aggregate<StatusCountRow>(pipeline);
  const countFor = (status: TaskStatus): number =>
    rows.find((row) => row._id === status)?.count ?? 0;

  const pending = countFor('PENDING');
  const completed = countFor('COMPLETED');
  return { pending, completed, total: pending + completed };
}

// Rule: a title can be pending only once (case and spaces do not matter).
// A completed task does not count, so the same work can be planned again later.
// "excludeId" skips the task we are about to change, so it does not block itself.
async function assertNoPendingDuplicate(
  titleNormalized: string,
  excludeId?: Types.ObjectId,
): Promise<void> {
  const filter: QueryFilter<TaskDoc> = { titleNormalized, status: 'PENDING' };
  if (excludeId) {
    filter._id = { $ne: excludeId };
  }
  if (await TaskModel.exists(filter)) {
    throw badUserInput('A pending task with this title already exists', 'title');
  }
}

// Creates a task. New tasks always start as PENDING.
export async function createTask(rawTitle: string): Promise<TaskDto> {
  const title = validateTitle(rawTitle);
  const titleNormalized = normalizeTitle(title);

  await assertNoPendingDuplicate(titleNormalized);

  const task = await TaskModel.create({ title, titleNormalized });
  return toTaskDto(task);
}

// Changes the status of one task. Throws NOT_FOUND when the id is unknown.
export async function updateTaskStatus(id: string, status: TaskStatus): Promise<TaskDto> {
  // A string that is not a valid ObjectId can never match a task.
  if (!mongoose.isObjectIdOrHexString(id)) {
    throw notFound('Task not found');
  }

  const task = await TaskModel.findById(id).lean();
  if (!task) {
    throw notFound('Task not found');
  }

  // Moving a task back to PENDING must not create a second pending task with the same title.
  if (status === 'PENDING' && task.status !== 'PENDING') {
    await assertNoPendingDuplicate(task.titleNormalized, task._id);
  }

  const updated = await TaskModel.findByIdAndUpdate(
    id,
    { status },
    { returnDocument: 'after', runValidators: true },
  ).lean();

  if (!updated) {
    throw notFound('Task not found');
  }
  return toTaskDto(updated);
}
