import { PostgrestError } from '@supabase/supabase-js';
import { supabase } from '../config/supabase';
import { AppError } from '../middleware/errorHandler';
import {
  CreateTransactionDTO,
  PaginatedTransactionsResponse,
  Transaction,
  TransactionFilterOptions,
  TransactionResponse,
  TransactionType,
  UpdateTransactionDTO,
} from '../models/transaction.model';

export interface ITransactionRepository {
  create(payload: CreateTransactionDTO): Promise<Transaction>;
  deleteById(id: string): Promise<Transaction>;
  updateById(id: string, payload: UpdateTransactionDTO): Promise<Transaction>;
  getSummaryByRange(startDate: string, endDate: string): Promise<Array<{ type: TransactionType; nominal: number }>>;
  listPaginated(filters: TransactionFilterOptions): Promise<PaginatedTransactionsResponse>;
}

export class SupabaseTransactionRepository implements ITransactionRepository {
  private mapPayload(dto: CreateTransactionDTO) {
    return {
      debtor_name: dto.debtor_name ?? null,
      nominal: dto.nominal,
      type: dto.type,
      note: dto.note ?? null,
      invoice_url: dto.invoice_url ?? null,
      invoice_data: dto.invoice_data ?? null,
    };
  }

  private handleError(error: PostgrestError, action: string): never {
    if (error.code === 'PGRST116') {
      throw new AppError('Transaction not found', 404);
    }

    throw new AppError(`Failed to ${action} transaction: ${error.message}`, 400);
  }

  async create(payload: CreateTransactionDTO): Promise<Transaction> {
    const insertPayload = this.mapPayload(payload);

    const { data, error } = await supabase
      .from('transactions')
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      this.handleError(error, 'create');
    }

    if (!data) {
      throw new AppError('Failed to create transaction: empty response', 500);
    }

    return data as Transaction;
  }

  async deleteById(id: string): Promise<Transaction> {
    const { data, error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) {
      this.handleError(error, 'delete');
    }

    if (!data) {
      throw new AppError('Transaction not found', 404);
    }

    return data as Transaction;
  }

  async updateById(id: string, payload: UpdateTransactionDTO): Promise<Transaction> {
    const updatePayload = {
      debtor_name: payload.debtor_name ?? null,
      nominal: payload.nominal!,
      type: payload.type!,
      note: payload.note ?? null,
      invoice_url: payload.invoice_url ?? null,
      invoice_data: payload.invoice_data ?? null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('transactions')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      this.handleError(error, 'update');
    }

    if (!data) {
      throw new AppError('Transaction not found', 404);
    }

    return data as Transaction;
  }

  async getSummaryByRange(startDate: string, endDate: string): Promise<Array<{ type: TransactionType; nominal: number }>> {
    const { data, error } = await supabase
      .from('transactions')
      .select('type, nominal')
      .gte('created_at', startDate)
      .lt('created_at', endDate);

    if (error) {
      throw new AppError(`Failed to fetch transaction summary: ${error.message}`, 500);
    }

    return (data || []) as Array<{ type: TransactionType; nominal: number }>;
  }

  async listPaginated(filters: TransactionFilterOptions): Promise<PaginatedTransactionsResponse> {
    const {
      page,
      perPage,
      orderBy,
      orderDirection,
      note,
      types,
      createdFrom,
      createdTo,
    } = filters;

    const offset = (page - 1) * perPage;

    let countQuery = supabase.from('transactions').select('*', { count: 'exact', head: true });
    let dataQuery = supabase.from('transactions').select('*');

    const applyFilters = (query: typeof countQuery | typeof dataQuery) => {
      let q = query;

      if (note) {
        q = q.ilike('note', `%${note}%`);
      }

      if (types && types.length > 0) {
        q = q.in('type', types);
      }

      if (createdFrom) {
        q = q.gte('created_at', createdFrom);
      }

      if (createdTo) {
        q = q.lte('created_at', createdTo);
      }

      return q;
    };

    countQuery = applyFilters(countQuery);
    dataQuery = applyFilters(dataQuery);

    const [{ count, error: countError }, { data, error: dataError }] = await Promise.all([
      countQuery,
      dataQuery.order(orderBy, { ascending: orderDirection === 'asc' }).range(offset, offset + perPage - 1),
    ]);

    if (countError) {
      throw new AppError(`Failed to get transaction count: ${countError.message}`, 500);
    }

    if (dataError) {
      throw new AppError(`Failed to get transactions: ${dataError.message}`, 500);
    }

    const transactions = (data || []) as Transaction[];

    const transformedData: TransactionResponse[] = transactions.map((transaction) => ({
      id: transaction.id,
      nominal: transaction.nominal,
      debtor_name: transaction.debtor_name,
      invoice_url: transaction.invoice_url,
      invoice_data: transaction.invoice_data,
      note: transaction.note,
      created_at: transaction.created_at,
      updated_at: transaction.updated_at,
    }));

    const totalItems = count || 0;
    const totalPages = Math.ceil(totalItems / perPage);

    return {
      transactions: transformedData,
      pagination: {
        page,
        per_page: perPage,
        total_items: totalItems,
        total_pages: totalPages,
      },
    };
  }
}
