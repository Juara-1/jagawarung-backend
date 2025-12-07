import { z } from 'zod';

/**
 * Validation schema for POST /api/auth/login request body
 */
export const loginSchema = z.object({
  email: z
    .string({
      error: (issue) =>
        issue.input === undefined
          ? 'email is required'
          : 'email must be a string',
    })
    .email({ message: 'email must be a valid email address' }),
  password: z
    .string({
      error: (issue) =>
        issue.input === undefined
          ? 'password is required'
          : 'password must be a string',
    })
    .min(1, { message: 'password cannot be empty' }),
});

/**
 * Type inference from the schema
 */
export type LoginRequest = z.infer<typeof loginSchema>;

