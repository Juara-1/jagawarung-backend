import { AppError } from '../middleware/errorHandler';
import {
  CreateTransactionDTO,
  TransactionResponse,
  TRANSACTION_TYPES,
  isTransactionType,
} from '../models/transaction.model';
import {
  ITransactionRepository,
  SupabaseTransactionRepository,
} from '../repositories/transaction.repository';

export interface ITransactionService {
  create(payload: CreateTransactionDTO): Promise<TransactionResponse>;
}

export class TransactionService implements ITransactionService {
  constructor(private readonly repository: ITransactionRepository) {}

  static withSupabase(): TransactionService {
    return new TransactionService(new SupabaseTransactionRepository());
  }

  async create(payload: CreateTransactionDTO): Promise<TransactionResponse> {
    this.validatePayload(payload);

    const transaction = await this.repository.create(payload);

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

  private validatePayload(payload: CreateTransactionDTO): void {
    const { debtorName = null, nominal, type, note = null, invoiceUrl = null } = payload;

    if (typeof nominal !== 'number' || Number.isNaN(nominal) || nominal <= 0) {
      throw new AppError('nominal must be a positive number', 400);
    }

    if (!type || typeof type !== 'string' || !isTransactionType(type)) {
      throw new AppError(
        `type must be one of: ${TRANSACTION_TYPES.join(', ')}`,
        400
      );
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
}
