import { AppError } from '../middleware/errorHandler';
import { TransactionService } from '../services/transaction.service';
import {
  CreateTransactionDTO,
  Transaction,
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

    it('should throw error for invalid nominal (negative)', async () => {
      // Arrange
      const invalidPayload = { ...validPayload, nominal: -1000 };

      // Act & Assert
      await expect(service.create(invalidPayload)).rejects.toThrow(
        new AppError('nominal must be a positive number', 400)
      );
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it('should throw error for invalid nominal (zero)', async () => {
      // Arrange
      const invalidPayload = { ...validPayload, nominal: 0 };

      // Act & Assert
      await expect(service.create(invalidPayload)).rejects.toThrow(
        new AppError('nominal must be a positive number', 400)
      );
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it('should throw error for invalid nominal (NaN)', async () => {
      // Arrange
      const invalidPayload = { ...validPayload, nominal: NaN };

      // Act & Assert
      await expect(service.create(invalidPayload)).rejects.toThrow(
        new AppError('nominal must be a positive number', 400)
      );
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it('should throw error for missing type', async () => {
      // Arrange
      const invalidPayload = { ...validPayload };
      delete (invalidPayload as any).type;

      // Act & Assert
      await expect(service.create(invalidPayload)).rejects.toThrow(
        new AppError('type must be one of: spending, earning, debts', 400)
      );
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it('should throw error for invalid type', async () => {
      // Arrange
      const invalidPayload = { ...validPayload, type: 'invalid_type' as TransactionType };

      // Act & Assert
      await expect(service.create(invalidPayload)).rejects.toThrow(
        new AppError('type must be one of: spending, earning, debts', 400)
      );
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it('should throw error for missing nominal', async () => {
      // Arrange
      const invalidPayload = { ...validPayload };
      delete (invalidPayload as any).nominal;

      // Act & Assert
      await expect(service.create(invalidPayload)).rejects.toThrow(
        new AppError('nominal must be a positive number', 400)
      );
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it('should throw error for non-numeric nominal', async () => {
      // Arrange
      const invalidPayload = { ...validPayload, nominal: 'not_a_number' as any };

      // Act & Assert
      await expect(service.create(invalidPayload)).rejects.toThrow(
        new AppError('nominal must be a positive number', 400)
      );
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it('should throw error for debt transaction without debtorName', async () => {
      // Arrange
      const debtPayload = {
        nominal: 50000,
        type: 'debts' as TransactionType,
        note: 'Test debt',
      };

      // Act & Assert
      await expect(service.create(debtPayload)).rejects.toThrow(
        new AppError('debtorName is required for debt transactions', 400)
      );
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it('should throw error for debt transaction with empty debtorName', async () => {
      // Arrange
      const debtPayload = {
        nominal: 50000,
        type: 'debts' as TransactionType,
        debtorName: '',
        note: 'Test debt',
      };

      // Act & Assert
      await expect(service.create(debtPayload)).rejects.toThrow(
        new AppError('debtorName is required for debt transactions', 400)
      );
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it('should throw error for debt transaction with non-string debtorName', async () => {
      // Arrange
      const debtPayload = {
        nominal: 50000,
        type: 'debts' as TransactionType,
        debtorName: 123 as any,
        note: 'Test debt',
      };

      // Act & Assert
      await expect(service.create(debtPayload)).rejects.toThrow(
        new AppError('debtorName must be a string when provided', 400)
      );
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it('should throw error for non-string note', async () => {
      // Arrange
      const invalidPayload = { ...validPayload, note: 123 as any };

      // Act & Assert
      await expect(service.create(invalidPayload)).rejects.toThrow(
        new AppError('note must be a string when provided', 400)
      );
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it('should throw error for non-string invoiceUrl', async () => {
      // Arrange
      const invalidPayload = { ...validPayload, invoiceUrl: 123 as any };

      // Act & Assert
      await expect(service.create(invalidPayload)).rejects.toThrow(
        new AppError('invoiceUrl must be a string when provided', 400)
      );
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it('should create debt transaction with valid debtorName', async () => {
      // Arrange
      const debtPayload = {
        nominal: 50000,
        type: 'debts' as TransactionType,
        debtorName: 'John Doe',
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
        debtorName: null,
        note: null,
        invoiceUrl: null,
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
});