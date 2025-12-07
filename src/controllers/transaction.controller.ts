import { Request, Response, NextFunction } from 'express';
import { sendSuccess, sendPaginatedSuccess } from '../utils/response';
import { AppError } from '../middleware/errorHandler';
import { TransactionService, ListTransactionsOptions, CreateTransactionOptions } from '../services/transaction.service';
import {
  CreateTransactionDTO,
  UpdateTransactionDTO,
} from '../models/transaction.model';

const transactionService = TransactionService.withSupabase();

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