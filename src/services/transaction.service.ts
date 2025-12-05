import { AppError } from '../middleware/errorHandler';
import {
  CreateTransactionDTO,
  PaginatedTransactionsResponse,
  Transaction,
  TransactionFilterOptions,
  TransactionResponse,
  TRANSACTION_TYPES,
  TransactionSummary,
  TransactionListQueryParams,
  TransactionOrderDirection,
  TransactionOrderField,
  TransactionType,
  isTransactionType,
  UpdateTransactionDTO,
} from '../models/transaction.model';
import {
  ITransactionRepository,
  SupabaseTransactionRepository,
} from '../repositories/transaction.repository';

export interface ITransactionService {
  list(query: TransactionListQueryParams): Promise<PaginatedTransactionsResponse>;
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

  async list(query: TransactionListQueryParams): Promise<PaginatedTransactionsResponse> {
    const filters = this.parseListQuery(query);
    return this.repository.listPaginated(filters);
  }

  async create(payload: CreateTransactionDTO): Promise<TransactionResponse> {
    this.validatePayload(payload);

    const transaction = await this.repository.create(payload);

    return this.toResponse(transaction);
  }

  private parseListQuery(query: TransactionListQueryParams): TransactionFilterOptions {
    const page = Math.max(parseInt(query.page || '1', 10), 1);
    const perPageRaw = Math.min(Math.max(parseInt(query.per_page || '10', 10), 1), 100);
    const orderByRaw = (query.order_by as TransactionOrderField) || 'created_at';
    const orderDirectionRaw = (query.order_direction as TransactionOrderDirection) || 'desc';

    const allowedOrderFields: TransactionOrderField[] = ['created_at', 'updated_at', 'nominal'];
    const allowedOrderDirections: TransactionOrderDirection[] = ['asc', 'desc'];

    if (!allowedOrderFields.includes(orderByRaw)) {
      throw new AppError(
        `Invalid order_by value. Allowed values: ${allowedOrderFields.join(', ')}`,
        400
      );
    }

    if (!allowedOrderDirections.includes(orderDirectionRaw)) {
      throw new AppError('Invalid order_direction value. Allowed values: asc, desc', 400);
    }

    const note = query.note || undefined;

    const typeFilterList = (query.type || '')
      .split(',')
      .map((type) => type.trim().toLowerCase())
      .filter((type) => type.length > 0) as TransactionType[];

    if (typeFilterList.length > 0) {
      const invalidTypes = typeFilterList.filter((type) => !isTransactionType(type));
      if (invalidTypes.length > 0) {
        throw new AppError('Invalid type value. Allowed values: spending, earning, debts', 400);
      }
    }

    const createdFrom = query.created_from ? this.validateDate(query.created_from, 'created_from') : undefined;
    const createdTo = query.created_to ? this.validateDate(query.created_to, 'created_to') : undefined;

    return {
      page,
      perPage: perPageRaw,
      orderBy: orderByRaw,
      orderDirection: orderDirectionRaw,
      note,
      types: typeFilterList.length ? typeFilterList : undefined,
      createdFrom,
      createdTo,
    };
  }

  private validateDate(value: string, field: string): string {
    if (Number.isNaN(Date.parse(value))) {
      throw new AppError(`Invalid ${field} date. Use ISO format`, 400);
    }
    return value;
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
    const { debtor_name = null, nominal, type, note = null, invoice_url = null } = payload;

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

    if (type === 'debts' && !debtor_name) {
      throw new AppError('debtor_name is required for debt transactions', 400);
    }

    if (debtor_name && typeof debtor_name !== 'string') {
      throw new AppError('debtor_name must be a string', 400);
    }

    if (note && typeof note !== 'string') {
      throw new AppError('note must be a string when provided', 400);
    }

    if (invoice_url && typeof invoice_url !== 'string') {
      throw new AppError('invoice_url must be a string when provided', 400);
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
