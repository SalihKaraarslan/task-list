import { gql } from 'graphql-request';

// The GraphQL operations the app uses. "gql" only adds editor highlighting.

const TASK_FIELDS = gql`
  fragment TaskFields on Task {
    id
    title
    status
    createdAt
  }
`;

export const GET_TASKS = gql`
  query GetTasks($filter: TaskFilter, $first: Int, $after: String) {
    getTasks(filter: $filter, first: $first, after: $after) {
      items {
        ...TaskFields
      }
      nextCursor
    }
  }
  ${TASK_FIELDS}
`;

export const GET_TASK_STATS = gql`
  query GetTaskStats($filter: TaskFilter) {
    taskStats(filter: $filter) {
      pending
      completed
      total
    }
  }
`;

export const CREATE_TASK = gql`
  mutation CreateTask($title: String!) {
    createTask(title: $title) {
      ...TaskFields
    }
  }
  ${TASK_FIELDS}
`;

export const UPDATE_TASK = gql`
  mutation UpdateTask($id: ID!, $status: TaskStatus!) {
    updateTask(id: $id, status: $status) {
      ...TaskFields
    }
  }
  ${TASK_FIELDS}
`;
