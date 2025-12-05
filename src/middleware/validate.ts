import { NextFunction, Request, Response } from 'express';
import { ZodSchema } from 'zod';
import { AppError } from './errorHandler';

type RequestLocation = 'body' | 'query' | 'params';

export const validate = <T>(schema: ZodSchema<T>, location: RequestLocation = 'body') => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const payload = (req as any)[location];
    const result = schema.safeParse(payload);

    if (!result.success) {
      const message = result.error.issues.map((issue) => issue.message).join(', ');
      return next(new AppError(message, 400));
    }

    (req as any)[location] = result.data;
    return next();
  };
};
