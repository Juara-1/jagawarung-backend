import { PostgrestError } from '@supabase/supabase-js';
import { supabase } from '../config/supabase';
import { AppError } from '../middleware/errorHandler';
import {
  CreateTransactionDTO,
  Transaction,
  TransactionType,
  UpdateTransactionDTO,
} from '../models/transaction.model';

export interface ITransactionRepository {
  create(payload: CreateTransactionDTO): Promise<Transaction>;
  deleteById(id: string): Promise<Transaction>;
  updateById(id: string, payload: UpdateTransactionDTO): Promise<Transaction>;
  getSummaryByRange(startDate: string, endDate: string): Promise<Array<{ type: TransactionType; nominal: number }>>;
}

export class SupabaseTransactionRepository implements ITransactionRepository {
  private mapPayload(dto: CreateTransactionDTO) {
    return {
      debtor_name: dto.debtorName ?? null,
      nominal: dto.nominal,
      type: dto.type,
      note: dto.note ?? null,
      invoice_url: dto.invoiceUrl ?? null,
      invoice_data: dto.invoiceData ?? null,
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
      debtor_name: payload.debtorName ?? null,
      nominal: payload.nominal!,
      type: payload.type!,
      note: payload.note ?? null,
      invoice_url: payload.invoiceUrl ?? null,
      invoice_data: payload.invoiceData ?? null,
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
}
