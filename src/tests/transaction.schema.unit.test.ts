import { transactionCreateSchema } from '../validators/transaction.schema';

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

