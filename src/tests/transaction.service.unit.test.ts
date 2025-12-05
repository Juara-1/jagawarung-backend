import { AppError } from '../middleware/errorHandler';
import { TransactionService } from '../services/transaction.service';
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
  updateById: jest.fn(),
  getSummaryByRange: jest.fn(),
  listPaginated: jest.fn(),
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
      const result = await service.list({});

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
      await service.list({ page: '2', per_page: '20' });

      // Assert
      expect(mockRepository.listPaginated).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 2,
          perPage: 20,
        })
      );
    });

    it('should enforce minimum page value of 1', async () => {
      // Arrange
      mockRepository.listPaginated.mockResolvedValue(mockPaginatedResponse);

      // Act
      await service.list({ page: '0' });

      // Assert
      expect(mockRepository.listPaginated).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 1,
        })
      );
    });

    it('should enforce minimum per_page value of 1', async () => {
      // Arrange
      mockRepository.listPaginated.mockResolvedValue(mockPaginatedResponse);

      // Act
      await service.list({ per_page: '0' });

      // Assert
      expect(mockRepository.listPaginated).toHaveBeenCalledWith(
        expect.objectContaining({
          perPage: 1,
        })
      );
    });

    it('should enforce maximum per_page value of 100', async () => {
      // Arrange
      mockRepository.listPaginated.mockResolvedValue(mockPaginatedResponse);

      // Act
      await service.list({ per_page: '500' });

      // Assert
      expect(mockRepository.listPaginated).toHaveBeenCalledWith(
        expect.objectContaining({
          perPage: 100,
        })
      );
    });

    it('should list transactions with custom ordering', async () => {
      // Arrange
      mockRepository.listPaginated.mockResolvedValue(mockPaginatedResponse);

      // Act
      await service.list({ order_by: 'nominal', order_direction: 'asc' });

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
      await service.list({ order_by: 'updated_at' });

      // Assert
      expect(mockRepository.listPaginated).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: 'updated_at',
        })
      );
    });

    it('should throw error for invalid order_by value', async () => {
      // Act & Assert
      await expect(service.list({ order_by: 'invalid_field' })).rejects.toThrow(
        new AppError('Invalid order_by value. Allowed values: created_at, updated_at, nominal', 400)
      );
      expect(mockRepository.listPaginated).not.toHaveBeenCalled();
    });

    it('should throw error for invalid order_direction value', async () => {
      // Act & Assert
      await expect(service.list({ order_direction: 'invalid' })).rejects.toThrow(
        new AppError('Invalid order_direction value. Allowed values: asc, desc', 400)
      );
      expect(mockRepository.listPaginated).not.toHaveBeenCalled();
    });

    it('should list transactions with note filter', async () => {
      // Arrange
      mockRepository.listPaginated.mockResolvedValue(mockPaginatedResponse);

      // Act
      await service.list({ note: 'test search' });

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
      await service.list({ type: 'earning' });

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
      await service.list({ type: 'earning,spending' });

      // Assert
      expect(mockRepository.listPaginated).toHaveBeenCalledWith(
        expect.objectContaining({
          types: ['earning', 'spending'],
        })
      );
    });

    it('should handle type filter with extra spaces', async () => {
      // Arrange
      mockRepository.listPaginated.mockResolvedValue(mockPaginatedResponse);

      // Act
      await service.list({ type: ' earning , spending , debts ' });

      // Assert
      expect(mockRepository.listPaginated).toHaveBeenCalledWith(
        expect.objectContaining({
          types: ['earning', 'spending', 'debts'],
        })
      );
    });

    it('should throw error for invalid type filter', async () => {
      // Act & Assert
      await expect(service.list({ type: 'invalid_type' })).rejects.toThrow(
        new AppError('Invalid type value. Allowed values: spending, earning, debts', 400)
      );
      expect(mockRepository.listPaginated).not.toHaveBeenCalled();
    });

    it('should throw error when one of multiple types is invalid', async () => {
      // Act & Assert
      await expect(service.list({ type: 'earning,invalid' })).rejects.toThrow(
        new AppError('Invalid type value. Allowed values: spending, earning, debts', 400)
      );
      expect(mockRepository.listPaginated).not.toHaveBeenCalled();
    });

    it('should list transactions with created_from filter', async () => {
      // Arrange
      mockRepository.listPaginated.mockResolvedValue(mockPaginatedResponse);
      const dateFrom = '2025-12-01T00:00:00.000Z';

      // Act
      await service.list({ created_from: dateFrom });

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
      await service.list({ created_to: dateTo });

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
      await service.list({ created_from: dateFrom, created_to: dateTo });

      // Assert
      expect(mockRepository.listPaginated).toHaveBeenCalledWith(
        expect.objectContaining({
          createdFrom: dateFrom,
          createdTo: dateTo,
        })
      );
    });

    it('should throw error for invalid created_from date format', async () => {
      // Act & Assert
      await expect(service.list({ created_from: 'not-a-date' })).rejects.toThrow(
        new AppError('Invalid created_from date. Use ISO format', 400)
      );
      expect(mockRepository.listPaginated).not.toHaveBeenCalled();
    });

    it('should throw error for invalid created_to date format', async () => {
      // Act & Assert
      await expect(service.list({ created_to: 'invalid-date' })).rejects.toThrow(
        new AppError('Invalid created_to date. Use ISO format', 400)
      );
      expect(mockRepository.listPaginated).not.toHaveBeenCalled();
    });

    it('should list transactions with all filters combined', async () => {
      // Arrange
      mockRepository.listPaginated.mockResolvedValue(mockPaginatedResponse);

      // Act
      await service.list({
        page: '2',
        per_page: '25',
        order_by: 'nominal',
        order_direction: 'asc',
        note: 'groceries',
        type: 'spending,earning',
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

    it('should handle empty type filter string', async () => {
      // Arrange
      mockRepository.listPaginated.mockResolvedValue(mockPaginatedResponse);

      // Act
      await service.list({ type: '' });

      // Assert
      expect(mockRepository.listPaginated).toHaveBeenCalledWith(
        expect.objectContaining({
          types: undefined,
        })
      );
    });

    it('should handle repository errors', async () => {
      // Arrange
      const repositoryError = new Error('Database connection failed');
      mockRepository.listPaginated.mockRejectedValue(repositoryError);

      // Act & Assert
      await expect(service.list({})).rejects.toThrow(repositoryError);
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

    it('should throw error for invalid time range', async () => {
      // Act & Assert
      await expect(service.getSummary('invalid' as any)).rejects.toThrow(
        new AppError('Invalid time_range. Allowed values: day, week, month', 400)
      );
      expect(mockRepository.getSummaryByRange).not.toHaveBeenCalled();
    });
  });
});