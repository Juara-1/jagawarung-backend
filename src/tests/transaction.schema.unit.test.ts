import {
  transactionCreateSchema,
  transactionUpdateSchema,
  transactionIdParamSchema,
  transactionListQuerySchema,
  transactionSummaryQuerySchema,
} from '../validators/transaction.schema';

describe('transactionCreateSchema', () => {
  describe('valid payloads', () => {
    it('should accept valid earning transaction', () => {
      const result = transactionCreateSchema.safeParse({
        nominal: 100000,
        type: 'earning',
        note: 'Test transaction',
      });
      expect(result.success).toBe(true);
    });

    it('should accept valid spending transaction', () => {
      const result = transactionCreateSchema.safeParse({
        nominal: 50000,
        type: 'spending',
      });
      expect(result.success).toBe(true);
    });

    it('should accept valid debts transaction with debtor_name', () => {
      const result = transactionCreateSchema.safeParse({
        nominal: 75000,
        type: 'debts',
        debtor_name: 'John Doe',
      });
      expect(result.success).toBe(true);
    });

    it('should accept transaction with all optional fields', () => {
      const result = transactionCreateSchema.safeParse({
        nominal: 100000,
        type: 'earning',
        debtor_name: null,
        note: 'Full transaction',
        invoice_url: 'https://example.com/invoice.pdf',
        invoice_data: { invoice_id: '12345' },
      });
      expect(result.success).toBe(true);
    });

    it('should trim debtor_name whitespace', () => {
      const result = transactionCreateSchema.safeParse({
        nominal: 75000,
        type: 'debts',
        debtor_name: '  John Doe  ',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.debtor_name).toBe('John Doe');
      }
    });
  });

  describe('nominal validation', () => {
    it('should reject negative nominal', () => {
      const result = transactionCreateSchema.safeParse({
        nominal: -1000,
        type: 'earning',
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe('nominal must be a positive number');
    });

    it('should reject zero nominal', () => {
      const result = transactionCreateSchema.safeParse({
        nominal: 0,
        type: 'earning',
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe('nominal must be a positive number');
    });

    it('should reject missing nominal', () => {
      const result = transactionCreateSchema.safeParse({
        type: 'earning',
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe('nominal must be a positive number');
    });

    it('should reject non-numeric nominal', () => {
      const result = transactionCreateSchema.safeParse({
        nominal: 'not_a_number',
        type: 'earning',
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe('nominal must be a number');
    });
  });

  describe('type validation', () => {
    it('should reject missing type', () => {
      const result = transactionCreateSchema.safeParse({
        nominal: 100000,
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe('type is required');
    });

    it('should reject invalid type', () => {
      const result = transactionCreateSchema.safeParse({
        nominal: 100000,
        type: 'invalid_type',
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe('type must be one of: spending, earning, debts');
    });
  });

  describe('debtor_name validation', () => {
    it('should reject debts transaction without debtor_name', () => {
      const result = transactionCreateSchema.safeParse({
        nominal: 50000,
        type: 'debts',
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe('debtor_name is required for debt transactions');
    });

    it('should reject debts transaction with empty debtor_name', () => {
      const result = transactionCreateSchema.safeParse({
        nominal: 50000,
        type: 'debts',
        debtor_name: '',
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe('debtor_name is required for debt transactions');
    });

    it('should reject debts transaction with whitespace-only debtor_name', () => {
      const result = transactionCreateSchema.safeParse({
        nominal: 50000,
        type: 'debts',
        debtor_name: '   ',
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe('debtor_name is required for debt transactions');
    });

    it('should reject non-string debtor_name', () => {
      const result = transactionCreateSchema.safeParse({
        nominal: 50000,
        type: 'debts',
        debtor_name: 12345,
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe('debtor_name must be a string');
    });
  });

  describe('optional fields validation', () => {
    it('should reject non-string note', () => {
      const result = transactionCreateSchema.safeParse({
        nominal: 100000,
        type: 'earning',
        note: 12345,
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe('note must be a string');
    });

    it('should reject non-string invoice_url', () => {
      const result = transactionCreateSchema.safeParse({
        nominal: 100000,
        type: 'earning',
        invoice_url: 12345,
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe('invoice_url must be a string');
    });
  });
});

describe('transactionUpdateSchema', () => {
  describe('valid payloads', () => {
    it('should accept valid update payload', () => {
      const result = transactionUpdateSchema.safeParse({
        nominal: 150000,
        type: 'spending',
        note: 'Updated transaction',
      });
      expect(result.success).toBe(true);
    });

    it('should accept debt update with debtor_name', () => {
      const result = transactionUpdateSchema.safeParse({
        nominal: 75000,
        type: 'debts',
        debtor_name: 'Jane Doe',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('nominal validation', () => {
    it('should reject negative nominal', () => {
      const result = transactionUpdateSchema.safeParse({
        nominal: -1000,
        type: 'earning',
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe('nominal must be a positive number');
    });

    it('should reject zero nominal', () => {
      const result = transactionUpdateSchema.safeParse({
        nominal: 0,
        type: 'earning',
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe('nominal must be a positive number');
    });
  });

  describe('type validation', () => {
    it('should reject invalid type', () => {
      const result = transactionUpdateSchema.safeParse({
        nominal: 100000,
        type: 'invalid_type',
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe('type must be one of: spending, earning, debts');
    });
  });

  describe('debtor_name validation', () => {
    it('should reject debts without debtor_name', () => {
      const result = transactionUpdateSchema.safeParse({
        nominal: 50000,
        type: 'debts',
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe('debtor_name is required for debt transactions');
    });

    it('should reject non-string debtor_name', () => {
      const result = transactionUpdateSchema.safeParse({
        nominal: 50000,
        type: 'debts',
        debtor_name: 123,
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe('debtor_name must be a string');
    });
  });

  describe('optional fields validation', () => {
    it('should reject non-string note', () => {
      const result = transactionUpdateSchema.safeParse({
        nominal: 100000,
        type: 'earning',
        note: 123,
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe('note must be a string');
    });

    it('should reject non-string invoice_url', () => {
      const result = transactionUpdateSchema.safeParse({
        nominal: 100000,
        type: 'earning',
        invoice_url: 123,
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe('invoice_url must be a string');
    });
  });
});

describe('transactionIdParamSchema', () => {
  describe('valid params', () => {
    it('should accept valid UUID', () => {
      const result = transactionIdParamSchema.safeParse({
        id: '123e4567-e89b-12d3-a456-426614174000',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('invalid params', () => {
    it('should reject missing id', () => {
      const result = transactionIdParamSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('should reject invalid UUID format', () => {
      const result = transactionIdParamSchema.safeParse({
        id: 'not-a-valid-uuid',
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe('id must be a valid UUID');
    });

    it('should reject non-string id', () => {
      const result = transactionIdParamSchema.safeParse({
        id: 12345,
      });
      expect(result.success).toBe(false);
    });
  });
});

describe('transactionListQuerySchema', () => {
  describe('valid queries', () => {
    it('should accept empty query with defaults', () => {
      const result = transactionListQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.per_page).toBe(10);
        expect(result.data.order_by).toBe('created_at');
        expect(result.data.order_direction).toBe('desc');
      }
    });

    it('should accept valid pagination', () => {
      const result = transactionListQuerySchema.safeParse({
        page: '2',
        per_page: '25',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(2);
        expect(result.data.per_page).toBe(25);
      }
    });

    it('should enforce minimum page value of 1', () => {
      const result = transactionListQuerySchema.safeParse({ page: '0' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
      }
    });

    it('should enforce minimum per_page value of 1', () => {
      const result = transactionListQuerySchema.safeParse({ per_page: '0' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.per_page).toBe(1);
      }
    });

    it('should enforce maximum per_page value of 100', () => {
      const result = transactionListQuerySchema.safeParse({ per_page: '500' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.per_page).toBe(100);
      }
    });

    it('should accept valid ordering', () => {
      const result = transactionListQuerySchema.safeParse({
        order_by: 'nominal',
        order_direction: 'asc',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.order_by).toBe('nominal');
        expect(result.data.order_direction).toBe('asc');
      }
    });

    it('should accept note filter', () => {
      const result = transactionListQuerySchema.safeParse({ note: 'groceries' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.note).toBe('groceries');
      }
    });

    it('should transform single type filter to array', () => {
      const result = transactionListQuerySchema.safeParse({ type: 'earning' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toEqual(['earning']);
      }
    });

    it('should transform comma-separated types to array', () => {
      const result = transactionListQuerySchema.safeParse({ type: 'earning,spending' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toEqual(['earning', 'spending']);
      }
    });

    it('should handle type filter with extra spaces', () => {
      const result = transactionListQuerySchema.safeParse({ type: ' earning , spending , debts ' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toEqual(['earning', 'spending', 'debts']);
      }
    });

    it('should handle empty type filter string', () => {
      const result = transactionListQuerySchema.safeParse({ type: '' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBeUndefined();
      }
    });

    it('should accept valid ISO date for created_from', () => {
      const result = transactionListQuerySchema.safeParse({
        created_from: '2025-12-01T00:00:00.000Z',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.created_from).toBe('2025-12-01T00:00:00.000Z');
      }
    });

    it('should accept valid ISO date for created_to', () => {
      const result = transactionListQuerySchema.safeParse({
        created_to: '2025-12-31T23:59:59.000Z',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.created_to).toBe('2025-12-31T23:59:59.000Z');
      }
    });
  });

  describe('invalid queries', () => {
    it('should reject invalid order_by', () => {
      const result = transactionListQuerySchema.safeParse({ order_by: 'invalid_field' });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe(
        'Invalid order_by value. Allowed values: created_at, updated_at, nominal'
      );
    });

    it('should reject invalid order_direction', () => {
      const result = transactionListQuerySchema.safeParse({ order_direction: 'invalid' });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe(
        'Invalid order_direction value. Allowed values: asc, desc'
      );
    });

    it('should reject invalid type filter', () => {
      const result = transactionListQuerySchema.safeParse({ type: 'invalid_type' });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe(
        'Invalid type value. Allowed values: spending, earning, debts'
      );
    });

    it('should reject when one of multiple types is invalid', () => {
      const result = transactionListQuerySchema.safeParse({ type: 'earning,invalid' });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe(
        'Invalid type value. Allowed values: spending, earning, debts'
      );
    });

    it('should reject invalid created_from date format', () => {
      const result = transactionListQuerySchema.safeParse({ created_from: 'not-a-date' });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe('Invalid date format. Use ISO format');
    });

    it('should reject invalid created_to date format', () => {
      const result = transactionListQuerySchema.safeParse({ created_to: 'invalid-date' });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe('Invalid date format. Use ISO format');
    });
  });
});

describe('transactionSummaryQuerySchema', () => {
  describe('valid queries', () => {
    it('should accept day time range', () => {
      const result = transactionSummaryQuerySchema.safeParse({ time_range: 'day' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.time_range).toBe('day');
      }
    });

    it('should accept week time range', () => {
      const result = transactionSummaryQuerySchema.safeParse({ time_range: 'week' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.time_range).toBe('week');
      }
    });

    it('should accept month time range', () => {
      const result = transactionSummaryQuerySchema.safeParse({ time_range: 'month' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.time_range).toBe('month');
      }
    });
  });

  describe('invalid queries', () => {
    it('should reject missing time_range', () => {
      const result = transactionSummaryQuerySchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('should reject invalid time_range', () => {
      const result = transactionSummaryQuerySchema.safeParse({ time_range: 'invalid' });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe(
        'Invalid time_range value. Allowed values: day, week, month'
      );
    });
  });
});
