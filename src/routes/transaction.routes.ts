import { Router } from 'express';
import * as transactionController from '../controllers/transaction.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  transactionCreateSchema,
  transactionCreateQuerySchema,
  transactionUpdateSchema,
  transactionIdParamSchema,
  transactionListQuerySchema,
  transactionSummaryQuerySchema,
  transactionRepaySchema,
} from '../validators/transaction.schema';

const router = Router();

// Apply authentication to all transaction routes
router.use(authenticate);

// ============================================================================
// Type Definitions
// ============================================================================

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
 * Pagination metadata
 * @typedef {object} PaginationInfo
 * @property {number} page - Current page number
 * @property {number} per_page - Items per page
 * @property {number} total_items - Total number of items
 * @property {number} total_pages - Total number of pages
 */

/**
 * Paginated transactions response
 * @typedef {object} PaginatedTransactionsResponse
 * @property {boolean} success - Whether the request was successful
 * @property {string} message - Response message
 * @property {array<Transaction>} data - Array of transaction records
 * @property {PaginationInfo} pagination - Pagination metadata
 */

/**
 * Transaction response wrapper
 * @typedef {object} TransactionResponse
 * @property {boolean} success - Whether the request was successful
 * @property {string} message - Response message
 * @property {Transaction} data - The transaction record
 */

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
 * Transaction summary data
 * @typedef {object} TransactionSummaryData
 * @property {number} total_debts - Total amount of debt transactions
 * @property {number} total_spending - Total amount of spending transactions
 * @property {number} total_earning - Total amount of earning transactions
 */

/**
 * Transaction summary response wrapper
 * @typedef {object} TransactionSummaryResponse
 * @property {boolean} success - Whether the request was successful
 * @property {string} message - Response message
 * @property {TransactionSummaryData} data - The transaction summary data
 */

/**
 * Error response
 * @typedef {object} ErrorResponse
 * @property {boolean} success - Always false for error responses - false
 * @property {string} message - Error message describing what went wrong
 */

// ============================================================================
// Routes
// ============================================================================

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
 * @return {ErrorResponse} 400 - Bad request
 * @return {ErrorResponse} 401 - Unauthorized
 */
router.get('/', validate(transactionListQuerySchema, 'query'), transactionController.getTransactions);

/**
 * GET /api/transactions/summary
 * @summary Get aggregated transaction totals by type
 * @tags Transactions
 * @security BearerAuth
 * @param {string} time_range.query - Time range filter (day, week, month). Required.
 * @return {TransactionSummaryResponse} 200 - Summary retrieved successfully
 * @return {ErrorResponse} 401 - Unauthorized
 */
router.get('/summary', validate(transactionSummaryQuerySchema, 'query'), transactionController.getTransactionSummary);

/**
 * POST /api/transactions
 * @summary Create a new transaction record
 * @tags Transactions
 * @security BearerAuth
 * @param {boolean} upsert.query - When true and type is 'debts', accumulates nominal for existing debtor_name
 * @param {CreateTransactionRequest} request.body.required - Transaction payload
 * @return {TransactionResponse} 201 - Transaction created successfully
 * @return {ErrorResponse} 400 - Validation error
 * @return {ErrorResponse} 401 - Unauthorized
 */
router.post('/', validate(transactionCreateQuerySchema, 'query'), validate(transactionCreateSchema), transactionController.createTransaction);

/**
 * PUT /api/transactions/{id}
 * @summary Update a transaction by ID
 * @tags Transactions
 * @security BearerAuth
 * @param {string} id.path.required - Transaction ID
 * @param {CreateTransactionRequest} request.body.required - Updated transaction payload
 * @return {TransactionResponse} 200 - Transaction updated successfully
 * @return {ErrorResponse} 401 - Unauthorized
 * @return {ErrorResponse} 404 - Transaction not found
 */
router.put('/:id', validate(transactionIdParamSchema, 'params'), validate(transactionUpdateSchema), transactionController.updateTransactionById);

/**
 * DELETE /api/transactions/{id}
 * @summary Delete a transaction by ID
 * @tags Transactions
 * @security BearerAuth
 * @param {string} id.path.required - Transaction ID
 * @return {TransactionResponse} 200 - Transaction deleted successfully
 * @return {ErrorResponse} 401 - Unauthorized
 * @return {ErrorResponse} 404 - Transaction not found
 */
router.delete('/:id', validate(transactionIdParamSchema, 'params'), transactionController.deleteTransactionById);

/**
 * POST /api/transactions/{id}/repay
 * @summary Mark a debt transaction as repaid
 * @tags Transactions
 * @security BearerAuth
 * @param {string} id.path.required - Transaction ID
 * @return {TransactionResponse} 200 - Debt marked as repaid successfully
 * @return {ErrorResponse} 400 - Transaction is not a debt
 * @return {ErrorResponse} 401 - Unauthorized
 * @return {ErrorResponse} 404 - Transaction not found
 */
router.post('/:id/repay', validate(transactionIdParamSchema, 'params'), validate(transactionRepaySchema), transactionController.repayDebt);

export default router;