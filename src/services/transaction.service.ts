import {
  CreateTransactionDTO,
  PaginatedTransactionsResponse,
  Transaction,
  TransactionFilterOptions,
  TransactionResponse,
  TransactionSummary,
  TransactionType,
  UpdateTransactionDTO,
} from '../models/transaction.model';
import {
  ITransactionRepository,
  SupabaseTransactionRepository,
} from '../repositories/transaction.repository';

export interface ValidatedListQuery {
  page: number;
  per_page: number;
  order_by: 'created_at' | 'updated_at' | 'nominal';
  order_direction: 'asc' | 'desc';
  note?: string;
  type?: TransactionType[];
  created_from?: string;
  created_to?: string;
}

export interface CreateTransactionOptions {
  upsert?: boolean;
}

export interface ITransactionService {
  list(query: ValidatedListQuery): Promise<PaginatedTransactionsResponse>;
  create(payload: CreateTransactionDTO, options?: CreateTransactionOptions): Promise<TransactionResponse>;
  delete(id: string): Promise<TransactionResponse>;
  update(id: string, payload: UpdateTransactionDTO): Promise<TransactionResponse>;
  getSummary(timeRange: 'day' | 'week' | 'month'): Promise<TransactionSummary>;
}

export class TransactionService implements ITransactionService {
  constructor(private readonly repository: ITransactionRepository) {}

  static withSupabase(): TransactionService {
    return new TransactionService(new SupabaseTransactionRepository());
  }

  async list(query: ValidatedListQuery): Promise<PaginatedTransactionsResponse> {
    const filters: TransactionFilterOptions = {
      page: query.page,
      perPage: query.per_page,
      orderBy: query.order_by,
      orderDirection: query.order_direction,
      note: query.note,
      types: query.type,
      createdFrom: query.created_from,
      createdTo: query.created_to,
    };
    return this.repository.listPaginated(filters);
  }

  async create(
    payload: CreateTransactionDTO,
    options: CreateTransactionOptions = {}
  ): Promise<TransactionResponse> {
    const { upsert = false } = options;

    // Handle upsert for debt transactions
    if (upsert && payload.type === 'debts' && payload.debtor_name) {
      const existingDebt = await this.repository.findDebtByDebtorName(payload.debtor_name);

      if (existingDebt) {
        // Accumulate the nominal value and update other fields if provided
        const newNominal = existingDebt.nominal + payload.nominal;
        const transaction = await this.repository.accumulateDebt(
          existingDebt.id,
          newNominal,
          payload
        );
        return this.toResponse(transaction);
      }
    }

    // Default behavior: create a new transaction
    const transaction = await this.repository.create(payload);
    return this.toResponse(transaction);
  }

  async delete(id: string): Promise<TransactionResponse> {
    const transaction = await this.repository.deleteById(id);
    return this.toResponse(transaction);
  }

  async update(id: string, payload: UpdateTransactionDTO): Promise<TransactionResponse> {
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
    }
  }
}
