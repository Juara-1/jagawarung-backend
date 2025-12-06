import { AgentService, DebtActionResult } from '../services/agent.service';
import { ParsedDebtIntent } from '../models/agent.model';
import { TransactionResponse } from '../models/transaction.model';
import { AppError } from '../middleware/errorHandler';

// Mock the TransactionService
const mockTransactionService = {
  create: jest.fn(),
  findDebtByDebtorName: jest.fn(),
  repayDebtByDebtorName: jest.fn(),
  list: jest.fn(),
  delete: jest.fn(),
  update: jest.fn(),
  repayDebt: jest.fn(),
  getSummary: jest.fn(),
};

describe('AgentService', () => {
  let agentService: AgentService;

  beforeEach(() => {
    jest.clearAllMocks();
    agentService = new AgentService(mockTransactionService as any);
  });

  describe('handleUpsertDebt', () => {
    const parsedIntent: ParsedDebtIntent = {
      original_prompt: 'Budi hutang 50000',
      action: 'upsert_debt',
      debtor_name: 'Budi',
      nominal: 50000,
    };

    const mockTransaction: TransactionResponse = {
      id: 'tx-123',
      nominal: 50000,
      debtor_name: 'Budi',
      invoice_url: null,
      invoice_data: null,
      type: 'debts',
      note: 'Budi hutang 50000',
      created_at: '2025-12-06T10:00:00.000Z',
      updated_at: '2025-12-06T10:00:00.000Z',
    };

    it('should create a new debt transaction with correct payload', async () => {
      // Arrange
      mockTransactionService.create.mockResolvedValue(mockTransaction);

      // Act
      const result: DebtActionResult = await (agentService as any).handleUpsertDebt(parsedIntent);

      // Assert
      expect(mockTransactionService.create).toHaveBeenCalledWith(
        {
          type: 'debts',
          debtor_name: 'Budi',
          nominal: 50000,
          note: 'Budi hutang 50000',
        },
        { upsert: true }
      );
      expect(result).toEqual({
        action: 'upsert_debt',
        transaction: mockTransaction,
        message: 'Hutang untuk Budi berhasil dicatat sebesar 50000',
      });
    });

    it('should return correct Indonesian message for upsert action', async () => {
      // Arrange
      mockTransactionService.create.mockResolvedValue(mockTransaction);

      // Act
      const result: DebtActionResult = await (agentService as any).handleUpsertDebt(parsedIntent);

      // Assert
      expect(result.message).toBe('Hutang untuk Budi berhasil dicatat sebesar 50000');
      expect(result.action).toBe('upsert_debt');
    });

    it('should handle accumulated debt (existing debt)', async () => {
      // Arrange
      const accumulatedTransaction: TransactionResponse = {
        ...mockTransaction,
        nominal: 150000, // Accumulated from 100000 + 50000
      };
      mockTransactionService.create.mockResolvedValue(accumulatedTransaction);

      // Act
      const result: DebtActionResult = await (agentService as any).handleUpsertDebt(parsedIntent);

      // Assert
      expect(result.transaction?.nominal).toBe(150000);
      expect(result.action).toBe('upsert_debt');
    });

    it('should use original_prompt as note', async () => {
      // Arrange
      const customIntent: ParsedDebtIntent = {
        original_prompt: 'Siti pinjam 100 ribu untuk modal',
        action: 'upsert_debt',
        debtor_name: 'Siti',
        nominal: 100000,
      };
      mockTransactionService.create.mockResolvedValue({
        ...mockTransaction,
        debtor_name: 'Siti',
        nominal: 100000,
        note: 'Siti pinjam 100 ribu untuk modal',
      });

      // Act
      await (agentService as any).handleUpsertDebt(customIntent);

      // Assert
      expect(mockTransactionService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          note: 'Siti pinjam 100 ribu untuk modal',
        }),
        { upsert: true }
      );
    });
  });

  describe('handleGetDebt', () => {
    const parsedIntent: ParsedDebtIntent = {
      original_prompt: 'Budi',
      action: 'get_debt',
      debtor_name: 'Budi',
      nominal: 0,
    };

    const mockTransaction: TransactionResponse = {
      id: 'tx-456',
      nominal: 75000,
      debtor_name: 'Budi',
      invoice_url: null,
      invoice_data: null,
      note: 'Previous debt',
      type: 'debts',
      created_at: '2025-12-05T10:00:00.000Z',
      updated_at: '2025-12-05T10:00:00.000Z',
    };

    it('should retrieve existing debt transaction', async () => {
      // Arrange
      mockTransactionService.findDebtByDebtorName.mockResolvedValue(mockTransaction);

      // Act
      const result: DebtActionResult = await (agentService as any).handleGetDebt(parsedIntent);

      // Assert
      expect(mockTransactionService.findDebtByDebtorName).toHaveBeenCalledWith('Budi');
      expect(result).toEqual({
        action: 'get_debt',
        transaction: mockTransaction,
        message: 'Budi memiliki hutang sebesar 75000',
      });
    });

    it('should return null transaction when debt not found', async () => {
      // Arrange
      mockTransactionService.findDebtByDebtorName.mockResolvedValue(null);

      // Act
      const result: DebtActionResult = await (agentService as any).handleGetDebt(parsedIntent);

      // Assert
      expect(mockTransactionService.findDebtByDebtorName).toHaveBeenCalledWith('Budi');
      expect(result).toEqual({
        action: 'get_debt',
        transaction: null,
        message: 'Tidak ada hutang yang tercatat untuk Budi',
      });
    });

    it('should return correct Indonesian message when debt exists', async () => {
      // Arrange
      mockTransactionService.findDebtByDebtorName.mockResolvedValue(mockTransaction);

      // Act
      const result: DebtActionResult = await (agentService as any).handleGetDebt(parsedIntent);

      // Assert
      expect(result.message).toBe('Budi memiliki hutang sebesar 75000');
      expect(result.action).toBe('get_debt');
      expect(result.transaction).not.toBeNull();
    });

    it('should return correct Indonesian message when debt not found', async () => {
      // Arrange
      mockTransactionService.findDebtByDebtorName.mockResolvedValue(null);

      // Act
      const result: DebtActionResult = await (agentService as any).handleGetDebt(parsedIntent);

      // Assert
      expect(result.message).toBe('Tidak ada hutang yang tercatat untuk Budi');
      expect(result.action).toBe('get_debt');
      expect(result.transaction).toBeNull();
    });

    it('should handle different debtor names correctly', async () => {
      // Arrange
      const sitiIntent: ParsedDebtIntent = {
        original_prompt: 'cek hutang Siti',
        action: 'get_debt',
        debtor_name: 'Siti',
        nominal: 0,
      };
      const sitiTransaction: TransactionResponse = {
        ...mockTransaction,
        debtor_name: 'Siti',
        nominal: 200000,
      };
      mockTransactionService.findDebtByDebtorName.mockResolvedValue(sitiTransaction);

      // Act
      const result: DebtActionResult = await (agentService as any).handleGetDebt(sitiIntent);

      // Assert
      expect(mockTransactionService.findDebtByDebtorName).toHaveBeenCalledWith('Siti');
      expect(result.message).toBe('Siti memiliki hutang sebesar 200000');
      expect(result.transaction?.debtor_name).toBe('Siti');
    });
  });

  describe('handleRepayDebt', () => {
    const parsedIntent: ParsedDebtIntent = {
      original_prompt: 'Budi lunas',
      action: 'repay_debt',
      debtor_name: 'Budi',
      nominal: 0,
    };

    const mockRepaidTransaction: TransactionResponse = {
      id: 'tx-789',
      nominal: 50000,
      debtor_name: null, // Set to null after repayment
      invoice_url: null,
      invoice_data: null,
      note: 'Pembayaran Hutang Budi',
      type: 'spending',
      created_at: '2025-12-05T10:00:00.000Z',
      updated_at: '2025-12-06T10:00:00.000Z',
    };

    it('should repay debt successfully', async () => {
      // Arrange
      mockTransactionService.repayDebtByDebtorName.mockResolvedValue(mockRepaidTransaction);

      // Act
      const result: DebtActionResult = await (agentService as any).handleRepayDebt(parsedIntent);

      // Assert
      expect(mockTransactionService.repayDebtByDebtorName).toHaveBeenCalledWith('Budi');
      expect(result).toEqual({
        action: 'repay_debt',
        transaction: mockRepaidTransaction,
        message: 'Hutang Budi berhasil dilunaskan',
      });
    });

    it('should return correct Indonesian message for successful repayment', async () => {
      // Arrange
      mockTransactionService.repayDebtByDebtorName.mockResolvedValue(mockRepaidTransaction);

      // Act
      const result: DebtActionResult = await (agentService as any).handleRepayDebt(parsedIntent);

      // Assert
      expect(result.message).toBe('Hutang Budi berhasil dilunaskan');
      expect(result.action).toBe('repay_debt');
    });

    it('should throw AppError with 404 when debt not found', async () => {
      // Arrange
      mockTransactionService.repayDebtByDebtorName.mockRejectedValue(
        new Error('No debt found for debtor: Budi')
      );

      // Act & Assert
      await expect((agentService as any).handleRepayDebt(parsedIntent)).rejects.toThrow(AppError);
      await expect((agentService as any).handleRepayDebt(parsedIntent)).rejects.toThrow(
        'Tidak ada hutang yang tercatat untuk Budi'
      );
    });

    it('should throw AppError with correct status code when debt not found', async () => {
      // Arrange
      mockTransactionService.repayDebtByDebtorName.mockRejectedValue(
        new Error('No debt found for debtor: Budi')
      );

      // Act & Assert
      try {
        await (agentService as any).handleRepayDebt(parsedIntent);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        expect((error as AppError).statusCode).toBe(404);
        expect((error as AppError).message).toBe('Tidak ada hutang yang tercatat untuk Budi');
      }
    });

    it('should rethrow other errors without modification', async () => {
      // Arrange
      const unexpectedError = new Error('Database connection failed');
      mockTransactionService.repayDebtByDebtorName.mockRejectedValue(unexpectedError);

      // Act & Assert
      await expect((agentService as any).handleRepayDebt(parsedIntent)).rejects.toThrow(
        'Database connection failed'
      );
      await expect((agentService as any).handleRepayDebt(parsedIntent)).rejects.not.toBeInstanceOf(
        AppError
      );
    });

    it('should handle different debtor names correctly', async () => {
      // Arrange
      const sitiIntent: ParsedDebtIntent = {
        original_prompt: 'hapus hutang Siti',
        action: 'repay_debt',
        debtor_name: 'Siti',
        nominal: 0,
      };
      const sitiRepaidTransaction: TransactionResponse = {
        ...mockRepaidTransaction,
        note: 'Pembayaran Hutang Siti',
      };
      mockTransactionService.repayDebtByDebtorName.mockResolvedValue(sitiRepaidTransaction);

      // Act
      const result: DebtActionResult = await (agentService as any).handleRepayDebt(sitiIntent);

      // Assert
      expect(mockTransactionService.repayDebtByDebtorName).toHaveBeenCalledWith('Siti');
      expect(result.message).toBe('Hutang Siti berhasil dilunaskan');
    });

    it('should verify transaction has debtor_name set to null after repayment', async () => {
      // Arrange
      mockTransactionService.repayDebtByDebtorName.mockResolvedValue(mockRepaidTransaction);

      // Act
      const result: DebtActionResult = await (agentService as any).handleRepayDebt(parsedIntent);

      // Assert
      expect(result.transaction?.debtor_name).toBeNull();
    });
  });
});