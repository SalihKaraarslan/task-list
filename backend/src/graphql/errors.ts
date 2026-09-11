import { ApolloServerErrorCode } from '@apollo/server/errors';
import { GraphQLError } from 'graphql';

// The error codes this API returns in "extensions.code".
export const ErrorCode = {
  // Built-in Apollo code for input that fails validation.
  BAD_USER_INPUT: ApolloServerErrorCode.BAD_USER_INPUT,
  // Built-in Apollo code for unexpected server errors.
  INTERNAL_SERVER_ERROR: ApolloServerErrorCode.INTERNAL_SERVER_ERROR,
  // Our own code for "this task does not exist".
  NOT_FOUND: 'NOT_FOUND',
} as const;

// Builds an error for input that fails validation.
export function badUserInput(message: string, argumentName?: string): GraphQLError {
  return new GraphQLError(message, {
    extensions: { code: ErrorCode.BAD_USER_INPUT, argumentName },
  });
}

// Builds an error for a task that does not exist.
export function notFound(message: string): GraphQLError {
  return new GraphQLError(message, {
    extensions: { code: ErrorCode.NOT_FOUND },
  });
}
