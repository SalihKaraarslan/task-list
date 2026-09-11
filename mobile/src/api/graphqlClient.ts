import type { BaseQueryFn } from '@reduxjs/toolkit/query';
import { ClientError, GraphQLClient } from 'graphql-request';

import { API_URL } from '../config/env';

// What an endpoint sends to the base query: a GraphQL document and its variables.
export interface GraphqlRequestArgs {
  document: string;
  variables?: Record<string, unknown>;
}

// The error shape every endpoint gets. "code" comes from the backend, for example NOT_FOUND.
export interface GraphqlApiError {
  status: number;
  code?: string;
  message: string;
}

const client = new GraphQLClient(API_URL);

// RTK Query calls this for every request. It must return { data } or { error }, never throw.
export const graphqlBaseQuery: BaseQueryFn<GraphqlRequestArgs, unknown, GraphqlApiError> = async (
  { document, variables },
  { signal },
) => {
  try {
    const data = await client.request({ document, variables, signal });
    return { data };
  } catch (error) {
    return { error: toApiError(error) };
  }
};

// Turns any thrown value into a GraphqlApiError.
function toApiError(error: unknown): GraphqlApiError {
  // graphql-request throws ClientError when the backend answers with "errors".
  if (error instanceof ClientError) {
    const firstError = error.response.errors?.[0];
    const code = firstError?.extensions?.code;
    return {
      status: error.response.status,
      code: typeof code === 'string' ? code : undefined,
      message: firstError?.message ?? error.message,
    };
  }

  // Anything else is a network problem: no connection, wrong address, or the server is down.
  return { status: 0, message: 'Could not reach the server. Is the backend running?' };
}

// Reads a message from any error value, so we can show it to the user.
export function getErrorMessage(error: unknown): string {
  if (isGraphqlApiError(error)) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Something went wrong';
}

function isGraphqlApiError(error: unknown): error is GraphqlApiError {
  return typeof error === 'object' && error !== null && 'status' in error && 'message' in error;
}
