import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';
import { sendSuccess } from '../utils/response';
import { AppError } from '../middleware/errorHandler';
import { UpsertDebtDTO } from '../models/debt.model';

// POST /api/debts/upsert - Upsert debt by debtor name
export const upsertDebt = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { debtorName, totalNominal }: UpsertDebtDTO = req.body;

    // Validate input
    if (!debtorName || totalNominal === undefined || totalNominal === null) {
      throw new AppError('debtorName and totalNominal are required', 400);
    }

    if (typeof totalNominal !== 'number' || totalNominal < 0) {
      throw new AppError('totalNominal must be a non-negative number', 400);
    }

    // Upsert using Supabase (updates if debtor_name exists, inserts if not)
    const { data, error } = await supabase
      .from('debts')
      .upsert(
        {
          debtor_name: debtorName,
          total_nominal: totalNominal,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'debtor_name', // Unique constraint column
          ignoreDuplicates: false, // Update on conflict
        }
      )
      .select()
      .single();

    if (error) throw new AppError(error.message, 400);

    sendSuccess(res, data, 'Debt upserted successfully', 200);
  } catch (error) {
    next(error);
  }
};
