import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { AppError } from './errorHandler';

export function validateBody(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const message = (result.error as any).issues
        ? (result.error as any).issues.map((e: any) => e.message).join(', ')
        : result.error.message;
      throw new AppError(400, message);
    }
    req.body = result.data;
    next();
  };
}

export function validateQuery(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      const message = (result.error as any).issues
        ? (result.error as any).issues.map((e: any) => e.message).join(', ')
        : result.error.message;
      throw new AppError(400, message);
    }
    req.query = result.data as any;
    next();
  };
}
