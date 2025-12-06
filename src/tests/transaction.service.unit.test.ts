import { TransactionService, ValidatedListQuery } from '../services/transaction.service';
import {
  CreateTransactionDTO,
  PaginatedTransactionsResponse,
  Transaction,
  TransactionResponse,
  TransactionType,
} from '../models/transaction.model';

// Mock the repository
const mockRepository = {
  create: jest.fn(),
  deleteById: jest.fn(),
  findById: jest.fn(),
  updateById: jest.fn(),
  getSummaryByRange: jest.fn(),
  listPaginated: jest.fn(),
  findDebtByDebtorName: jest.fn(),
  accumulateDebt: jest.fn(),
};

// Default validated query for list tests
const defaultListQuery: ValidatedListQuery = {
  page: 1,
  per_page: 10,
  order_by: 'created_at',
  order_direction: 'desc',
};

describe('TransactionService', () => {
  let service: TransactionService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new TransactionService(mockRepository as any);
  });

  describe('list', () => {
    const mockTransactions: TransactionResponse[] = [
      {
        id: 'tx-1',
        nominal: 100000,
        debtor_name: null,
        invoice_url: null,
        invoice_data: null,
        note: 'Test transaction 1',
        created_at: '2025-12-06T10:00:00.000Z',
        updated_at: '2025-12-06T10:00:00.000Z',
      },
      {
        id: 'tx-2',
        nominal: 50000,
        debtor_name: 'John Doe',
        invoice_url: null,
        invoice_data: null,
        note: 'Test transaction 2',
        created_at: '2025-12-05T10:00:00.000Z',
        updated_at: '2025-12-05T10:00:00.000Z',
      },
    ];

    const mockPaginatedResponse: PaginatedTransactionsResponse = {
      transactions: mockTransactions,
      pagination: {
        page: 1,
        per_page: 10,
        total_items: 2,
        total_pages: 1,
      },
    };

    it('should list transactions with default parameters', async () => {
      // Arrange
      mockRepository.listPaginated.mockResolvedValue(mockPaginatedResponse);

      // Act
      const result = await service.list(defaultListQuery);

      // Assert
      expect(mockRepository.listPaginated).toHaveBeenCalledWith({
        page: 1,
        perPage: 10,
        orderBy: 'created_at',
        orderDirection: 'desc',
        note: undefined,
        types: undefined,
        createdFrom: undefined,
        createdTo: undefined,
      });
      expect(result).toEqual(mockPaginatedResponse);
    });

    it('should list transactions with custom pagination', async () => {
      // Arrange
      mockRepository.listPaginated.mockResolvedValue({
        ...mockPaginatedResponse,
        pagination: { ...mockPaginatedResponse.pagination, page: 2, per_page: 20 },
      });

      // Act
      await service.list({ ...defaultListQuery, page: 2, per_page: 20 });

      // Assert
      expect(mockRepository.listPaginated).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 2,
          perPage: 20,
        })
      );
    });

    it('should list transactions with custom ordering', async () => {
      // Arrange
      mockRepository.listPaginated.mockResolvedValue(mockPaginatedResponse);

      // Act
      await service.list({ ...defaultListQuery, order_by: 'nominal', order_direction: 'asc' });

      // Assert
      expect(mockRepository.listPaginated).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: 'nominal',
          orderDirection: 'asc',
        })
      );
    });

    it('should list transactions with updated_at ordering', async () => {
      // Arrange
      mockRepository.listPaginated.mockResolvedValue(mockPaginatedResponse);

      // Act
      await service.list({ ...defaultListQuery, order_by: 'updated_at' });

      // Assert
      expect(mockRepository.listPaginated).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: 'updated_at',
        })
      );
    });

    it('should list transactions with note filter', async () => {
      // Arrange
      mockRepository.listPaginated.mockResolvedValue(mockPaginatedResponse);

      // Act
      await service.list({ ...defaultListQuery, note: 'test search' });

      // Assert
      expect(mockRepository.listPaginated).toHaveBeenCalledWith(
        expect.objectContaining({
          note: 'test search',
        })
      );
    });

    it('should list transactions with single type filter', async () => {
      // Arrange
      mockRepository.listPaginated.mockResolvedValue(mockPaginatedResponse);

      // Act
      await service.list({ ...defaultListQuery, type: ['earning'] });

      // Assert
      expect(mockRepository.listPaginated).toHaveBeenCalledWith(
        expect.objectContaining({
          types: ['earning'],
        })
      );
    });

    it('should list transactions with multiple type filters', async () => {
      // Arrange
      mockRepository.listPaginated.mockResolvedValue(mockPaginatedResponse);

      // Act
      await service.list({ ...defaultListQuery, type: ['earning', 'spending'] });

      // Assert
      expect(mockRepository.listPaginated).toHaveBeenCalledWith(
        expect.objectContaining({
          types: ['earning', 'spending'],
        })
      );
    });

    it('should list transactions with created_from filter', async () => {
      // Arrange
      mockRepository.listPaginated.mockResolvedValue(mockPaginatedResponse);
      const dateFrom = '2025-12-01T00:00:00.000Z';

      // Act
      await service.list({ ...defaultListQuery, created_from: dateFrom });

      // Assert
      expect(mockRepository.listPaginated).toHaveBeenCalledWith(
        expect.objectContaining({
          createdFrom: dateFrom,
        })
      );
    });

    it('should list transactions with created_to filter', async () => {
      // Arrange
      mockRepository.listPaginated.mockResolvedValue(mockPaginatedResponse);
      const dateTo = '2025-12-31T23:59:59.000Z';

      // Act
      await service.list({ ...defaultListQuery, created_to: dateTo });

      // Assert
      expect(mockRepository.listPaginated).toHaveBeenCalledWith(
        expect.objectContaining({
          createdTo: dateTo,
        })
      );
    });

    it('should list transactions with date range filter', async () => {
      // Arrange
      mockRepository.listPaginated.mockResolvedValue(mockPaginatedResponse);
      const dateFrom = '2025-12-01T00:00:00.000Z';
      const dateTo = '2025-12-31T23:59:59.000Z';

      // Act
      await service.list({ ...defaultListQuery, created_from: dateFrom, created_to: dateTo });

      // Assert
      expect(mockRepository.listPaginated).toHaveBeenCalledWith(
        expect.objectContaining({
          createdFrom: dateFrom,
          createdTo: dateTo,
        })
      );
    });

    it('should list transactions with all filters combined', async () => {
      // Arrange
      mockRepository.listPaginated.mockResolvedValue(mockPaginatedResponse);

      // Act
      await service.list({
        page: 2,
        per_page: 25,
        order_by: 'nominal',
        order_direction: 'asc',
        note: 'groceries',
        type: ['spending', 'earning'],
        created_from: '2025-12-01T00:00:00.000Z',
        created_to: '2025-12-31T23:59:59.000Z',
      });

      // Assert
      expect(mockRepository.listPaginated).toHaveBeenCalledWith({
        page: 2,
        perPage: 25,
        orderBy: 'nominal',
        orderDirection: 'asc',
        note: 'groceries',
        types: ['spending', 'earning'],
        createdFrom: '2025-12-01T00:00:00.000Z',
        createdTo: '2025-12-31T23:59:59.000Z',
      });
    });

    it('should handle repository errors', async () => {
      // Arrange
      const repositoryError = new Error('Database connection failed');
      mockRepository.listPaginated.mockRejectedValue(repositoryError);

      // Act & Assert
      await expect(service.list(defaultListQuery)).rejects.toThrow(repositoryError);
    });
  });

  describe('create', () => {
    const validPayload: CreateTransactionDTO = {
      nominal: 100000,
      type: 'earning',
      note: 'Test transaction',
    };

    const mockTransaction: Transaction = {
      id: 'test-id',
      nominal: 100000,
      debtor_name: null,
      invoice_url: null,
      invoice_data: null,
      note: 'Test transaction',
      type: 'earning',
      created_at: '2025-12-06T10:00:00.000Z',
      updated_at: '2025-12-06T10:00:00.000Z',
    };

    it('should create a transaction successfully', async () => {
      // Arrange
      mockRepository.create.mockResolvedValue(mockTransaction);

      // Act
      const result = await service.create(validPayload);

      // Assert
      expect(mockRepository.create).toHaveBeenCalledWith(validPayload);
      expect(result).toEqual({
        id: 'test-id',
        nominal: 100000,
        debtor_name: null,
        invoice_url: null,
        invoice_data: null,
        note: 'Test transaction',
        created_at: '2025-12-06T10:00:00.000Z',
        updated_at: '2025-12-06T10:00:00.000Z',
      });
    });

    it('should create debt transaction with valid debtor_name', async () => {
      // Arrange
      const debtPayload = {
        nominal: 50000,
        type: 'debts' as TransactionType,
        debtor_name: 'John Doe',
        note: 'Test debt',
      };

      const mockDebtTransaction: Transaction = {
        id: 'debt-id',
        nominal: 50000,
        debtor_name: 'John Doe',
        invoice_url: null,
        invoice_data: null,
        note: 'Test debt',
        type: 'debts',
        created_at: '2025-12-06T10:00:00.000Z',
        updated_at: '2025-12-06T10:00:00.000Z',
      };

      mockRepository.create.mockResolvedValue(mockDebtTransaction);

      // Act
      const result = await service.create(debtPayload);

      // Assert
      expect(mockRepository.create).toHaveBeenCalledWith(debtPayload);
      expect(result).toEqual({
        id: 'debt-id',
        nominal: 50000,
        debtor_name: 'John Doe',
        invoice_url: null,
        invoice_data: null,
        note: 'Test debt',
        created_at: '2025-12-06T10:00:00.000Z',
        updated_at: '2025-12-06T10:00:00.000Z',
      });
    });

    it('should create transaction with null optional fields', async () => {
      // Arrange
      const payloadWithNulls = {
        nominal: 100000,
        type: 'earning' as TransactionType,
        debtor_name: null,
        note: null,
        invoice_url: null,
      };

      mockRepository.create.mockResolvedValue(mockTransaction);

      // Act
      const result = await service.create(payloadWithNulls);

      // Assert
      expect(mockRepository.create).toHaveBeenCalledWith(payloadWithNulls);
      expect(result).toEqual({
        id: 'test-id',
        nominal: 100000,
        debtor_name: null,
        invoice_url: null,
        invoice_data: null,
        note: 'Test transaction',
        created_at: '2025-12-06T10:00:00.000Z',
        updated_at: '2025-12-06T10:00:00.000Z',
      });
    });

    it('should handle repository errors', async () => {
      // Arrange
      const repositoryError = new Error('Database connection failed');
      mockRepository.create.mockRejectedValue(repositoryError);

      // Act & Assert
      await expect(service.create(validPayload)).rejects.toThrow(repositoryError);
    });
  });

  describe('create with upsert', () => {
    const debtPayload: CreateTransactionDTO = {
      nominal: 50000,
      type: 'debts',
      debtor_name: 'John Doe',
      note: 'Initial debt',
    };

    const existingDebtTransaction: Transaction = {
      id: 'existing-debt-id',
      nominal: 100000,
      debtor_name: 'John Doe',
      invoice_url: null,
      invoice_data: null,
      note: 'Original debt note',
      type: 'debts',
      created_at: '2025-12-01T10:00:00.000Z',
      updated_at: '2025-12-01T10:00:00.000Z',
    };

    const accumulatedDebtTransaction: Transaction = {
      id: 'existing-debt-id',
      nominal: 150000,
      debtor_name: 'John Doe',
      invoice_url: null,
      invoice_data: null,
      note: 'Initial debt',
      type: 'debts',
      created_at: '2025-12-01T10:00:00.000Z',
      updated_at: '2025-12-06T10:00:00.000Z',
    };

    it('should accumulate nominal when upsert=true and debt exists', async () => {
      // Arrange
      mockRepository.findDebtByDebtorName.mockResolvedValue(existingDebtTransaction);
      mockRepository.accumulateDebt.mockResolvedValue(accumulatedDebtTransaction);

      // Act
      const result = await service.create(debtPayload, { upsert: true });

      // Assert
      expect(mockRepository.findDebtByDebtorName).toHaveBeenCalledWith('John Doe');
      expect(mockRepository.accumulateDebt).toHaveBeenCalledWith(
        'existing-debt-id',
        150000, // 100000 + 50000
        debtPayload
      );
      expect(mockRepository.create).not.toHaveBeenCalled();
      expect(result.nominal).toBe(150000);
    });

    it('should create new debt when upsert=true but no existing debt', async () => {
      // Arrange
      mockRepository.findDebtByDebtorName.mockResolvedValue(null);
      const newDebtTransaction: Transaction = {
        id: 'new-debt-id',
        nominal: 50000,
        debtor_name: 'John Doe',
        invoice_url: null,
        invoice_data: null,
        note: 'Initial debt',
        type: 'debts',
        created_at: '2025-12-06T10:00:00.000Z',
        updated_at: '2025-12-06T10:00:00.000Z',
      };
      mockRepository.create.mockResolvedValue(newDebtTransaction);

      // Act
      const result = await service.create(debtPayload, { upsert: true });

      // Assert
      expect(mockRepository.findDebtByDebtorName).toHaveBeenCalledWith('John Doe');
      expect(mockRepository.accumulateDebt).not.toHaveBeenCalled();
      expect(mockRepository.create).toHaveBeenCalledWith(debtPayload);
      expect(result.nominal).toBe(50000);
    });

    it('should create new transaction when upsert=false (default)', async () => {
      // Arrange
      const newDebtTransaction: Transaction = {
        id: 'new-debt-id',
        nominal: 50000,
        debtor_name: 'John Doe',
        invoice_url: null,
        invoice_data: null,
        note: 'Initial debt',
        type: 'debts',
        created_at: '2025-12-06T10:00:00.000Z',
        updated_at: '2025-12-06T10:00:00.000Z',
      };
      mockRepository.create.mockResolvedValue(newDebtTransaction);

      // Act
      const result = await service.create(debtPayload); // no options = upsert defaults to false

      // Assert
      expect(mockRepository.findDebtByDebtorName).not.toHaveBeenCalled();
      expect(mockRepository.accumulateDebt).not.toHaveBeenCalled();
      expect(mockRepository.create).toHaveBeenCalledWith(debtPayload);
      expect(result.nominal).toBe(50000);
    });

    it('should not upsert for non-debt transaction types', async () => {
      // Arrange
      const earningPayload: CreateTransactionDTO = {
        nominal: 100000,
        type: 'earning',
        note: 'Salary',
      };
      const newEarningTransaction: Transaction = {
        id: 'earning-id',
        nominal: 100000,
        debtor_name: null,
        invoice_url: null,
        invoice_data: null,
        note: 'Salary',
        type: 'earning',
        created_at: '2025-12-06T10:00:00.000Z',
        updated_at: '2025-12-06T10:00:00.000Z',
      };
      mockRepository.create.mockResolvedValue(newEarningTransaction);

      // Act
      const result = await service.create(earningPayload, { upsert: true });

      // Assert
      expect(mockRepository.findDebtByDebtorName).not.toHaveBeenCalled();
      expect(mockRepository.create).toHaveBeenCalledWith(earningPayload);
      expect(result.nominal).toBe(100000);
    });

    it('should update optional fields when upserting', async () => {
      // Arrange
      const payloadWithUpdates: CreateTransactionDTO = {
        nominal: 25000,
        type: 'debts',
        debtor_name: 'John Doe',
        note: 'Updated note',
        invoice_url: 'https://example.com/invoice.pdf',
        invoice_data: { item: 'Laptop' },
      };

      const updatedTransaction: Transaction = {
        id: 'existing-debt-id',
        nominal: 125000,
        debtor_name: 'John Doe',
        invoice_url: 'https://example.com/invoice.pdf',
        invoice_data: { item: 'Laptop' },
        note: 'Updated note',
        type: 'debts',
        created_at: '2025-12-01T10:00:00.000Z',
        updated_at: '2025-12-06T10:00:00.000Z',
      };

      mockRepository.findDebtByDebtorName.mockResolvedValue(existingDebtTransaction);
      mockRepository.accumulateDebt.mockResolvedValue(updatedTransaction);

      // Act
      const result = await service.create(payloadWithUpdates, { upsert: true });

      // Assert
      expect(mockRepository.accumulateDebt).toHaveBeenCalledWith(
        'existing-debt-id',
        125000, // 100000 + 25000
        payloadWithUpdates
      );
      expect(result.note).toBe('Updated note');
      expect(result.invoice_url).toBe('https://example.com/invoice.pdf');
    });

    it('should handle findDebtByDebtorName errors', async () => {
      // Arrange
      const repositoryError = new Error('Database connection failed');
      mockRepository.findDebtByDebtorName.mockRejectedValue(repositoryError);

      // Act & Assert
      await expect(service.create(debtPayload, { upsert: true })).rejects.toThrow(repositoryError);
    });

    it('should handle accumulateDebt errors', async () => {
      // Arrange
      mockRepository.findDebtByDebtorName.mockResolvedValue(existingDebtTransaction);
      const repositoryError = new Error('Failed to update');
      mockRepository.accumulateDebt.mockRejectedValue(repositoryError);

      // Act & Assert
      await expect(service.create(debtPayload, { upsert: true })).rejects.toThrow(repositoryError);
    });
  });

  describe('update', () => {
    const updatePayload = {
      nominal: 150000,
      type: 'spending' as TransactionType,
      note: 'Updated transaction',
    };

    const mockTransaction: Transaction = {
      id: 'test-id',
      nominal: 150000,
      debtor_name: null,
      invoice_url: null,
      invoice_data: null,
      note: 'Updated transaction',
      type: 'spending',
      created_at: '2025-12-06T10:00:00.000Z',
      updated_at: '2025-12-06T11:00:00.000Z',
    };

    it('should update a transaction successfully', async () => {
      // Arrange
      mockRepository.updateById.mockResolvedValue(mockTransaction);

      // Act
      const result = await service.update('test-id', updatePayload);

      // Assert
      expect(mockRepository.updateById).toHaveBeenCalledWith('test-id', updatePayload);
      expect(result).toEqual({
        id: 'test-id',
        nominal: 150000,
        debtor_name: null,
        invoice_url: null,
        invoice_data: null,
        note: 'Updated transaction',
        created_at: '2025-12-06T10:00:00.000Z',
        updated_at: '2025-12-06T11:00:00.000Z',
      });
    });

    it('should update debt transaction with valid debtor_name', async () => {
      // Arrange
      const debtPayload = {
        nominal: 50000,
        type: 'debts' as TransactionType,
        debtor_name: 'Jane Doe',
        note: 'Updated debt',
      };

      const mockDebtTransaction: Transaction = {
        id: 'debt-id',
        nominal: 50000,
        debtor_name: 'Jane Doe',
        invoice_url: null,
        invoice_data: null,
        note: 'Updated debt',
        type: 'debts',
        created_at: '2025-12-06T10:00:00.000Z',
        updated_at: '2025-12-06T11:00:00.000Z',
      };

      mockRepository.updateById.mockResolvedValue(mockDebtTransaction);

      // Act
      const result = await service.update('debt-id', debtPayload);

      // Assert
      expect(mockRepository.updateById).toHaveBeenCalledWith('debt-id', debtPayload);
      expect(result).toEqual({
        id: 'debt-id',
        nominal: 50000,
        debtor_name: 'Jane Doe',
        invoice_url: null,
        invoice_data: null,
        note: 'Updated debt',
        created_at: '2025-12-06T10:00:00.000Z',
        updated_at: '2025-12-06T11:00:00.000Z',
      });
    });

    it('should handle repository errors', async () => {
      // Arrange
      const repositoryError = new Error('Database connection failed');
      mockRepository.updateById.mockRejectedValue(repositoryError);

      // Act & Assert
      await expect(service.update('test-id', updatePayload)).rejects.toThrow(repositoryError);
    });
  });

  describe('delete', () => {
    const mockTransaction: Transaction = {
      id: 'test-id',
      nominal: 100000,
      debtor_name: null,
      invoice_url: null,
      invoice_data: null,
      note: 'Test transaction',
      type: 'earning',
      created_at: '2025-12-06T10:00:00.000Z',
      updated_at: '2025-12-06T10:00:00.000Z',
    };

    it('should delete a transaction successfully', async () => {
      // Arrange
      mockRepository.deleteById.mockResolvedValue(mockTransaction);

      // Act
      const result = await service.delete('test-id');

      // Assert
      expect(mockRepository.deleteById).toHaveBeenCalledWith('test-id');
      expect(result).toEqual({
        id: 'test-id',
        nominal: 100000,
        debtor_name: null,
        invoice_url: null,
        invoice_data: null,
        note: 'Test transaction',
        created_at: '2025-12-06T10:00:00.000Z',
        updated_at: '2025-12-06T10:00:00.000Z',
      });
    });

    it('should handle repository errors', async () => {
      // Arrange
      const repositoryError = new Error('Database connection failed');
      mockRepository.deleteById.mockRejectedValue(repositoryError);

      // Act & Assert
      await expect(service.delete('test-id')).rejects.toThrow(repositoryError);
    });
  });

  describe('getSummary', () => {
    const mockTransactions = [
      { type: 'earning' as TransactionType, nominal: 100000 },
      { type: 'earning' as TransactionType, nominal: 50000 },
      { type: 'spending' as TransactionType, nominal: 30000 },
      { type: 'spending' as TransactionType, nominal: 20000 },
      { type: 'debts' as TransactionType, nominal: 75000 },
      { type: 'debts' as TransactionType, nominal: 25000 },
    ];

    it('should return correct summary for day range', async () => {
      // Arrange
      mockRepository.getSummaryByRange.mockResolvedValue(mockTransactions);

      // Act
      const result = await service.getSummary('day');

      // Assert
      expect(mockRepository.getSummaryByRange).toHaveBeenCalledWith(
        expect.any(String), // start of day
        expect.any(String)  // start of next day
      );
      expect(result).toEqual({
        total_debts: 100000,
        total_spending: 50000,
        total_earning: 150000,
      });
    });

    it('should return correct summary for week range', async () => {
      // Arrange
      mockRepository.getSummaryByRange.mockResolvedValue(mockTransactions);

      // Act
      const result = await service.getSummary('week');

      // Assert
      expect(mockRepository.getSummaryByRange).toHaveBeenCalledWith(
        expect.any(String), // start of week
        expect.any(String)  // start of next week
      );
      expect(result).toEqual({
        total_debts: 100000,
        total_spending: 50000,
        total_earning: 150000,
      });
    });

    it('should return correct summary for month range', async () => {
      // Arrange
      mockRepository.getSummaryByRange.mockResolvedValue(mockTransactions);

      // Act
      const result = await service.getSummary('month');

      // Assert
      expect(mockRepository.getSummaryByRange).toHaveBeenCalledWith(
        expect.any(String), // start of month
        expect.any(String)  // start of next month
      );
      expect(result).toEqual({
        total_debts: 100000,
        total_spending: 50000,
        total_earning: 150000,
      });
    });

    it('should return zero summary for empty transactions', async () => {
      // Arrange
      mockRepository.getSummaryByRange.mockResolvedValue([]);

      // Act
      const result = await service.getSummary('day');

      // Assert
      expect(result).toEqual({
        total_debts: 0,
        total_spending: 0,
        total_earning: 0,
      });
    });

    it('should handle partial transaction data', async () => {
      // Arrange
      const partialTransactions = [
        { type: 'earning' as TransactionType, nominal: 100000 },
        { type: 'spending' as TransactionType, nominal: 30000 },
        // Missing debts
      ];
      mockRepository.getSummaryByRange.mockResolvedValue(partialTransactions);

      // Act
      const result = await service.getSummary('day');

      // Assert
      expect(result).toEqual({
        total_debts: 0,
        total_spending: 30000,
        total_earning: 100000,
      });
    });

    it('should handle repository errors', async () => {
      // Arrange
      const repositoryError = new Error('Database connection failed');
      mockRepository.getSummaryByRange.mockRejectedValue(repositoryError);

      // Act & Assert
      await expect(service.getSummary('day')).rejects.toThrow(repositoryError);
    });
  });

  describe('repayDebt', () => {
    const mockDebtTransaction: Transaction = {
      id: 'debt-1',
      nominal: 100000,
      debtor_name: 'John Doe',
      invoice_url: null,
      invoice_data: null,
      note: 'Initial debt',
      type: 'debts',
      created_at: '2025-12-01T10:00:00.000Z',
      updated_at: '2025-12-01T10:00:00.000Z',
    };

    const mockUpdatedTransaction: Transaction = {
      ...mockDebtTransaction,
      type: 'earning',
      debtor_name: null,
      note: 'Pembayaran Hutang John Doe',
      updated_at: '2025-12-06T10:00:00.000Z',
    };

    it('should successfully mark a debt as repaid', async () => {
      // Arrange
      mockRepository.findById.mockResolvedValue(mockDebtTransaction);
      mockRepository.updateById.mockResolvedValue(mockUpdatedTransaction);

      // Act
      const result = await service.repayDebt('debt-1');

      // Assert
      expect(mockRepository.findById).toHaveBeenCalledWith('debt-1');
      expect(mockRepository.updateById).toHaveBeenCalledWith('debt-1', {
        type: 'earning',
        debtor_name: null,
        note: 'Pembayaran Hutang John Doe',
      });
      expect(result).toEqual({
        id: 'debt-1',
        nominal: 100000,
        debtor_name: null,
        invoice_url: null,
        invoice_data: null,
        note: 'Pembayaran Hutang John Doe',
        created_at: '2025-12-01T10:00:00.000Z',
        updated_at: '2025-12-06T10:00:00.000Z',
      });
    });

    it('should throw error if transaction is not found', async () => {
      // Arrange
      mockRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.repayDebt('non-existent-id')).rejects.toThrow('Transaction not found');
      expect(mockRepository.findById).toHaveBeenCalledWith('non-existent-id');
      expect(mockRepository.updateById).not.toHaveBeenCalled();
    });

    it('should throw error if transaction is not a debt', async () => {
      // Arrange
      const nonDebtTransaction: Transaction = {
        ...mockDebtTransaction,
        type: 'spending',
      };
      mockRepository.findById.mockResolvedValue(nonDebtTransaction);

      // Act & Assert
      await expect(service.repayDebt('non-debt-id')).rejects.toThrow('Transaction is not a debt');
      expect(mockRepository.findById).toHaveBeenCalledWith('non-debt-id');
      expect(mockRepository.updateById).not.toHaveBeenCalled();
    });

    it('should throw error if debt transaction has no debtor name', async () => {
      // Arrange
      const debtWithoutDebtor: Transaction = {
        ...mockDebtTransaction,
        debtor_name: null,
      };
      mockRepository.findById.mockResolvedValue(debtWithoutDebtor);

      // Act & Assert
      await expect(service.repayDebt('no-debtor-id')).rejects.toThrow('Debt transaction has no debtor name');
      expect(mockRepository.findById).toHaveBeenCalledWith('no-debtor-id');
      expect(mockRepository.updateById).not.toHaveBeenCalled();
    });

    it('should handle repository errors during findById', async () => {
      // Arrange
      const repositoryError = new Error('Database connection failed');
      mockRepository.findById.mockRejectedValue(repositoryError);

      // Act & Assert
      await expect(service.repayDebt('debt-1')).rejects.toThrow(repositoryError);
      expect(mockRepository.findById).toHaveBeenCalledWith('debt-1');
      expect(mockRepository.updateById).not.toHaveBeenCalled();
    });

    it('should handle repository errors during updateById', async () => {
      // Arrange
      const repositoryError = new Error('Update failed');
      mockRepository.findById.mockResolvedValue(mockDebtTransaction);
      mockRepository.updateById.mockRejectedValue(repositoryError);

      // Act & Assert
      await expect(service.repayDebt('debt-1')).rejects.toThrow(repositoryError);
      expect(mockRepository.findById).toHaveBeenCalledWith('debt-1');
      expect(mockRepository.updateById).toHaveBeenCalledWith('debt-1', {
        type: 'earning',
        debtor_name: null,
        note: 'Pembayaran Hutang John Doe',
      });
    });
  });
});