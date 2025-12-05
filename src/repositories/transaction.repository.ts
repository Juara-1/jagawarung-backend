import { PostgrestError } from '@supabase/supabase-js';
import { supabase } from '../config/supabase';
import { AppError } from '../middleware/errorHandler';
import {
  CreateTransactionDTO,
  Transaction,
} from '../models/transaction.model';

export interface ITransactionRepository {
  create(payload: CreateTransactionDTO): Promise<Transaction>;
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

  private handleError(error: PostgrestError): never {
    throw new AppError(`Failed to create transaction: ${error.message}`, 400);
  }

  async create(payload: CreateTransactionDTO): Promise<Transaction> {
    const insertPayload = this.mapPayload(payload);

    const { data, error } = await supabase
      .from('transactions')
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      this.handleError(error);
    }

    if (!data) {
      throw new AppError('Failed to create transaction: empty response', 500);
    }

    return data as Transaction;
  }
}
