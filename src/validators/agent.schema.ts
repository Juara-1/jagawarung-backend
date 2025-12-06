import { z } from 'zod';

/**
 * Validation schema for POST /api/agent/transactions request body
 */
export const agentRequestSchema = z.object({
  prompt: z
    .string({
      error: (issue) =>
        issue.input === undefined
          ? 'prompt is required'
          : 'prompt must be a string',
    })
    .min(1, { message: 'prompt cannot be empty' })
    .max(2000, { message: 'prompt cannot exceed 2000 characters' })
});

/**
 * Type inference from the schema
 */
export type agentRequestSchema = z.infer<typeof agentRequestSchema>;

