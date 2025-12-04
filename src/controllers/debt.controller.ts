import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';
import { sendSuccess } from '../utils/response';
import { AppError } from '../middleware/errorHandler';
import { UpsertDebtDTO } from '../models/debt.model';

/**
 * A debt record
 * @typedef {object} Debt
 * @property {string} id - Debt ID
 * @property {string} debtor_name - Name of the debtor
 * @property {number} total_nominal - Total amount owed
 * @property {string} created_at - Creation timestamp
 * @property {string} updated_at - Last update timestamp
 */

/**
 * Upsert debt request
 * @typedef {object} UpsertDebtRequest
 * @property {string} debtorName.required - Name of the debtor
 * @property {number} totalNominal.required - Total amount owed
 */

/**
 * GET /api/debts
 * @summary Get debt by debtor name
 * @tags Debts
 * @param {string} debtorName.query.required - Name of the debtor
 * @return {Debt} 200 - Debt retrieved successfully
 * @return {object} 404 - Debt not found
 * @return {object} 400 - Bad request
 */
export const getDebtByName = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { debtorName } = req.query;

    if (!debtorName || typeof debtorName !== 'string') {
      throw new AppError('debtorName query parameter is required', 400);
    }

    const { data, error } = await supabase
      .from('debts')
      .select('*')
      .eq('debtor_name', debtorName)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new AppError('Debt not found for this debtor', 404);
      }
      throw new AppError(error.message, 400);
    }

    sendSuccess(res, data, 'Debt retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/debts/upsert
 * @summary Create or update a debt
 * @tags Debts
 * @param {UpsertDebtRequest} request.body.required - Debt information
 * @return {Debt} 200 - Debt upserted successfully
 * @return {object} 400 - Bad request
 */
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

/**
 * DELETE /api/debts
 * @summary Delete debt by debtor name
 * @tags Debts
 * @param {string} debtorName.query.required - Name of the debtor
 * @return {Debt} 200 - Debt deleted successfully
 * @return {object} 404 - Debt not found
 * @return {object} 400 - Bad request
 */
export const deleteDebtByName = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { debtorName } = req.query;

    if (!debtorName || typeof debtorName !== 'string') {
      throw new AppError('debtorName query parameter is required', 400);
    }

    const { data, error } = await supabase
      .from('debts')
      .delete()
      .eq('debtor_name', debtorName)
      .select();

    if (error) throw new AppError(error.message, 400);

    if (!data || data.length === 0) {
      throw new AppError('Debt not found for this debtor', 404);
    }

    sendSuccess(res, data[0], 'Debt deleted successfully');
  } catch (error) {
    next(error);
  }
};
