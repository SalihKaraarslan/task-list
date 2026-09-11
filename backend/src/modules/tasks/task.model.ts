import { Schema, model, type InferSchemaType } from 'mongoose';

import { TITLE_MAX_LENGTH } from './task.constants';

// A task can only be in one of these two states.
export const TASK_STATUSES = ['PENDING', 'COMPLETED'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

const taskSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: TITLE_MAX_LENGTH,
    },
    // A lower-case copy of the title. Search uses this field, so the index can help.
    titleNormalized: { type: String, required: true },
    status: {
      type: String,
      enum: TASK_STATUSES,
      required: true,
      default: 'PENDING',
    },
  },
  {
    // Adds createdAt and updatedAt to every task.
    timestamps: true,
    // We do not need the __v field.
    versionKey: false,
  },
);

// Index for pages that filter by status and show the newest task first.
taskSchema.index({ status: 1, _id: -1 });
// Index for "title starts with ..." search.
taskSchema.index({ titleNormalized: 1 });

export type TaskDoc = InferSchemaType<typeof taskSchema>;
export const TaskModel = model('Task', taskSchema);
