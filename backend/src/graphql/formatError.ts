import { unwrapResolverError } from '@apollo/server/errors';
import type { GraphQLFormattedError } from 'graphql';
import mongoose from 'mongoose';

import { env } from '../config/env';
import { ErrorCode } from './errors';

// Runs on every GraphQL error before it goes to the client.
export function formatError(
  formattedError: GraphQLFormattedError,
  error: unknown,
): GraphQLFormattedError {
  // Apollo wraps errors thrown inside resolvers. This gives us the original error.
  const original = unwrapResolverError(error);

  // A Mongoose validation error means the input was bad, not the server.
  if (original instanceof mongoose.Error.ValidationError) {
    return withCode(formattedError, original.message, ErrorCode.BAD_USER_INPUT);
  }

  // A cast error means an id had the wrong shape. We treat it like "not found".
  if (original instanceof mongoose.Error.CastError) {
    return withCode(formattedError, 'Task not found', ErrorCode.NOT_FOUND);
  }

  const isInternal = formattedError.extensions?.code === ErrorCode.INTERNAL_SERVER_ERROR;
  if (isInternal) {
    console.error('Unexpected GraphQL error:', original);
    // Do not show internal details to clients in production.
    if (env.isProduction) {
      return withCode(formattedError, 'Internal server error', ErrorCode.INTERNAL_SERVER_ERROR);
    }
  }

  return formattedError;
}

// Returns a copy of the error with a new message and code.
function withCode(
  formattedError: GraphQLFormattedError,
  message: string,
  code: string,
): GraphQLFormattedError {
  return {
    ...formattedError,
    message,
    extensions: { ...formattedError.extensions, code },
  };
}
