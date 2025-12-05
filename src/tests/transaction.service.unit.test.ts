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

    it('should throw error for debt transaction without debtor_name', async () => {
      // Arrange
      const debtPayload = {
        nominal: 50000,
        type: 'debts' as TransactionType,
        note: 'Test debt',
      };

      // Act & Assert
      await expect(service.create(debtPayload)).rejects.toThrow(
        new AppError('debtor_name is required for debt transactions', 400)
      );
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it('should throw error for debt transaction with empty debtor_name', async () => {
      // Arrange
      const debtPayload = {
        nominal: 50000,
        type: 'debts' as TransactionType,
        debtor_name: '',
        note: 'Test debt',
      };

      // Act & Assert
      await expect(service.create(debtPayload)).rejects.toThrow(
        new AppError('debtor_name is required for debt transactions', 400)
      );
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it('should throw error for debt transaction with non-string debtor_name', async () => {
      // Arrange
      const debtPayload = {
        nominal: 50000,
        type: 'debts' as TransactionType,
        debtor_name: 123 as any,
        note: 'Test debt',
      };

      // Act & Assert
      await expect(service.create(debtPayload)).rejects.toThrow(
        new AppError('debtor_name must be a string', 400)
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

    it('should throw error for non-string invoice_url', async () => {
      // Arrange
      const invalidPayload = { ...validPayload, invoice_url: 123 as any };

      // Act & Assert
      await expect(service.create(invalidPayload)).rejects.toThrow(
        new AppError('invoice_url must be a string when provided', 400)
      );
      expect(mockRepository.create).not.toHaveBeenCalled();
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

    it('should throw error for invalid nominal (negative)', async () => {
      // Arrange
      const invalidPayload = { ...updatePayload, nominal: -1000 };

      // Act & Assert
      await expect(service.update('test-id', invalidPayload)).rejects.toThrow(
        new AppError('nominal must be a positive number', 400)
      );
      expect(mockRepository.updateById).not.toHaveBeenCalled();
    });

    it('should throw error for invalid nominal (zero)', async () => {
      // Arrange
      const invalidPayload = { ...updatePayload, nominal: 0 };

      // Act & Assert
      await expect(service.update('test-id', invalidPayload)).rejects.toThrow(
        new AppError('nominal must be a positive number', 400)
      );
      expect(mockRepository.updateById).not.toHaveBeenCalled();
    });

    it('should throw error for invalid type', async () => {
      // Arrange
      const invalidPayload = { ...updatePayload, type: 'invalid_type' as TransactionType };

      // Act & Assert
      await expect(service.update('test-id', invalidPayload)).rejects.toThrow(
        new AppError('type must be one of: spending, earning, debts', 400)
      );
      expect(mockRepository.updateById).not.toHaveBeenCalled();
    });

    it('should throw error for debt transaction without debtor_name', async () => {
      // Arrange
      const debtPayload = {
        nominal: 50000,
        type: 'debts' as TransactionType,
        note: 'Test debt',
      };

      // Act & Assert
      await expect(service.update('test-id', debtPayload)).rejects.toThrow(
        new AppError('debtor_name is required for debt transactions', 400)
      );
      expect(mockRepository.updateById).not.toHaveBeenCalled();
    });

    it('should throw error for debt transaction with non-string debtor_name', async () => {
      // Arrange
      const debtPayload = {
        nominal: 50000,
        type: 'debts' as TransactionType,
        debtor_name: 123 as any,
        note: 'Test debt',
      };

      // Act & Assert
      await expect(service.update('test-id', debtPayload)).rejects.toThrow(
        new AppError('debtor_name must be a string', 400)
      );
      expect(mockRepository.updateById).not.toHaveBeenCalled();
    });

    it('should throw error for non-string note', async () => {
      // Arrange
      const invalidPayload = { ...updatePayload, note: 123 as any };

      // Act & Assert
      await expect(service.update('test-id', invalidPayload)).rejects.toThrow(
        new AppError('note must be a string when provided', 400)
      );
      expect(mockRepository.updateById).not.toHaveBeenCalled();
    });

    it('should throw error for non-string invoice_url', async () => {
      // Arrange
      const invalidPayload = { ...updatePayload, invoice_url: 123 as any };

      // Act & Assert
      await expect(service.update('test-id', invalidPayload)).rejects.toThrow(
        new AppError('invoice_url must be a string when provided', 400)
      );
      expect(mockRepository.updateById).not.toHaveBeenCalled();
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
});