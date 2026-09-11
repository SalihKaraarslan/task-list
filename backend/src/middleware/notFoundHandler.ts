import type { Request, Response } from 'express';

// Runs when no route matched. Returns JSON instead of the default HTML page.
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: { message: `Route not found: ${req.method} ${req.originalUrl}` },
  });
}
