import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';
import { sendSuccess } from '../utils/response';
import { AppError } from '../middleware/errorHandler';
import { Transaction, TransactionResponse, PaginatedTransactionsResponse } from '../models/transaction.model';

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
 */
export const getTransactions = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Extract pagination parameters
    const page = parseInt(req.query.page as string) || 1;
    const perPage = Math.min(parseInt(req.query.per_page as string) || 10, 100); // Max 100 items per page
    const orderBy = (req.query.order_by as string) || 'created_at';
    const orderDirection = (req.query.order_direction as string) || 'desc';
    const noteFilter = (req.query.note as string) || '';
    const typeFilter = (req.query.type as string) || '';
    const createdFrom = req.query.created_from as string || '';
    const createdTo = req.query.created_to as string || '';

    const allowedOrderFields = ['created_at', 'updated_at', 'nominal'];
    const allowedOrderDirections = ['asc', 'desc'];

    if (!allowedOrderFields.includes(orderBy)) {
      throw new AppError(`Invalid order_by value. Allowed values: ${allowedOrderFields.join(', ')}`, 400);
    }

    if (!allowedOrderDirections.includes(orderDirection.toLowerCase())) {
      throw new AppError('Invalid order_direction value. Allowed values: asc, desc', 400);
    }

    const validTypes = ['spending', 'earning', 'debts'];
    const typeFilterList = typeFilter
      .split(',')
      .map((type) => type.trim().toLowerCase())
      .filter((type) => type.length > 0);

    if (typeFilterList.length > 0) {
      const invalidTypes = typeFilterList.filter((type) => !validTypes.includes(type));
      if (invalidTypes.length > 0) {
        throw new AppError('Invalid type value. Allowed values: spending, earning, debts', 400);
      }
    }

    if (createdFrom && Number.isNaN(Date.parse(createdFrom))) {
      throw new AppError('Invalid created_from date. Use ISO format', 400);
    }

    if (createdTo && Number.isNaN(Date.parse(createdTo))) {
      throw new AppError('Invalid created_to date. Use ISO format', 400);
    }

    // Validate pagination parameters
    if (page < 1) {
      throw new AppError('Page must be greater than 0', 400);
    }
    if (perPage < 1) {
      throw new AppError('per_page must be greater than 0', 400);
    }

    // Calculate offset
    const offset = (page - 1) * perPage;

    // Build query with filters
    let query = supabase.from('transactions').select('*', { count: 'exact' });

    if (noteFilter) {
      query = query.ilike('note', `%${noteFilter}%`);
    }

    if (typeFilterList.length > 0) {
      query = query.in('type', typeFilterList);
    }

    if (createdFrom) {
      query = query.gte('created_at', createdFrom);
    }

    if (createdTo) {
      query = query.lte('created_at', createdTo);
    }

    // Get total count for pagination
    const { count: totalItems, error: countError } = await query.limit(0);

    if (countError) {
      throw new AppError(`Failed to get transaction count: ${countError.message}`, 500);
    }

    // Get transactions with pagination and filters
    let dataQuery = supabase.from('transactions').select('*');

    if (noteFilter) {
      dataQuery = dataQuery.ilike('note', `%${noteFilter}%`);
    }

    if (typeFilterList.length > 0) {
      dataQuery = dataQuery.in('type', typeFilterList);
    }

    if (createdFrom) {
      dataQuery = dataQuery.gte('created_at', createdFrom);
    }

    if (createdTo) {
      dataQuery = dataQuery.lte('created_at', createdTo);
    }

    const { data: transactions, error: transactionsError } = await dataQuery
      .order(orderBy, { ascending: orderDirection === 'asc' })
      .range(offset, offset + perPage - 1);

    if (transactionsError) {
      throw new AppError(`Failed to get transactions: ${transactionsError.message}`, 500);
    }

    // Transform data to match response format
    const transformedData: TransactionResponse[] = (transactions || []).map((transaction: Transaction) => ({
      id: transaction.id,
      nominal: transaction.nominal,
      debtor_name: transaction.debtor_name,
      invoice_url: transaction.invoice_url,
      invoice_data: transaction.invoice_data,
      note: transaction.note,
      created_at: transaction.created_at,
      updated_at: transaction.updated_at
    }));

    // Calculate pagination info
    const totalPages = Math.ceil((totalItems || 0) / perPage);

    const response: PaginatedTransactionsResponse = {
      success: true,
      message: 'transactions retrieved successfully',
      data: transformedData,
      pagination: {
        page,
        per_page: perPage,
        total_items: totalItems || 0,
        total_pages: totalPages
      }
    };

    sendSuccess(res, response, 'Transactions retrieved successfully');
  } catch (error) {
    next(error);
  }
};