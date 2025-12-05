import { AppError } from '../middleware/errorHandler';
import {
  CreateTransactionDTO,
  Transaction,
  TransactionResponse,
  TRANSACTION_TYPES,
  TransactionSummary,
  isTransactionType,
  UpdateTransactionDTO,
} from '../models/transaction.model';
import {
  ITransactionRepository,
  SupabaseTransactionRepository,
} from '../repositories/transaction.repository';

export interface ITransactionService {
  create(payload: CreateTransactionDTO): Promise<TransactionResponse>;
  delete(id: string): Promise<TransactionResponse>;
  update(id: string, payload: UpdateTransactionDTO): Promise<TransactionResponse>;
  getSummary(timeRange: 'day' | 'week' | 'month'): Promise<TransactionSummary>;
}

export class TransactionService implements ITransactionService {
  constructor(private readonly repository: ITransactionRepository) {}

  static withSupabase(): TransactionService {
    return new TransactionService(new SupabaseTransactionRepository());
  }

  async create(payload: CreateTransactionDTO): Promise<TransactionResponse> {
    this.validatePayload(payload);

    const transaction = await this.repository.create(payload);

    return this.toResponse(transaction);
  }

  async delete(id: string): Promise<TransactionResponse> {
    const transaction = await this.repository.deleteById(id);
    return this.toResponse(transaction);
  }

  async update(id: string, payload: UpdateTransactionDTO): Promise<TransactionResponse> {
    this.validatePayload(payload, { allowPartial: false });

    const transaction = await this.repository.updateById(id, payload);
    return this.toResponse(transaction);
  }

  async getSummary(timeRange: 'day' | 'week' | 'month'): Promise<TransactionSummary> {
    const startDate = this.getTimeRangeStart(timeRange);
    const endDate = this.getTimeRangeEnd(timeRange);

    const transactions = await this.repository.getSummaryByRange(startDate, endDate);

    const summary: TransactionSummary = {
      total_debts: 0,
      total_spending: 0,
      total_earning: 0,
    };

    transactions.forEach((transaction) => {
      if (transaction.type === 'debts') {
        summary.total_debts += transaction.nominal;
      } else if (transaction.type === 'spending') {
        summary.total_spending += transaction.nominal;
      } else if (transaction.type === 'earning') {
        summary.total_earning += transaction.nominal;
      }
    });

    return summary;
  }

  private validatePayload(
    payload: Partial<CreateTransactionDTO>,
    options: { allowPartial?: boolean } = {}
  ): void {
    const { debtorName = null, nominal, type, note = null, invoiceUrl = null } = payload;

    if (!options.allowPartial || nominal !== undefined) {
      if (typeof nominal !== 'number' || Number.isNaN(nominal) || nominal <= 0) {
      throw new AppError('nominal must be a positive number', 400);
    }
    }

    if (!options.allowPartial || type !== undefined) {
      if (!type || typeof type !== 'string' || !isTransactionType(type)) {
        throw new AppError(
          `type must be one of: ${TRANSACTION_TYPES.join(', ')}`,
          400
        );
      }
    }

    if (type === 'debts' && (!debtorName || typeof debtorName !== 'string')) {
      throw new AppError('debtorName is required for debt transactions', 400);
    }

    if (debtorName && typeof debtorName !== 'string') {
      throw new AppError('debtorName must be a string when provided', 400);
    }

    if (note && typeof note !== 'string') {
      throw new AppError('note must be a string when provided', 400);
    }

    if (invoiceUrl && typeof invoiceUrl !== 'string') {
      throw new AppError('invoiceUrl must be a string when provided', 400);
    }
  }

  private toResponse(transaction: Transaction): TransactionResponse {
    return {
      id: transaction.id,
      nominal: transaction.nominal,
      debtor_name: transaction.debtor_name,
      invoice_url: transaction.invoice_url,
      invoice_data: transaction.invoice_data,
      note: transaction.note,
      created_at: transaction.created_at,
      updated_at: transaction.updated_at,
    };
  }

  private getTimeRangeStart(timeRange: 'day' | 'week' | 'month'): string {
    const now = new Date();

    switch (timeRange) {
      case 'day':
        now.setHours(0, 0, 0, 0);
        return now.toISOString();
      case 'week': {
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
        const startOfWeek = new Date(now.setDate(diff));
        startOfWeek.setHours(0, 0, 0, 0);
        return startOfWeek.toISOString();
      }
      case 'month':
        return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      default:
        throw new AppError('Invalid time_range. Allowed values: day, week, month', 400);
    }
  }

  private getTimeRangeEnd(timeRange: 'day' | 'week' | 'month'): string {
    const now = new Date();

    switch (timeRange) {
      case 'day': {
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        return tomorrow.toISOString();
      }
      case 'week': {
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1) + 7;
        const startOfNextWeek = new Date(now);
        startOfNextWeek.setDate(diff);
        startOfNextWeek.setHours(0, 0, 0, 0);
        return startOfNextWeek.toISOString();
      }
      case 'month':
        return new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();
      default:
        throw new AppError('Invalid time_range. Allowed values: day, week, month', 400);
    }
  }
}
