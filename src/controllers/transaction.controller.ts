import { Request, Response, NextFunction } from 'express';
import { sendSuccess, sendPaginatedSuccess } from '../utils/response';
import { AppError } from '../middleware/errorHandler';
import { TransactionService, ListTransactionsOptions, CreateTransactionOptions } from '../services/transaction.service';
import {
  CreateTransactionDTO,
  UpdateTransactionDTO,
} from '../models/transaction.model';

/**
 * A transaction record
 * @typedef {object} Transaction
 * @property {string} id - Transaction ID
 * @property {string} debtor_name - Name of the debtor (null for non-debt transactions)
 * @property {string} note - Transaction note
 * @property {string} type - Transaction type (spending, earning, or debts)
 * @property {number} nominal - Transaction amount
 * @property {object} invoice_data - Invoice data from OCR
 * @property {string} invoice_url - URL to invoice in Supabase storage
 * @property {string} created_at - Creation timestamp
 * @property {string} updated_at - Last update timestamp
 */

/**
 * GET /api/transactions
 * @summary Get paginated transactions
 * @tags Transactions
 * @security BearerAuth
 * @param {number} page.query - Page number (default: 1)
 * @param {number} per_page.query - Items per page (default: 10, max: 100)
 * @param {string} note.query - Case-insensitive search on transaction note
 * @param {string} type.query - Comma-separated list of transaction types (spending, earning, debts)
 * @param {string} created_from.query - Filter transactions created after or on this ISO timestamp
 * @param {string} created_to.query - Filter transactions created before or on this ISO timestamp
 * @param {string} order_by.query - Sort field (created_at, updated_at, nominal)
 * @param {string} order_direction.query - Sort direction (asc or desc)
 * @return {PaginatedTransactionsResponse} 200 - Transactions retrieved successfully
 * @return {object} 400 - Bad request
 * @return {object} 401 - Unauthorized
 */
export const getTransactions = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // req.query is already validated and transformed by the validate middleware
    const queryParams = req.query as unknown as ListTransactionsOptions;
    const { transactions, pagination } = await transactionService.list(queryParams);
    sendPaginatedSuccess(res, transactions, pagination, 'Transactions retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Create transaction request body
 * @typedef {object} CreateTransactionRequest
 * @property {string} debtor_name - Name of the debtor (required for debts)
 * @property {number} nominal.required - Transaction amount (must be > 0)
 * @property {string} type.required - Transaction type (spending, earning, debts)
 * @property {string} note - Transaction note
 * @property {string} invoice_url - URL to the invoice in storage
 * @property {object} invoice_data - Invoice metadata or OCR payload
 */

/**
 * POST /api/transactions
 * @summary Create a new transaction record
 * @tags Transactions
 * @security BearerAuth
 * @param {boolean} upsert.query - When true and type is 'debts', accumulates nominal for existing debtor_name
 * @param {CreateTransactionRequest} request.body.required - Transaction payload
 * @return {TransactionResponse} 201 - Transaction created successfully
 * @return {object} 400 - Validation error
 * @return {object} 401 - Unauthorized
 */
const transactionService = TransactionService.withSupabase();

export const createTransaction = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const payload = req.body as CreateTransactionDTO;
    // Query is validated and transformed by middleware - upsert is now a boolean
    const { upsert } = req.query as unknown as { upsert: boolean };

    const options: CreateTransactionOptions = { upsert };
    const response = await transactionService.create(payload, options);

    sendSuccess(res, response, 'Transaction created successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/transactions/{id}
 * @summary Delete a transaction by ID
 * @tags Transactions
 * @security BearerAuth
 * @param {string} id.path.required - Transaction ID
 * @return {object} 200 - Transaction deleted successfully
 * @return {object} 401 - Unauthorized
 * @return {object} 404 - Transaction not found
 */
export const deleteTransactionById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    if (!id) {
      throw new AppError('Transaction id is required', 400);
    }

    const response = await transactionService.delete(id);

    sendSuccess(res, response, 'Transaction deleted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/transactions/{id}
 * @summary Update a transaction by ID
 * @tags Transactions
 * @security BearerAuth
 * @param {string} id.path.required - Transaction ID
 * @param {CreateTransactionRequest} request.body.required - Updated transaction payload
 * @return {TransactionResponse} 200 - Transaction updated successfully
 * @return {object} 401 - Unauthorized
 * @return {object} 404 - Transaction not found
 */
export const updateTransactionById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    if (!id) {
      throw new AppError('Transaction id is required', 400);
    }

    const updatePayload = req.body as UpdateTransactionDTO;
    const response = await transactionService.update(id, updatePayload);

    sendSuccess(res, response, 'Transaction updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/transactions/summary
 * @summary Get aggregated transaction totals by type
 * @tags Transactions
 * @security BearerAuth
 * @param {string} time_range.query - Time range filter (day, week, month). Required.
 * @return {object} 200 - Summary retrieved successfully
 * @return {object} 401 - Unauthorized
 */
export const getTransactionSummary = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // req.query is already validated and transformed by the validate middleware
    const { time_range } = req.query as { time_range: 'day' | 'week' | 'month' };

    const summary = await transactionService.getSummary(time_range);

    sendSuccess(res, summary, 'Transaction summary retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/transactions/{id}/repay
 * @summary Mark a debt transaction as repaid
 * @tags Transactions
 * @security BearerAuth
 * @param {string} id.path.required - Transaction ID
 * @return {TransactionResponse} 200 - Debt marked as repaid successfully
 * @return {object} 400 - Transaction is not a debt
 * @return {object} 401 - Unauthorized
 * @return {object} 404 - Transaction not found
 */
export const repayDebt = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    if (!id) {
      throw new AppError('Transaction id is required', 400);
    }

    const response = await transactionService.repayDebt(id);

    sendSuccess(res, response, 'Debt marked as repaid successfully');
  } catch (error) {
    next(error);
  }
};