import { z } from 'zod';

/**
 * Validation schema for POST /api/agent/transactions request body
 */
export const agentDebtsRequestSchema = z.object({
  prompt: z
    .string({
      error: (issue) =>
        issue.input === undefined
          ? 'prompt is required'
          : 'prompt must be a string',
    })
    .min(1, { message: 'prompt cannot be empty' })
    .max(2000, { message: 'prompt cannot exceed 2000 characters' }),
  type: z.literal('debts', { error: 'type must be "debts"' }),
});

/**
 * Type inference from the schema
 */
export type AgentDebtsRequestSchema = z.infer<typeof agentDebtsRequestSchema>;

