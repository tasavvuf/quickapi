import type { Request, Response, NextFunction } from 'express';

/**
 * Global error-handling middleware.
 * Catches thrown errors and sends a standardized JSON response.
 */
export function errorHandler(
  err: Error & { status?: number },
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';

  console.error(`[error] ${status} — ${message}`);

  res.status(status).json({
    success: false,
    error: message,
  });
}
