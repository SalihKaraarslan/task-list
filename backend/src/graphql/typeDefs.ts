// The GraphQL schema. The "#graphql" comment turns on syntax highlighting in editors.
export const typeDefs = `#graphql
  enum TaskStatus {
    PENDING
    COMPLETED
  }

  type Task {
    id: ID!
    title: String!
    status: TaskStatus!
    "ISO 8601 date string, for example 2026-09-11T10:00:00.000Z"
    createdAt: String!
  }

  "Optional filters for the task queries."
  input TaskFilter {
    "Only tasks with this status."
    status: TaskStatus
    "Only tasks whose title starts with this text (case-insensitive)."
    search: String
  }

  "One page of tasks."
  type TaskConnection {
    items: [Task!]!
    "Send this as \\"after\\" to get the next page. Null on the last page."
    nextCursor: String
    "How many tasks match the filter, across all pages. Counted only when you ask for it."
    totalCount: Int!
  }

  "Task counts by status. Computed with a MongoDB aggregation."
  type TaskStats {
    pending: Int!
    completed: Int!
    total: Int!
  }

  type Query {
    "Returns tasks newest first, one page at a time. With no arguments it returns the first 20."
    getTasks(filter: TaskFilter, first: Int = 20, after: String): TaskConnection!
    "Returns how many tasks are pending and completed."
    taskStats(filter: TaskFilter): TaskStats!
  }

  type Mutation {
    "Creates a task with the given title. New tasks start as PENDING. Fails with BAD_USER_INPUT when a pending task with the same title already exists (case-insensitive)."
    createTask(title: String!): Task!
    "Changes the status of one task. Setting it back to PENDING fails with BAD_USER_INPUT when another pending task has the same title."
    updateTask(id: ID!, status: TaskStatus!): Task!
  }
`;
