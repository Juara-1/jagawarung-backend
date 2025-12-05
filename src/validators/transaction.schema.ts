import { z } from 'zod';
import { TRANSACTION_TYPES } from '../models/transaction.model';

const debtorNameSchema = z
  .string({
    error: (issue) =>
      issue.input === undefined ? 'debtor_name is required' : 'debtor_name must be a string',
  })
  .trim()
  .transform((value) => (value === '' ? undefined : value));

const transactionTypeSchema = z.enum(TRANSACTION_TYPES, {
  error: (issue) =>
    issue.input === undefined
      ? 'type is required'
      : `type must be one of: ${TRANSACTION_TYPES.join(', ')}`,
});

export const transactionCreateSchema = z
  .object({
    debtor_name: debtorNameSchema.optional().nullable(),
    nominal: z
      .number({
        error: (issue) =>
          issue.input === undefined
            ? 'nominal must be a positive number'
            : 'nominal must be a number',
      })
      .positive({ error: 'nominal must be a positive number' }),
    type: transactionTypeSchema,
    invoice_url: z
      .string({
        error: () => 'invoice_url must be a string',
      })
      .optional()
      .nullable(),
    invoice_data: z.record(z.string(), z.any()).optional().nullable(),
    note: z
      .string({
        error: () => 'note must be a string',
      })
      .optional()
      .nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.type === 'debts' && (!data.debtor_name || data.debtor_name.trim().length === 0)) {
      ctx.addIssue({
        code: 'custom',
        message: 'debtor_name is required for debt transactions',
        path: ['debtor_name'],
      });
    }
  });
