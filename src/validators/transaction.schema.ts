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

const nominalSchema = z
  .number({
    error: (issue) =>
      issue.input === undefined ? 'nominal must be a positive number' : 'nominal must be a number',
  })
  .positive({ error: 'nominal must be a positive number' });

const invoiceUrlSchema = z
  .string({
    error: () => 'invoice_url must be a string',
  })
  .optional()
  .nullable();

const invoiceDataSchema = z.record(z.string(), z.any()).optional().nullable();

const noteSchema = z
  .string({
    error: () => 'note must be a string',
  })
  .optional()
  .nullable();

export const transactionCreateSchema = z
  .object({
    debtor_name: debtorNameSchema.optional().nullable(),
    nominal: nominalSchema,
    type: transactionTypeSchema,
    invoice_url: invoiceUrlSchema,
    invoice_data: invoiceDataSchema,
    note: noteSchema,
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

export const transactionUpdateSchema = z
  .object({
    debtor_name: debtorNameSchema.optional().nullable(),
    nominal: nominalSchema,
    type: transactionTypeSchema,
    invoice_url: invoiceUrlSchema,
    invoice_data: invoiceDataSchema,
    note: noteSchema,
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

export const transactionIdParamSchema = z.object({
  id: z.uuid({ error: 'id must be a valid UUID' }),
});

// Constants for list query validation
const ORDER_FIELDS = ['created_at', 'updated_at', 'nominal'] as const;
const ORDER_DIRECTIONS = ['asc', 'desc'] as const;
const TIME_RANGES = ['day', 'week', 'month'] as const;

// Helper to validate ISO date string
const isoDateStringSchema = z.string().refine(
  (value) => !Number.isNaN(Date.parse(value)),
  { message: 'Invalid date format. Use ISO format' }
);

// Helper to parse and validate type filter (comma-separated list)
const typeFilterSchema = z
  .string()
  .optional()
  .transform((value) => {
    if (!value) return undefined;
    const types = value
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0);
    return types.length > 0 ? types : undefined;
  })
  .refine(
    (types) => {
      if (!types) return true;
      return types.every((type) => TRANSACTION_TYPES.includes(type as (typeof TRANSACTION_TYPES)[number]));
    },
    { message: 'Invalid type value. Allowed values: spending, earning, debts' }
  )
  .transform((types) => types as (typeof TRANSACTION_TYPES)[number][] | undefined);

export const transactionListQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => {
      const parsed = parseInt(val || '1', 10);
      return Math.max(parsed, 1);
    }),
  per_page: z
    .string()
    .optional()
    .transform((val) => {
      const parsed = parseInt(val || '10', 10);
      return Math.min(Math.max(parsed, 1), 100);
    }),
  order_by: z.enum(ORDER_FIELDS, {
    error: () => `Invalid order_by value. Allowed values: ${ORDER_FIELDS.join(', ')}`,
  }).optional().default('created_at'),
  order_direction: z.enum(ORDER_DIRECTIONS, {
    error: () => 'Invalid order_direction value. Allowed values: asc, desc',
  }).optional().default('desc'),
  note: z.string().optional(),
  type: typeFilterSchema,
  created_from: isoDateStringSchema.optional(),
  created_to: isoDateStringSchema.optional(),
});

export const transactionSummaryQuerySchema = z.object({
  time_range: z.enum(TIME_RANGES, {
    error: () => 'Invalid time_range value. Allowed values: day, week, month',
  }),
});

export const transactionCreateQuerySchema = z.object({
  upsert: z
    .string()
    .optional()
    .default('false')
    .transform((val) => val === 'true'),
});
