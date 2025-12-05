import {
  transactionCreateSchema,
  transactionUpdateSchema,
  transactionIdParamSchema,
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
