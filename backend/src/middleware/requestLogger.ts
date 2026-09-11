import type { NextFunction, Request, Response } from 'express';

// Logs one line per request. Example: POST /graphql (GetTasks) 200 12.3ms
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const startedAt = performance.now();

  // "finish" fires when the response is sent. By then the JSON body is parsed too.
  res.on('finish', () => {
    const durationMs = (performance.now() - startedAt).toFixed(1);
    const operationName = getOperationName(req);
    const label = operationName ? ` (${operationName})` : '';
    console.log(`${req.method} ${req.originalUrl}${label} ${res.statusCode} ${durationMs}ms`);
  });

  next();
}

// Reads the GraphQL operation name from the request body, if there is one.
function getOperationName(req: Request): string | undefined {
  const body: unknown = req.body;
  if (body && typeof body === 'object' && 'operationName' in body) {
    const name = (body as { operationName?: unknown }).operationName;
    return typeof name === 'string' ? name : undefined;
  }
  return undefined;
}
