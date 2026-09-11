import type { NextFunction, Request, Response } from 'express';

import { env } from '../config/env';

// Errors from body parsing carry an HTTP status, for example 400 for broken JSON.
interface HttpError extends Error {
  status?: number;
  statusCode?: number;
}

// The last middleware in the chain. Express calls it with any error that was not handled.
// It must keep all four parameters, or Express will not see it as an error handler.
export function errorHandler(
  error: HttpError,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const status = error.status ?? error.statusCode ?? 500;
  const isServerError = status >= 500;

  if (isServerError) {
    console.error(`Unhandled error (${status}):`, error);
  } else {
    console.warn(`Client error (${status}): ${error.message}`);
  }

  // Do not show internal details to clients in production.
  const message = isServerError && env.isProduction ? 'Internal server error' : error.message;

  res.status(status).json({ error: { message } });
}
