import type { Request, Response, NextFunction } from 'express';

/**
 * Validate that the request body contains all required fields.
 */
export function validateBody(...requiredFields: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const missing = requiredFields.filter((f) => req.body[f] === undefined || req.body[f] === null);
    if (missing.length) {
      const err = new Error(`Missing required fields: ${missing.join(', ')}`) as Error & { status?: number };
      err.status = 400;
      return next(err);
    }
    next();
  };
}

